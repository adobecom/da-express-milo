/**
 * Fetches product info from Zazzle partner API by template ID.
 * In the browser we use a CORS proxy worker to avoid Zazzle CORS; the proxy is
 * whitelisted for da.live and localhost. Direct Zazzle URL is used when window is undefined (e.g. SSR).
 */

export interface ProductFromTemplateResponse {
  product?: {
    title?: string;
    description?: string;
  };
}

const TOP_LEVEL_DOMAIN = 'com';
const ENDPOINT = 'getproductfromtemplate';

const PROXY_BASE_DEFAULT = 'https://proxy-worker.jingleh12345.workers.dev/proxy';

function getProxyBase(): string | null {
  if (typeof window === 'undefined') return null;
  const envUrl = import.meta.env.VITE_ZAZZLE_PROXY_URL;
  if (envUrl && typeof envUrl === 'string') return envUrl.replace(/\/$/, '');
  return PROXY_BASE_DEFAULT;
}

function getZazzleApiUrl(templateId: string): string {
  return `https://www.zazzle.${TOP_LEVEL_DOMAIN}/svc/partner/adobeexpress/v1/${ENDPOINT}?templateId=${encodeURIComponent(templateId)}`;
}

function getProductFromTemplateUrl(templateId: string, proxyBase: string | null): string {
  if (proxyBase) {
    const target = getZazzleApiUrl(templateId);
    return `${proxyBase}?url=${encodeURIComponent(target)}`;
  }
  return getZazzleApiUrl(templateId);
}

export async function fetchProductFromTemplate(templateId: string): Promise<ProductFromTemplateResponse> {
  const proxyBase = getProxyBase();
  const url = getProductFromTemplateUrl(templateId, proxyBase);
  const res = await fetch(url);
  const json = await res.json();
  // Proxy returns upstream body as-is; some backends wrap in { data }; accept both.
  const data = (json as { data?: ProductFromTemplateResponse }).data ?? (json as ProductFromTemplateResponse);
  return data ?? {};
}
