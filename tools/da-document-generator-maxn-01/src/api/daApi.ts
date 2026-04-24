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

// Convert any DA-related URL to an admin source path (/org/repo/path)
export function urlToSourcePath(url: string): string {
  // DA edit URL: https://da.live/#/adobecom/da-express-milo/...
  if (url.includes('da.live/#/')) {
    return url.substring(url.indexOf('da.live/#/') + 'da.live/#'.length);
  }
  // Raw source path already
  if (url.startsWith('/')) return url;
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
  if (!/<meta\s/i.test(html)) {
    issues.push('No <meta> tags found — SEO metadata may not populate correctly');
  }
  if (placeholders.length === 0) {
    issues.push('No {{placeholder}} tokens found — verify the template has substitution markers');
  }
  const hasHero =
    /class="hero"/i.test(html) ||
    /<th[^>]*>\s*hero\s*<\/th>/i.test(html) ||
    /<td[^>]*>\s*hero\s*<\/td>/i.test(html);
  if (!hasHero) {
    issues.push('No hero block detected — verify the template includes expected PDP structure');
  }

  const isInvalid = issues.some((i) => i.includes('Missing <main>'));
  const status = isInvalid ? 'invalid' : issues.length > 0 ? 'warning' : 'ready';

  return { status, issues, placeholders };
}
