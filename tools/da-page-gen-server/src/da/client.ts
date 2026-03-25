/**
 * Low-level DA Admin + HLX Admin API client.
 * All functions accept an optional per-request token that overrides the global DA_TOKEN env var.
 */
import { config } from '../config.js';
import type { DAFile, DASourceResponse, HlxStatusResponse } from './types.js';

function bearerHeaders(token?: string): Record<string, string> {
  const t = token ?? config.daToken;
  if (!t) throw new Error('DA_TOKEN is not set. Provide it in .env or pass a token per-request.');
  return { Authorization: `Bearer ${t}` };
}

function hlxHeaders(token?: string): Record<string, string> {
  const t = token ?? config.daToken;
  if (!t) throw new Error('DA_TOKEN is not set.');
  return { 'x-auth-token': t };
}

// ---------------------------------------------------------------------------
// Source API  (admin.da.live/source)
// ---------------------------------------------------------------------------

/** GET /source/{path} — read raw file content */
export async function getSource(path: string, token?: string): Promise<string> {
  const res = await fetch(`${config.daAdminBase}/source${path}`, {
    headers: bearerHeaders(token),
  });
  if (!res.ok) throw new Error(`getSource ${path}: HTTP ${res.status} — ${await res.text()}`);
  return res.text();
}

/** POST /source/{path} — create or overwrite a file */
export async function postSource(
  path: string,
  content: string,
  contentType = 'text/html',
  token?: string,
): Promise<DASourceResponse> {
  const dest = path.endsWith('.html') ? path : `${path}.html`;
  const form = new FormData();
  form.append('data', new Blob([content], { type: contentType }));
  const res = await fetch(`${config.daAdminBase}/source${dest}`, {
    method: 'POST',
    headers: bearerHeaders(token),
    body: form,
  });
  if (!res.ok) throw new Error(`postSource ${path}: HTTP ${res.status} — ${await res.text()}`);
  return res.json() as Promise<DASourceResponse>;
}

/** DELETE /source/{path} — delete a file or folder */
export async function deleteSource(path: string, token?: string): Promise<void> {
  const res = await fetch(`${config.daAdminBase}/source${path}`, {
    method: 'DELETE',
    headers: bearerHeaders(token),
  });
  if (!res.ok && res.status !== 204)
    throw new Error(`deleteSource ${path}: HTTP ${res.status}`);
}

/** POST /source/{path} (no extension) — create a folder */
export async function createFolder(path: string, token?: string): Promise<DASourceResponse> {
  const res = await fetch(`${config.daAdminBase}/source${path}`, {
    method: 'POST',
    headers: bearerHeaders(token),
  });
  if (!res.ok) throw new Error(`createFolder ${path}: HTTP ${res.status} — ${await res.text()}`);
  return res.json() as Promise<DASourceResponse>;
}

// ---------------------------------------------------------------------------
// List API  (admin.da.live/list)
// ---------------------------------------------------------------------------

/** GET /list/{path} — list immediate children */
export async function listDir(path: string, token?: string): Promise<DAFile[]> {
  const res = await fetch(`${config.daAdminBase}/list${path}`, {
    headers: bearerHeaders(token),
  });
  if (!res.ok) throw new Error(`listDir ${path}: HTTP ${res.status} — ${await res.text()}`);
  return res.json() as Promise<DAFile[]>;
}

/** Recursively list all files under a path (parallelised level-by-level) */
export async function listRecursive(path: string, token?: string): Promise<DAFile[]> {
  const entries = await listDir(path, token);
  const results: DAFile[] = [];
  await Promise.all(
    entries.map(async (entry) => {
      if (entry.ext === undefined) {
        // Directory — recurse
        const children = await listRecursive(entry.path, token);
        results.push(...children);
      } else {
        results.push(entry);
      }
    }),
  );
  return results;
}

// ---------------------------------------------------------------------------
// HLX Admin API  (admin.hlx.page — status / publish)
// ---------------------------------------------------------------------------

/** GET status for a page */
export async function getPageStatus(webPath: string, token?: string): Promise<HlxStatusResponse> {
  const url = `${config.hlxAdminBase}/status/${config.org}/${config.repo}/main${webPath}`;
  const res = await fetch(url, { headers: bearerHeaders(token) });
  if (!res.ok) throw new Error(`getPageStatus ${webPath}: HTTP ${res.status}`);
  return res.json() as Promise<HlxStatusResponse>;
}

/** POST — publish page to live */
export async function publishPage(webPath: string, token?: string): Promise<string> {
  const url = `${config.hlxAdminBase}/live/${config.org}/${config.repo}/main${webPath}`;
  const res = await fetch(url, { method: 'POST', headers: hlxHeaders(token) });
  if (!res.ok) throw new Error(`publishPage ${webPath}: HTTP ${res.status}`);
  return `https://main--${config.repo}--${config.org}.aem.live${webPath}`;
}

/** DELETE — unpublish page from live */
export async function unpublishPage(webPath: string, token?: string): Promise<void> {
  const url = `${config.hlxAdminBase}/live/${config.org}/${config.repo}/main${webPath}`;
  const res = await fetch(url, { method: 'DELETE', headers: hlxHeaders(token) });
  if (!res.ok) throw new Error(`unpublishPage ${webPath}: HTTP ${res.status}`);
}
