#!/usr/bin/env node
/**
 * figma-page-diff.mjs
 *
 * Clones a page's content locally via the `aem` CLI (`aem content clone`),
 * so draft/unpublished pages that 401 on the public .aem.page/.aem.live
 * preview domains (access-not-allowed to an unauthenticated caller) can
 * still be rendered and diffed — the aem CLI itself carries the caller's
 * authenticated da.live session. Boots a local `aem up` dev server against
 * that cloned content + a disposable worktree's code (see
 * lib/local-page-server.mjs for that lifecycle — shared with
 * figma-element-diff.mjs and style-audit.mjs), screenshots the page at a
 * Figma reference PNG's exact dimensions (viewport-clipped, not fullPage,
 * so the capture is naturally truncated to the reference's height instead
 * of scaled/sheared into it), and pixel-diffs the two via comparison/
 * diff.mjs's padded (non-stretching) diff.
 *
 * Usage:
 *   node figma-page-diff.mjs --page </site/path> --figma-ref <path.png> [options]
 *
 * Options:
 *   --page <path>         Required. Site path to render, e.g. /drafts/blog/blog-main
 *   --figma-ref <path>     Required. Reference PNG exported from the Figma
 *                            frame (e.g. via the Figma MCP's get_screenshot).
 *   --ref <branch>         Git branch to check out for code. Default: stage.
 *   --clone-path <path>    da.live folder to pass to `aem content clone
 *                            --path=`. Default: the page's parent directory.
 *   --dpr <n>              Device pixel ratio the ref was exported at.
 *                            Default: 1.
 *   --threshold <0..1>     Per-pixel color tolerance for pixelmatch.
 *                            Default: 0.1.
 *   --wait <ms>            Extra settle time after load. Default: 800.
 *   -r, --root <path>      Main repo root. Defaults to walking up from cwd
 *                            looking for a dir containing content/express.
 *   -p, --port <number>    Port for the local aem dev server. Default: 3002.
 *   -k, --keep-worktree    Don't remove the worktree/branch when done.
 *   --timeout <seconds>    How long to wait for the dev server. Default: 60.
 *   --out <dir>            Output dir. Default: .dr-screendiff/<page-slug>/<ref-slug>.
 *
 * Output (JSON on stdout): { page, ref, clonePath, port, figmaRef,
 *   viewport: {width,height}, dpr, mismatchPct, bucket, diffImage,
 *   actualImage, worktreeKept }
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { Jimp } from 'jimp';
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
      ref: { type: 'string', default: 'stage' },
      'clone-path': { type: 'string' },
      dpr: { type: 'string', default: '1' },
      threshold: { type: 'string', default: '0.1' },
      wait: { type: 'string', default: '800' },
      root: { type: 'string', short: 'r' },
      port: { type: 'string', short: 'p', default: '3002' },
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
const dpr = Number(values.dpr);
const threshold = Number(values.threshold);
const waitMs = Number(values.wait);

if (!pagePath) fail('Missing required --page </site/path>');
if (!figmaRefPath) fail('Missing required --figma-ref <path.png>');
if (!pagePath.startsWith('/')) fail(`--page must start with "/" (got "${pagePath}")`);

const root = values.root || (await findRoot(process.cwd()));
if (!root) fail('Could not locate the da-express-milo repo root (looked for content/express + .git). Pass --root explicitly.');

const clonePath = values['clone-path'] || dirname(pagePath);
const pageSlug = slugify(pagePath) || 'home';
const refSlug = slugify(ref) || 'ref';
// Own top-level folder (not .qa-screendiff, which is qa-worktree.mjs's/
// comparison's) so figma-vs-page results are easy to find and prune on
// their own.
const outDir = values.out || join(root, '.dr-screendiff', pageSlug, refSlug);

async function main() {
  await mkdir(outDir, { recursive: true });

  const refBuf = await readFile(figmaRefPath);
  const refImg = await Jimp.read(refBuf);
  const viewport = {
    width: Math.round(refImg.bitmap.width / dpr),
    height: Math.round(refImg.bitmap.height / dpr),
  };

  const actualPath = join(outDir, 'actual.png');
  await withLocalPage({
    root,
    ref,
    clonePath,
    port: Number(port),
    timeoutSeconds: Number(values.timeout),
    keepWorktree: values['keep-worktree'],
    branchPrefix: 'fgd-',
    slug: pageSlug,
  }, async ({ baseUrl }) => {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    try {
      const browserPage = await browser.newPage({ viewport, deviceScaleFactor: dpr });
      await browserPage.goto(`${baseUrl}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
      await browserPage.waitForTimeout(waitMs);
      // fullPage:false clips to the viewport — this is the truncation to the
      // Figma frame's height, not a post-hoc crop.
      await browserPage.screenshot({ path: actualPath, fullPage: false });
    } finally {
      await browser.close();
    }
  });

  const diffPath = join(outDir, 'diff.png');
  const diff = await diffImages(figmaRefPath, actualPath, diffPath, threshold);

  const summary = {
    page: pagePath,
    ref,
    clonePath,
    port: Number(port),
    figmaRef: figmaRefPath,
    viewport,
    dpr,
    mismatchPct: Number(diff.mismatchPct.toFixed(2)),
    bucket: bucket(diff.mismatchPct),
    heightDeltaPx: diff.heightDelta,
    diffImage: diffPath,
    actualImage: actualPath,
    worktreeKept: Boolean(values['keep-worktree']),
  };
  await writeFile(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

try {
  await main();
} catch (err) {
  fail(err.message);
}
