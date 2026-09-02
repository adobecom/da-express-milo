/**
 * Shared lifecycle for "clone da.live content locally, then boot a local
 * `aem up` dev server" — used by figma-page-diff.mjs, figma-element-diff.mjs,
 * and style-audit.mjs so each doesn't reimplement worktree/clone/server/
 * teardown from scratch.
 *
 * Content is cloned via `aem content clone` (the authenticated da.live
 * source) rather than proxied from a live URL, because a draft/unpublished
 * page 401s (access-not-allowed) on the public .aem.page/.aem.live preview
 * domains for an unauthenticated caller — the aem CLI carries the caller's
 * own logged-in session instead. `aem up --url` still points at the ref's
 * public .aem.live as a fallback for anything NOT cloned locally (nav/
 * footer fragments, other pages) — its default fallback is main's
 * .aem.page, which 401s the same way the draft page did, silently breaking
 * decoration even though the page itself loads.
 */
import { execFile, execFileSync, spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { slugify } from './slugify.mjs';

const execFileAsync = promisify(execFile);

async function isDir(candidate) {
  try {
    return (await stat(candidate)).isDirectory();
  } catch {
    return false;
  }
}

export async function findRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i += 1) {
    if (await isDir(join(dir, 'content', 'express')) && await isDir(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
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

/**
 * Sets up a disposable worktree + cloned content + dev server, runs `fn`,
 * then always tears both down (server killed, worktree/branch removed)
 * even if `fn` throws.
 *
 * @param {object} opts
 * @param {string} opts.root - main repo root (contains content/express + .git)
 * @param {string} opts.ref - git branch to check out for code
 * @param {string} opts.clonePath - da.live folder to `aem content clone --path=`
 * @param {string} [opts.branchPrefix] - worktree/branch name prefix (default "lps-")
 * @param {string} [opts.slug] - identifier folded into the branch name (default: slugify(clonePath))
 * @param {number} [opts.port] - dev server port (default 3050)
 * @param {number} [opts.timeoutSeconds] - server readiness timeout (default 60)
 * @param {boolean} [opts.keepWorktree] - skip teardown (for debugging)
 * @param {(ctx: {baseUrl: string, worktreePath: string}) => Promise<any>} fn
 * @returns {Promise<any>} whatever `fn` returns
 */
export async function withLocalPage(opts, fn) {
  const {
    root, ref, clonePath, port = 3050, timeoutSeconds = 60, keepWorktree = false,
  } = opts;
  const branchPrefix = opts.branchPrefix || 'lps-';
  const slug = opts.slug || slugify(clonePath) || 'page';
  const refSlug = slugify(ref) || 'ref';
  const refBudget = Math.min(refSlug.length, 6);
  const slugBudget = 20 - branchPrefix.length - 1 - refBudget;
  const branchName = `${branchPrefix}${slug.slice(0, Math.max(slugBudget, 1))}-${refSlug.slice(0, refBudget)}`.replace(/-+$/, '');
  const worktreePath = join(root, '.claude', 'worktrees', branchName);

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
    if (!branchName.startsWith(branchPrefix)) return false; // safety: never touch anything we didn't create
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

  await removeWorktreeIfOwned(); // clear any stale worktree from a previous crashed run

  git(['fetch', 'origin', ref], root);
  git(['worktree', 'add', worktreePath, '-b', branchName, '--no-track', `origin/${ref}`], root);

  try {
    await execFileAsync('aem', ['content', 'clone', `--path=${clonePath}`, '--force'], {
      cwd: worktreePath,
      maxBuffer: 20 * 1024 * 1024,
    });

    const contentUrl = `https://${ref}--da-express-milo--adobecom.aem.live`;
    serverProcess = spawn('aem', ['up', '--port', String(port), '--no-open', '--stop-other', '--url', contentUrl], {
      cwd: worktreePath,
      stdio: ['ignore', 'ignore', 'ignore'],
    });

    // "localhost", not "127.0.0.1" — the app's getLibs() dev/stage override
    // only activates when location.hostname contains "local".
    const baseUrl = `http://localhost:${port}`;
    const up = await waitForServer(`${baseUrl}/`, timeoutSeconds * 1000);
    if (!up) throw new Error(`Dev server did not come up on port ${port} within ${timeoutSeconds}s.`);

    return await fn({ baseUrl, worktreePath });
  } finally {
    await killServer();
    await removeWorktreeIfOwned();
  }
}
