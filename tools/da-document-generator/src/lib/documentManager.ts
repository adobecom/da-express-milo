import { crawlDirectory, fetchAndParseDocs, type CrawlError, type DocFetchError } from '../api/crawl';
import { batchCheckStatus, getToken, daPathToLiveUrl, daPathToPreviewUrl, cat, postDoc } from '../api/daApi';
import { fetchProductFromTemplate, type ZazzleProduct } from '../api/zazzleApi';
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

export interface CrawlAndLoadResult {
  docs: ManagedDoc[];
  errors: (CrawlError | DocFetchError)[];
}

/**
 * Crawls `rootPath`, parses every doc found into a `ManagedDoc`, then live-checks
 * publish/preview status for whatever was found so the table reflects real state rather
 * than a stale guess. A crawl/fetch failure for one subtree/doc is surfaced in `errors`,
 * never silently dropped from the result.
 */
export async function crawlAndLoadDocs(rootPath: string): Promise<CrawlAndLoadResult> {
  const crawl = await crawlDirectory(rootPath);
  const { records, errors: fetchErrors } = await fetchAndParseDocs(
    crawl.docs.map((d) => d.path),
    (html, path) => parseDocRecord(html, path, rootPath),
  );

  const token = getToken();
  if (token && records.length > 0) {
    const statuses = await batchCheckStatus(records.map((r) => r.path), token);
    for (const record of records) {
      const status = statuses.get(record.path);
      if (!status) continue;
      if (status.live) {
        record.stage = 'published';
        record.liveUrl = daPathToLiveUrl(record.path);
      } else if (status.preview) {
        record.stage = 'previewed';
        record.previewUrl = daPathToPreviewUrl(record.path);
      }
    }
  }

  return { docs: records, errors: [...crawl.errors, ...fetchErrors] };
}

const zazzleCache = new Map<string, ZazzleProduct | null>();

async function lookupZazzleProduct(productId: string): Promise<ZazzleProduct | null> {
  if (zazzleCache.has(productId)) return zazzleCache.get(productId) ?? null;
  const product = await fetchProductFromTemplate(productId);
  zazzleCache.set(productId, product);
  return product;
}

/**
 * Self-heals a document that predates the metadata contract: recovers `product-type` via an
 * on-demand Zazzle lookup keyed by the (already-known or positionally-extracted) URN, writes
 * the identity metadata and re-tags editable fields against the doc's current text, and
 * persists the result. Returns `undefined` if there's no URN to look up or Zazzle has no
 * matching product — the caller should leave the row's `needsBackfill` flag as-is in that case.
 */
export async function backfillIdentity(target: ManagedDoc): Promise<ManagedDoc | undefined> {
  const productId = target.identity.productId;
  if (!productId) return undefined;

  const product = await lookupZazzleProduct(productId);
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
