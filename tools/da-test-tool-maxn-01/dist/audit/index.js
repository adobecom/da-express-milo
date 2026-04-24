/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
/* eslint-enable import/no-unresolved */
import { ls, collectDocs, cat, readJson, writeJson, fetchPublishedPaths } from '../shared/da-api.js';

const SCAN_ROOT = '/adobecom/da-express-milo';
const AUDIT_DIR = '/adobecom/da-express-milo/drafts/da-test-tool-maxn-01';
const LEGACY_AUDIT_PATH = `${AUDIT_DIR}/audit-results.json`;
const GITHUB_DA_EXPRESS_API = 'https://api.github.com/repos/adobecom/da-express-milo/contents/express/code/blocks?ref=stage';
const GITHUB_MILO_API = 'https://api.github.com/repos/adobecom/milo/contents/libs/blocks?ref=stage';
const BATCH_SIZE = 10;
const SKIP_DIRS = new Set(['drafts', 'tools']);

const $scanAllBtn = document.getElementById('scan-all-btn');
const $statusBtn = document.getElementById('status-btn');
const $status = document.getElementById('status');
const $blockCount = document.getElementById('block-count');
const $legend = document.getElementById('legend');
const $results = document.getElementById('results');
const $dirDetails = document.getElementById('dir-details');
const $dirList = document.getElementById('dir-list');
const $sortSelect = document.getElementById('sort-select');

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

function extractBlocks(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = new Set();

  for (const div of doc.querySelectorAll('main > div > div[class]')) {
    const firstClass = div.className.trim().toLowerCase().split(/\s+/)[0];
    if (firstClass) blocks.add(firstClass);
  }

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
  if (Array.isArray(stored)) return { express: new Set(stored), milo: new Set() };
  return {
    express: new Set(stored.express || []),
    milo: new Set(stored.milo || []),
  };
}

function auditPath(dirname) {
  return `${AUDIT_DIR}/audit-${dirname}.json`;
}

function mergeAllParts(dirParts) {
  const parts = Object.values(dirParts).filter((d) => d && d !== 'scanning');
  if (parts.length === 0) return null;

  const blocks = {};
  let docCount = 0;
  let scanErrors = 0;

  for (const part of parts) {
    docCount += part.docCount;
    scanErrors += (part.scanErrors || 0);
    for (const [block, paths] of Object.entries(part.blocks)) {
      if (!blocks[block]) blocks[block] = [];
      blocks[block].push(...paths);
    }
  }

  const publishedPaths = parts.flatMap((p) => p.publishedPaths || []);

  return {
    blocks,
    docCount,
    scanErrors,
    publishedPaths: publishedPaths.length ? publishedPaths : null,
  };
}

function sortEntries(entries, expressBlocks, miloBlocks) {
  if ($sortSelect.value === 'repo') {
    const rank = (name) => {
      if (expressBlocks.has(name)) return 0;
      if (miloBlocks.has(name)) return 1;
      return 2;
    };
    return entries.sort(([nameA, a], [nameB, b]) => {
      const dr = rank(nameA) - rank(nameB);
      if (dr !== 0) return dr;
      if (b.length !== a.length) return b.length - a.length;
      return nameA.localeCompare(nameB);
    });
  }
  return entries.sort(([nameA, a], [nameB, b]) => {
    if (b.length !== a.length) return b.length - a.length;
    return nameA.localeCompare(nameB);
  });
}

function applyFlipAnimation(container, renderFn) {
  const items = [...container.children];
  const oldTops = new Map(items.map((el) => [el.dataset.blockName, el.getBoundingClientRect().top]));

  renderFn();

  const newItems = [...container.children];
  for (const el of newItems) {
    const oldTop = oldTops.get(el.dataset.blockName);
    if (oldTop === undefined) continue;
    const dy = oldTop - el.getBoundingClientRect().top;
    if (dy === 0) continue;
    el.style.transition = 'none';
    el.style.transform = `translateY(${dy}px)`;
  }

  requestAnimationFrame(() => {
    for (const el of newItems) {
      el.style.transition = 'transform 0.35s ease';
      el.style.transform = '';
    }
    setTimeout(() => {
      for (const el of newItems) {
        el.style.transition = '';
      }
    }, 400);
  });
}

function publishedUrl(path) {
  const withoutPrefix = path.replace('/adobecom/da-express-milo', '');
  const withoutExt = withoutPrefix.replace(/\.html$/, '');
  return `https://www.adobe.com${withoutExt}`;
}

function renderResults(data, repoBlocks, publishedSet) {
  const { express: expressBlocks, milo: miloBlocks } = repoBlocks;
  const allRepoBlocks = new Set([...expressBlocks, ...miloBlocks]);

  const allBlocks = { ...data.blocks };
  for (const name of allRepoBlocks) {
    if (!allBlocks[name]) allBlocks[name] = [];
  }

  const sorted = sortEntries(Object.entries(allBlocks), expressBlocks, miloBlocks);

  $blockCount.textContent = `${sorted.length} unique block${sorted.length !== 1 ? 's' : ''} across ${data.docCount.toLocaleString()} documents`;

  $legend.innerHTML = `
    <span class="legend-express"><span class="legend-express-square">■</span> da-express-milo</span>
    <span class="legend-milo"><span class="legend-express-square">■</span> milo</span>
    <span class="legend-unknown"><span class="legend-express-square">■</span> unrecognized</span>
  `;

  $results.innerHTML = '';

  for (const [blockName, paths] of sorted) {
    const inExpress = expressBlocks.has(blockName);
    const inMilo = miloBlocks.has(blockName);

    const details = document.createElement('details');
    details.dataset.blockName = blockName;
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
    const sortedPaths = [...paths].sort((a, b) => {
      const ap = publishedSet?.has(a) ? 0 : 1;
      const bp = publishedSet?.has(b) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.localeCompare(b);
    });
    for (const path of sortedPaths) {
      const li = document.createElement('li');
      li.textContent = path;
      if (publishedSet && publishedSet.has(path)) {
        const badge = document.createElement('a');
        badge.className = 'published-badge';
        badge.href = publishedUrl(path);
        badge.target = '_blank';
        badge.rel = 'noopener noreferrer';
        badge.title = 'View live page';
        badge.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
        li.appendChild(badge);
      }
      ul.appendChild(li);
    }
    details.appendChild(summary);
    details.appendChild(ul);
    $results.appendChild(details);
  }
}

(async function init() {
  const { token } = await DA_SDK;

  let dirs = [];
  const dirParts = {};
  let repoBlocks = { express: new Set(), milo: new Set() };
  let isBusy = false;
  let lastRenderData = null;
  let lastPublishedSet = null;

  function setStatus(text) { $status.textContent = text; }

  function setBusy(busy) {
    isBusy = busy;
    $scanAllBtn.disabled = busy;
    if ($statusBtn.style.display !== 'none') $statusBtn.disabled = busy;
  }

  function renderDirList() {
    $dirList.innerHTML = '';
    for (const dir of dirs) {
      const data = dirParts[dir];
      const isScanning = data === 'scanning';

      const row = document.createElement('div');
      row.className = 'dir-row';

      const nameEl = document.createElement('span');
      nameEl.className = 'dir-name';
      nameEl.textContent = dir;

      const metaEl = document.createElement('span');
      metaEl.className = 'dir-meta';
      if (isScanning) {
        metaEl.textContent = 'scanning…';
      } else if (data) {
        metaEl.textContent = `${data.docCount.toLocaleString()} docs · ${new Date(data.scannedAt).toLocaleDateString()}`;
      } else {
        metaEl.textContent = 'never scanned';
        metaEl.classList.add('dim');
      }

      const btn = document.createElement('button');
      btn.className = 'dir-btn';
      btn.textContent = isScanning ? '…' : (data ? 'Rescan' : 'Scan');
      btn.disabled = isBusy;
      if (!isBusy) btn.addEventListener('click', () => scanOneDir(dir));

      row.appendChild(nameEl);
      row.appendChild(metaEl);
      row.appendChild(btn);
      $dirList.appendChild(row);
    }
  }

  function renderMergedResults() {
    const merged = mergeAllParts(dirParts);
    if (!merged) {
      $blockCount.textContent = 'No scan data yet. Expand "Directory Scans" above to begin.';
      $legend.innerHTML = '';
      $results.innerHTML = '';
      $statusBtn.style.display = 'none';
      lastRenderData = null;
      lastPublishedSet = null;
      return;
    }
    lastRenderData = merged;
    lastPublishedSet = merged.publishedPaths ? new Set(merged.publishedPaths) : null;
    renderResults(merged, repoBlocks, lastPublishedSet);
    $statusBtn.style.display = '';
    $statusBtn.textContent = merged.publishedPaths?.length ? 'Refresh Status' : 'Check Status';
  }

  async function runScanForDir(dirName) {
    const dirPath = `${SCAN_ROOT}/${dirName}`;
    const blocks = {};
    let scanned = 0;
    let errors = 0;

    const docs = await collectDocs(dirPath, token, (count) => {
      setStatus(`Scanning ${dirName}… ${count} documents found`);
    });

    setStatus(`Scanning ${dirName}… 0 / ${docs.length}`);

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
        } catch { return 1; }
      }));
      errors += batchErrors.reduce((s, e) => s + e, 0);
      scanned += batch.length;
      const errStr = errors > 0 ? `, ${errors} error${errors !== 1 ? 's' : ''}` : '';
      setStatus(`Scanning ${dirName}… ${scanned} / ${docs.length}${errStr}`);
    }

    return {
      scannedAt: new Date().toISOString(),
      docCount: docs.length,
      scanErrors: errors,
      repoBlocks: { express: [...repoBlocks.express], milo: [...repoBlocks.milo] },
      blocks,
    };
  }

  async function scanOneDir(dirName) {
    if (isBusy) return;
    setBusy(true);
    dirParts[dirName] = 'scanning';
    renderDirList();

    try {
      const data = await runScanForDir(dirName);
      setStatus('Saving…');
      await writeJson(auditPath(dirName), data, token);
      dirParts[dirName] = data;
      setStatus('');
    } catch (err) {
      dirParts[dirName] = null;
      setStatus(`Error scanning ${dirName}: ${err.message}`);
    } finally {
      setBusy(false);
      renderDirList();
      renderMergedResults();
    }
  }

  async function scanAllDirs() {
    if (isBusy) return;
    setBusy(true);
    $dirDetails.open = true;

    try {
      for (const dir of dirs) {
        dirParts[dir] = 'scanning';
        renderDirList();
        try {
          // eslint-disable-next-line no-await-in-loop
          const data = await runScanForDir(dir);
          setStatus('Saving…');
          // eslint-disable-next-line no-await-in-loop
          await writeJson(auditPath(dir), data, token);
          dirParts[dir] = data;
          renderDirList();
          renderMergedResults();
        } catch (err) {
          dirParts[dir] = null;
          setStatus(`Error scanning ${dir}: ${err.message} — continuing`);
          renderDirList();
        }
      }
      setStatus('');
    } finally {
      setBusy(false);
      renderDirList();
    }
  }

  // --- Init ---

  setStatus('Loading…');

  const [rootItems, rb] = await Promise.all([
    ls(SCAN_ROOT, token).catch(() => []),
    fetchRepoBlocks(),
  ]);

  // Fall back to stored repo blocks if GitHub fetch returned nothing
  repoBlocks = (rb.express.size > 0 || rb.milo.size > 0) ? rb : (() => {
    const stored = Object.values(dirParts).find((p) => p && p.repoBlocks);
    return stored ? repoBlocksFromStored(stored.repoBlocks) : rb;
  })();

  dirs = rootItems
    .filter((item) => !item.ext && !SKIP_DIRS.has(item.path.split('/').pop()))
    .map((item) => item.path.split('/').pop())
    .sort();

  if (dirs.length === 0) {
    setStatus('No content directories found under repo root.');
    return;
  }

  // Migrate legacy audit-results.json → audit-express.json on first load
  const expressData = await readJson(auditPath('express'), token);
  if (!expressData && dirs.includes('express')) {
    const legacy = await readJson(LEGACY_AUDIT_PATH, token);
    if (legacy) {
      await writeJson(auditPath('express'), legacy, token);
      dirParts.express = legacy;
    }
  } else {
    dirParts.express = expressData || null;
  }

  // Load all other partial results in parallel
  await Promise.all(
    dirs.filter((d) => d !== 'express').map(async (dir) => {
      dirParts[dir] = await readJson(auditPath(dir), token);
    }),
  );

  // Update repoBlocks fallback now that dirParts is populated
  if (repoBlocks.express.size === 0 && repoBlocks.milo.size === 0) {
    const stored = Object.values(dirParts).find((p) => p && p.repoBlocks);
    if (stored) repoBlocks = repoBlocksFromStored(stored.repoBlocks);
  }

  setStatus('');
  renderDirList();
  renderMergedResults();

  $scanAllBtn.addEventListener('click', scanAllDirs);

  $sortSelect.addEventListener('change', () => {
    if (!lastRenderData) return;
    applyFlipAnimation($results, () => renderResults(lastRenderData, repoBlocks, lastPublishedSet));
  });

  $statusBtn.addEventListener('click', async () => {
    if (isBusy) return;
    setBusy(true);

    const pathToDir = {};
    for (const [dir, data] of Object.entries(dirParts)) {
      if (!data || data === 'scanning') continue;
      for (const paths of Object.values(data.blocks)) {
        for (const p of paths) pathToDir[p] = dir;
      }
    }

    const allPaths = Object.keys(pathToDir);
    try {
      const publishedPaths = await fetchPublishedPaths(allPaths, token, (done, total) => {
        setStatus(`Checking status… ${done} / ${total}`);
      });

      const publishedByDir = {};
      for (const p of publishedPaths) {
        const dir = pathToDir[p];
        if (dir) {
          if (!publishedByDir[dir]) publishedByDir[dir] = [];
          publishedByDir[dir].push(p);
        }
      }

      setStatus('Saving status results…');
      const now = new Date().toISOString();
      await Promise.all(
        dirs.map(async (dir) => {
          const data = dirParts[dir];
          if (!data || data === 'scanning') return;
          const updated = { ...data, statusCheckedAt: now, publishedPaths: publishedByDir[dir] || [] };
          dirParts[dir] = updated;
          await writeJson(auditPath(dir), updated, token);
        }),
      );

      setStatus('');
      renderMergedResults();
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setBusy(false);
    }
  });
}());
