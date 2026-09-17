#!/usr/bin/env node
/**
 * clean-screendiffs.mjs
 *
 * Prunes `.qa-screendiff/` output — screenshots, diff images, and JSON logs
 * accumulate across qa-worktree/comparison runs with no automatic cleanup.
 *
 * Usage:
 *   node clean-screendiffs.mjs [options]
 *
 * Options:
 *   -r, --root <path>       Repo root. Defaults to walking up from cwd
 *                             looking for a dir containing content/express.
 *      --block <name>       Only consider this block's directory (matched as
 *                             a slug, same rule as the other tools). Without
 *                             this, every block directory under
 *                             .qa-screendiff/ is a candidate.
 *      --older-than <days>  Only remove a block directory whose most
 *                             recently modified file is older than this many
 *                             days. Without this, --all is required.
 *      --all                Remove every candidate block directory
 *                             regardless of age. Required if --older-than
 *                             is omitted, so a bare invocation can't
 *                             accidentally wipe everything.
 *      --dry-run            Report what would be removed without deleting
 *                             anything.
 *
 * Output (JSON on stdout):
 *   {
 *     root, screendiffDir, dryRun,
 *     removed: [{ block, path, bytes, ageDays }],
 *     bytesFreed
 *   }
 *
 * Safety: refuses to touch anything whose resolved path doesn't contain a
 * `.qa-screendiff` segment, and only ever removes directories one level
 * below `.qa-screendiff/` (never the directory itself, never anything
 * outside it) — a `--block` typo can't widen the blast radius.
 */

import {
  readdir, stat, rm,
} from 'node:fs/promises';
import { dirname, join, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { slugify } from './lib/slugify.mjs';

function fail(message) {
  process.stdout.write(`${JSON.stringify({ error: message })}\n`);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      root: { type: 'string', short: 'r' },
      block: { type: 'string' },
      'older-than': { type: 'string' },
      all: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
    },
  }));
} catch (err) {
  fail(`Argument parse error: ${err.message}`);
}

const {
  block, all, 'dry-run': dryRun,
} = values;
const olderThanDays = values['older-than'] ? Number(values['older-than']) : null;

if (olderThanDays === null && !all) {
  fail('Refusing to run with no scope: pass --older-than <days> and/or --all.');
}
if (olderThanDays !== null && (Number.isNaN(olderThanDays) || olderThanDays < 0)) {
  fail(`Invalid --older-than "${values['older-than']}" (expected a non-negative number of days)`);
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
    if (await isDir(join(dir, 'content', 'express')) && await isDir(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

async function dirStats(target) {
  // Returns { bytes, newestMtimeMs } over every file under `target`.
  let bytes = 0;
  let newestMtimeMs = 0;
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    await Promise.all(entries.map(async (entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      const s = await stat(full);
      bytes += s.size;
      if (s.mtimeMs > newestMtimeMs) newestMtimeMs = s.mtimeMs;
      return undefined;
    }));
  }
  await walk(target);
  return { bytes, newestMtimeMs };
}

const root = values.root || (await findRoot(process.cwd()));
if (!root) fail('Could not locate the da-express-milo repo root (looked for content/express + .git). Pass --root explicitly.');

const screendiffDir = join(root, '.qa-screendiff');
if (!screendiffDir.split(sep).includes('.qa-screendiff')) {
  fail('Refusing to run: resolved target does not contain a .qa-screendiff segment.');
}

if (!(await isDir(screendiffDir))) {
  process.stdout.write(`${JSON.stringify({
    root, screendiffDir, dryRun, removed: [], bytesFreed: 0, note: 'Nothing to clean — .qa-screendiff does not exist.',
  }, null, 2)}\n`);
  process.exit(0);
}

const wantedSlug = block ? slugify(block) : null;
const entries = await readdir(screendiffDir, { withFileTypes: true });
const candidates = entries.filter((e) => e.isDirectory() && (!wantedSlug || e.name === wantedSlug));

if (block && candidates.length === 0) {
  fail(`No .qa-screendiff directory found for block "${block}" (looked for slug "${wantedSlug}").`);
}

const now = Date.now();
const removed = [];
let bytesFreed = 0;

for (const entry of candidates) {
  const target = join(screendiffDir, entry.name);
  // eslint-disable-next-line no-await-in-loop
  const { bytes, newestMtimeMs } = await dirStats(target);
  const ageDays = newestMtimeMs ? (now - newestMtimeMs) / 86400000 : Infinity;
  const eligible = olderThanDays === null ? true : ageDays >= olderThanDays;
  if (!eligible) continue;

  removed.push({
    block: entry.name, path: target, bytes, ageDays: Number(ageDays.toFixed(1)),
  });
  bytesFreed += bytes;
  if (!dryRun) {
    // eslint-disable-next-line no-await-in-loop
    await rm(target, { recursive: true, force: true });
  }
}

process.stdout.write(`${JSON.stringify({
  root, screendiffDir, dryRun, removed, bytesFreed,
}, null, 2)}\n`);
