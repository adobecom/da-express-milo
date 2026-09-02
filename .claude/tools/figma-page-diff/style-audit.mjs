#!/usr/bin/env node
/**
 * style-audit.mjs
 *
 * Same clone/boot lifecycle as figma-page-diff.mjs (see
 * lib/local-page-server.mjs), but instead of a pixel diff, checks a list of
 * computed-style assertions (padding and/or font-size+weight) against
 * expected values gathered by hand from Figma dev mode. Extracted from the
 * ad-hoc `node -e "...playwright..."` snippets used repeatedly to audit
 * blog-posts-v2/blog-columns/banner padding and font sizes block-by-block —
 * this replaces that copy-pasted pattern with one reusable, checks-file-
 * driven call.
 *
 * Usage:
 *   node style-audit.mjs --page </site/path> --checks <checks.json> [options]
 *
 * checks.json: an array of objects, each either:
 *   { "label": string, "selector": "<css>", "expect": { "padding"?: "T R B L" in px, "font"?: "SIZEpx/WEIGHT" } }
 * or:
 *   { "label": string, "heading": "<exact h1/h2/h3 text>", "expect": {...} }
 *   (heading match walks up to the closest `.section` ancestor)
 *
 * Options:
 *   --ref <branch>          Git branch to check out for code. Default: stage.
 *   --clone-path <path>     da.live folder to clone. Default: page's parent dir.
 *   --wait <ms>             Extra settle time after load. Default: 1500.
 *   -r, --root <path>       Main repo root. Defaults to auto-detect from cwd.
 *   -p, --port <number>     Dev server port. Default: 3052.
 *   -k, --keep-worktree     Don't remove the worktree/branch when done.
 *   --timeout <seconds>     Dev-server readiness timeout. Default: 60.
 *   --out <dir>             Output dir. Default: .dr-screendiff/style-audit/<page-slug>.
 *
 * Output (JSON on stdout): array of
 *   { label, found, status: "MATCH"|"MISMATCH"|"NOT FOUND", expect, actual, mismatches }
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { withLocalPage, findRoot } from '../lib/local-page-server.mjs';
import { slugify } from '../lib/slugify.mjs';

function fail(message) {
  process.stdout.write(`${JSON.stringify({ error: message })}\n`);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      page: { type: 'string' },
      checks: { type: 'string' },
      ref: { type: 'string', default: 'stage' },
      'clone-path': { type: 'string' },
      wait: { type: 'string', default: '1500' },
      root: { type: 'string', short: 'r' },
      port: { type: 'string', short: 'p', default: '3052' },
      'keep-worktree': { type: 'boolean', short: 'k', default: false },
      timeout: { type: 'string', default: '60' },
      out: { type: 'string' },
    },
  }));
} catch (err) {
  fail(`Argument parse error: ${err.message}`);
}

const { page: pagePath, ref, port } = values;
const waitMs = Number(values.wait);

if (!pagePath) fail('Missing required --page </site/path>');
if (!values.checks) fail('Missing required --checks <checks.json>');
if (!pagePath.startsWith('/')) fail(`--page must start with "/" (got "${pagePath}")`);

const root = values.root || (await findRoot(process.cwd()));
if (!root) fail('Could not locate the da-express-milo repo root. Pass --root explicitly.');

const checks = JSON.parse(await readFile(values.checks, 'utf8'));
const clonePath = values['clone-path'] || dirname(pagePath);
const pageSlug = slugify(pagePath) || 'home';
const outDir = values.out || join(root, '.dr-screendiff', 'style-audit', pageSlug);

async function main() {
  const rawResults = await withLocalPage({
    root,
    ref,
    clonePath,
    port: Number(port),
    timeoutSeconds: Number(values.timeout),
    keepWorktree: values['keep-worktree'],
    branchPrefix: 'sty-',
    slug: pageSlug,
  }, async ({ baseUrl }) => {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    try {
      const browserPage = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
      await browserPage.goto(`${baseUrl}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
      await browserPage.waitForTimeout(waitMs);

      const evalResult = await browserPage.evaluate((checkList) => {
        function pad(el) {
          const cs = getComputedStyle(el);
          return [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' ');
        }
        function font(el) {
          const cs = getComputedStyle(el);
          return `${cs.fontSize}/${cs.fontWeight}`;
        }
        return checkList.map((check) => {
          let el = null;
          if (check.selector) {
            el = document.querySelector(check.selector);
          } else if (check.heading) {
            const headings = [...document.querySelectorAll('h1, h2, h3')];
            const match = headings.find((h) => h.textContent.trim() === check.heading);
            el = match ? (match.closest('.section') || match.parentElement) : null;
          }
          if (!el) return { ...check, found: false };
          const actual = {};
          if (check.expect?.padding) actual.padding = pad(el);
          if (check.expect?.font) actual.font = font(el);
          return { ...check, found: true, actual };
        });
      }, checks);
      return evalResult;
    } finally {
      await browser.close();
    }
  });

  const report = rawResults.map((r) => {
    if (!r.found) return { label: r.label, status: 'NOT FOUND' };
    const mismatches = [];
    if (r.expect?.padding && r.expect.padding !== r.actual.padding) {
      mismatches.push(`padding: expected "${r.expect.padding}", got "${r.actual.padding}"`);
    }
    if (r.expect?.font && r.expect.font !== r.actual.font) {
      mismatches.push(`font: expected "${r.expect.font}", got "${r.actual.font}"`);
    }
    return {
      label: r.label, status: mismatches.length ? 'MISMATCH' : 'MATCH', expect: r.expect, actual: r.actual, mismatches,
    };
  });

  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

try {
  await main();
} catch (err) {
  fail(err.message);
}
