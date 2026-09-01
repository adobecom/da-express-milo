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
 *   -r, --root <path>        Repo root. Defaults to walking up from --start-dir (or cwd)
 *                              looking for a directory that contains --dir.
 *   -s, --start-dir <path>   Where to start the root search. Defaults to process.cwd().
 *   -d, --dir <path>         Content dir relative to root. Default: "content/express".
 *   -i, --ignore-case        Case-insensitive matching.
 *
 * Output (JSON on stdout):
 *   {
 *     pattern, matchType, root, contentDir,
 *     filesScanned, matchingFiles, totalMatches,
 *     pages: [{ file, path, matches, context: [...] }, ...]  // sorted by path
 *   }
 *
 * On error, prints { "error": "..." } to stdout and exits 1.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, dirname, sep } from 'node:path';
import { parseArgs } from 'node:util';

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
    },
  }));
} catch (err) {
  fail(`Argument parse error: ${err.message}`);
}

const { pattern, type, dir: contentDir, 'ignore-case': ignoreCase } = values;

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

async function findRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i += 1) {
    if (await isDir(join(dir, contentDir))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

const startDir = values['start-dir'] || process.cwd();
const root = values.root || (await findRoot(startDir));

if (!root) {
  fail(`Could not locate a directory containing "${contentDir}" starting from ${startDir}. Pass --root explicitly.`);
}

const scanDir = join(root, contentDir);
if (!(await isDir(scanDir))) {
  fail(`Content dir does not exist: ${scanDir}`);
}

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

function toPagePath(file) {
  const rel = relative(root, file).split(sep).join('/');
  let p = rel.replace(/^content\//, '');
  p = p.replace(/\.html$/, '');
  p = p.replace(/(^|\/)index$/, '');
  return `/${p}`.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
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
const files = await collectHtmlFiles(scanDir);

const pages = [];
let totalMatches = 0;

await Promise.all(files.map(async (file) => {
  const content = await readFile(file, 'utf8');
  const { count, context } = matcher(content);
  if (count > 0) {
    totalMatches += count;
    pages.push({
      file: relative(root, file).split(sep).join('/'),
      path: toPagePath(file),
      matches: count,
      context,
    });
  }
}));

pages.sort((a, b) => a.path.localeCompare(b.path));

process.stdout.write(`${JSON.stringify({
  pattern,
  matchType: type,
  root,
  contentDir,
  filesScanned: files.length,
  matchingFiles: pages.length,
  totalMatches,
  pages,
}, null, 2)}\n`);
