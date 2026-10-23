#!/usr/bin/env node

// Keeps BLOCK-STATUS.md up to date: every block listed there must still exist in
// express/code/blocks/. Fails when a block's code was removed but its row wasn't.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const markdown = fs.readFileSync(path.join(rootDir, 'BLOCK-STATUS.md'), 'utf8');

const listed = new Set(markdown.split('\n')
  .map((line) => line.match(/^\|\s*`([a-z0-9-]+)`/)?.[1])
  .filter(Boolean));

const missing = [...listed]
  .filter((name) => !fs.existsSync(path.join(rootDir, 'express/code/blocks', name)));

missing.forEach((name) => {
  process.stderr.write(`"${name}" is listed in BLOCK-STATUS.md but express/code/blocks/${name} doesn't exist. `
    + 'If the block was removed, delete its row from BLOCK-STATUS.md.\n');
});

if (missing.length) process.exitCode = 1;
else process.stdout.write(`BLOCK-STATUS.md is up to date (${listed.size} blocks checked).\n`);
