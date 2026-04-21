/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
/* eslint-enable import/no-unresolved */
import { collectDocs, cat, readJson, writeJson, fetchPublishedPaths } from '../shared/da-api.js';

const SCAN_ROOT = '/adobecom/da-express-milo/express';
const AUDIT_DATA_PATH = '/adobecom/da-express-milo/drafts/da-test-tool-maxn-01/audit-results.json';
const GITHUB_DA_EXPRESS_API = 'https://api.github.com/repos/adobecom/da-express-milo/contents/express/code/blocks?ref=stage';
const GITHUB_MILO_API = 'https://api.github.com/repos/adobecom/milo/contents/libs/blocks?ref=stage';
const BATCH_SIZE = 10;

const $scanBtn = document.getElementById('scan-btn');
const $statusBtn = document.getElementById('status-btn');
const $lastScanned = document.getElementById('last-scanned');
const $status = document.getElementById('status');
const $blockCount = document.getElementById('block-count');
const $legend = document.getElementById('legend');
const $results = document.getElementById('results');

async function fetchGitHubDirNames(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const items = await resp.json();
    return items.filter((i) => i.type === 'dir').map((i) => i.name.toLowerCase());
  } catch {
    return [];
  }
}

async function fetchRepoBlocks() {
  const [expressNames, miloNames] = await Promise.all([
    fetchGitHubDirNames(GITHUB_DA_EXPRESS_API),
    fetchGitHubDirNames(GITHUB_MILO_API),
  ]);
  return { express: new Set(expressNames), milo: new Set(miloNames) };
}

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

function repoBlocksFromStored(stored) {
  // Handle old flat-array format written before two-repo support
  if (Array.isArray(stored)) return { express: new Set(stored), milo: new Set() };
  return {
    express: new Set(stored.express || []),
    milo: new Set(stored.milo || []),
  };
}

function renderResults(data, repoBlocks, publishedSet) {
  const { express: expressBlocks, milo: miloBlocks } = repoBlocks;
  const allRepoBlocks = new Set([...expressBlocks, ...miloBlocks]);

  // Merge content-hit blocks with zero-use repo blocks
  const allBlocks = { ...data.blocks };
  for (const name of allRepoBlocks) {
    if (!allBlocks[name]) allBlocks[name] = [];
  }

  // Sort: usage count desc, then alphabetically for ties / zero-use
  const sorted = Object.entries(allBlocks).sort(([nameA, a], [nameB, b]) => {
    if (b.length !== a.length) return b.length - a.length;
    return nameA.localeCompare(nameB);
  });

  $blockCount.textContent = `${sorted.length} unique block${sorted.length !== 1 ? 's' : ''} across ${data.docCount} documents`;

  $legend.innerHTML = `
    <span class="legend-express">■ da-express-milo</span>
    <span class="legend-milo">■ milo</span>
    <span class="legend-unknown">■ unrecognized</span>
  `;

  $results.innerHTML = '';

  for (const [blockName, paths] of sorted) {
    const inExpress = expressBlocks.has(blockName);
    const inMilo = miloBlocks.has(blockName);

    const details = document.createElement('details');
    if (inExpress) details.className = 'repo-express';
    else if (inMilo) details.className = 'repo-milo';

    const summary = document.createElement('summary');
    const left = document.createElement('span');
    left.className = 'summary-left';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = blockName;
    left.appendChild(nameSpan);

    if (inExpress && inMilo) {
      const badge = document.createElement('span');
      badge.className = 'override-badge';
      badge.textContent = '↑ milo';
      left.appendChild(badge);
    }

    const countSpan = document.createElement('span');
    countSpan.className = 'summary-count';
    const pubCount = publishedSet ? paths.filter((p) => publishedSet.has(p)).length : null;
    const pubSuffix = pubCount !== null ? ` <span class="published-count">(${pubCount} published)</span>` : '';
    countSpan.innerHTML = ` — ${paths.length} use${paths.length !== 1 ? 's' : ''}${pubSuffix}`;
    left.appendChild(countSpan);

    summary.appendChild(left);

    const ul = document.createElement('ul');
    ul.className = 'block-paths';
    for (const path of paths) {
      const li = document.createElement('li');
      li.textContent = path;
      if (publishedSet && publishedSet.has(path)) {
        const badge = document.createElement('span');
        badge.className = 'published-badge';
        badge.title = 'Published';
        badge.textContent = '●';
        li.appendChild(badge);
      }
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
  $legend.innerHTML = '';
  $status.textContent = 'Traversing /express directory tree…';

  // Fetch both repo block lists in parallel with BFS traversal
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

  const { express: expressBlocks, milo: miloBlocks } = await repoBlocksPromise;

  const data = {
    scannedAt: new Date().toISOString(),
    docCount: docs.length,
    scanErrors: errors,
    repoBlocks: {
      express: [...expressBlocks],
      milo: [...miloBlocks],
    },
    blocks,
  };

  $status.textContent = 'Saving results…';
  await writeJson(AUDIT_DATA_PATH, data, token);

  return data;
}

// Collect all unique doc paths across all blocks in the data object
function allDocPaths(data) {
  const seen = new Set();
  for (const paths of Object.values(data.blocks)) {
    for (const p of paths) seen.add(p);
  }
  return [...seen];
}

(async function init() {
  const { token } = await DA_SDK;

  let currentData = null;

  function showResults(data, repoBlocks) {
    currentData = data;
    const publishedSet = data.publishedPaths ? new Set(data.publishedPaths) : null;
    renderResults(data, repoBlocks, publishedSet);
    $statusBtn.style.display = '';
    $statusBtn.textContent = data.publishedPaths ? 'Refresh Status' : 'Check Status';
  }

  $status.textContent = 'Loading…';
  const cached = await readJson(AUDIT_DATA_PATH, token);

  if (cached) {
    $lastScanned.textContent = `Last scanned: ${new Date(cached.scannedAt).toLocaleString()}`;
    $scanBtn.textContent = 'Rescan';
    showResults(cached, repoBlocksFromStored(cached.repoBlocks || {}));
  }
  $status.textContent = '';

  $scanBtn.addEventListener('click', async () => {
    $scanBtn.disabled = true;
    $statusBtn.style.display = 'none';
    try {
      const data = await runScan(token);
      $lastScanned.textContent = `Last scanned: ${new Date(data.scannedAt).toLocaleString()}`;
      $scanBtn.textContent = 'Rescan';
      $status.textContent = '';
      showResults(data, repoBlocksFromStored(data.repoBlocks));
    } catch (err) {
      $status.textContent = `Error: ${err.message}`;
    } finally {
      $scanBtn.disabled = false;
    }
  });

  $statusBtn.addEventListener('click', async () => {
    if (!currentData) return;
    $statusBtn.disabled = true;
    $scanBtn.disabled = true;
    try {
      const paths = allDocPaths(currentData);
      const publishedPaths = await fetchPublishedPaths(paths, token, (done, total) => {
        $status.textContent = `Checking status… ${done} / ${total}`;
      });
      currentData = { ...currentData, statusCheckedAt: new Date().toISOString(), publishedPaths };
      $status.textContent = 'Saving status results…';
      await writeJson(AUDIT_DATA_PATH, currentData, token);
      $status.textContent = '';
      showResults(currentData, repoBlocksFromStored(currentData.repoBlocks || {}));
    } catch (err) {
      $status.textContent = `Error: ${err.message}`;
    } finally {
      $statusBtn.disabled = false;
      $scanBtn.disabled = false;
    }
  });
}());
