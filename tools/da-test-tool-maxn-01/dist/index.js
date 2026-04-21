/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const DA_ADMIN = 'https://admin.da.live';
const SCAN_ROOT = '/adobecom/da-express-milo/express';
const BATCH_SIZE = 10;

const $status = document.getElementById('status');
const $results = document.getElementById('results');
const $form = document.getElementById('search-form');

// Safety guardrail: this tool is read-only. Throws if any non-GET request is attempted.
function safeFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') throw new Error(`Write operations are not permitted (attempted ${method} ${url})`);
  return fetch(url, { ...options, method: 'GET' });
}

async function ls(path, token) {
  const resp = await safeFetch(`${DA_ADMIN}/list${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`ls ${path}: ${resp.status}`);
  return resp.json();
}

async function cat(path, token) {
  const resp = await safeFetch(`${DA_ADMIN}/source${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`cat ${path}: ${resp.status}`);
  return resp.text();
}

// BFS traversal — lists all directories at a given level in parallel
async function collectDocs(rootDir, token) {
  const docs = [];
  let dirs = [rootDir];
  while (dirs.length) {
    // eslint-disable-next-line no-await-in-loop
    const listings = await Promise.all(dirs.map((d) => ls(d, token)));
    dirs = [];
    for (const items of listings) {
      for (const item of items) {
        if (item.ext === 'html') docs.push(item.path);
        else if (!item.ext) dirs.push(item.path);
      }
    }
  }
  return docs;
}

function docContainsBlock(html, blockName) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const query = blockName.toLowerCase().trim();

  // DA stores blocks as <div class="block-name [variant...]">
  // The block name is always the first class token
  for (const div of doc.querySelectorAll('div[class]')) {
    const firstClass = div.className.trim().toLowerCase().split(/\s+/)[0];
    if (firstClass === query) return true;
  }

  // Fallback: table-based format (older Word/Google Docs-authored content)
  for (const table of doc.querySelectorAll('table')) {
    const firstCell = table.querySelector('tr:first-child th, tr:first-child td');
    if (firstCell) {
      const text = firstCell.textContent.trim().toLowerCase();
      if (
        text === query
        || text.startsWith(`${query} `)
        || text.startsWith(`${query}(`)
        || text.startsWith(`${query},`)
      ) return true;
    }
  }

  return false;
}

async function scanDocs(paths, blockName, token) {
  let scanned = 0;
  let errors = 0;
  $results.innerHTML = '';

  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const batch = paths.slice(i, i + BATCH_SIZE);
    // eslint-disable-next-line no-await-in-loop
    const batchErrors = await Promise.all(batch.map(async (path) => {
      try {
        const html = await cat(path, token);
        if (docContainsBlock(html, blockName)) {
          const li = document.createElement('li');
          li.textContent = path;
          $results.appendChild(li);
        }
        return 0;
      } catch {
        return 1;
      }
    }));
    errors += batchErrors.reduce((sum, e) => sum + e, 0);
    scanned += batch.length;
    const errStr = errors > 0 ? `, ${errors} error${errors !== 1 ? 's' : ''}` : '';
    $status.textContent = `Scanning… ${scanned} / ${paths.length}${errStr}`;
  }

  const count = $results.children.length;
  const errSuffix = errors > 0 ? ` (${errors} file${errors !== 1 ? 's' : ''} could not be read)` : '';
  $status.textContent = `Done — ${count} document${count !== 1 ? 's' : ''} contain "${blockName}"${errSuffix}.`;
}

(async function init() {
  const { token } = await DA_SDK;

  $form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const blockName = document.getElementById('block-input').value.trim();
    if (!blockName) return;

    $form.querySelector('button').disabled = true;
    $results.innerHTML = '';
    $status.textContent = 'Traversing /express directory tree…';

    try {
      const docs = await collectDocs(SCAN_ROOT, token);
      $status.textContent = `Found ${docs.length} documents. Scanning for "${blockName}"…`;
      await scanDocs(docs, blockName, token);
    } catch (err) {
      $status.textContent = `Error: ${err.message}`;
    } finally {
      $form.querySelector('button').disabled = false;
    }
  });
}());
