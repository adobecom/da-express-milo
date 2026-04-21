export const DA_ADMIN = 'https://admin.da.live';

// aem.live is the public CDN for published AEM Edge Delivery content.
// HEAD requests require no auth and have a 200 req/sec rate limit.
// admin.hlx.page was tried first but has CORS restrictions that block browser requests from non-production origins.
const STATUS_BATCH_SIZE = 20;
const STATUS_BATCH_MS = 200; // 20 req per 200ms = 100 req/sec, well under the 200 req/sec aem.live limit

function daPathToLiveUrl(daPath) {
  // /adobecom/da-express-milo/express/foo/bar.html → https://main--da-express-milo--adobecom.aem.live/express/foo/bar
  const parts = daPath.split('/').filter(Boolean);
  const [org, repo, ...rest] = parts;
  const contentPath = `/${rest.join('/').replace(/\.html$/, '')}`;
  return `https://main--${repo}--${org}.aem.live${contentPath}`;
}

export async function fetchPublishedPaths(paths, _token, onProgress) {
  if (paths.length === 0) return [];

  const published = [];
  for (let i = 0; i < paths.length; i += STATUS_BATCH_SIZE) {
    const batchStart = Date.now();
    const batch = paths.slice(i, i + STATUS_BATCH_SIZE);
    // eslint-disable-next-line no-await-in-loop
    const results = await Promise.all(batch.map(async (path) => {
      try {
        const resp = await fetch(daPathToLiveUrl(path), { method: 'HEAD' });
        return resp.ok ? path : null;
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
