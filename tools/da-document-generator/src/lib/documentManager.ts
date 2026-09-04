import { crawlDirectory, type CrawlError, type DocFetchError } from '../api/crawl';
import { getToken, daPathToLiveUrl, daPathToPreviewUrl, cat, postDoc, resolveStatuses, type PageStatus } from '../api/daApi';
import { CRAWL_CONCURRENCY, runBatch } from './concurrency';
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

/** Map a resolved PageStatus onto a row update (published / previewed / draft / unknown). */
function statusToUpdate(path: string, s: PageStatus | undefined): StatusUpdate {
  if (!s || !s.ok) return { path, statusUnknown: true };
  if (s.live) return { path, stage: 'published', liveUrl: daPathToLiveUrl(path), statusUnknown: false };
  if (s.preview) return { path, stage: 'previewed', previewUrl: daPathToPreviewUrl(path), statusUnknown: false };
  return { path, statusUnknown: false }; // exists in source only → Draft
}

/** Emit resolved statuses to the caller in FLUSH_SIZE batches (one merge per batch, not per row). */
function emitStatuses(
  paths: string[],
  statuses: Map<string, PageStatus>,
  onStatuses: (updates: StatusUpdate[]) => void,
): void {
  let buf: StatusUpdate[] = [];
  paths.forEach((path, idx) => {
    buf.push(statusToUpdate(path, statuses.get(path)));
    if (buf.length >= FLUSH_SIZE || idx === paths.length - 1) {
      onStatuses(buf);
      buf = [];
    }
  });
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

  // Phase 3 — status. Resolve publish/preview state for the whole set via the bulk status job
  // (one async job) with an authless CDN-HEAD fallback — no per-doc calls to the rate-limited
  // admin status API, so a large scan can't trip its throttle and mass-mark rows Unknown.
  const token = getToken();
  if (token && total > 0) {
    cb.onProgress('checking', 0, total);
    const statuses = await resolveStatuses(paths, token, (done) => {
      if (!cb.cancelled()) cb.onProgress('checking', done, total);
    });
    if (cb.cancelled()) return { errors: [...crawl.errors, ...fetchErrors] };
    emitStatuses(paths, statuses, cb.onStatuses);
    cb.onProgress('checking', total, total);
  }

  return { errors: [...crawl.errors, ...fetchErrors] };
}

/**
 * Re-resolve publish/preview status for a SUBSET of already-listed docs — used by the Document
 * Manager's "Recheck status" action to retry only the rows that came back Unknown, without
 * re-crawling the tree or re-fetching any source. Reuses the same bulk-job → HEAD resolver.
 */
export async function recheckStatuses(
  paths: string[],
  cb: Pick<ScanCallbacks, 'onStatuses' | 'onProgress' | 'cancelled'>,
): Promise<void> {
  const token = getToken();
  if (!token || paths.length === 0) return;
  const total = paths.length;
  cb.onProgress('checking', 0, total);
  const statuses = await resolveStatuses(paths, token, (done) => {
    if (!cb.cancelled()) cb.onProgress('checking', done, total);
  });
  if (cb.cancelled()) return;
  emitStatuses(paths, statuses, cb.onStatuses);
  cb.onProgress('checking', total, total);
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
