#!/usr/bin/env node
/**
 * Integration test for the DA crawl + block-detection logic (lib/da-crawl.mjs),
 * which powers crawl-affected.mjs and select-affected.mjs.
 *
 * Self-consistency premise: the kitchen-sink and block-library demo pages are
 * one-block-per-page — a page named `<block>.html` MUST render block `<block>`.
 * So if we crawl those pages and extract their blocks, every page's own block
 * must be found. A miss means the crawl (fetch/list) or the block-detection
 * regex is broken.
 *
 * Because it hits the live DA admin API, it needs a token:
 *   DA_TOKEN=$(da-auth-helper token) node test/crawl-affected.integration.mjs
 * With no token it SKIPS (exit 0) rather than failing.
 *
 * Exit codes: 0 = pass/skip, 1 = one or more demo pages missing their block.
 */

import {
  extractBlocks, createDaClient, crawlHtmlPaths, mapPool,
} from '../lib/da-crawl.mjs';

const ORG = 'adobecom';
const REPO = 'da-express-milo';
const DEMO_DIRS = [
  `/${ORG}/${REPO}/docs/library/kitchen-sink`,
  `/${ORG}/${REPO}/docs/library/blocks`,
];

// Demo pages that legitimately do NOT render a single same-named block, each
// VERIFIED by inspecting the page source. Every entry is a known non-1:1 page,
// NOT a detection bug being papered over. (See findings doc for the audit.)
const SKIP = new Set([
  'app-banner', // defers to a fragment; block renders inside `<div class="fragment">`
  'ax-accordion', // empty stub demo page (block exists in code, page never authored)
  'category-list', // described via `columns`; block not authored on the page
  'colors-how-to-carousel', // described via `columns` (real block is color-how-to-carousel)
  'multifunctional-button', // described via `columns`
  'playlist', // described via `columns`
  'table-of-contents-seo-feature', // compound SEO page; block is `table-of-contents`
  'z-pattern', // section layout style, renders as `text` (not a block)
  'show-with-example-usage', // docs scaffolding page, not a block
  'gen-ai-row', // page renders `gen-ai-cards` (block renamed)
  'pdp-x', // demo uses test variant class `pdp-x-test-2`
  'pricing-cards-simplified', // block class is `simplified-pricing-cards` (name reversed)
  'pricing-cards-simplified-kitchen-sink', // compound; block is `pricing-cards`
  'colors-seo-page', // composed SEO page (multiple blocks), not a single block
  'test', // scratch page, no block
]);

// The page's own block counts as found if an extracted block equals the page
// name, or is a prefix of it (page = block + variant, e.g. blog-posts-v2).
function blockFound(expected, blocks) {
  if (blocks.has(expected)) return true;
  for (const b of blocks) {
    if (expected === b || expected.startsWith(`${b}-`)) return true;
  }
  return false;
}

const token = process.env.DA_TOKEN;
if (!token) {
  process.stdout.write('SKIP: no DA_TOKEN in env — set DA_TOKEN=$(da-auth-helper token)\n');
  process.exit(0);
}

const client = createDaClient(token);

// 1. Collect all demo page source paths.
const paths = [];
for (const dir of DEMO_DIRS) {
  // eslint-disable-next-line no-await-in-loop
  const found = await crawlHtmlPaths(client, { org: ORG, repo: REPO, startPath: dir });
  paths.push(...found);
}
if (paths.length === 0) {
  process.stderr.write('FAIL: crawl returned 0 demo pages (crawl/list broken?)\n');
  process.exit(1);
}

// 2. Fetch + check each page contains its own block.
const results = await mapPool(paths, 12, async (srcPath) => {
  const expected = srcPath.split('/').pop().replace(/\.html$/, '');
  if (SKIP.has(expected)) return { expected, srcPath, skipped: true };
  const html = await client.getSource(srcPath);
  if (html == null) return { expected, srcPath, error: 'source fetch failed' };
  const blocks = extractBlocks(html);
  return {
    expected, srcPath, found: blockFound(expected, blocks), blocks: [...blocks],
  };
});

const skipped = results.filter((r) => r.skipped);
const errored = results.filter((r) => r.error);
const failed = results.filter((r) => !r.skipped && !r.error && !r.found);
const passed = results.filter((r) => r.found);

let s = '';
s += `\nIntegration test — crawl-affected block detection\n${'─'.repeat(64)}\n`;
s += `demo pages crawled: ${paths.length}  (list ${client.stats.listCalls}, fetch ${client.stats.fetchCalls})\n`;
s += `passed: ${passed.length}   skipped: ${skipped.length}   errored: ${errored.length}   FAILED: ${failed.length}\n`;

if (errored.length) {
  s += '\nfetch errors:\n';
  for (const r of errored) s += `  ⚠️  ${r.srcPath}: ${r.error}\n`;
}
if (failed.length) {
  s += '\nMISSING their own block (bug or new SKIP candidate):\n';
  for (const r of failed) {
    s += `  ❌ ${r.expected}  — blocks on page: [${r.blocks.join(', ') || '(none)'}]\n`;
  }
}
s += '\n';
process.stdout.write(s);

// Errors (network) and misses both fail the test.
process.exit(failed.length || errored.length ? 1 : 0);
