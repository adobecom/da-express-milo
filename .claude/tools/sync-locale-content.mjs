#!/usr/bin/env node
/**
 * sync-locale-content.mjs
 *
 * Clones (first run) or refreshes (subsequent runs) the local `aem content
 * clone` checkout for one or more locales, so query-content-blocks.mjs /
 * qa-worktree.mjs / compare-branches.mjs can enumerate pages across every
 * locale, not just en.
 *
 * Each locale gets its own checkout — `aem content clone` bakes a single
 * rootPath into `.da-config.json` per checkout, so one checkout can never
 * serve two locales (see lib/locales.mjs). `en` keeps the existing in-repo
 * `content/` checkout; every other locale is cloned OUTSIDE the repo, under
 * `~/.aem-content-cache/da-express-milo/<key>/`, so N locale checkouts
 * (each with their own nested `.git`) never clutter the working tree.
 *
 * Requires the `aem` CLI to already be installed and IMS-authenticated
 * (same prerequisite as the original single-locale `content/` checkout —
 * see `aem content clone --help`). This script does not attempt to
 * authenticate, and runs clones SEQUENTIALLY (not in parallel) to avoid
 * hammering IMS auth with 20+ concurrent requests.
 *
 * Usage:
 *   node sync-locale-content.mjs [--locale <key> ...] [--all] [--list] [--dry-run]
 *
 * Options:
 *      --locale <key>        Sync this locale (repeatable).
 *      --all                 Sync every locale in the registry.
 *      --list                Print the locale registry (key, rootPath, checkout dir, and
 *                              whether it's already cloned) and exit — no cloning.
 *      --dry-run             Report what would run, without invoking `aem`.
 *      --locales-config <p>  Override path to locales.json.
 *   -r, --root <path>        Repo root (for resolving the `en` locale's in-repo checkout).
 *                              Defaults to walking up from cwd looking for ".git".
 *
 * Output (JSON on stdout):
 *   --list:   { locales: [{ locale, rootPath, contentDir, cloned }] }
 *   otherwise: { results: [{ locale, rootPath, contentDir, action, ok, error? }] }
 *              action is one of "cloned"|"refreshed"|"would-clone"|"would-refresh".
 *
 * Caveat: whether re-running `aem content clone` against an existing
 * checkout updates it in place (vs. needing removal + re-clone) hasn't been
 * verified against the real `aem` CLI from this environment — verify
 * against ONE locale before relying on this for a large sync.
 */

import { execFile } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { promisify } from 'node:util';
import {
  loadLocales, resolveLocaleContentDir, rootPathFor,
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
      locale: locale.key, rootPath: rootPathFor(locale), contentDir, cloned,
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

async function syncOne(locale) {
  const contentDir = resolveLocaleContentDir(root, locale);
  const rootPath = rootPathFor(locale);
  const alreadyCloned = await exists(join(contentDir, '.da-config.json'));

  if (dryRun) {
    return {
      locale: locale.key, rootPath, contentDir, action: alreadyCloned ? 'would-refresh' : 'would-clone', ok: true,
    };
  }

  await mkdir(contentDir, { recursive: true });
  try {
    await execFileAsync('aem', ['content', 'clone', `--path=${rootPath}`], {
      cwd: contentDir,
      maxBuffer: 20 * 1024 * 1024,
    });
    return {
      locale: locale.key, rootPath, contentDir, action: alreadyCloned ? 'refreshed' : 'cloned', ok: true,
    };
  } catch (err) {
    return {
      locale: locale.key, rootPath, contentDir, action: alreadyCloned ? 'refresh' : 'clone', ok: false, error: err.message,
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
