/**
 * Fetches product info from Zazzle partner API by template ID.
 * In dev, uses local Koa proxy to avoid CORS.
 */
const TOP_LEVEL_DOMAIN = 'com';
const ENDPOINT = 'getproductfromtemplate';

const PROXY_ORIGIN = 'http://localhost:3002';

function getProductFromTemplateUrl(templateId: string, useProxy: boolean): string {
  if (useProxy) {
    return `${PROXY_ORIGIN}/api/product-from-template?templateId=${encodeURIComponent(templateId)}`;
  }
  return `https://www.zazzle.${TOP_LEVEL_DOMAIN}/svc/partner/adobeexpress/v1/${ENDPOINT}?templateId=${encodeURIComponent(templateId)}`;
}

export async function fetchProductFromTemplate(templateId: string): Promise<unknown> {
  const useProxy = import.meta.env.DEV && typeof window !== 'undefined';
  const url = getProductFromTemplateUrl(templateId, useProxy);
  const res = await fetch(url);
  const json = await res.json();
  const data = (json as { data?: unknown }).data;
  return data;
}
