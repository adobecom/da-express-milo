#!/usr/bin/env node
/**
 * C5 (SPIKE) — DA-wide discovery of additional affected pages.
 *
 * Recursively lists a DA repo via admin.da.live/list, fetches every .html
 * source, extracts the blocks it uses, and reports which pages use any of the
 * affected blocks — i.e. pages BEYOND the curated critical set.
 *
 * Requires a DA token in env DA_TOKEN.
 *
 * Usage:
 *   DA_TOKEN=$(da-auth-helper token) node crawl-affected.mjs \
 *     --org adobecom --repo express-color \
 *     --changed .qa-screendiff/changed-blocks.json \
 *     [--manifest <critical-pages.json>] [--out .qa-screendiff/crawl-<repo>.json] \
 *     [--concurrency 8] [--max-pages 5000] [--skip-locales] [--exclude drafts]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import {
  extractBlocks, createDaClient, crawlHtmlPaths, edsOf, mapPool,
} from '../lib/da-crawl.mjs';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

const org = arg('--org');
const repo = arg('--repo');
const changedPath = arg('--changed');
const manifestPath = arg('--manifest', null);
const outPath = arg('--out', `.qa-screendiff/crawl-${repo}.json`);
const concurrency = Number(arg('--concurrency', '8'));
const maxPages = Number(arg('--max-pages', '5000'));
const skipLocales = arg('--skip-locales', false) === true;
const excludeArg = arg('--exclude', 'drafts');
const excludeSegments = new Set(
  (excludeArg === true ? '' : excludeArg).split(',').map((s) => s.trim()).filter(Boolean),
);
const token = process.env.DA_TOKEN;

if (!org || !repo || !changedPath || !token) {
  process.stderr.write('Need --org, --repo, --changed and env DA_TOKEN.\n');
  process.exit(1);
}

const changed = JSON.parse(readFileSync(changedPath, 'utf8'));
const affectedSet = new Set(changed.affectedBlocks || []);

const curated = new Set();
if (manifestPath) {
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const p of m.pages) {
    if (p.project && m.projects[p.project]?.repo === repo) curated.add(p.edsPath);
  }
}

const client = createDaClient(token);

const t0 = Date.now();
const htmlPaths = await crawlHtmlPaths(client, {
  org, repo, skipLocales, excludeSegments, maxPages,
});
const t1 = Date.now();

const pageResults = await mapPool(htmlPaths, concurrency, async (srcPath) => {
  const html = await client.getSource(srcPath);
  if (html == null) return { srcPath, error: true };
  const blocks = extractBlocks(html);
  const matched = [...blocks].filter((b) => affectedSet.has(b)).sort();
  return { srcPath, edsPath: edsOf(org, repo, srcPath), matched };
});
const t2 = Date.now();

const affectedPages = pageResults.filter((r) => r.matched && r.matched.length);
const newPages = affectedPages.filter((r) => !curated.has(r.edsPath));

const byBlock = {};
for (const r of affectedPages) {
  for (const b of r.matched) (byBlock[b] ||= []).push(r.edsPath);
}

const out = {
  repo,
  affectedBlocks: [...affectedSet].sort(),
  metrics: {
    listCalls: client.stats.listCalls,
    fetchCalls: client.stats.fetchCalls,
    htmlPagesCrawled: htmlPaths.length,
    listMs: t1 - t0,
    fetchMs: t2 - t1,
    totalMs: t2 - t0,
    errors: pageResults.filter((r) => r.error).length,
  },
  affectedPageCount: affectedPages.length,
  curatedAlreadyKnown: affectedPages.length - newPages.length,
  newPageCount: newPages.length,
  byBlock: Object.fromEntries(Object.entries(byBlock).map(([k, v]) => [k, v.sort()])),
  newPages: newPages.map((r) => r.edsPath).sort(),
  // Per-page detail for downstream merge (build-worklist).
  pages: affectedPages
    .map((r) => ({ edsPath: r.edsPath, matchedBlocks: r.matched, isNew: !curated.has(r.edsPath) }))
    .sort((a, b) => a.edsPath.localeCompare(b.edsPath)),
};
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);

let s = '';
s += `\nC5 SPIKE — DA crawl of ${org}/${repo}\n`;
s += `${'─'.repeat(64)}\n`;
s += `crawl: ${htmlPaths.length} html pages | ${client.stats.listCalls} list calls | ${client.stats.fetchCalls} fetches\n`;
s += `time:  list ${t1 - t0}ms + fetch ${t2 - t1}ms = ${t2 - t0}ms\n`;
s += `affected pages: ${affectedPages.length} (curated ${affectedPages.length - newPages.length} + NEW ${newPages.length})\n`;
s += '\naffected pages per block:\n';
for (const [b, pages] of Object.entries(out.byBlock)) s += `  ${b}: ${pages.length}\n`;
s += `\nwrote ${outPath}\n`;
process.stdout.write(s);
