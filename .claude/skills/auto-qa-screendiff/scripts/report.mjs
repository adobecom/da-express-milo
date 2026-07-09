#!/usr/bin/env node
/**
 * C9 — Render the local HTML report from results.json + a template.
 *
 * The template is customizable: pass --template <file> to use your own, or edit
 * the default at templates/report.html. It supports a tiny token syntax:
 *   {{key}}     — value, HTML-escaped
 *   {{{key}}}   — value, raw (no escaping)
 *   <!-- BEGIN row -->…<!-- END row -->  — repeated once per result row
 *
 * Usage:
 *   node report.mjs [--results .qa-screendiff/report/results.json] \
 *     [--template <skill>/templates/report.html] [--out <dir>/index.html]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, fb) => {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fb;
};

const resultsPath = arg('--results', '.qa-screendiff/report/results.json');
const templatePath = arg('--template', path.join(here, '..', 'templates', 'report.html'));
const outPath = arg('--out', path.join(path.dirname(resultsPath), 'index.html'));

const data = JSON.parse(readFileSync(resultsPath, 'utf8'));
const template = readFileSync(templatePath, 'utf8');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
}[c]));
function fill(tpl, obj) {
  return tpl
    .replace(/\{\{\{(\w+)\}\}\}/g, (_, k) => (obj[k] == null ? '' : String(obj[k])))
    .replace(/\{\{(\w+)\}\}/g, (_, k) => (obj[k] == null ? '' : esc(obj[k])));
}

// Severity ordering: failures/breakage first, then by diff ratio desc.
const RANK = {
  'a-failed': 0, 'b-failed': 1, broken: 2, diff: 3, ok: 4,
};
const ranked = [...data.results].sort((x, y) => (
  (RANK[x.status] ?? 9) - (RANK[y.status] ?? 9)
  || (y.diff?.ratio ?? 0) - (x.diff?.ratio ?? 0)
));

const counts = data.results.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
const flagged = data.results.filter((r) => r.status !== 'ok').length;

const rows = ranked.map((r) => {
  const pct = r.diff ? `${(r.diff.ratio * 100).toFixed(2)}%` : '—';
  // For a flagged regression, show only what's new to B; otherwise show the union for context.
  const broken = r.status === 'broken' && r.newBroken
    ? r.newBroken
    : [...new Set([...(r.b.brokenBlocks || []), ...(r.a.brokenBlocks || [])])];
  return {
    project: r.project,
    edsPath: r.edsPath,
    viewport: r.viewport,
    status: r.status,
    statusClass: `st-${r.status}`,
    source: r.source,
    matchedBlocks: (r.matchedBlocks || []).join(', ') || '—',
    diffPct: pct,
    diffRatio: r.diff ? r.diff.ratio : 0,
    sizeChanged: r.diff?.sizeChanged ? 'size changed' : '',
    aUrl: r.a.url,
    bUrl: r.b.url,
    aImg: r.a.screenshot || '',
    bImg: r.b.screenshot || '',
    diffImg: r.diff?.image || '',
    brokenList: broken.length ? broken.map((x) => `<li>${esc(x)}</li>`).join('') : '',
    noteHtml: (r.a.error || r.b.error) ? `<div class="note">${esc(r.a.error || r.b.error)}</div>` : '',
  };
});

// Extract + expand the row section, then fill top-level tokens.
const rowRe = /<!-- BEGIN row -->([\s\S]*?)<!-- END row -->/;
const m = template.match(rowRe);
const rowsHtml = m ? rows.map((r) => fill(m[1], r)).join('') : '';
let html = template.replace(rowRe, rowsHtml);

const summary = `${data.results.length} cells · <strong>${flagged} flagged</strong> · `
  + Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' · ');

html = fill(html, {
  title: 'Auto-QA Screen-Diff Report',
  branch: data.branch,
  base: data.base,
  generatedAt: data.generatedAt,
  selfCheckBanner: data.selfCheck
    ? '<div class="banner">⚠️ self-check mode: B captured from the SAME url as A (diffs should be ~0)</div>'
    : '',
  summary,
});

writeFileSync(outPath, html);
process.stdout.write(`report: ${data.results.length} cells (${flagged} flagged) → ${outPath}\n`);
