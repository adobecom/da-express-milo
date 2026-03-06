/**
 * DA (Document Authoring) Source API – read/write via admin.da.live.
 * Same pattern as daas-dashboard daApi: cat uses GET /source/{path} with Bearer token.
 */

const DA_API = 'https://admin.da.live';
const ORG = 'adobecom';
const REPO = 'da-express-milo';

console.log(window.location.hostname, window.location.pathname, window.location.port);

let token: string | null = null;

export function getToken(): string | null {
  return token ?? import.meta.env.VITE_DA_TOKEN ?? null;
}

export function setToken(t: string | null): void {
  token = t;
}

/**
 * Convert a page URL to the DA source path for cat().
 * Uses the URL's pathname and prefixes with /{org}/{repo}, appends .html if missing.
 * @example
 * urlToSourcePath('https://main--da-express-milo--adobecom.aem.page/drafts/jingle/pdp-page-gen/foo')
 * // -> '/adobecom/da-express-milo/drafts/jingle/pdp-page-gen/foo.html'
 */
export function urlToSourcePath(pageUrl: string): string {
  const u = new URL(pageUrl.trim(), 'https://dummy');
  let pathname = u.pathname.replace(/\/$/, '') || '/';
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  const sourcePath = `/${ORG}/${REPO}${pathname}`;
  return sourcePath.endsWith('.html') ? sourcePath : `${sourcePath}.html`;
}

/**
 * cat – read file content from DA source
 * GET /source/{path}
 */
export async function cat(filePath: string): Promise<string> {
  const t = getToken();
  if (!t) throw new Error('DA token not set; set VITE_DA_TOKEN or run from DA.live');
  const url = `${DA_API}/source${filePath}`;
  const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${t}` } });
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`cat failed: ${resp.status} - ${errorText}`);
  }
  return resp.text();
}

/**
 * Convert a relative path (e.g. /drafts/jingle/pdp-page-gen/slug) to full DA source path for postDoc.
 */
export function pathToSourcePath(relativePath: string): string {
  const p = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `/${ORG}/${REPO}${p}`;
}

export interface PostDocResponse {
  source?: { editUrl?: string };
}

/**
 * postDoc – write HTML to a document at the given path
 * POST /source/{path}.html
 * @returns API response; use res.source.editUrl for the edit link
 */
export async function postDoc(dest: string, html: string): Promise<PostDocResponse> {
  const t = getToken();
  if (!t) throw new Error('DA token not set; set VITE_DA_TOKEN or run from DA.live');
  const fullpath = `${DA_API}/source${dest}${dest.endsWith('.html') ? '' : '.html'}`;
  const blob = new Blob([html], { type: 'text/html' });
  const body = new FormData();
  body.append('data', blob);
  const resp = await fetch(fullpath, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}` },
    body,
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`postDoc failed: ${resp.status} - ${errorText}`);
  }
  const json = (await resp.json()) as PostDocResponse;
  return json;
}
