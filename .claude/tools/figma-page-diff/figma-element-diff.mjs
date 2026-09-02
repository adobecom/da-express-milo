#!/usr/bin/env node
/**
 * figma-element-diff.mjs
 *
 * Same clone/boot lifecycle as figma-page-diff.mjs (see
 * lib/local-page-server.mjs), but captures ONE element instead of the whole
 * viewport — located by --heading (matches the first h1/h2/h3 whose exact
 * text equals it, then walks up to the closest `.section`) or --selector —
 * and pixel-diffs it against a Figma reference PNG via comparison/diff.mjs's
 * padded (non-stretching) diff.
 *
 * Extracted from the ad-hoc Playwright snippets used repeatedly during a
 * manual audit (screenshot one block, diff against a Figma node export,
 * repeat per block) — this replaces that copy-pasted pattern with one
 * reusable, arg-driven call.
 *
 * Usage:
 *   node figma-element-diff.mjs --page </site/path> --figma-ref <path.png> (--heading <text> | --selector <css>) [options]
 *
 * Options:
 *   --page <path>          Required. Site path to render.
 *   --figma-ref <path>      Required. Reference PNG for the matching Figma node.
 *   --heading <text>        Locate the element by exact h1/h2/h3 text; the
 *                             captured element is that heading's closest
 *                             `.section` ancestor (falls back to its parent).
 *   --selector <css>        Locate the element by CSS selector instead.
 *   --ref <branch>          Git branch to check out for code. Default: stage.
 *   --clone-path <path>     da.live folder to clone. Default: page's parent dir.
 *   --dpr <n>               Device pixel ratio the ref was exported at. Default: 1.
 *   --threshold <0..1>      Per-pixel color tolerance for pixelmatch. Default: 0.1.
 *   --wait <ms>             Extra settle time after load. Default: 1500.
 *   -r, --root <path>       Main repo root. Defaults to auto-detect from cwd.
 *   -p, --port <number>     Dev server port. Default: 3051.
 *   -k, --keep-worktree     Don't remove the worktree/branch when done.
 *   --timeout <seconds>     Dev-server readiness timeout. Default: 60.
 *   --out <dir>             Output dir. Default:
 *                             .dr-screendiff/<page-slug>/element/<heading-or-selector-slug>.
 *
 * Output (JSON on stdout): { page, ref, heading, selector, figmaRef,
 *   mismatchPct, bucket, heightDeltaPx, actualImage, diffImage }
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { withLocalPage, findRoot } from '../lib/local-page-server.mjs';
import { slugify } from '../lib/slugify.mjs';
import { diffImages, bucket } from '../comparison/diff.mjs';

function fail(message) {
  process.stdout.write(`${JSON.stringify({ error: message })}\n`);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      page: { type: 'string' },
      'figma-ref': { type: 'string' },
      heading: { type: 'string' },
      selector: { type: 'string' },
      ref: { type: 'string', default: 'stage' },
      'clone-path': { type: 'string' },
      dpr: { type: 'string', default: '1' },
      threshold: { type: 'string', default: '0.1' },
      wait: { type: 'string', default: '1500' },
      root: { type: 'string', short: 'r' },
      port: { type: 'string', short: 'p', default: '3051' },
      'keep-worktree': { type: 'boolean', short: 'k', default: false },
      timeout: { type: 'string', default: '60' },
      out: { type: 'string' },
    },
  }));
} catch (err) {
  fail(`Argument parse error: ${err.message}`);
}

const { page: pagePath, ref, port } = values;
const figmaRefPath = values['figma-ref'];
const threshold = Number(values.threshold);
const waitMs = Number(values.wait);

if (!pagePath) fail('Missing required --page </site/path>');
if (!figmaRefPath) fail('Missing required --figma-ref <path.png>');
if (!pagePath.startsWith('/')) fail(`--page must start with "/" (got "${pagePath}")`);
if (!values.heading && !values.selector) fail('Provide --heading <text> or --selector <css> to locate the element.');

const root = values.root || (await findRoot(process.cwd()));
if (!root) fail('Could not locate the da-express-milo repo root. Pass --root explicitly.');

const clonePath = values['clone-path'] || dirname(pagePath);
const pageSlug = slugify(pagePath) || 'home';
const locatorSlug = slugify(values.heading || values.selector) || 'element';
const outDir = values.out || join(root, '.dr-screendiff', pageSlug, 'element', locatorSlug);

async function main() {
  await mkdir(outDir, { recursive: true });
  const actualPath = join(outDir, 'actual.png');

  await withLocalPage({
    root,
    ref,
    clonePath,
    port: Number(port),
    timeoutSeconds: Number(values.timeout),
    keepWorktree: values['keep-worktree'],
    branchPrefix: 'fed-',
    slug: pageSlug,
  }, async ({ baseUrl }) => {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    try {
      const browserPage = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
      await browserPage.goto(`${baseUrl}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
      await browserPage.waitForTimeout(waitMs);

      const handle = await browserPage.evaluateHandle(({ heading, selector }) => {
        if (selector) return document.querySelector(selector);
        const headings = [...document.querySelectorAll('h1, h2, h3')];
        const match = headings.find((h) => h.textContent.trim() === heading);
        return match ? (match.closest('.section') || match.parentElement) : null;
      }, { heading: values.heading, selector: values.selector });
      const el = handle.asElement();
      if (!el) throw new Error(`Element not found (heading="${values.heading || ''}" selector="${values.selector || ''}")`);
      await el.scrollIntoViewIfNeeded();
      await el.screenshot({ path: actualPath });
    } finally {
      await browser.close();
    }
  });

  const diffPath = join(outDir, 'diff.png');
  const diff = await diffImages(figmaRefPath, actualPath, diffPath, threshold);

  const summary = {
    page: pagePath,
    ref,
    heading: values.heading || null,
    selector: values.selector || null,
    figmaRef: figmaRefPath,
    mismatchPct: Number(diff.mismatchPct.toFixed(2)),
    bucket: bucket(diff.mismatchPct),
    heightDeltaPx: diff.heightDelta,
    actualImage: actualPath,
    diffImage: diffPath,
  };
  await writeFile(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

try {
  await main();
} catch (err) {
  fail(err.message);
}
