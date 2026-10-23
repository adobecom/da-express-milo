#!/usr/bin/env node
// Block-structure gate for the pinata-code `command` template.
//
// Every CHANGED block under express/code/blocks/<name>/ must contain both
// <name>.js and <name>.css. A block shipped with only one of the pair renders
// broken in production even when lint and unit tests pass. Every block on
// `stage` satisfies this today, so the check only ever fails on the change.
//
// Usage (the harness substitutes the changed-file list for {changed_files}):
//   node .pinata/scripts/check-block-structure.mjs <path> <path> ...
// With no changed block files, it passes (nothing to check). A block whose
// whole directory was removed by the change is skipped: deleting a block is
// not a half-shipped block.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const BLOCKS_DIR = 'express/code/blocks';
const BLOCK_RE = /^express\/code\/blocks\/([^/]+)\//;

const changed = process.argv.slice(2).filter(Boolean);
const blocks = [...new Set(
  changed
    .map((f) => BLOCK_RE.exec(f.replaceAll('\\', '/').replace(/^\.\//, '')))
    .filter(Boolean)
    .map((m) => m[1]),
)].filter((name) => existsSync(join(BLOCKS_DIR, name)));

if (blocks.length === 0) {
  console.log('No changed blocks; block-structure check passed.');
  process.exit(0);
}

const missing = [];
for (const name of blocks) {
  for (const ext of ['js', 'css']) {
    const file = join(BLOCKS_DIR, name, `${name}.${ext}`);
    if (!existsSync(file)) missing.push(file);
  }
}

if (missing.length > 0) {
  console.error('Block-structure check failed — missing required files:');
  for (const file of missing) console.error(`  - ${file}`);
  process.exit(1);
}

console.log(`Block-structure check passed (${blocks.length} block(s) checked).`);
