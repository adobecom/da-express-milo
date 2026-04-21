export const DA_ADMIN = 'https://admin.da.live';

const AEM_ADMIN = 'https://admin.hlx.page';
const STATUS_BATCH_SIZE = 5;
const STATUS_BATCH_MS = 500; // 5 req per 500ms = 10 req/sec, within the AEM Admin rate limit

function daPathToStatusUrl(daPath) {
  // /adobecom/da-express-milo/express/foo/bar.html → https://admin.hlx.page/status/adobecom/da-express-milo/main/express/foo/bar
  const parts = daPath.split('/').filter(Boolean);
  const [org, repo, ...rest] = parts;
  const contentPath = rest.join('/').replace(/\.html$/, '');
  return `${AEM_ADMIN}/status/${org}/${repo}/main/${contentPath}`;
}

async function probeAuthMode(url, token) {
  let resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (resp.ok || resp.status === 404) return 'bearer';
  if (resp.status === 401) {
    resp = await fetch(url, { credentials: 'include' });
    if (resp.ok || resp.status === 404) return 'credentials';
  }
  return null;
}

export async function fetchPublishedPaths(paths, token, onProgress) {
  if (paths.length === 0) return [];

  const authMode = await probeAuthMode(daPathToStatusUrl(paths[0]), token);
  if (!authMode) throw new Error('Status unavailable: authentication failed for admin.hlx.page.');

  const fetchOpts = authMode === 'bearer'
    ? { headers: { Authorization: `Bearer ${token}` } }
    : { credentials: 'include' };

  const published = [];
  for (let i = 0; i < paths.length; i += STATUS_BATCH_SIZE) {
    const batchStart = Date.now();
    const batch = paths.slice(i, i + STATUS_BATCH_SIZE);
    // eslint-disable-next-line no-await-in-loop
    const results = await Promise.all(batch.map(async (path) => {
      try {
        const resp = await fetch(daPathToStatusUrl(path), fetchOpts);
        if (!resp.ok) return null;
        const data = await resp.json();
        return data.publishLastModified ? path : null;
      } catch { return null; }
    }));
    for (const p of results) if (p) published.push(p);
    if (onProgress) onProgress(i + batch.length, paths.length);
    const elapsed = Date.now() - batchStart;
    const wait = STATUS_BATCH_MS - elapsed;
    // eslint-disable-next-line no-await-in-loop
    if (wait > 0 && i + STATUS_BATCH_SIZE < paths.length) await new Promise((r) => { setTimeout(r, wait); });
  }
  return published;
}

export function safeFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') throw new Error(`Write operations are not permitted (attempted ${method} ${url})`);
  return fetch(url, { ...options, method: 'GET' });
}

export async function ls(path, token) {
  const resp = await safeFetch(`${DA_ADMIN}/list${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`ls ${path}: ${resp.status}`);
  return resp.json();
}

export async function cat(path, token) {
  const resp = await safeFetch(`${DA_ADMIN}/source${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`cat ${path}: ${resp.status}`);
  return resp.text();
}

export async function readJson(path, token) {
  try {
    const resp = await safeFetch(`${DA_ADMIN}/source${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}

export async function writeJson(path, data, token) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const body = new FormData();
  body.append('data', blob);
  const resp = await fetch(`${DA_ADMIN}/source${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  if (!resp.ok) throw new Error(`write ${path}: ${resp.status}`);
}

const LS_CONCURRENCY = 10;

// BFS traversal — batches ls calls to avoid overwhelming the API
export async function collectDocs(rootDir, token, onProgress) {
  const docs = [];
  let dirs = [rootDir];
  while (dirs.length) {
    const nextDirs = [];
    for (let i = 0; i < dirs.length; i += LS_CONCURRENCY) {
      const batch = dirs.slice(i, i + LS_CONCURRENCY);
      // eslint-disable-next-line no-await-in-loop
      const listings = await Promise.all(batch.map((d) => ls(d, token)));
      for (const items of listings) {
        for (const item of items) {
          if (item.ext === 'html') docs.push(item.path);
          else if (!item.ext) nextDirs.push(item.path);
        }
      }
      if (onProgress) onProgress(docs.length);
    }
    dirs = nextDirs;
  }
  return docs;
}
