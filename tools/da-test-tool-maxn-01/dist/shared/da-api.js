export const DA_ADMIN = 'https://admin.da.live';

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
