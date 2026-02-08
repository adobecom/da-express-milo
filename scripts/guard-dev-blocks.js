#!/usr/bin/env node
/**
 * Guard: production blocks and shared must not import from dev blocks.
 * Dev blocks live in express/code/blocks/dev-* (inside the real blocks folder).
 * We scan express/code/blocks (excluding dev-* dirs) and express/code/shared for
 * any import/require that references /dev/ or /dev- (e.g. ../dev-palettes/).
 * MWPW-187637
 */

import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const PATTERN = /(from\s+['"].*(\/dev\/|\/dev-)|require\s*\(\s*['"].*(\/dev\/|\/dev-))/;

async function* walkJsFiles(dir, opts = {}) {
  const { skipDevDirs = false } = opts;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    return;
  }
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (skipDevDirs && ent.name.startsWith('dev-')) continue;
      yield* walkJsFiles(full, opts);
    } else if (ent.isFile() && EXTENSIONS.has(ent.name.slice(ent.name.lastIndexOf('.')))) {
      yield full;
    }
  }
}

async function checkDir(root, dirName, skipDevDirs = false) {
  const dir = join(root, 'express', 'code', dirName);
  const violations = [];
  try {
    for await (const file of walkJsFiles(dir, { skipDevDirs })) {
      const content = await readFile(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (PATTERN.test(line)) {
          violations.push({ file, line: i + 1, content: line.trim() });
        }
      });
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  return violations;
}

export async function runGuard(root = process.cwd()) {
  const blocksViolations = await checkDir(root, 'blocks', true);
  const sharedViolations = await checkDir(root, 'shared');
  const all = [
    ...blocksViolations.map((v) => ({ ...v, scope: 'blocks' })),
    ...sharedViolations.map((v) => ({ ...v, scope: 'shared' })),
  ];
  return { success: all.length === 0, violations: all };
}

async function main() {
  const { success, violations } = await runGuard();
  if (violations.length) {
    console.error('🔍 Checking for illegal dev block imports (import/require lines only)...');
    violations.forEach((v) => {
      console.error(`❌ ${v.file}:${v.line} (${v.scope}) — must not import from dev/`);
      console.error(`   ${v.content}`);
    });
    console.error('\nProduction blocks and shared must not import from dev blocks (express/code/blocks/dev-*).');
    process.exit(1);
  }
  console.log('✅ No illegal imports found');
  process.exit(0);
}

const isMain = process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);
if (isMain) {
  main();
}
