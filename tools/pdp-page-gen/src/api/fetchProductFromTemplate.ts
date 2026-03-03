/**
 * Fetches product info from Zazzle partner API by template ID.
 * In the browser we always use a proxy (default localhost:3002) to avoid CORS,
 * including when the built app is loaded from da.live. Run `npm run proxy` locally.
 */

export interface ProductFromTemplateResponse {
  product?: {
    title?: string;
    description?: string;
  };
}

const TOP_LEVEL_DOMAIN = 'com';
const ENDPOINT = 'getproductfromtemplate';

const PROXY_ORIGIN_DEFAULT = 'http://localhost:3002';

function getProxyOrigin(): string | null {
  if (typeof window === 'undefined') return null;
  const envUrl = import.meta.env.VITE_ZAZZLE_PROXY_URL;
  if (envUrl && typeof envUrl === 'string') return envUrl.replace(/\/$/, '');
  return PROXY_ORIGIN_DEFAULT;
}

function getProductFromTemplateUrl(templateId: string, proxyOrigin: string | null): string {
  if (proxyOrigin) {
    return `${proxyOrigin}/api/product-from-template?templateId=${encodeURIComponent(templateId)}`;
  }
  return `https://www.zazzle.${TOP_LEVEL_DOMAIN}/svc/partner/adobeexpress/v1/${ENDPOINT}?templateId=${encodeURIComponent(templateId)}`;
}

export async function fetchProductFromTemplate(templateId: string): Promise<ProductFromTemplateResponse> {
  const proxyOrigin = getProxyOrigin();
  const url = getProductFromTemplateUrl(templateId, proxyOrigin);
  const res = await fetch(url);
  const json = await res.json();
  const data = (json as { data?: ProductFromTemplateResponse }).data;
  return data ?? {};
}
