#!/usr/bin/env node
/**
 * query-content-blocks.mjs
 *
 * Scans an EDS content tree (e.g. `content/express/**\/*.html` in
 * da-express-milo) for pages that reference a given block name or CSS
 * pattern, and reports results as JSON on stdout for consumption by other
 * tools/agents.
 *
 * Usage:
 *   node query-content-blocks.mjs --pattern <name> [options]
 *
 * Options:
 *   -p, --pattern <string>   Required. Block name, class, or CSS/text pattern to search for.
 *   -t, --type <mode>        Match mode: "block" (default), "css", or "regex".
 *                              block  - exact class-token match inside class="..." attributes
 *                                       (so "marquee" won't spuriously match "grid-marquee")
 *                              css    - literal substring match anywhere in the file
 *                                       (custom properties, data attrs, inline styles, etc.)
 *                              regex  - --pattern is compiled as a JS RegExp (no flags beyond i)
 *   -r, --root <path>        Repo root. Single-locale mode: defaults to walking up from
 *                              --start-dir looking for a dir containing --dir. Multi-locale
 *                              mode: defaults to walking up looking for a dir containing ".git".
 *   -s, --start-dir <path>   Where to start the root search. Defaults to process.cwd().
 *   -d, --dir <path>         Single-locale mode only. Content dir relative to root.
 *                              Default: "content/express". Ignored if --locale/--all-locales given.
 *   -i, --ignore-case        Case-insensitive matching.
 *      --locale <key>        Scan this locale (repeatable, e.g. --locale=de --locale=fr).
 *                              Locale keys/checkout paths come from locales.json (see
 *                              lib/locales.mjs). Switches to multi-locale mode. Fails if the
 *                              locale's content isn't cloned locally yet (run
 *                              sync-locale-content.mjs first).
 *      --all-locales         Scan every locale in the registry that has a local checkout;
 *                              locales without one are reported in `localesSkipped`, not an
 *                              error (unlike an explicit, missing --locale).
 *      --locales-config <p>  Override path to locales.json. Default: ./locales.json (next to
 *                              this script).
 *
 * Output (JSON on stdout):
 *   Single-locale mode (default, no --locale/--all-locales — unchanged from before locale
 *   support was added):
 *     {
 *       pattern, matchType, root, contentDir,
 *       filesScanned, matchingFiles, totalMatches,
 *       pages: [{ file, path, matches, context: [...], locale }, ...]  // sorted by path
 *     }
 *   Multi-locale mode:
 *     {
 *       pattern, matchType, root,
 *       locales: [<key>, ...],                          // locales actually scanned
 *       localesSkipped: [{ locale, reason, scanDir }],   // --all-locales only
 *       filesScanned, matchingFiles, totalMatches,       // aggregate across all scanned locales
 *       byLocale: { <key>: { filesScanned, matchingFiles, totalMatches } },
 *       pages: [{ file, path, matches, context: [...], locale }, ...]  // sorted by locale, then path
 *     }
 *
 * On error, prints { "error": "..." } to stdout and exits 1.
 */

import {
  readdir, readFile, stat,
} from 'node:fs/promises';
import {
  join, relative, dirname, sep,
} from 'node:path';
import { parseArgs } from 'node:util';
import { toPagePath as toPagePathPure } from './lib/page-path.mjs';
import { loadLocales, resolveLocaleContentDir, rootPathFor } from './lib/locales.mjs';

function fail(message) {
  process.stdout.write(`${JSON.stringify({ error: message })}\n`);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      pattern: { type: 'string', short: 'p' },
      type: { type: 'string', short: 't', default: 'block' },
      root: { type: 'string', short: 'r' },
      'start-dir': { type: 'string', short: 's' },
      dir: { type: 'string', short: 'd', default: 'content/express' },
      'ignore-case': { type: 'boolean', short: 'i', default: false },
      locale: { type: 'string', multiple: true },
      'all-locales': { type: 'boolean', default: false },
      'locales-config': { type: 'string' },
    },
  }));
} catch (err) {
  fail(`Argument parse error: ${err.message}`);
}

const {
  pattern, type, dir: contentDir, 'ignore-case': ignoreCase, 'all-locales': allLocales,
} = values;
const requestedLocales = values.locale || [];
const multiLocale = allLocales || requestedLocales.length > 0;

if (!pattern) fail('Missing required --pattern <name>');
if (!['block', 'css', 'regex'].includes(type)) {
  fail(`Invalid --type "${type}" (expected block, css, or regex)`);
}

async function isDir(candidate) {
  try {
    return (await stat(candidate)).isDirectory();
  } catch {
    return false;
  }
}

async function walkUpFor(startDir, hasMarker) {
  let dir = startDir;
  for (let i = 0; i < 10; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await hasMarker(dir)) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

const startDir = values['start-dir'] || process.cwd();

async function collectHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(full);
    if (entry.isFile() && entry.name.endsWith('.html')) return [full];
    return [];
  }));
  return files.flat();
}

function buildMatcher() {
  if (type === 'regex') {
    const flags = ignoreCase ? 'gi' : 'g';
    let re;
    try {
      re = new RegExp(pattern, flags);
    } catch (err) {
      fail(`Invalid regex pattern: ${err.message}`);
    }
    return (content) => {
      const found = content.match(re) || [];
      return { count: found.length, context: [...new Set(found)].slice(0, 5) };
    };
  }

  if (type === 'css') {
    const needle = ignoreCase ? pattern.toLowerCase() : pattern;
    return (content) => {
      const haystack = ignoreCase ? content.toLowerCase() : content;
      let count = 0;
      let idx = haystack.indexOf(needle);
      while (idx !== -1) {
        count += 1;
        idx = haystack.indexOf(needle, idx + needle.length);
      }
      return { count, context: [] };
    };
  }

  // block mode: exact class-token match inside class="..." attributes
  const classAttrRe = /class="([^"]*)"/g;
  const target = ignoreCase ? pattern.toLowerCase() : pattern;
  return (content) => {
    let count = 0;
    const context = new Set();
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = classAttrRe.exec(content)) !== null) {
      const tokens = m[1].split(/\s+/).filter(Boolean);
      const tokenMatch = tokens.some((tok) => (ignoreCase ? tok.toLowerCase() : tok) === target);
      if (tokenMatch) {
        count += 1;
        context.add(m[1]);
      }
    }
    return { count, context: [...context].slice(0, 5) };
  };
}

const matcher = buildMatcher();

// Scans one locale's checkout: `scanDir` is the directory actually walked for
// .html files; `pathRoot` is the directory page paths/file paths are made
// relative to (the checkout root, one or more levels above scanDir — e.g.
// pathRoot=".../content", scanDir=".../content/express").
async function scanOne(scanDir, pathRoot) {
  if (!(await isDir(scanDir))) return null;
  const files = await collectHtmlFiles(scanDir);
  const pages = [];
  let totalMatches = 0;
  await Promise.all(files.map(async (file) => {
    const content = await readFile(file, 'utf8');
    const { count, context } = matcher(content);
    if (count > 0) {
      totalMatches += count;
      const relPath = relative(pathRoot, file).split(sep).join('/');
      pages.push({
        file: relPath, path: toPagePathPure(relPath), matches: count, context,
      });
    }
  }));
  return { files, pages, totalMatches };
}

if (multiLocale) {
  const root = values.root || (await walkUpFor(startDir, (dir) => isDir(join(dir, '.git'))));
  if (!root) fail(`Could not locate the repo root (looked for ".git") starting from ${startDir}. Pass --root explicitly.`);

  let registry;
  try {
    registry = await loadLocales(values['locales-config']);
  } catch (err) {
    fail(`Could not load locale registry: ${err.message}`);
  }

  let targets = registry;
  if (requestedLocales.length > 0) {
    targets = requestedLocales.map((key) => {
      const found = registry.find((l) => l.key === key);
      if (!found) fail(`Unknown locale "${key}" — not found in the locale registry.`);
      return found;
    });
  }

  const localesSkipped = [];
  const byLocale = {};
  const pages = [];
  let filesScanned = 0;
  let totalMatches = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const locale of targets) {
    const localeContentDir = resolveLocaleContentDir(root, locale);
    const scanDir = join(localeContentDir, ...rootPathFor(locale).split('/').filter(Boolean));
    // eslint-disable-next-line no-await-in-loop
    const result = await scanOne(scanDir, localeContentDir);
    if (!result) {
      if (requestedLocales.length > 0) {
        fail(`Locale "${locale.key}" was explicitly requested but its content isn't cloned locally (expected ${scanDir}). Run sync-locale-content.mjs --locale=${locale.key} first.`);
      }
      localesSkipped.push({ locale: locale.key, reason: 'not cloned locally', scanDir });
      continue;
    }
    const tagged = result.pages.map((p) => ({ ...p, locale: locale.key }));
    pages.push(...tagged);
    filesScanned += result.files.length;
    totalMatches += result.totalMatches;
    byLocale[locale.key] = {
      filesScanned: result.files.length,
      matchingFiles: result.pages.length,
      totalMatches: result.totalMatches,
    };
  }

  pages.sort((a, b) => (a.locale === b.locale
    ? a.path.localeCompare(b.path)
    : a.locale.localeCompare(b.locale)));

  process.stdout.write(`${JSON.stringify({
    pattern,
    matchType: type,
    root,
    locales: Object.keys(byLocale),
    localesSkipped,
    filesScanned,
    matchingFiles: pages.length,
    totalMatches,
    byLocale,
    pages,
  }, null, 2)}\n`);
} else {
  const root = values.root || (await walkUpFor(startDir, (dir) => isDir(join(dir, contentDir))));
  if (!root) fail(`Could not locate a directory containing "${contentDir}" starting from ${startDir}. Pass --root explicitly.`);

  const scanDir = join(root, contentDir);
  const result = await scanOne(scanDir, root);
  if (!result) fail(`Content dir does not exist: ${scanDir}`);

  const implicitLocale = contentDir === 'content/express' ? 'en' : null;
  const pages = result.pages
    .map((p) => ({ ...p, locale: implicitLocale }))
    .sort((a, b) => a.path.localeCompare(b.path));

  process.stdout.write(`${JSON.stringify({
    pattern,
    matchType: type,
    root,
    contentDir,
    filesScanned: result.files.length,
    matchingFiles: pages.length,
    totalMatches: result.totalMatches,
    pages,
  }, null, 2)}\n`);
}
