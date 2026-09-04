#!/usr/bin/env node
/**
 * sync-locale-content.mjs
 *
 * Clones (first run) or refreshes (subsequent runs) the local `aem content
 * clone` checkout for one or more locales, so query-content-blocks.mjs /
 * qa-worktree.mjs / compare-branches.mjs can enumerate pages across every
 * locale, not just en.
 *
 * `aem content clone` always writes into `<cwd>/content/`, and resolves
 * which da.live org/repo to pull from via the ENCLOSING directory's git
 * `origin` remote — it refuses to run ("No git remote found") anywhere
 * else. So every locale needs its own "project dir" with a `.git` pointed
 * at this repo (see lib/locales.mjs for the full explanation). `en` reuses
 * the real repo checkout, which already qualifies. Every other locale gets
 * its own minimal project dir OUTSIDE the repo, under
 * `~/.aem-content-cache/da-express-milo/<key>/` — this script creates it
 * and runs a bare `git init` + `git remote add origin <this repo's URL>`
 * there the first time (no fetch/checkout of actual repo code — the clone
 * tool only reads the remote URL to figure out which org/repo to hit).
 *
 * Requires the `aem` CLI to already be installed. No IMS auth is needed to
 * clone this org's content (verified empirically) — this script does not
 * attempt to authenticate. Clones run SEQUENTIALLY (not in parallel) to
 * keep load on da.live reasonable across 20+ locales.
 *
 * Usage:
 *   node sync-locale-content.mjs [--locale <key> ...] [--all] [--list] [--dry-run]
 *
 * Options:
 *      --locale <key>        Sync this locale (repeatable).
 *      --all                 Sync every locale in the registry.
 *      --list                Print the locale registry (key, rootPath, project/content dirs,
 *                              and whether it's already cloned) and exit — no cloning.
 *      --dry-run             Report what would run, without invoking `git`/`aem`.
 *      --locales-config <p>  Override path to locales.json.
 *   -r, --root <path>        Repo root (for resolving the `en` locale's project dir, and for
 *                              reading this repo's origin URL for other locales' project
 *                              dirs). Defaults to walking up from cwd looking for ".git".
 *
 * Output (JSON on stdout):
 *   --list:   { locales: [{ locale, rootPath, projectDir, contentDir, cloned }] }
 *   otherwise: { results: [{ locale, rootPath, projectDir, contentDir, action, ok, error? }] }
 *              action is one of "cloned"|"refreshed"|"would-clone"|"would-refresh".
 *
 * Caveat: whether re-running `aem content clone` against an existing
 * checkout updates it in place (vs. needing removal + re-clone) hasn't been
 * verified against the real `aem` CLI — verify against ONE locale before
 * relying on this to refresh a large existing sync.
 */

import { execFile } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { promisify } from 'node:util';
import {
  loadLocales, resolveLocaleProjectDir, resolveLocaleContentDir, rootPathFor,
} from './lib/locales.mjs';

const execFileAsync = promisify(execFile);

function fail(message) {
  process.stdout.write(`${JSON.stringify({ error: message })}\n`);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      locale: { type: 'string', multiple: true },
      all: { type: 'boolean', default: false },
      list: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      root: { type: 'string', short: 'r' },
      'locales-config': { type: 'string' },
    },
  }));
} catch (err) {
  fail(`Argument parse error: ${err.message}`);
}

const requestedLocales = values.locale || [];
const { all, list, 'dry-run': dryRun } = values;

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch {
    return false;
  }
}

async function findRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await exists(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

const root = values.root || (await findRoot(process.cwd()));
if (!root) fail('Could not locate the repo root (looked for ".git"). Pass --root explicitly.');

let registry;
try {
  registry = await loadLocales(values['locales-config']);
} catch (err) {
  fail(`Could not load locale registry: ${err.message}`);
}

if (list) {
  const rows = await Promise.all(registry.map(async (locale) => {
    const contentDir = resolveLocaleContentDir(root, locale);
    const cloned = await exists(join(contentDir, '.da-config.json'));
    return {
      locale: locale.key,
      rootPath: rootPathFor(locale),
      projectDir: resolveLocaleProjectDir(root, locale),
      contentDir,
      cloned,
    };
  }));
  process.stdout.write(`${JSON.stringify({ locales: rows }, null, 2)}\n`);
  process.exit(0);
}

if (!all && requestedLocales.length === 0) {
  fail('Pass --locale <key> (repeatable), --all, or --list.');
}

const targets = all ? registry : requestedLocales.map((key) => {
  const found = registry.find((l) => l.key === key);
  if (!found) fail(`Unknown locale "${key}" — not found in the locale registry.`);
  return found;
});

let originUrl;
async function getOriginUrl() {
  if (!originUrl) {
    const { stdout } = await execFileAsync('git', ['-C', root, 'remote', 'get-url', 'origin']);
    originUrl = stdout.trim();
  }
  return originUrl;
}

// Ensures `projectDir` has a `.git` with `origin` pointed at this repo, so
// `aem content clone` (run with cwd=projectDir) can resolve the org/repo.
// A no-op for `en`, whose project dir is the real repo checkout.
async function ensureProjectDir(locale, projectDir) {
  if (locale.key === 'en') return;
  await mkdir(projectDir, { recursive: true });
  if (await exists(join(projectDir, '.git'))) return;
  await execFileAsync('git', ['init', '-q'], { cwd: projectDir });
  await execFileAsync('git', ['remote', 'add', 'origin', await getOriginUrl()], { cwd: projectDir });
}

async function syncOne(locale) {
  const projectDir = resolveLocaleProjectDir(root, locale);
  const contentDir = resolveLocaleContentDir(root, locale);
  const rootPath = rootPathFor(locale);
  const alreadyCloned = await exists(join(contentDir, '.da-config.json'));

  if (dryRun) {
    return {
      locale: locale.key, rootPath, projectDir, contentDir, action: alreadyCloned ? 'would-refresh' : 'would-clone', ok: true,
    };
  }

  try {
    await ensureProjectDir(locale, projectDir);
    await execFileAsync('aem', ['content', 'clone', `--path=${rootPath}`], {
      cwd: projectDir,
      maxBuffer: 20 * 1024 * 1024,
    });
    return {
      locale: locale.key, rootPath, projectDir, contentDir, action: alreadyCloned ? 'refreshed' : 'cloned', ok: true,
    };
  } catch (err) {
    return {
      locale: locale.key, rootPath, projectDir, contentDir, action: alreadyCloned ? 'refresh' : 'clone', ok: false, error: err.message,
    };
  }
}

const results = [];
// Sequential on purpose — see module docstring.
// eslint-disable-next-line no-restricted-syntax
for (const locale of targets) {
  // eslint-disable-next-line no-await-in-loop
  results.push(await syncOne(locale));
}

process.stdout.write(`${JSON.stringify({ results }, null, 2)}\n`);
