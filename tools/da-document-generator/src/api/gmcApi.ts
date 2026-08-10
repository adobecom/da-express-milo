import type { GmcEnv } from '../types';

// Deployed stage namespace for pdp-gmc-sync (used for the GMC "test" env while building/testing
// this feature). Confirmed via `aio app info` in pdp-gmc-sync: namespace "14257-pdpgmcsync-stage",
// apihost "adobeioruntime.net" (the actual action-invocation domain — adobeio-static.net is the
// static-asset/UI hosting domain, a different thing). No action name here: gmcFetch() appends
// `/${action}` itself. Override via VITE_GMC_API_BASE for local dev (`aio app dev`/`aio app run`)
// or a prod namespace once one exists. See GMC-Status-Sync-PRD.md §10.
const DEFAULT_BASE_URL = 'https://14257-pdpgmcsync-stage.adobeioruntime.net/api/v1/web/gmc-feed-sync';

function getBaseUrl(): string {
  return import.meta.env.VITE_GMC_API_BASE || DEFAULT_BASE_URL;
}

const IMS_PROFILE_URL = 'https://ims-na1.adobelogin.com/ims/profile/v1';

// Keyed by token so a re-login (new token) doesn't serve a stale org id, but a bulk submit's
// multiple sequential chunk calls (see gmcSubmit.ts) don't each re-fetch the profile.
let cachedOrg: { token: string; orgId: string | null } | null = null;

/**
 * `sync-products`'s own IMS access token is enough to ask IMS directly who it belongs to —
 * no dependency on any particular host page having bootstrapped `window.adobeIMS` (confirmed
 * live: `window.adobeIMS` isn't present on the page this app actually runs on, but this endpoint
 * works from here with the app's existing DA token). Fails open to `null` on any error/non-200 —
 * this must never throw and block a GMC call over a missing org id.
 */
async function fetchOwnerOrgFromIms(token: string): Promise<string | null> {
  try {
    const resp = await fetch(IMS_PROFILE_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) return null;
    const profile = await resp.json() as { ownerOrg?: string };
    return profile.ownerOrg ?? null;
  } catch {
    return null;
  }
}

/**
 * `sync-products`/`diagnostics` require an `x-gw-ims-org-id` header (`require-adobe-auth: true`).
 * VITE_GMC_IMS_ORG_ID remains as a manual override/escape hatch only; the normal path always
 * asks IMS live via `fetchOwnerOrgFromIms`.
 */
export async function getImsOrgId(token: string): Promise<string | null> {
  const override = import.meta.env.VITE_GMC_IMS_ORG_ID;
  if (override) return override;
  if (cachedOrg?.token === token) return cachedOrg.orgId;
  const orgId = await fetchOwnerOrgFromIms(token);
  cachedOrg = { token, orgId };
  return orgId;
}

/**
 * Mirrors pdp-gmc-sync's actions/lib/mapProduct.js sanitizeOfferId() exactly — the server returns
 * results keyed by the sanitized offerId (URN namespace prefix stripped, colons to hyphens), so
 * matching a result back to a ManagedDoc by `identity.productId` requires the same transform
 * client-side. Do not let this drift from the server implementation.
 */
export function sanitizeOfferId(id: string): string {
  const trimmed = String(id ?? '').trim();
  const stripped = trimmed.replace(/^urn:aaid:sc:[^:]+:/, '');
  return stripped.replace(/:/g, '-');
}

export interface GmcSyncRow {
  product_id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  price: number;
  /** Mirrors pdp-gmc-sync's mapProduct.js contract: omit both sale fields entirely (not `null`)
   * when there's no active discount — see fetchProductPricing in zazzleApi.ts. */
  sale_price?: number;
  sale_price_end_date?: string;
  product_type?: string;
}

export interface GmcSyncResult {
  env: GmcEnv;
  dataSource: string;
  submitted: number;
  succeeded: number;
  failed: number;
  pushedIds: string[];
  failedItems: { productId: string; reason: string }[];
}

export type GmcDiagnosticResult =
  | {
      offerId: string;
      ok: true;
      status: 'active' | 'pending' | 'disapproved' | 'unknown';
      issues: { code: string; severity: string; resolution: string; attribute: string; description: string }[];
      name: string;
      stale?: boolean;
    }
  | {
      offerId: string;
      ok: false;
      status: 'error';
      code?: string;
      statusCode?: string;
      reason?: string;
      message: string;
    };

export interface GmcDiagnosticsResponse {
  env: GmcEnv;
  accountId: string;
  offerCount: number;
  counts: { active: number; pending: number; disapproved: number; unknown: number; error: number };
  itemIssueTop: unknown[];
  results: GmcDiagnosticResult[];
}

async function gmcFetch<T>(
  action: 'sync-products' | 'diagnostics',
  body: Record<string, unknown>,
  token: string,
): Promise<T> {
  const orgId = await getImsOrgId(token);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (orgId) headers['x-gw-ims-org-id'] = orgId;
  const resp = await fetch(`${getBaseUrl()}/${action}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${action}: ${resp.status}: ${text}`);
  }
  return resp.json() as Promise<T>;
}

export async function syncProducts(env: GmcEnv, products: GmcSyncRow[], token: string): Promise<GmcSyncResult> {
  return gmcFetch<GmcSyncResult>('sync-products', { env, products }, token);
}

export async function fetchDiagnostics(env: GmcEnv, offerIds: string[], token: string): Promise<GmcDiagnosticsResponse> {
  return gmcFetch<GmcDiagnosticsResponse>('diagnostics', { env, offerIds }, token);
}
