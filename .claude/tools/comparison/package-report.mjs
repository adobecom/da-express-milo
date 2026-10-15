#!/usr/bin/env node
/**
 * package-report.mjs
 *
 * Packages a compare-branches.mjs JSON log into a single, portable,
 * self-contained HTML report: no external files, no CDN scripts, no build
 * step, nothing else to transport. Diff images for minor/major pages are
 * embedded as base64 data URIs directly in the HTML; identical/error/
 * missing pages are listed as plain rows (their diff image has nothing
 * interesting to show). Built for handing comparison results to a QA team
 * that has no access to the machine that ran the comparison and no
 * CLI/VS Code — they open the one file in any browser.
 *
 * Usage:
 *   node package-report.mjs --input <comparison.json> [options]
 *
 * Options:
 *   -i, --input <path>   Required. Path to a compare-branches.mjs JSON log
 *                          (e.g. .qa-screendiff/<block>/comparison-<base>-vs-<branch>.json).
 *   -o, --output <path>  Output HTML file. Default: alongside --input, named
 *                          report-<base>-vs-<branch>.html.
 *      --locale <key>    Only include this locale (repeatable). Default: all.
 *      --bucket <name>   Only include this bucket: identical|minor|major|
 *                          baselineOnly404|branchOnly404|bothErrored|missing
 *                          (repeatable). Default: all.
 *      --all-images      Also embed diff images for identical/error/missing
 *                          rows (default: only minor/major get images).
 *
 * Output (JSON on stdout):
 *   { input, output, pagesIncluded, imagesEmbedded, bytesOut }
 *
 * The report is entirely static (vanilla HTML/CSS/JS, no dependencies) —
 * locale/bucket filtering happens client-side via a couple of <select>s,
 * and each row expands via a native <details> element (works with
 * JavaScript disabled too, filters just won't).
 */

import { readFile, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';

function fail(message) {
  process.stdout.write(`${JSON.stringify({ error: message })}\n`);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      input: { type: 'string', short: 'i' },
      output: { type: 'string', short: 'o' },
      locale: { type: 'string', multiple: true },
      bucket: { type: 'string', multiple: true },
      'all-images': { type: 'boolean', default: false },
    },
  }));
} catch (err) {
  fail(`Argument parse error: ${err.message}`);
}

if (!values.input) fail('Missing required --input <path>');

let log;
try {
  log = JSON.parse(await readFile(values.input, 'utf8'));
} catch (err) {
  fail(`Could not read/parse --input: ${err.message}`);
}
if (log.error) fail(`--input is itself an error log: ${log.error}`);

const {
  block, base, branch, mode, threshold, generatedAt, statsByLocale, pages,
} = log;
if (!Array.isArray(pages)) fail('--input does not look like a compare-branches.mjs log (no "pages" array).');

const localeFilter = values.locale?.length ? new Set(values.locale) : null;
const bucketFilter = values.bucket?.length ? new Set(values.bucket) : null;
const ALL_BUCKETS = ['major', 'minor', 'identical', 'branchOnly404', 'baselineOnly404', 'bothErrored', 'missing', 'unknown'];

// Mirrors compare-branches.mjs's own bucketing logic (from baseStatus/
// branchStatus + mismatchPct) rather than parsing its human-readable
// `skipped` strings, so this stays correct if that wording ever changes.
function bucketOf(page) {
  if (page.branchStatus === 'missing') return 'missing';
  const baseOk = page.baseStatus === 'ok';
  const branchOk = page.branchStatus === 'ok';
  if (!baseOk && !branchOk) return 'bothErrored';
  if (!baseOk) return 'baselineOnly404';
  if (!branchOk) return 'branchOnly404';
  const primary = page.fullPage || page.element;
  if (primary && typeof primary.mismatchPct === 'number') {
    if (primary.mismatchPct < 0.5) return 'identical';
    if (primary.mismatchPct <= 3) return 'minor';
    return 'major';
  }
  return 'unknown';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const baseSlug = base.replace(/[^a-z0-9]+/gi, '-');
const branchSlug = branch.replace(/[^a-z0-9]+/gi, '-');
const output = values.output || join(dirname(values.input), `report-${baseSlug}-vs-${branchSlug}.html`);

const filtered = pages.filter((p) => {
  if (localeFilter && !localeFilter.has(p.locale || 'en')) return false;
  const b = bucketOf(p);
  if (bucketFilter && !bucketFilter.has(b)) return false;
  return true;
}).map((p) => ({ ...p, bucket: bucketOf(p) }));

// Major first, then minor, then everything else grouped, each sorted by
// mismatchPct (or just locale/path when there isn't one) descending.
const bucketOrder = {
  major: 0,
  minor: 1,
  unknown: 2,
  branchOnly404: 3,
  bothErrored: 4,
  baselineOnly404: 5,
  missing: 6,
  identical: 7,
};
filtered.sort((a, b2) => {
  if (bucketOrder[a.bucket] !== bucketOrder[b2.bucket]) {
    return bucketOrder[a.bucket] - bucketOrder[b2.bucket];
  }
  const pctA = (a.fullPage || a.element)?.mismatchPct ?? -1;
  const pctB = (b2.fullPage || b2.element)?.mismatchPct ?? -1;
  if (pctA !== pctB) return pctB - pctA;
  return a.path.localeCompare(b2.path);
});

let imagesEmbedded = 0;
async function imageDataUri(page) {
  const primary = page.fullPage || page.element;
  const diffImage = primary?.diffImage;
  if (!diffImage) return null;
  if (!values['all-images'] && !['minor', 'major'].includes(page.bucket)) return null;
  try {
    const buf = await readFile(diffImage);
    imagesEmbedded += 1;
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null; // image missing on disk — report still works, just shows no thumbnail
  }
}

const rows = await Promise.all(filtered.map(async (page) => {
  const primary = page.fullPage || page.element;
  const pct = primary?.mismatchPct;
  const heightDelta = primary?.heightDeltaPx;
  const dataUri = await imageDataUri(page);
  return { ...page, pct, heightDelta, dataUri };
}));

const BUCKET_LABEL = {
  major: 'Major',
  minor: 'Minor',
  identical: 'Identical',
  branchOnly404: `Broke on ${branch}`,
  baselineOnly404: `Only on ${branch}`,
  bothErrored: 'Errored (both)',
  missing: 'Missing',
  unknown: 'Unknown',
};
const BUCKET_COLOR = {
  major: '#c0392b',
  minor: '#d68910',
  identical: '#1e8449',
  branchOnly404: '#922b21',
  baselineOnly404: '#7d6608',
  bothErrored: '#7f8c8d',
  missing: '#7f8c8d',
  unknown: '#7f8c8d',
};

function statsTable(byLocale) {
  if (!byLocale) return '';
  const localeRows = Object.entries(byLocale).map(([locale, s]) => `
    <tr>
      <td>${escapeHtml(locale)}</td>
      <td>${s.total}</td>
      <td>${s.identical}</td>
      <td>${s.minor}</td>
      <td>${s.major}</td>
      <td>${s.branchOnly404}</td>
      <td>${s.baselineOnly404}</td>
      <td>${s.bothErrored}</td>
      <td>${s.missing}</td>
    </tr>`).join('');
  return `
    <table class="stats">
      <thead><tr><th>Locale</th><th>Total</th><th>Identical</th><th>Minor</th><th>Major</th><th>Broke on branch</th><th>Only on branch</th><th>Both errored</th><th>Missing</th></tr></thead>
      <tbody>${localeRows}</tbody>
    </table>`;
}

function rowHtml(page) {
  const pctLabel = typeof page.pct === 'number' ? `${page.pct}%` : '—';
  const heightNote = page.heightDelta > 50 ? ` <span class="height-note">(height Δ${page.heightDelta}px)</span>` : '';
  const image = page.dataUri
    ? `<img src="${page.dataUri}" alt="Diff for ${escapeHtml(page.path)}" loading="lazy">`
    : '<p class="no-image">No diff image for this row.</p>';
  return `
    <details class="row" data-locale="${escapeHtml(page.locale || 'en')}" data-bucket="${page.bucket}">
      <summary>
        <span class="badge" style="background:${BUCKET_COLOR[page.bucket]}">${BUCKET_LABEL[page.bucket]}</span>
        <span class="locale">${escapeHtml(page.locale || 'en')}</span>
        <span class="path">${escapeHtml(page.path)}</span>
        <span class="pct">${pctLabel}${heightNote}</span>
      </summary>
      <div class="row-body">
        <p>
          <a href="${escapeHtml(page.baseUrl)}" target="_blank" rel="noopener">${escapeHtml(base)}</a>
          &nbsp;vs&nbsp;
          <a href="${escapeHtml(page.branchUrl)}" target="_blank" rel="noopener">${escapeHtml(branch)}</a>
        </p>
        ${image}
      </div>
    </details>`;
}

const localesPresent = [...new Set(rows.map((p) => p.locale || 'en'))].sort();
const bucketsPresent = ALL_BUCKETS.filter((b) => rows.some((p) => p.bucket === b));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(block)}: ${escapeHtml(base)} vs ${escapeHtml(branch)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 24px; background: #f5f6f7; color: #1a1a1a; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .meta { color: #555; font-size: 13px; margin-bottom: 20px; }
  table.stats { border-collapse: collapse; margin-bottom: 24px; font-size: 13px; background: #fff; }
  table.stats th, table.stats td { border: 1px solid #ddd; padding: 4px 8px; text-align: right; }
  table.stats th:first-child, table.stats td:first-child { text-align: left; }
  .filters { margin-bottom: 16px; display: flex; gap: 12px; align-items: center; font-size: 13px; }
  .filters select { padding: 4px 8px; }
  .row { background: #fff; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 6px; }
  .row.hidden { display: none; }
  .row summary { cursor: pointer; padding: 8px 12px; display: flex; gap: 10px; align-items: center; list-style: none; }
  .row summary::-webkit-details-marker { display: none; }
  .badge { color: #fff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
  .locale { font-weight: 600; text-transform: uppercase; font-size: 11px; color: #555; width: 32px; }
  .path { flex: 1; font-family: ui-monospace, monospace; font-size: 13px; }
  .pct { font-variant-numeric: tabular-nums; color: #333; font-size: 12px; }
  .height-note { color: #888; }
  .row-body { padding: 0 12px 12px; border-top: 1px solid #eee; }
  .row-body img { max-width: 100%; border: 1px solid #ddd; margin-top: 8px; }
  .no-image { color: #888; font-size: 13px; }
  #count { font-size: 13px; color: #555; margin-bottom: 8px; }
</style>
</head>
<body>
  <h1>${escapeHtml(block)}: ${escapeHtml(base)} vs ${escapeHtml(branch)}</h1>
  <div class="meta">mode=${escapeHtml(mode)}${threshold ? `, threshold=${threshold}` : ''} · generated ${escapeHtml(generatedAt || '')} · ${pages.length} page(s) in source log, ${rows.length} shown here, ${imagesEmbedded} image(s) embedded</div>
  ${statsTable(statsByLocale)}
  <div class="filters">
    <label>Locale: <select id="localeFilter"><option value="">All</option>${localesPresent.map((l) => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('')}</select></label>
    <label>Bucket: <select id="bucketFilter"><option value="">All</option>${bucketsPresent.map((b) => `<option value="${b}">${BUCKET_LABEL[b]}</option>`).join('')}</select></label>
  </div>
  <div id="count"></div>
  <div id="rows">
    ${rows.map(rowHtml).join('\n')}
  </div>
  <script>
    const localeSel = document.getElementById('localeFilter');
    const bucketSel = document.getElementById('bucketFilter');
    const rowEls = [...document.querySelectorAll('.row')];
    const countEl = document.getElementById('count');
    function applyFilters() {
      const locale = localeSel.value;
      const bucket = bucketSel.value;
      let shown = 0;
      rowEls.forEach((el) => {
        const match = (!locale || el.dataset.locale === locale) && (!bucket || el.dataset.bucket === bucket);
        el.classList.toggle('hidden', !match);
        if (match) shown += 1;
      });
      countEl.textContent = shown + ' of ' + rowEls.length + ' page(s) shown';
    }
    localeSel.addEventListener('change', applyFilters);
    bucketSel.addEventListener('change', applyFilters);
    applyFilters();
  </script>
</body>
</html>
`;

await writeFile(output, html);
const { size } = await stat(output);

process.stdout.write(`${JSON.stringify({
  input: values.input,
  output,
  pagesIncluded: rows.length,
  imagesEmbedded,
  bytesOut: size,
}, null, 2)}\n`);
