const DA_API = 'https://admin.da.live';
const ORG = 'adobecom';
const REPO = 'da-express-milo';

let token: string | null = null;

export function getToken(): string | null {
  return token ?? import.meta.env.VITE_DA_TOKEN ?? null;
}

export function setToken(t: string | null): void {
  token = t;
}

export interface PostDocResponse {
  source?: { editUrl?: string };
}

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
    throw new Error(`${resp.status}: ${errorText}`);
  }
  return resp.json() as Promise<PostDocResponse>;
}

export async function cat(filePath: string): Promise<string> {
  const t = getToken();
  if (!t) throw new Error('DA token not set; set VITE_DA_TOKEN or run from DA.live');
  const resp = await fetch(`${DA_API}/source${filePath}`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);
  return resp.text();
}

export function buildPath(relativePath: string): string {
  const p = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `/${ORG}/${REPO}${p}`;
}
