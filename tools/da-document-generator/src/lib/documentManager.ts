import { crawlDirectory, type CrawlError, type DocFetchError } from '../api/crawl';
import { checkPageStatus, getToken, daPathToLiveUrl, daPathToPreviewUrl, cat, postDoc } from '../api/daApi';
import { CRAWL_CONCURRENCY, STATUS_CONCURRENCY, runBatch } from './concurrency';
import { lookupProductFromTemplate } from '../api/zazzleApi';
import { readMetadataBlockFromDoc, upsertMetadataBlockOnDoc, serializeDoc } from './metadata';
import { tagEditableFieldsOnDoc, type EditableFieldKey } from './generate';
import type { ManagedDoc, ManagedDocIdentity } from '../types';

function computeSubDirectory(path: string, rootPath: string): string {
  const root = rootPath.endsWith('/') ? rootPath.slice(0, -1) : rootPath;
  const rel = path.startsWith(root) ? path.slice(root.length) : path;
  const lastSlash = rel.lastIndexOf('/');
  return lastSlash > 0 ? rel.slice(0, lastSlash) : '/';
}

/**
 * The product URN as it exists in generated documents that predate the metadata contract
 * (PR4): unlabeled positional text — the first row's second cell of the `print-product-detail`
 * authored block. Used only as a fallback when no `product-id` metadata row is present.
 */
function extractLegacyProductId(doc: Document): string | undefined {
  const block = doc.querySelector('.print-product-detail');
  const firstRow = block?.children[0];
  const cell = firstRow?.children[1];
  return cell?.textContent?.trim() || undefined;
}

function readEditableField(doc: Document, key: EditableFieldKey): { value?: string; editable: boolean } {
  const el = doc.querySelector(`[data-doc-key="${key}"]`);
  if (!el) return { editable: false };
  return { value: el.textContent?.trim() || undefined, editable: true };
}

interface DerivedFields {
  identity: ManagedDocIdentity;
  needsBackfill: boolean;
  title?: string;
  shortTitle?: string;
  description?: string;
  editable: { title: boolean; shortTitle: boolean; description: boolean };
}

function deriveFields(doc: Document): DerivedFields {
  const metadata = readMetadataBlockFromDoc(doc);
  const productId = metadata['product-id'] || extractLegacyProductId(doc);
  const productType = metadata['product-type'];
  const titleField = readEditableField(doc, 'title');
  const shortTitleField = readEditableField(doc, 'short_title');
  const descriptionField = readEditableField(doc, 'description');

  return {
    identity: {
      productType,
      productId,
      generatedBatch: metadata['generated-batch'],
      lastUpdated: metadata['last-updated'],
    },
    needsBackfill: !productType || !productId,
    title: titleField.value,
    shortTitle: shortTitleField.value,
    description: descriptionField.value,
    editable: {
      title: titleField.editable,
      shortTitle: shortTitleField.editable,
      description: descriptionField.editable,
    },
  };
}

export function parseDocRecord(html: string, path: string, rootPath: string): ManagedDoc {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return {
    id: path,
    path,
    stage: 'generated',
    subDirectory: computeSubDirectory(path, rootPath),
    ...deriveFields(doc),
  };
}

export type ScanPhase = 'discovering' | 'loading' | 'checking';

export interface StatusUpdate {
  path: string;
  stage?: ManagedDoc['stage'];
  statusUnknown?: boolean;
  liveUrl?: string;
  previewUrl?: string;
}

export interface ScanCallbacks {
  /** Placeholder rows (path + sub-directory) available immediately after discovery. */
  onDiscovered: (docs: ManagedDoc[], total: number) => void;
  /** A batch of fully-parsed metadata records, to merge into the rows by path. */
  onRecords: (records: ManagedDoc[]) => void;
  /** A batch of publish/preview status results (or Unknown), to merge into the rows by path. */
  onStatuses: (updates: StatusUpdate[]) => void;
  onProgress: (phase: ScanPhase, done: number, total: number) => void;
  /** Return true to abort — checked between async steps so a rescan/unmount stops work. */
  cancelled: () => boolean;
}

const FLUSH_SIZE = 25;
// If this many status checks fail with zero successes, treat the status endpoint as
// unreachable (e.g. CORS-blocked) and mark the rest Unknown without more network calls.
const STATUS_FAILURE_CIRCUIT = 10;

function placeholderDoc(path: string, rootPath: string): ManagedDoc {
  return {
    id: path,
    path,
    stage: 'generated',
    subDirectory: computeSubDirectory(path, rootPath),
    identity: {},
    needsBackfill: false,
    editable: { title: false, shortTitle: false, description: false },
  };
}

/**
 * Segmented, progressive scan: (1) discover paths and emit placeholder rows immediately,
 * (2) fetch/parse each doc's metadata in batches, (3) live-check publish/preview status
 * last — deferred and resilient (fast-fail + circuit breaker) so a blocked or slow status
 * endpoint can never hang the scan. Progress and partial results stream via callbacks; the
 * caller aborts an in-flight scan by flipping `cancelled()`.
 */
export async function scanDocs(
  rootPath: string,
  cb: ScanCallbacks,
): Promise<{ errors: (CrawlError | DocFetchError)[] }> {
  // Phase 1 — discovery. Emit placeholder rows the moment paths are known.
  cb.onProgress('discovering', 0, 0);
  const crawl = await crawlDirectory(rootPath, { concurrency: CRAWL_CONCURRENCY });
  if (cb.cancelled()) return { errors: crawl.errors };
  const paths = crawl.docs.map((d) => d.path);
  const total = paths.length;
  cb.onDiscovered(paths.map((p) => placeholderDoc(p, rootPath)), total);

  // Phase 2 — metadata (heavy per-doc fetch/parse), streamed in batches. Row updates and
  // progress fire at the flush cadence (not per doc) to avoid a re-render on every document.
  const fetchErrors: DocFetchError[] = [];
  let parsed = 0;
  let recBuf: ManagedDoc[] = [];
  cb.onProgress('loading', 0, total);
  await runBatch(paths, async (path) => {
    if (cb.cancelled()) return;
    try {
      recBuf.push(parseDocRecord(await cat(path), path, rootPath));
    } catch (err) {
      fetchErrors.push({ path, message: err instanceof Error ? err.message : String(err) });
    }
    parsed++;
    if (recBuf.length >= FLUSH_SIZE || parsed === total) {
      cb.onRecords(recBuf);
      recBuf = [];
      cb.onProgress('loading', parsed, total);
    }
  }, CRAWL_CONCURRENCY);
  if (cb.cancelled()) return { errors: [...crawl.errors, ...fetchErrors] };

  // Phase 3 — status (deferred, resilient). Fast-fail per call, plus a circuit breaker so a
  // wholly-unreachable endpoint marks the rest Unknown instead of probing every doc.
  const token = getToken();
  if (token && total > 0) {
    let checked = 0;
    let failures = 0;
    let successes = 0;
    let aborted = false;
    let statBuf: StatusUpdate[] = [];
    cb.onProgress('checking', 0, total);
    await runBatch(paths, async (path) => {
      if (cb.cancelled()) return;
      let update: StatusUpdate;
      if (aborted) {
        update = { path, statusUnknown: true };
      } else {
        const s = await checkPageStatus(path, token);
        if (s.ok) {
          successes++;
          update = s.live
            ? { path, stage: 'published', liveUrl: daPathToLiveUrl(path) }
            : s.preview
              ? { path, stage: 'previewed', previewUrl: daPathToPreviewUrl(path) }
              : { path }; // definitively not published/previewed — stays Draft
        } else {
          failures++;
          update = { path, statusUnknown: true };
          if (successes === 0 && failures >= STATUS_FAILURE_CIRCUIT) aborted = true;
        }
      }
      statBuf.push(update);
      checked++;
      if (statBuf.length >= FLUSH_SIZE || checked === total) {
        cb.onStatuses(statBuf);
        statBuf = [];
        cb.onProgress('checking', checked, total);
      }
    }, STATUS_CONCURRENCY);
  }

  return { errors: [...crawl.errors, ...fetchErrors] };
}

/**
 * Self-heals a document that predates the metadata contract: recovers `product-type` via an
 * on-demand Zazzle lookup keyed by the (already-known or positionally-extracted) URN, writes
 * the identity metadata and re-tags editable fields against the doc's current text, and
 * persists the result. Returns `undefined` if there's no URN to look up or Zazzle has no
 * matching product — the caller should leave the row's `needsBackfill` flag as-is in that case.
 *
 * `force` bypasses the session template cache (see {@link refetchZazzleInfo}).
 */
export async function backfillIdentity(
  target: ManagedDoc,
  { force = false }: { force?: boolean } = {},
): Promise<ManagedDoc | undefined> {
  const productId = target.identity.productId;
  if (!productId) return undefined;

  const product = await lookupProductFromTemplate(productId, { force });
  if (!product) return undefined;

  const html = await cat(target.path);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  tagEditableFieldsOnDoc(doc, {
    title: product.rootRawTitle,
    short_title: product.rootRawTitle,
    description: product.description,
  });
  upsertMetadataBlockOnDoc(doc, {
    'product-type': product.productType,
    'product-id': productId,
    'last-updated': new Date().toISOString(),
  });
  await postDoc(target.path, serializeDoc(doc));

  return { ...target, ...deriveFields(doc) };
}

/**
 * Per-row "Refetch Zazzle info": re-pulls the template response for a single doc, bypassing the
 * session cache, and re-applies title/description/identity metadata. Same mechanics as
 * {@link backfillIdentity} but always hits the network — used to recover a row whose earlier
 * lookup failed transiently or whose Zazzle data has since changed. Returns `undefined` (no
 * write) when the doc has no URN or Zazzle still has no matching product.
 */
export async function refetchZazzleInfo(target: ManagedDoc): Promise<ManagedDoc | undefined> {
  return backfillIdentity(target, { force: true });
}

/**
 * Writes a new value for one editable field (title/short_title/description) on `target`,
 * targeting the tagged `[data-doc-key]` node surgically rather than re-templating the whole
 * doc. Bumps only `last-updated` — never `generated-batch`, which must reflect the Generate
 * run that produced the templated content, not a later Document Manager touch. Throws if the
 * field isn't tagged as editable on this doc (callers should check `target.editable[key]`
 * before offering the edit affordance in the first place).
 */
export async function writeFieldValue(
  target: ManagedDoc,
  key: EditableFieldKey,
  value: string,
): Promise<ManagedDoc> {
  const html = await cat(target.path);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const el = doc.querySelector(`[data-doc-key="${key}"]`);
  if (!el) throw new Error(`Field "${key}" is not editable on ${target.path}`);
  el.textContent = value;
  upsertMetadataBlockOnDoc(doc, { 'last-updated': new Date().toISOString() });
  await postDoc(target.path, serializeDoc(doc));

  return { ...target, ...deriveFields(doc) };
}
