#!/usr/bin/env node
/**
 * C5 merge + C6 — Build the unified capture worklist.
 *
 * Merges the curated affected pages (from select-affected) with any discovered
 * pages (from crawl-affected --discover), dedupes by project+edsPath, pairs
 * stable (A) vs branch (B) URLs, and writes worklist.json — the single handoff
 * artifact the capture step consumes.
 *
 * Usage:
 *   node build-worklist.mjs \
 *     --manifest <critical-pages.json> \
 *     --affected .qa-screendiff/affected-pages.json \
 *     [--crawl .qa-screendiff/crawl-express-color.json ...] \
 *     [--repo-of-crawl express-color=color ...]   (map crawl repo -> project key) \
 *     --branch <name> --out .qa-screendiff/worklist.json
 */

import { readFileSync, writeFileSync } from 'node:fs';

function args(name) {
  const out = [];
  process.argv.forEach((a, i) => { if (a === name && process.argv[i + 1]) out.push(process.argv[i + 1]); });
  return out;
}
const arg = (name, fb) => (args(name)[0] ?? fb);

const manifest = JSON.parse(readFileSync(arg('--manifest'), 'utf8'));
const branch = arg('--branch', 'HEAD');
const outPath = arg('--out', '.qa-screendiff/worklist.json');

// Map a DA repo name to the manifest project key.
const projectOfRepo = {};
for (const [key, p] of Object.entries(manifest.projects)) projectOfRepo[p.repo] = key;

const urlsFor = (projectKey, edsPath) => {
  const proj = manifest.projects[projectKey];
  const suffix = edsPath === '/' ? '/' : edsPath;
  return {
    a: proj.stableBase + suffix,
    b: proj.branchBase.replace('{branch}', branch) + suffix,
  };
};

// key => entry (dedupe by project + edsPath)
const byKey = new Map();
function add(projectKey, edsPath, matchedBlocks, source) {
  const key = `${projectKey}::${edsPath}`;
  if (byKey.has(key)) {
    const e = byKey.get(key);
    e.matchedBlocks = [...new Set([...e.matchedBlocks, ...matchedBlocks])].sort();
    if (source === 'curated') e.source = 'curated'; // curated wins as the label
    return;
  }
  const { a, b } = urlsFor(projectKey, edsPath);
  byKey.set(key, {
    project: projectKey, edsPath, matchedBlocks: [...matchedBlocks].sort(), source, a, b,
  });
}

// 1. Curated affected pages.
const affected = JSON.parse(readFileSync(arg('--affected'), 'utf8'));
for (const p of affected.pages) {
  if (p.affected) add(p.project, p.edsPath, p.matchedBlocks || [], 'curated');
}

// 2. Discovered pages from each crawl file.
for (const crawlPath of args('--crawl')) {
  const crawl = JSON.parse(readFileSync(crawlPath, 'utf8'));
  const projectKey = projectOfRepo[crawl.repo];
  if (!projectKey) {
    process.stderr.write(`WARN: crawl repo '${crawl.repo}' not in manifest projects; skipping ${crawlPath}\n`);
    continue;
  }
  for (const pg of crawl.pages || []) {
    add(projectKey, pg.edsPath, pg.matchedBlocks || [], 'discovered');
  }
}

const viewports = manifest.viewports || ['chrome', 'ipad', 'iphone'];
const pages = [...byKey.values()].sort((a, b) => (
  a.project.localeCompare(b.project) || a.edsPath.localeCompare(b.edsPath)
));
for (const p of pages) p.viewports = viewports;

const out = {
  branch,
  base: affected.base,
  generatedAt: new Date().toISOString(),
  counts: {
    total: pages.length,
    curated: pages.filter((p) => p.source === 'curated').length,
    discovered: pages.filter((p) => p.source === 'discovered').length,
  },
  viewports,
  pages,
};
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
process.stdout.write(
  `worklist: ${pages.length} pages (${out.counts.curated} curated + ${out.counts.discovered} discovered) `
  + `× ${viewports.length} viewports → ${outPath}\n`,
);
