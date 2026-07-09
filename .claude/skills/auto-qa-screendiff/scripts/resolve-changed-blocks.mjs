#!/usr/bin/env node
/**
 * C2 — Changed-blocks resolver.
 *
 * Determines which Express blocks are affected by the current branch's diff:
 *   - Direct:   files under express/code/blocks/<name>/            → block <name>
 *   - Indirect: shared JS modules (scripts/**, etc.) are traced through a
 *               reverse import graph to find every block that (transitively)
 *               imports a changed module.
 *   - Global:   if a change fans out past a threshold, or touches a known
 *               global entry point, the whole critical set should be checked.
 *
 * Output: JSON on stdout.
 *
 * Usage:
 *   node resolve-changed-blocks.mjs [--base stage] [--repo-root <path>]
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const repoRoot = path.resolve(arg('--repo-root', process.cwd()));
const base = arg('--base', 'stage');
const CODE_ROOT = 'express/code';
const BLOCKS_DIR = `${CODE_ROOT}/blocks`;

// A change to one of these means "assume everything is affected".
const KNOWN_GLOBAL = [
  `${CODE_ROOT}/scripts/scripts.js`,
  `${CODE_ROOT}/scripts/utils.js`,
];
// If a shared change fans out to more blocks than this, treat it as global.
const GLOBAL_BLOCK_THRESHOLD = 40;

function sh(cmd) {
  return execSync(cmd, { cwd: repoRoot, encoding: 'utf8' });
}

// 1. Changed files on this branch vs. base (committed changes).
let changedFiles = [];
try {
  const out = sh(`git diff --name-only ${base}...HEAD`).trim();
  changedFiles = out ? out.split('\n') : [];
} catch (e) {
  process.stderr.write(`git diff failed against base '${base}': ${e.message}\n`);
  process.exit(1);
}

const blockOf = (file) => {
  const m = file.match(new RegExp(`^${BLOCKS_DIR}/([^/]+)/`));
  return m ? m[1] : null;
};

const directBlocks = new Set();
const changedJsAbs = new Set(); // seeds for the reverse-import BFS
let hitKnownGlobal = false;

for (const f of changedFiles) {
  if (KNOWN_GLOBAL.includes(f)) hitKnownGlobal = true;
  const b = blockOf(f);
  if (b) directBlocks.add(b);
  if (f.startsWith(`${CODE_ROOT}/`) && f.endsWith('.js')) {
    changedJsAbs.add(path.resolve(repoRoot, f));
  }
}

// 2. Build a reverse import graph over all tracked JS under express/code.
const allJsRel = sh(`git ls-files ${CODE_ROOT}`)
  .trim()
  .split('\n')
  .filter((f) => f.endsWith('.js'));
const allJsAbs = new Set(allJsRel.map((f) => path.resolve(repoRoot, f)));

const SPEC_RES = [
  /\bfrom\s*['"]([^'"]+)['"]/g, // import/export ... from '...'
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // dynamic import('...')
  /\bimport\s+['"]([^'"]+)['"]/g, // side-effect import '...'
];

function resolveSpec(fromAbs, spec) {
  if (!spec.startsWith('.')) return null; // bare/lib/template imports → external
  const baseTarget = path.resolve(path.dirname(fromAbs), spec);
  const candidates = spec.endsWith('.js')
    ? [baseTarget]
    : [`${baseTarget}.js`, path.join(baseTarget, 'index.js')];
  return candidates.find((c) => allJsAbs.has(c)) || null;
}

// importedAbs -> Set(importerAbs)
const reverse = new Map();
for (const importerAbs of allJsAbs) {
  let src = '';
  try { src = readFileSync(importerAbs, 'utf8'); } catch { continue; }
  const specs = new Set();
  for (const re of SPEC_RES) {
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(src)) !== null) specs.add(m[1]);
  }
  for (const spec of specs) {
    const target = resolveSpec(importerAbs, spec);
    if (!target) continue;
    if (!reverse.has(target)) reverse.set(target, new Set());
    reverse.get(target).add(importerAbs);
  }
}

// 3. BFS from every changed JS file over reverse edges → all dependent files.
const reached = new Set();
const queue = [...changedJsAbs].filter((f) => allJsAbs.has(f));
for (const f of queue) reached.add(f);
while (queue.length) {
  const cur = queue.shift();
  const importers = reverse.get(cur);
  if (!importers) continue;
  for (const imp of importers) {
    if (!reached.has(imp)) {
      reached.add(imp);
      queue.push(imp);
    }
  }
}

const dependentBlocks = new Set();
for (const absFile of reached) {
  const rel = path.relative(repoRoot, absFile);
  const b = blockOf(rel);
  if (b) dependentBlocks.add(b);
}

// 4. Assemble affected set + global decision.
const affectedBlocks = new Set([...directBlocks, ...dependentBlocks]);
let globalChange = false;
let whyGlobal = null;
if (hitKnownGlobal) {
  globalChange = true;
  whyGlobal = 'A known global entry point changed (scripts.js / utils.js).';
} else if (affectedBlocks.size > GLOBAL_BLOCK_THRESHOLD) {
  globalChange = true;
  whyGlobal = `Change fans out to ${affectedBlocks.size} blocks (> ${GLOBAL_BLOCK_THRESHOLD}).`;
}

const sorted = (s) => [...s].sort();
process.stdout.write(`${JSON.stringify({
  base,
  branch: sh('git rev-parse --abbrev-ref HEAD').trim(),
  changedFileCount: changedFiles.length,
  changedFiles,
  directBlocks: sorted(directBlocks),
  dependentBlocks: sorted(dependentBlocks),
  affectedBlocks: sorted(affectedBlocks),
  globalChange,
  whyGlobal,
}, null, 2)}\n`);
