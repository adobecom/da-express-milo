#!/usr/bin/env node
/**
 * compare-branches.mjs
 *
 * Compares how a block renders on a baseline ref (default: stage) vs. a
 * feature branch, across every page that references it. Delegates the two
 * capture runs to qa-worktree.mjs — one worktree/dev-server/screenshot pass
 * per ref, run CONCURRENTLY (distinct worktree/branch names and distinct
 * ports per ref, and both refs are fetched once up front by this script so
 * the two qa-worktree calls never race each other on `git fetch`) — then
 * pixel-diffs matching pages and writes a JSON log plus a natural-language
 * summary.
 *
 * Block comparisons default to capturing just the block element (not the
 * whole page): full-page screenshots of a long page are slow to render/
 * encode/write and mostly irrelevant to "did this block change" — use
 * --mode=full or --mode=both to also/instead diff the full page.
 *
 * Usage:
 *   node compare-branches.mjs --block <name> --branch <branch> [options]
 *
 * Options:
 *   -b, --block <string>    Required. Block name to QA.
 *      --branch <string>    Required. Feature branch to compare against base.
 *      --base <string>      Baseline ref. Default: stage. Must differ from
 *                             --branch.
 *      --mode <m>           element | full | both. Default: element.
 *      --selector <css>     Element to diff for element/both modes.
 *                             Defaults to ".<block-slug>" if omitted.
 *      --concurrency <n>    Pages captured in parallel PER SIDE (passed
 *                             through to each qa-worktree call). Default: 6.
 *      --threshold <0..1>   Per-pixel color tolerance for pixelmatch.
 *                             Default: 0.1.
 *   -r, --root <path>       Main repo root. Defaults to auto-detect from cwd.
 *   -p, --port <number>     Port for the baseline's dev server (the branch's
 *                             server runs on port+1). Default: 3002.
 *      --timeout <seconds>  Dev-server readiness timeout per run. Default: 60.
 *   -k, --keep-worktrees    Don't remove either worktree/branch when done.
 *
 * Output (JSON on stdout, and written to
 * .qa-screendiff/<block-slug>/comparison-<base>-vs-<branch-slug>.json):
 *   {
 *     block, base, branch, mode, selector, threshold, generatedAt,
 *     stats: { total, identical, minor, major, baselineOnly404, branchOnly404,
 *              bothErrored, missing },
 *     pages: [{
 *       path, baseUrl, branchUrl, baseStatus, branchStatus,
 *       fullPage?: { mismatchPct, diffImage, heightDeltaPx } | { skipped: reason },
 *       element?: { mismatchPct, diffImage, heightDeltaPx } | { skipped: reason },
 *     }],
 *     narrative: "<human-readable summary, including base/branch URLs for
 *                  every major diff and the top minor diffs, so a reviewer
 *                  can open both sides directly>"
 *   }
 */

import { execFile, execFileSync } from 'node:child_process';
import {
  mkdir, stat, writeFile, readFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { Jimp } from 'jimp';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const QA_WORKTREE_TOOL = join(HERE, '..', 'qa-worktree', 'qa-worktree.mjs');

function fail(message) {
  process.stdout.write(`${JSON.stringify({ error: message })}\n`);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      block: { type: 'string', short: 'b' },
      branch: { type: 'string' },
      base: { type: 'string', default: 'stage' },
      mode: { type: 'string', default: 'element' },
      selector: { type: 'string' },
      concurrency: { type: 'string', default: '6' },
      threshold: { type: 'string', default: '0.1' },
      root: { type: 'string', short: 'r' },
      port: { type: 'string', short: 'p', default: '3002' },
      timeout: { type: 'string', default: '60' },
      'keep-worktrees': { type: 'boolean', short: 'k', default: false },
    },
  }));
} catch (err) {
  fail(`Argument parse error: ${err.message}`);
}

const {
  block, branch, base, mode, port, 'keep-worktrees': keepWorktrees,
} = values;
const threshold = Number(values.threshold);

if (!block) fail('Missing required --block <name>');
if (!branch) fail('Missing required --branch <name>');
if (base === branch) fail('--base and --branch must be different refs.');
if (!['full', 'element', 'both'].includes(mode)) fail(`Invalid --mode "${mode}" (expected full, element, or both)`);
const wantsFullPage = mode === 'full' || mode === 'both';
const wantsElement = mode === 'element' || mode === 'both';

async function isDir(candidate) {
  try {
    return (await stat(candidate)).isDirectory();
  } catch {
    return false;
  }
}

async function findRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i += 1) {
    if (await isDir(join(dir, 'content', 'express')) && await isDir(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const root = values.root || (await findRoot(process.cwd()));
if (!root) fail('Could not locate the da-express-milo repo root (looked for content/express + .git). Pass --root explicitly.');

const slug = slugify(block);
const selector = values.selector || (wantsElement ? `.${slug}` : undefined);
const baseSlug = slugify(base) || 'base';
const branchSlug = slugify(branch) || 'branch';
const compareDir = join(root, '.qa-screendiff', slug, `diff-${baseSlug}-vs-${branchSlug}`);

async function runCapture(ref, refPort) {
  const args = [
    QA_WORKTREE_TOOL,
    `--block=${block}`,
    `--ref=${ref}`,
    `--root=${root}`,
    `--port=${refPort}`,
    `--timeout=${values.timeout}`,
    `--mode=${mode}`,
    `--concurrency=${values.concurrency}`,
    '--skip-fetch', // both refs are fetched once, up front, by this script (see main())
  ];
  if (selector) args.push(`--selector=${selector}`);
  if (keepWorktrees) args.push('--keep-worktree');
  const { stdout } = await execFileAsync('node', args, { maxBuffer: 50 * 1024 * 1024 });
  const result = JSON.parse(stdout);
  if (result.error) throw new Error(`qa-worktree failed for ref "${ref}": ${result.error}`);
  return result;
}

async function diffImages(pathA, pathB, outPath) {
  const [bufA, bufB] = await Promise.all([readFile(pathA), readFile(pathB)]);
  const [imgA, imgB] = await Promise.all([Jimp.read(bufA), Jimp.read(bufB)]);

  // Pad both to a shared canvas (top-left aligned) instead of resizing either
  // one to match the other's dimensions. Full-page screenshots routinely
  // differ in height (dynamic/personalized content, accordion state, etc.);
  // stretching a shorter capture to a taller one's height shears every row
  // below the first divergence and produces a huge, meaningless mismatch %
  // (a diagonal "ghosting" artifact). Padding instead just marks the extra
  // rows/columns as mismatched, which is the honest result of a length
  // difference rather than an invented distortion.
  const width = Math.max(imgA.bitmap.width, imgB.bitmap.width);
  const height = Math.max(imgA.bitmap.height, imgB.bitmap.height);
  const heightDelta = Math.abs(imgA.bitmap.height - imgB.bitmap.height);

  const canvasA = new Jimp({ width, height, color: 0xffffffff });
  const canvasB = new Jimp({ width, height, color: 0xffffffff });
  canvasA.composite(imgA, 0, 0);
  canvasB.composite(imgB, 0, 0);

  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(
    canvasA.bitmap.data,
    canvasB.bitmap.data,
    diff.data,
    width,
    height,
    { threshold, includeAA: false },
  );
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, PNG.sync.write(diff));
  return {
    mismatchPct: (100 * mismatched) / (width * height), width, height, heightDelta,
  };
}

function bucket(pct) {
  if (pct < 0.5) return 'identical';
  if (pct <= 3) return 'minor';
  return 'major';
}

async function main() {
  // Fetch both refs once, up front — the two qa-worktree calls run
  // concurrently below and each passes --skip-fetch, so they never race each
  // other doing `git fetch` on the same repo.
  execFileSync('git', ['fetch', 'origin', base, branch], { cwd: root, encoding: 'utf8' });

  const [baseResult, branchResult] = await Promise.all([
    runCapture(base, port),
    runCapture(branch, Number(port) + 1),
  ]);

  const stats = {
    total: 0, identical: 0, minor: 0, major: 0, baselineOnly404: 0, branchOnly404: 0, bothErrored: 0, missing: 0,
  };
  const pages = [];

  if (baseResult.pagesFound === 0 || branchResult.pagesFound === 0) {
    const narrative = `No pages reference "${block}" — nothing to compare between ${base} and ${branch}.`;
    const summary = {
      block, base, branch, mode, selector: selector || null, threshold, generatedAt: new Date().toISOString(), stats, pages, narrative,
    };
    await mkdir(join(root, '.qa-screendiff', slug), { recursive: true });
    await writeFile(join(root, '.qa-screendiff', slug, `comparison-${baseSlug}-vs-${branchSlug}.json`), JSON.stringify(summary, null, 2));
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    return;
  }

  const branchByPath = new Map(branchResult.screenshots.map((s) => [s.path, s]));

  for (const baseShot of baseResult.screenshots) {
    const branchShot = branchByPath.get(baseShot.path);
    stats.total += 1;
    const record = {
      path: baseShot.path,
      baseUrl: `${baseResult.contentUrl}${baseShot.path}`,
      branchUrl: `${branchResult.contentUrl}${baseShot.path}`,
      baseStatus: baseShot.status,
      branchStatus: branchShot ? branchShot.status : 'missing',
    };

    if (!branchShot) {
      stats.missing += 1;
      record.fullPage = { skipped: 'page missing from branch capture' };
      pages.push(record);
      continue;
    }

    const baseOk = baseShot.status === 'ok';
    const branchOk = branchShot.status === 'ok';
    let skipReason = null;

    if (!baseOk && !branchOk) {
      stats.bothErrored += 1;
      skipReason = `both sides failed (base: ${baseShot.status}, branch: ${branchShot.status})`;
    } else if (!baseOk) {
      stats.baselineOnly404 += 1;
      skipReason = `only exists on ${branch} (base was ${baseShot.status})`;
    } else if (!branchOk) {
      stats.branchOnly404 += 1;
      skipReason = `broken/missing on ${branch} (${branchShot.status})`;
    }

    if (wantsFullPage) {
      if (skipReason) {
        record.fullPage = { skipped: skipReason };
      } else if (baseShot.file && branchShot.file) {
        const diffFile = `${baseShot.path.replace(/^\//, '').replace(/\//g, '_') || 'home'}.diff.png`;
        const diffPath = join(compareDir, diffFile);
        // eslint-disable-next-line no-await-in-loop
        const diff = await diffImages(
          join(baseResult.outDir, baseShot.file),
          join(branchResult.outDir, branchShot.file),
          diffPath,
        );
        record.fullPage = {
          mismatchPct: Number(diff.mismatchPct.toFixed(2)),
          diffImage: diffPath,
          heightDeltaPx: diff.heightDelta,
        };
        stats[bucket(diff.mismatchPct)] += 1;
      } else {
        record.fullPage = { skipped: 'full-page screenshot missing on one or both sides' };
      }
    }

    if (wantsElement) {
      if (skipReason) {
        record.element = { skipped: skipReason };
      } else if (baseShot.elementFile && branchShot.elementFile) {
        const elDiffFile = `${baseShot.path.replace(/^\//, '').replace(/\//g, '_') || 'home'}.element.diff.png`;
        const elDiffPath = join(compareDir, elDiffFile);
        try {
          // eslint-disable-next-line no-await-in-loop
          const elDiff = await diffImages(
            join(baseResult.outDir, baseShot.elementFile),
            join(branchResult.outDir, branchShot.elementFile),
            elDiffPath,
          );
          record.element = {
            mismatchPct: Number(elDiff.mismatchPct.toFixed(2)),
            diffImage: elDiffPath,
            heightDeltaPx: elDiff.heightDelta,
          };
          if (!wantsFullPage) stats[bucket(elDiff.mismatchPct)] += 1;
        } catch (err) {
          record.element = { skipped: `diff failed: ${err.message}` };
        }
      } else {
        record.element = { skipped: 'selector not found on one or both sides' };
      }
    }

    pages.push(record);
  }

  const primary = wantsFullPage ? 'fullPage' : 'element';
  const diffed = pages.filter((p) => p[primary] && typeof p[primary].mismatchPct === 'number');
  const majorPages = diffed.filter((p) => bucket(p[primary].mismatchPct) === 'major')
    .sort((a, b) => b[primary].mismatchPct - a[primary].mismatchPct);
  const minorPages = diffed.filter((p) => bucket(p[primary].mismatchPct) === 'minor')
    .sort((a, b) => b[primary].mismatchPct - a[primary].mismatchPct);

  function describe(p) {
    const d = p[primary];
    const heightNote = d.heightDeltaPx > 50
      ? ` [${primary === 'fullPage' ? 'page' : 'element'} height differs by ${d.heightDeltaPx}px between ${base} and ${branch} — may just be a content-length/personalization difference, not a rendering bug; check the diff image]`
      : '';
    return `  - ${p.path}: ${d.mismatchPct}%${heightNote}\n      ${base}: ${p.baseUrl}\n      ${branch}: ${p.branchUrl}`;
  }

  const MINOR_CAP = 15;
  const narrativeLines = [];
  narrativeLines.push(`Compared "${block}" on ${base} vs ${branch} across ${stats.total} page(s) (mode=${mode}${selector ? `, selector="${selector}"` : ''}).`);
  if (stats.identical) narrativeLines.push(`${stats.identical} page(s) render identically (< 0.5% mismatch).`);
  if (stats.minor) narrativeLines.push(`${stats.minor} page(s) show a minor visual diff (0.5-3%).`);
  if (stats.major) narrativeLines.push(`${stats.major} page(s) show a MAJOR visual diff (> 3%) — likely a real regression or intentional change.`);
  if (stats.branchOnly404) narrativeLines.push(`${stats.branchOnly404} page(s) broke or 404'd on ${branch} but were fine on ${base}.`);
  if (stats.baselineOnly404) narrativeLines.push(`${stats.baselineOnly404} page(s) were already broken/404 on ${base} (not a regression from ${branch}).`);
  if (stats.bothErrored) narrativeLines.push(`${stats.bothErrored} page(s) failed to render on both sides.`);
  if (stats.missing) narrativeLines.push(`${stats.missing} page(s) from ${base}'s capture were missing from ${branch}'s.`);

  if (majorPages.length) {
    narrativeLines.push(`\nMajor diffs (${majorPages.length}) — open both URLs side by side:`);
    for (const p of majorPages) narrativeLines.push(describe(p));
  }

  if (minorPages.length) {
    const shown = minorPages.slice(0, MINOR_CAP);
    narrativeLines.push(`\nMinor diffs (${minorPages.length}${minorPages.length > MINOR_CAP ? `, showing top ${MINOR_CAP}` : ''}):`);
    for (const p of shown) narrativeLines.push(describe(p));
    if (minorPages.length > MINOR_CAP) {
      narrativeLines.push(`  ...and ${minorPages.length - MINOR_CAP} more — see the "pages" array in the JSON log for the full list with URLs.`);
    }
  }

  if (stats.total > 0 && stats.identical === stats.total) {
    narrativeLines.push('No visual differences detected anywhere — safe to treat as a no-op change for this block.');
  }
  const narrative = narrativeLines.join('\n');

  const summary = {
    block,
    base,
    branch,
    mode,
    selector: selector || null,
    threshold,
    generatedAt: new Date().toISOString(),
    stats,
    pages,
    narrative,
  };

  const logPath = join(root, '.qa-screendiff', slug, `comparison-${baseSlug}-vs-${branchSlug}.json`);
  await mkdir(dirname(logPath), { recursive: true });
  await writeFile(logPath, JSON.stringify(summary, null, 2));
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

try {
  await main();
} catch (err) {
  fail(err.message);
}
