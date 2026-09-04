import { runBatch, DEFAULT_CONCURRENCY, sleep } from '../lib/concurrency';

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

export function daPathToProdUrl(daPath: string): string {
  const { org, repo, contentPath } = parseDAPath(daPath);
  // Production host binding is specific to this EDS site (adobe.com/express);
  // the live origin serves www.adobe.com with the content path preserved 1:1.
  if (org === 'adobecom' && repo === 'da-express-milo') {
    return `https://www.adobe.com${contentPath}`;
  }
  // Unknown org/repo → no known prod binding; fall back to the live origin URL.
  return daPathToLiveUrl(daPath);
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

export async function createDocVersion(dest: string, label: string): Promise<void> {
  const t = getToken();
  if (!t) throw new Error('DA token not set; set VITE_DA_TOKEN or run from DA.live');
  const path = dest.endsWith('.html') ? dest : `${dest}.html`;
  const resp = await fetch(`${DA_API}/versionsource${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ label }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`version ${dest}: ${resp.status}: ${text}`);
  }
}

export async function docExists(daPath: string): Promise<boolean> {
  const t = getToken();
  const headers: Record<string, string> = { 'cache-control': 'no-store' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const path = daPath.endsWith('.html') ? daPath : `${daPath}.html`;
  const resp = await fetch(`${DA_API}/source${path}`, { method: 'HEAD', headers });
  if (resp.status === 404) return false;
  if (resp.ok) return true;
  throw new Error(`${resp.status}: ${daPath}`);
}

export async function cat(filePath: string): Promise<string> {
  const t = getToken();
  if (!t) throw new Error('DA token not set; set VITE_DA_TOKEN or run from DA.live');
  const path = filePath.endsWith('.html') ? filePath : `${filePath}.html`;
  const resp = await fetch(`${DA_API}/source${path}`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);
  return resp.text();
}

export interface DaListItem {
  path: string;
  ext?: string;
}

export async function listDirectory(dirPath: string): Promise<DaListItem[]> {
  const t = getToken();
  if (!t) throw new Error('DA token not set; set VITE_DA_TOKEN or run from DA.live');
  const resp = await fetch(`${DA_API}/list${dirPath}`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);
  return resp.json() as Promise<DaListItem[]>;
}

export interface DirectoryCheckResult {
  valid: boolean;
  error?: string;
}

export async function checkDirectoryExists(dirPath: string): Promise<DirectoryCheckResult> {
  try {
    await listDirectory(dirPath);
    return { valid: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const is403 = msg.startsWith('403');
    const is404 = msg.startsWith('404');
    return {
      valid: false,
      error: is403
        ? "Access denied — you don't have permission to write to this directory"
        : is404
        ? 'Directory not found — confirm the path exists in DA before generating'
        : `Could not verify directory (${msg})`,
    };
  }
}

export async function fetchSheet(daPath: string): Promise<Record<string, string>[]> {
  const t = getToken();
  if (!t) throw new Error('DA token not set; set VITE_DA_TOKEN or run from DA.live');
  const path = daPath.endsWith('.json') ? daPath : `${daPath}.json`;
  const resp = await fetch(`${DA_API}/source${path}`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);
  const json = await resp.json() as { data?: Record<string, string>[] };
  return json.data ?? [];
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

export async function triggerUnpublish(daPath: string, token: string): Promise<void> {
  const { org, repo, contentPath } = parseDAPath(daPath);
  const resp = await fetch(`${HLX_ADMIN}/live/${org}/${repo}/${BRANCH}${contentPath}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`unpublish ${daPath}: ${resp.status}`);
}

export async function deleteDocument(daPath: string, token: string): Promise<void> {
  const fullpath = `${DA_API}/source${daPath}${daPath.endsWith('.html') ? '' : '.html'}`;
  const resp = await fetch(fullpath, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`delete ${daPath}: ${resp.status}`);
}

export interface PageStatus {
  live: boolean;
  preview: boolean;
  /** False when the status check failed (rate-limited/unreachable); live/preview are then not meaningful. */
  ok: boolean;
}

export async function checkPageStatus(daPath: string, token: string): Promise<PageStatus> {
  const { org, repo, contentPath } = parseDAPath(daPath);
  const url = `${HLX_ADMIN}/status/${org}/${repo}/${BRANCH}${contentPath}`;
  const MAX_ATTEMPTS = 4;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      // Rate-limited or transient server error — back off and retry rather than silently
      // reporting the doc as "not published" (the AEM admin API throttles aggressively).
      if (resp.status === 429 || resp.status >= 500) {
        if (attempt < MAX_ATTEMPTS - 1) {
          const retryAfter = Number(resp.headers.get('retry-after'));
          const backoffMs = Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : 400 * 2 ** attempt;
          await sleep(backoffMs + Math.random() * 300);
          continue;
        }
        return { live: false, preview: false, ok: false };
      }
      if (!resp.ok) return { live: false, preview: false, ok: false };
      const data = await resp.json() as { live?: { status: number }; preview?: { status: number } };
      return { live: data.live?.status === 200, preview: data.preview?.status === 200, ok: true };
    } catch {
      // Network / CORS failure — the endpoint is unreachable from this origin, so retrying
      // is futile (and, at scale, catastrophically slow). Fail fast; the caller marks it Unknown.
      return { live: false, preview: false, ok: false };
    }
  }
  return { live: false, preview: false, ok: false };
}

export async function batchCheckStatus(
  paths: string[],
  token: string,
  concurrency: number = DEFAULT_CONCURRENCY,
): Promise<Map<string, PageStatus>> {
  const results = new Map<string, PageStatus>();
  await runBatch(paths, async (p) => {
    results.set(p, await checkPageStatus(p, token));
  }, concurrency);
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scalable status resolution: bulk status job (primary) → authless CDN HEAD (fallback).
//
// Replaces per-document GETs to admin.hlx.page/status, which is rate-limited to ~10 req/s per
// project and so mass-fails a ~6k-doc scan. The bulk job statuses the whole set in one async job;
// if it's unavailable or returns an unrecognized shape, we fall back to bodyless/authless HEAD
// probes of the live CDN (200 req/s host limit), which reliably determine "published".
// ─────────────────────────────────────────────────────────────────────────────

const BULK_STATUS_CHUNK = 1000;   // max paths per bulk status job
const JOB_POLL_MS = 1000;         // delay between job-status polls
const JOB_POLL_MAX = 180;         // give up on a job after ~3 min → fall back
const HEAD_BATCH_SIZE = 20;       // paths probed in parallel per HEAD batch
const HEAD_BATCH_MS = 300;        // min ms per HEAD batch (paces well under the CDN's 200 req/s)

type StatusProgress = (done: number, total: number) => void;

/**
 * Resolve publish/preview status for many docs without hammering the rate-limited admin status
 * API. Tries the AEM bulk status job first; on any failure/unsupported/unrecognized response it
 * falls back to authless CDN HEAD probes (reliable for "published").
 */
export async function resolveStatuses(
  paths: string[],
  token: string,
  onProgress?: StatusProgress,
): Promise<Map<string, PageStatus>> {
  if (paths.length === 0) return new Map();
  try {
    return await bulkResolveStatus(paths, token, onProgress);
  } catch {
    return await headResolveStatus(paths, onProgress);
  }
}

/**
 * Authless, bodyless HEAD probe of the live CDN: live = 200. The preview tier is often
 * auth-gated, so it isn't probed here — a not-live doc reads as Draft in this fallback.
 */
export async function headResolveStatus(
  paths: string[],
  onProgress?: StatusProgress,
): Promise<Map<string, PageStatus>> {
  const result = new Map<string, PageStatus>();
  for (let i = 0; i < paths.length; i += HEAD_BATCH_SIZE) {
    const batchStart = Date.now();
    const batch = paths.slice(i, i + HEAD_BATCH_SIZE);
    await Promise.all(batch.map(async (p) => {
      let live = false;
      try {
        const resp = await fetch(daPathToLiveUrl(p), { method: 'HEAD' });
        live = resp.ok;
      } catch { /* CDN unreachable → treat as not published */ }
      result.set(p, { live, preview: false, ok: true });
    }));
    if (onProgress) onProgress(Math.min(i + batch.length, paths.length), paths.length);
    const wait = HEAD_BATCH_MS - (Date.now() - batchStart);
    if (wait > 0 && i + HEAD_BATCH_SIZE < paths.length) await sleep(wait);
  }
  return result;
}

/** Bulk status via the AEM admin job API: POST the paths, poll the job, read per-path results. */
export async function bulkResolveStatus(
  paths: string[],
  token: string,
  onProgress?: StatusProgress,
): Promise<Map<string, PageStatus>> {
  const { org, repo } = parseDAPath(paths[0]);
  const result = new Map<string, PageStatus>();
  let done = 0;
  for (let i = 0; i < paths.length; i += BULK_STATUS_CHUNK) {
    const chunk = paths.slice(i, i + BULK_STATUS_CHUNK);
    const contentToDa = new Map<string, string>();
    const contentPaths = chunk.map((p) => {
      const cp = parseDAPath(p).contentPath;
      contentToDa.set(cp, p);
      return cp;
    });
    const statuses = await runBulkStatusChunk(org, repo, contentPaths, token);
    for (const [cp, st] of statuses) {
      const da = contentToDa.get(cp);
      if (da) result.set(da, st);
    }
    done += chunk.length;
    if (onProgress) onProgress(Math.min(done, paths.length), paths.length);
  }
  // Any path the job didn't report on exists in source but not on preview/live → Draft.
  for (const p of paths) if (!result.has(p)) result.set(p, { live: false, preview: false, ok: true });
  return result;
}

type BulkResource = {
  path?: string; webPath?: string; resourcePath?: string;
  live?: { status?: number }; preview?: { status?: number };
};

async function runBulkStatusChunk(
  org: string,
  repo: string,
  contentPaths: string[],
  token: string,
): Promise<Map<string, PageStatus>> {
  // 1. Start the async bulk status job for these paths.
  const startResp = await fetch(`${HLX_ADMIN}/status/${org}/${repo}/${BRANCH}/*`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths: contentPaths, select: ['preview', 'live'] }),
  });
  if (!startResp.ok) throw new Error(`bulk status start: ${startResp.status}`);
  const startData = await startResp.json() as { job?: { name?: string }; links?: { self?: string } };
  const jobName = startData.job?.name ?? startData.links?.self?.split('/').pop();
  if (!jobName) throw new Error('bulk status: missing job name');

  // 2. Poll until the job stops.
  const jobUrl = `${HLX_ADMIN}/job/${org}/${repo}/${BRANCH}/status/${jobName}`;
  let stopped = false;
  for (let attempt = 0; attempt < JOB_POLL_MAX && !stopped; attempt++) {
    await sleep(JOB_POLL_MS);
    const jResp = await fetch(jobUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!jResp.ok) throw new Error(`bulk status poll: ${jResp.status}`);
    const jData = await jResp.json() as { state?: string };
    stopped = jData.state === 'stopped' || jData.state === 'completed';
  }
  if (!stopped) throw new Error('bulk status: job did not finish in time');

  // 3. Read per-path results.
  // NOTE: the exact /details response shape must be confirmed against a live run (see the plan's
  // feasibility-lock step). We parse the documented `resources` array and THROW on anything else
  // (incl. a path-key format that doesn't match what we requested) so resolveStatuses() falls back
  // to the reliable HEAD probe instead of silently reporting everything as Draft.
  const dResp = await fetch(`${jobUrl}/details`, { headers: { Authorization: `Bearer ${token}` } });
  if (!dResp.ok) throw new Error(`bulk status details: ${dResp.status}`);
  const details = await dResp.json() as { data?: { resources?: unknown }; resources?: unknown };
  const resources = details.data?.resources ?? details.resources;
  if (!Array.isArray(resources)) throw new Error('bulk status: unrecognized details shape');
  const out = new Map<string, PageStatus>();
  for (const item of resources as BulkResource[]) {
    const path = item.path ?? item.webPath ?? item.resourcePath;
    if (!path) continue;
    out.set(path, { live: item.live?.status === 200, preview: item.preview?.status === 200, ok: true });
  }
  const matched = contentPaths.filter((cp) => out.has(cp)).length;
  if (matched < contentPaths.length * 0.5) {
    throw new Error(`bulk status: path-format mismatch (${matched}/${contentPaths.length})`);
  }
  return out;
}

