#!/usr/bin/env node
/**
 * C3 + C4 + C6 — Page→blocks parse, intersect with changed blocks, pair A/B URLs.
 *
 * Two modes:
 *
 *   --mode plan
 *     Reads the manifest and prints a JSON fetch-plan: for each page, the
 *     { org, repo, daPath, file } the caller must fetch via the DA MCP
 *     (da_get_source) and save to `file`. This guarantees filename agreement
 *     with select mode.
 *
 *   --mode select
 *     Reads the saved DA source for each page, extracts the blocks it uses,
 *     intersects with the affected blocks from resolve-changed-blocks, and
 *     writes affected-pages.json plus a human summary.
 *
 * Usage:
 *   node select-affected.mjs --mode plan   --manifest <f> --pages-dir <d>
 *   node select-affected.mjs --mode select --manifest <f> --pages-dir <d> \
 *        --changed <changed-blocks.json> --branch <name> --out <affected-pages.json>
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { extractBlocks } from '../lib/da-crawl.mjs';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const mode = arg('--mode', 'select');
const manifestPath = arg('--manifest');
const pagesDir = arg('--pages-dir', '.qa-screendiff/pages');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const slug = (edsPath) => {
  const s = edsPath.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
  return s || 'root';
};
const pageFile = (page) => path.join(pagesDir, `${page.project}__${slug(page.edsPath)}.html`);

if (mode === 'plan') {
  const plan = manifest.pages.map((page) => {
    const proj = manifest.projects[page.project];
    return {
      project: page.project,
      org: proj.org,
      repo: proj.repo,
      daPath: page.daPath,
      edsPath: page.edsPath,
      label: page.label,
      file: pageFile(page),
    };
  });
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  process.exit(0);
}

// select mode
const changed = JSON.parse(readFileSync(arg('--changed'), 'utf8'));
const branch = arg('--branch', changed.branch || 'HEAD');
const outPath = arg('--out', '.qa-screendiff/affected-pages.json');
const affectedSet = new Set(changed.affectedBlocks || []);

const results = [];
for (const page of manifest.pages) {
  const proj = manifest.projects[page.project];
  const file = pageFile(page);
  const entry = {
    project: page.project,
    label: page.label,
    edsPath: page.edsPath,
    daPath: page.daPath,
    fetched: false,
    blocksOnPage: [],
    matchedBlocks: [],
    affected: false,
    reason: null,
  };

  if (existsSync(file)) {
    entry.fetched = true;
    const blocks = extractBlocks(readFileSync(file, 'utf8'));
    entry.blocksOnPage = [...blocks].sort();
    const matched = [...blocks].filter((b) => affectedSet.has(b)).sort();
    entry.matchedBlocks = matched;
    if (changed.globalChange) {
      entry.affected = true;
      entry.reason = `global change (${changed.whyGlobal || 'wide fan-out'})`;
    } else if (matched.length) {
      entry.affected = true;
      entry.reason = `uses changed block(s): ${matched.join(', ')}`;
    }
  } else {
    entry.reason = 'DA source not fetched (missing file)';
  }

  if (entry.affected) {
    const branchBase = proj.branchBase.replace('{branch}', branch);
    const suffix = page.edsPath === '/' ? '/' : page.edsPath;
    entry.a = proj.stableBase + suffix;
    entry.b = branchBase + suffix;
    entry.viewports = ['chrome', 'ipad', 'iphone'];
  }
  results.push(entry);
}

const affected = results.filter((r) => r.affected);
const out = {
  branch,
  base: changed.base,
  affectedBlocks: changed.affectedBlocks,
  globalChange: changed.globalChange,
  totalPagesChecked: results.length,
  affectedPageCount: affected.length,
  pages: results,
};
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);

// ---- human summary ----
const byProject = {};
for (const r of results) (byProject[r.project] ||= []).push(r);

const line = '─'.repeat(72);
let s = '';
s += `\n${line}\n`;
s += `Auto-QA screen-diff — affected pages\n`;
s += `${line}\n`;
s += `branch: ${branch}   base: ${changed.base}\n`;
s += `affected blocks (${(changed.affectedBlocks || []).length}): ${(changed.affectedBlocks || []).join(', ') || '(none)'}\n`;
s += `globalChange: ${changed.globalChange}${changed.whyGlobal ? ` — ${changed.whyGlobal}` : ''}\n`;
s += `pages checked: ${results.length}   affected: ${affected.length}\n`;

for (const [project, rows] of Object.entries(byProject)) {
  s += `\n${project.toUpperCase()} (${manifest.projects[project].repo})\n`;
  for (const r of rows.sort((a, b) => Number(b.affected) - Number(a.affected))) {
    const flag = r.affected ? '🔴' : (r.fetched ? '⚪' : '⚠️ ');
    s += `  ${flag} ${r.edsPath}  [${r.fetched ? `${r.blocksOnPage.length} blocks` : r.reason}]\n`;
    if (r.affected) s += `        → ${r.reason}\n        A: ${r.a}\n        B: ${r.b}\n`;
  }
}
s += `\nWrote ${outPath}\n`;
process.stdout.write(s);
