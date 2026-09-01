#!/usr/bin/env node
/**
 * qa-worktree.mjs
 *
 * Given a block name, spins up a disposable git worktree checked out from
 * a given ref (default: stage; no upstream tracking — see
 * feedback_never_touch_stage), finds every page that references the block
 * (via query-content-blocks.mjs), boots a local `aem up` dev server against
 * that worktree's code with content proxied live from
 * https://<ref>--da-express-milo--adobecom.aem.live (the repo's
 * content/express is untracked by git — a fresh worktree has no local
 * content to serve, and the `.aem.live` origin for a given ref is the
 * public, unauthed equivalent of what a plain `aem up` would show for that
 * branch), and screenshots every affected page (concurrently — see
 * --concurrency). Screenshots land in the MAIN repo (not the worktree,
 * which gets torn down) under `.qa-screendiff/<block-slug>/<ref-slug>/`.
 *
 * Usage:
 *   node qa-worktree.mjs --block <name> [options]
 *
 * Options:
 *   -b, --block <string>     Required. Block name to search for and QA.
 *      --ref <branch>        Git branch to check out (origin/<ref>) and the
 *                              default content origin's branch segment.
 *                              Default: stage.
 *      --content-url <url>   Override the content origin entirely (skip the
 *                              <ref>--da-express-milo--adobecom.aem.live
 *                              default) — e.g. for a branch with no .live
 *                              domain yet.
 *      --mode <m>            full | element | both. Default: "both" if
 *                              --selector is given, else "full".
 *                              - full:    only the full-page screenshot.
 *                              - element: only the element crop (skips the
 *                                 full-page screenshot+encode+write entirely
 *                                 — much faster on tall pages; used by the
 *                                 comparison tool by default since block
 *                                 comparisons don't need the whole page).
 *                              - both:    both.
 *      --selector <css>      Element to capture for element/both modes.
 *                              Defaults to ".<block-slug>" if omitted.
 *      --concurrency <n>     How many pages to capture in parallel (each in
 *                              its own browser context). Default: 6.
 *      --skip-fetch          Skip `git fetch origin <ref>` (caller already
 *                              fetched it — used by compare-branches.mjs to
 *                              fetch both refs once instead of twice).
 *   -t, --type <mode>        Match mode passed to query-content-blocks
 *                              (block|css|regex). Default: block.
 *   -r, --root <path>        Main repo root. Defaults to walking up from cwd
 *                              looking for a dir containing content/express.
 *   -p, --port <number>      Port for the local aem dev server. Default: 3002.
 *   -k, --keep-worktree      Don't remove the worktree/branch when done.
 *      --timeout <seconds>   How long to wait for the dev server to come up.
 *                              Default: 60.
 *
 * Output (JSON on stdout):
 *   {
 *     block, ref, branch, root, worktree, port, contentUrl, mode, selector,
 *     pagesFound, outDir,
 *     screenshots: [{
 *       path, file?, status: "ok"|"not-found-on-stage"|"error",
 *       httpStatus?, error?, elementFile?, elementStatus?
 *     }],
 *     worktreeKept: boolean
 *   }
 *
 * On a hard failure before any cleanup can run, prints { "error": "..." }
 * and exits 1 — but every code path attempts to kill the dev server and
 * (unless --keep-worktree) remove the worktree first.
 */

import { execFile, execFileSync, spawn } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const QUERY_TOOL = join(HERE, '..', 'query-content-blocks.mjs');

function fail(message) {
  process.stdout.write(`${JSON.stringify({ error: message })}\n`);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      block: { type: 'string', short: 'b' },
      ref: { type: 'string', default: 'stage' },
      'content-url': { type: 'string' },
      mode: { type: 'string' },
      selector: { type: 'string' },
      concurrency: { type: 'string', default: '6' },
      'skip-fetch': { type: 'boolean', default: false },
      type: { type: 'string', short: 't', default: 'block' },
      root: { type: 'string', short: 'r' },
      port: { type: 'string', short: 'p', default: '3002' },
      'keep-worktree': { type: 'boolean', short: 'k', default: false },
      timeout: { type: 'string', default: '60' },
    },
  }));
} catch (err) {
  fail(`Argument parse error: ${err.message}`);
}

const {
  block, ref, type, port, 'keep-worktree': keepWorktree, 'skip-fetch': skipFetch,
} = values;
const readinessTimeoutMs = Number(values.timeout) * 1000;
const concurrency = Math.max(1, Number(values.concurrency) || 1);

if (!block) fail('Missing required --block <name>');

const mode = values.mode || (values.selector ? 'both' : 'full');
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

function sleep(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch {
      // not up yet
    }
    await sleep(1000);
  }
  return false;
}

const root = values.root || (await findRoot(process.cwd()));
if (!root) fail('Could not locate the da-express-milo repo root (looked for content/express + .git). Pass --root explicitly.');

const slug = slugify(block);
if (!slug) fail(`Block name "${block}" produced an empty slug.`);
const selector = values.selector || (wantsElement ? `.${slug}` : undefined);

const refSlug = slugify(ref) || 'ref';
// Deterministic per (block, ref) so: (a) a stale worktree from a previous
// crashed run of the SAME block+ref is found and cleared on the next run,
// and (b) two DIFFERENT refs for the same block (base vs. branch, run
// concurrently by compare-branches.mjs) never collide. Budget: 20 chars max
// (feedback_short_branch_names) — "qa-" (3) + slug + "-" + refSlug, with
// refSlug capped at 6 chars so long block names still get most of the space.
const refBudget = Math.min(refSlug.length, 6);
const slugBudget = 20 - 3 - 1 - refBudget;
const branchName = `qa-${slug.slice(0, slugBudget)}-${refSlug.slice(0, refBudget)}`.replace(/-+$/, '');
const worktreePath = join(root, '.claude', 'worktrees', branchName);
const outDir = join(root, '.qa-screendiff', slug, refSlug);
const contentUrl = values['content-url'] || `https://${ref}--da-express-milo--adobecom.aem.live`;

let serverProcess = null;

async function killServer() {
  if (!serverProcess || serverProcess.killed) return;
  serverProcess.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => serverProcess.once('exit', resolve)),
    sleep(5000),
  ]);
  if (!serverProcess.killed) serverProcess.kill('SIGKILL');
}

async function removeWorktreeIfOwned() {
  if (keepWorktree) return false;
  if (!branchName.startsWith('qa-')) return false; // safety: never touch anything we didn't create
  try {
    git(['worktree', 'remove', '--force', worktreePath], root);
  } catch {
    // may not have been created yet
  }
  try {
    git(['branch', '-D', branchName], root);
  } catch {
    // may not exist
  }
  return true;
}

async function captureOne(browserPage, baseUrl, p) {
  const base = p.path.replace(/^\//, '').replace(/\//g, '_') || 'home';
  const record = { path: p.path };
  try {
    const response = await browserPage.goto(`${baseUrl}${p.path}`, { waitUntil: 'networkidle', timeout: 30000 });
    const httpStatus = response ? response.status() : null;
    record.httpStatus = httpStatus;
    record.status = httpStatus && httpStatus >= 400 ? 'not-found-on-stage' : 'ok';

    if (wantsFullPage) {
      const fileName = `${base}.png`;
      await browserPage.screenshot({ path: join(outDir, fileName), fullPage: true });
      record.file = fileName;
    }

    if (wantsElement) {
      const elementFile = `${base}.element.png`;
      try {
        const locator = browserPage.locator(selector).first();
        await locator.waitFor({ state: 'visible', timeout: 10000 });
        await locator.scrollIntoViewIfNeeded();
        await locator.screenshot({ path: join(outDir, elementFile) });
        record.elementFile = elementFile;
        record.elementStatus = 'ok';
      } catch (elErr) {
        record.elementStatus = 'not-found';
        record.elementError = elErr.message;
      }
    }
  } catch (err) {
    record.status = 'error';
    record.error = err.message;
  }
  return record;
}

async function captureAll(browser, baseUrl, pages) {
  const screenshots = new Array(pages.length);
  const slots = Math.min(concurrency, pages.length);
  const contexts = await Promise.all(
    Array.from({ length: slots }, () => browser.newContext({ viewport: { width: 1440, height: 900 } })),
  );
  const workerPages = await Promise.all(contexts.map((c) => c.newPage()));

  let cursor = 0;
  async function worker(workerPage) {
    for (;;) {
      const i = cursor;
      cursor += 1;
      if (i >= pages.length) return;
      screenshots[i] = await captureOne(workerPage, baseUrl, pages[i]);
    }
  }
  await Promise.all(workerPages.map(worker));
  await Promise.all(contexts.map((c) => c.close()));
  return screenshots;
}

async function main() {
  // 0. Clear out any stale worktree/branch from a previous run of the same block+ref.
  await removeWorktreeIfOwned();

  // 1. Fetch (unless the caller already did) + create a fresh, untracked
  // worktree off origin/<ref>.
  if (!skipFetch) git(['fetch', 'origin', ref], root);
  git(['worktree', 'add', worktreePath, '-b', branchName, '--no-track', `origin/${ref}`], root);

  // 2. Find affected pages. content/express is untracked (not part of the
  // git checkout), so query the MAIN repo's content tree, not the worktree.
  const { stdout: queryOut } = await execFileAsync('node', [
    QUERY_TOOL,
    `--pattern=${block}`,
    `--type=${type}`,
    `--root=${root}`,
  ], { maxBuffer: 20 * 1024 * 1024 });
  const queryResult = JSON.parse(queryOut);
  if (queryResult.error) throw new Error(`query-content-blocks failed: ${queryResult.error}`);

  const pages = queryResult.pages;
  await mkdir(outDir, { recursive: true });

  if (pages.length === 0) {
    await removeWorktreeIfOwned();
    const summary = {
      block, ref, branch: branchName, root, worktree: null, port: Number(port), contentUrl, mode, selector: selector || null,
      pagesFound: 0, outDir, screenshots: [], worktreeKept: false,
      note: 'No pages reference this block/pattern — nothing to screenshot.',
    };
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    return;
  }

  // 3. Boot the dev server: local code from the ref's worktree, content
  // proxied live from that ref's public .aem.live origin.
  serverProcess = spawn('aem', [
    'up', '--port', String(port), '--no-open', '--stop-other', '--url', contentUrl,
  ], {
    cwd: worktreePath,
    stdio: ['ignore', 'ignore', 'ignore'],
  });

  // Must be "localhost" (not 127.0.0.1): the app's getLibs() dev/stage
  // override in scripts/utils.js only activates when location.hostname
  // contains "local" — 127.0.0.1 falls through to prod /libs paths, which
  // 404 locally and leave the page's body hidden (anti-FOUC never clears).
  const baseUrl = `http://localhost:${port}`;
  const up = await waitForServer(`${baseUrl}/`, readinessTimeoutMs);
  if (!up) throw new Error(`Dev server did not come up on port ${port} within ${values.timeout}s.`);

  // 4. Screenshot every affected page, `concurrency` at a time.
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  let screenshots;
  try {
    screenshots = await captureAll(browser, baseUrl, pages);
  } finally {
    await browser.close();
  }

  await killServer();
  const kept = !(await removeWorktreeIfOwned());

  const summary = {
    block,
    ref,
    branch: branchName,
    root,
    worktree: kept ? worktreePath : null,
    port: Number(port),
    contentUrl,
    mode,
    selector: selector || null,
    pagesFound: pages.length,
    outDir,
    screenshots,
    worktreeKept: kept,
  };
  await writeFile(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

try {
  await main();
} catch (err) {
  await killServer();
  await removeWorktreeIfOwned();
  fail(err.message);
}
