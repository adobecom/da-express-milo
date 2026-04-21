/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
/* eslint-enable import/no-unresolved */
import { collectDocs, cat, readJson, writeJson } from '../shared/da-api.js';

const SCAN_ROOT = '/adobecom/da-express-milo/express';
const AUDIT_DATA_PATH = '/adobecom/da-express-milo/drafts/da-test-tool-maxn-01/audit-results.json';
const GITHUB_BLOCKS_API = 'https://api.github.com/repos/adobecom/da-express-milo/contents/express/code/blocks?ref=stage';
const BATCH_SIZE = 10;

async function fetchRepoBlocks() {
  try {
    const resp = await fetch(GITHUB_BLOCKS_API);
    if (!resp.ok) return new Set();
    const items = await resp.json();
    return new Set(items.filter((i) => i.type === 'dir').map((i) => i.name.toLowerCase()));
  } catch {
    return new Set();
  }
}

const $scanBtn = document.getElementById('scan-btn');
const $lastScanned = document.getElementById('last-scanned');
const $status = document.getElementById('status');
const $blockCount = document.getElementById('block-count');
const $results = document.getElementById('results');

// Extracts block names from a DA HTML document.
// Targets direct children of section divs (main > div > div[class]) which is
// the standard DA block structure, avoiding interior utility class names.
function extractBlocks(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = new Set();

  for (const div of doc.querySelectorAll('main > div > div[class]')) {
    const firstClass = div.className.trim().toLowerCase().split(/\s+/)[0];
    if (firstClass) blocks.add(firstClass);
  }

  // Fallback: table-based format (older Word/Google Docs-authored content)
  for (const table of doc.querySelectorAll('main > div > table')) {
    const firstCell = table.querySelector('tr:first-child th, tr:first-child td');
    if (firstCell) {
      const text = firstCell.textContent.trim().toLowerCase().split(/[\s(,]/)[0];
      if (text) blocks.add(text);
    }
  }

  return [...blocks];
}

function renderResults(data, repoBlocks) {
  const sorted = Object.entries(data.blocks)
    .sort(([, a], [, b]) => b.length - a.length);

  $blockCount.textContent = `${sorted.length} unique block${sorted.length !== 1 ? 's' : ''} across ${data.docCount} documents`;
  $results.innerHTML = '';

  for (const [blockName, paths] of sorted) {
    const details = document.createElement('details');
    const summary = document.createElement('summary');

    const left = document.createElement('span');
    left.className = 'summary-left';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = blockName;
    left.appendChild(nameSpan);
    if (repoBlocks.has(blockName)) {
      const badge = document.createElement('span');
      badge.className = 'repo-badge';
      badge.textContent = '✓ in repo';
      left.appendChild(badge);
    }
    const countSpan = document.createElement('span');
    countSpan.className = 'summary-count';
    countSpan.textContent = `${paths.length} use${paths.length !== 1 ? 's' : ''}`;
    summary.appendChild(left);
    summary.appendChild(countSpan);

    const ul = document.createElement('ul');
    ul.className = 'block-paths';
    for (const path of paths) {
      const li = document.createElement('li');
      li.textContent = path;
      ul.appendChild(li);
    }
    details.appendChild(summary);
    details.appendChild(ul);
    $results.appendChild(details);
  }
}

async function runScan(token) {
  $results.innerHTML = '';
  $blockCount.textContent = '';
  $status.textContent = 'Traversing /express directory tree…';

  // Fetch repo block list in parallel with the BFS traversal
  const repoBlocksPromise = fetchRepoBlocks();

  const docs = await collectDocs(SCAN_ROOT, token, (count) => {
    $status.textContent = `Traversing… ${count} documents found`;
  });

  $status.textContent = `Found ${docs.length} documents. Scanning for blocks…`;

  const blocks = {};
  let scanned = 0;
  let errors = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    // eslint-disable-next-line no-await-in-loop
    const batchErrors = await Promise.all(batch.map(async (path) => {
      try {
        const html = await cat(path, token);
        for (const name of extractBlocks(html)) {
          if (!blocks[name]) blocks[name] = [];
          blocks[name].push(path);
        }
        return 0;
      } catch {
        return 1;
      }
    }));
    errors += batchErrors.reduce((sum, e) => sum + e, 0);
    scanned += batch.length;
    const errStr = errors > 0 ? `, ${errors} error${errors !== 1 ? 's' : ''}` : '';
    $status.textContent = `Scanning… ${scanned} / ${docs.length}${errStr}`;
  }

  const repoBlocks = await repoBlocksPromise;

  const data = {
    scannedAt: new Date().toISOString(),
    docCount: docs.length,
    scanErrors: errors,
    repoBlocks: [...repoBlocks],
    blocks,
  };

  $status.textContent = 'Saving results…';
  await writeJson(AUDIT_DATA_PATH, data, token);

  return data;
}

(async function init() {
  const { token } = await DA_SDK;

  $status.textContent = 'Loading…';
  const cached = await readJson(AUDIT_DATA_PATH, token);

  if (cached) {
    $lastScanned.textContent = `Last scanned: ${new Date(cached.scannedAt).toLocaleString()}`;
    $scanBtn.textContent = 'Rescan';
    renderResults(cached, new Set(cached.repoBlocks || []));
  }
  $status.textContent = '';

  $scanBtn.addEventListener('click', async () => {
    $scanBtn.disabled = true;
    try {
      const data = await runScan(token);
      $lastScanned.textContent = `Last scanned: ${new Date(data.scannedAt).toLocaleString()}`;
      $scanBtn.textContent = 'Rescan';
      $status.textContent = '';
      renderResults(data, new Set(data.repoBlocks || []));
    } catch (err) {
      $status.textContent = `Error: ${err.message}`;
    } finally {
      $scanBtn.disabled = false;
    }
  });
}());
