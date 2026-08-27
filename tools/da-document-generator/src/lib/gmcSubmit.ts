import { lookupProductFromTemplate, fetchProductPricing } from '../api/zazzleApi';
import { GMC_LOCALES, DEFAULT_GMC_LOCALE } from '../api/gmcLocales';
import { daPathToProdUrl } from '../api/daApi';
import { runBatch, DEFAULT_CONCURRENCY } from './concurrency';
import {
  syncProducts,
  fetchDiagnostics,
  sanitizeOfferId,
  type GmcSyncRow,
  type GmcDiagnosticResult,
} from '../api/gmcApi';
import type { ManagedDoc, GmcEnv, GmcEnvState, GmcStatus } from '../types';

// sync-products (actions/lib/validate.js) hard-rejects the whole call above this.
export const MAX_GMC_CHUNK = 100;

// diagnostics (actions/lib/validate.js) separately hard-rejects above this limit
export const MAX_DIAGNOSTICS_CHUNK = 100;

export function chunkRows<T>(items: T[], size = MAX_GMC_CHUNK): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

// ---------------------------------------------------------------------------
// Preview assembly (dialog) — GMC-Submit-Dialog-PRD.md §6, §7
// ---------------------------------------------------------------------------

/** Whether a previewed field's value came from the authored DA doc or from Zazzle. */
export type GmcFieldSource = 'doc' | 'zazzle';

export interface GmcRowPreview {
  /** doc.path — the stable per-row key used everywhere in the dialog. */
  path: string;
  doc: ManagedDoc;
  /** Raw product-type used to group rows into tables. */
  productType: string;
  /** Sanitized offer id — present whenever the doc has a product id. */
  offerId?: string;
  /** Fully-assembled GMC payload — present only when the row is resolvable (not blocked). */
  row?: GmcSyncRow;
  /** Per-field provenance for the assembled payload (drives the Zazzle warning icon). */
  sources?: Partial<Record<keyof GmcSyncRow, GmcFieldSource>>;
  /** Why this row can't be submitted — present only when `row` is absent. */
  blockedReason?: string;
}

const UNKNOWN_TYPE = '(unknown type)';

/**
 * Single-doc assembly for the dialog preview. Field policy is unchanged from the pre-dialog submit
 * path — doc-first with Zazzle fallback for title/description/product_type, Zazzle-only for
 * image/price/sale_price, doc-only for link/product_id — but this returns per-field provenance plus
 * a structured `blockedReason` instead of throwing or collapsing into a flat "skipped" count.
 *
 * Price (and sale_price, when active) is fetched fresh here and never cached/persisted (the v1
 * invariant holds); the value shown in the dialog IS the value submitted (WYSIWYG) rather than being
 * re-fetched at submit time. `link` here is the production PDP URL (`daPathToProdUrl(doc.path)` →
 * `www.adobe.com/...`), submitted as-is for prod — the TEST-env `store.example.com` host swap is
 * applied later, only to the payload actually sent over the wire (see `toTestEnvLink` in
 * `submitAssembledRows`), so this preview and its cached `row` stay valid across an env-toggle flip
 * without re-assembling. (The dialog's clickable "Page" link is a separate field, `doc.liveUrl`,
 * rendered in `GmcPreviewRow` — not this `row.link`.)
 */
export async function assembleGmcPreview(doc: ManagedDoc): Promise<GmcRowPreview> {
  const base: GmcRowPreview = { path: doc.path, doc, productType: doc.identity.productType || UNKNOWN_TYPE };

  const productId = doc.identity.productId;
  if (!productId) return { ...base, blockedReason: 'Missing product ID' };
  base.offerId = sanitizeOfferId(productId);

  if (!doc.liveUrl) return { ...base, blockedReason: 'Not published — no live URL' };

  const product = await lookupProductFromTemplate(productId);
  if (!product) return { ...base, blockedReason: 'Zazzle product lookup failed' };

  const locale = GMC_LOCALES[DEFAULT_GMC_LOCALE];
  const pricing = await fetchProductPricing(product.id, product.productOption, locale);
  if (pricing == null) return { ...base, blockedReason: 'Zazzle price lookup failed' };

  const image = product.initialPrettyPreferredViewUrl;
  if (!image) return { ...base, blockedReason: 'Zazzle image lookup failed' };

  const resolvedType = doc.identity.productType || product.productType;
  const row: GmcSyncRow = {
    product_id: productId,
    title: doc.title || product.rootRawTitle,
    description: doc.description || product.description,
    link: daPathToProdUrl(doc.path),
    image_link: image,
    price: pricing.unitPrice,
    ...(pricing.salePrice != null ? { sale_price: pricing.salePrice, sale_price_end_date: pricing.saleEndDate } : {}),
    product_type: resolvedType,
  };
  const sources: GmcRowPreview['sources'] = {
    product_id: 'doc',
    link: 'doc',
    image_link: 'zazzle',
    price: 'zazzle',
    ...(pricing.salePrice != null ? { sale_price: 'zazzle' as const } : {}),
    title: doc.title ? 'doc' : 'zazzle',
    description: doc.description ? 'doc' : 'zazzle',
    product_type: doc.identity.productType ? 'doc' : 'zazzle',
  };

  return { ...base, productType: resolvedType, row, sources };
}

// ---------------------------------------------------------------------------
// Submit (dialog) — chunked, sequential, retry-once (GMC-Submit-Dialog-PRD.md §9)
// ---------------------------------------------------------------------------

/**
 * TEST-env-only substitution applied right before the wire call: pdp-gmc-sync's `pdpAllowedHosts`
 * allowlist (`config/defaults.json`) already carries a bare `store.example.com` placeholder host for
 * the test Merchant Center account. Swap only the scheme+host of the row's prod link — keep the
 * doc's actual path so each row still submits a distinct URL. (The doc-facing preview "Page" link is
 * a separate field, `doc.liveUrl`, rendered in `GmcPreviewRow` — untouched here.)
 */
function toTestEnvLink(liveUrl: string): string {
  const url = new URL(liveUrl);
  url.protocol = 'https:';
  url.hostname = 'store.example.com';
  url.port = '';
  return url.toString();
}

function rowForEnv(row: GmcSyncRow, env: GmcEnv): GmcSyncRow {
  return env === 'test' ? { ...row, link: toTestEnvLink(row.link) } : row;
}

async function submitChunkWithRetry(env: GmcEnv, rows: GmcSyncRow[], token: string) {
  try {
    return await syncProducts(env, rows, token);
  } catch {
    return await syncProducts(env, rows, token);
  }
}

export interface GmcSubmitProgress {
  chunkIndex: number;
  chunkCount: number;
}

export interface GmcSubmitEntry {
  path: string;
  offerId: string;
  row: GmcSyncRow;
}

/**
 * Submits an already-assembled, resolvable set of rows: chunk (<=50), submit sequentially (never
 * parallel chunk calls), retry each chunk call once before marking that chunk's rows Error. Returns
 * per-row {@link GmcEnvState} keyed by doc path so the caller can apply it onto `ManagedDoc.gmc[env]`.
 * Used for both the initial submit and the "retry errored rows" path (same entry point, a subset).
 */
export async function submitAssembledRows(
  entries: GmcSubmitEntry[],
  env: GmcEnv,
  token: string,
  onProgress?: (p: GmcSubmitProgress) => void,
): Promise<Map<string, GmcEnvState>> {
  const updates = new Map<string, GmcEnvState>();
  const pathByOfferId = new Map<string, string>();
  for (const entry of entries) pathByOfferId.set(entry.offerId, entry.path);

  const now = new Date().toISOString();
  const chunks = chunkRows(entries);
  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    try {
      const result = await submitChunkWithRetry(env, chunk.map((c) => rowForEnv(c.row, env)), token);
      for (const offerId of result.pushedIds) {
        const path = pathByOfferId.get(offerId);
        if (path) updates.set(path, { status: 'pending', lastSubmittedAt: now });
      }
      for (const failure of result.failedItems) {
        const path = pathByOfferId.get(failure.productId);
        if (path) updates.set(path, { status: 'error', lastSubmittedAt: now, message: failure.reason });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      for (const c of chunk) {
        updates.set(c.path, {
          status: 'error',
          lastSubmittedAt: now,
          message: `Rate limited or unreachable — retry later (${message})`,
        });
      }
    }
    onProgress?.({ chunkIndex: i + 1, chunkCount: chunks.length });
  }

  return updates;
}

// ---------------------------------------------------------------------------
// Diagnostics / status check — GMC-Status-Sync-PRD.md §8 (contract rewritten server-side since;
// this section no longer matches that PRD — see `GmcDiagnosticResult` in gmcApi.ts)
// ---------------------------------------------------------------------------

function disapprovedCountriesMessage(result: GmcDiagnosticResult): string | undefined {
  const countries = [...new Set(
    result.statusPerReportingContext?.flatMap((s) => s.disapprovedCountries ?? []) ?? [],
  )];
  return countries.length ? `Rejected in ${countries.join(', ')}` : undefined;
}

function mapDiagnosticResult(result: GmcDiagnosticResult): { status: GmcStatus; message?: string } {
  const status = result.aggregatedReportingContextStatus;
  if (status === 'ELIGIBLE' || status === 4) return { status: 'live' };
  if (status === 'ELIGIBLE_LIMITED' || status === 3) return { status: 'live', message: disapprovedCountriesMessage(result) };
  if (status === 'PENDING' || status === 2) return { status: 'pending' };
  if (status === 'NOT_ELIGIBLE_OR_DISAPPROVED' || status === 1) {
    return { status: 'disapproved', message: disapprovedCountriesMessage(result) };
  }
  return { status: 'pending' };
}

export interface GmcCheckOutcome {
  updates: Map<string, GmcEnvState>;
  skippedMissingProductId: number;
}

export async function checkGmcStatus(docs: ManagedDoc[], env: GmcEnv, token: string): Promise<GmcCheckOutcome> {
  const eligible = docs.filter((d) => d.identity.productId);
  const skippedMissingProductId = docs.length - eligible.length;
  const updates = new Map<string, GmcEnvState>();
  if (eligible.length === 0) return { updates, skippedMissingProductId };

  const byOfferId = new Map<string, ManagedDoc>();
  for (const doc of eligible) {
    byOfferId.set(sanitizeOfferId(doc.identity.productId as string), doc);
  }

  const now = new Date().toISOString();
  const chunks = chunkRows([...byOfferId.keys()], MAX_DIAGNOSTICS_CHUNK);
  await runBatch(chunks, async (offerIds) => {
    try {
      const response = await fetchDiagnostics(env, offerIds, token);
      for (const result of response.results) {
        const doc = byOfferId.get(result.offerId);
        if (!doc) continue;
        const { status, message } = mapDiagnosticResult(result);
        updates.set(doc.path, { status, message, lastCheckedAt: now, lastSubmittedAt: doc.gmc?.[env]?.lastSubmittedAt });
      }
      // Explicitly-requested offerIds GMC has no record of at all — confirmed absent, not just
      // unchecked (see `not-pushed` in types.ts).
      for (const offerId of response.missingOfferIds ?? []) {
        const doc = byOfferId.get(offerId);
        if (!doc) continue;
        updates.set(doc.path, { status: 'not-pushed', lastCheckedAt: now, lastSubmittedAt: doc.gmc?.[env]?.lastSubmittedAt });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      for (const offerId of offerIds) {
        const doc = byOfferId.get(offerId);
        if (!doc) continue;
        updates.set(doc.path, {
          status: 'error',
          lastCheckedAt: now,
          lastSubmittedAt: doc.gmc?.[env]?.lastSubmittedAt,
          message: `Rate limited or unreachable — retry later (${message})`,
        });
      }
    }
  }, DEFAULT_CONCURRENCY);

  return { updates, skippedMissingProductId };
}
