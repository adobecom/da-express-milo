const DA_API = 'https://admin.da.live';
const HLX_ADMIN = 'https://admin.hlx.page';
const BRANCH = 'main';

function parseDAPath(daPath: string): { org: string; repo: string; contentPath: string } {
  const parts = daPath.replace(/\.html$/, '').split('/').filter(Boolean);
  const [org, repo, ...rest] = parts;
  return { org, repo, contentPath: `/${rest.join('/')}` };
}

export function daPathToPreviewUrl(daPath: string): string {
  const { org, repo, contentPath } = parseDAPath(daPath);
  return `https://${BRANCH}--${repo}--${org}.aem.page${contentPath}`;
}

export function daPathToLiveUrl(daPath: string): string {
  const { org, repo, contentPath } = parseDAPath(daPath);
  return `https://${BRANCH}--${repo}--${org}.aem.live${contentPath}`;
}

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
  const path = filePath.endsWith('.html') ? filePath : `${filePath}.html`;
  const resp = await fetch(`${DA_API}/source${path}`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);
  return resp.text();
}

// Convert any DA-related URL to an admin source path (/org/repo/path)
export function urlToSourcePath(url: string): string {
  if (url.includes('da.live')) {
    try {
      const u = new URL(url);
      if (u.hash.length > 1) {
        const fragment = u.hash.slice(1);
        return fragment.startsWith('/') ? fragment : `/${fragment}`;
      }
    } catch { /* fall through */ }
    const hashIdx = url.indexOf('#');
    if (hashIdx !== -1) {
      const fragment = url.substring(hashIdx + 1);
      return fragment.startsWith('/') ? fragment : `/${fragment}`;
    }
  }
  if (url.startsWith('/')) return url;
  // Relative path without scheme: org/repo/path
  if (!url.includes('://')) return `/${url}`;
  // AEM page/preview URL: https://main--repo--org.aem.page/path
  try {
    const u = new URL(url);
    const sub = u.hostname.split('.')[0];
    const parts = sub.split('--');
    const org = parts[parts.length - 1];
    const repo = parts[parts.length - 2];
    return `/${org}/${repo}${u.pathname}`;
  } catch {
    return url;
  }
}

export function extractPlaceholders(html: string): string[] {
  const matches = [...html.matchAll(/\{\{([^}]+)\}\}/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

export interface TemplateValidation {
  status: 'ready' | 'warning' | 'invalid';
  placeholders: string[];
  issues: string[];
}

export function validateTemplate(html: string): TemplateValidation {
  const issues: string[] = [];
  const placeholders = extractPlaceholders(html);

  if (!/<main[\s>]/i.test(html)) {
    issues.push('Missing <main> element — template may not be a valid DA document');
  }
  if (placeholders.length === 0) {
    issues.push('No {{placeholder}} tokens found — verify the template has substitution markers');
  }

  const isInvalid = issues.some((i) => i.includes('Missing <main>'));
  const status = isInvalid ? 'invalid' : issues.length > 0 ? 'warning' : 'ready';

  return { status, issues, placeholders };
}

export async function triggerPreview(daPath: string, token: string): Promise<void> {
  const { org, repo, contentPath } = parseDAPath(daPath);
  const resp = await fetch(`${HLX_ADMIN}/preview/${org}/${repo}/${BRANCH}${contentPath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`preview ${daPath}: ${resp.status}`);
}

export async function triggerPublish(daPath: string, token: string): Promise<void> {
  const { org, repo, contentPath } = parseDAPath(daPath);
  const resp = await fetch(`${HLX_ADMIN}/live/${org}/${repo}/${BRANCH}${contentPath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`publish ${daPath}: ${resp.status}`);
}

