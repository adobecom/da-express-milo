import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  mkdtemp, mkdir, writeFile, utimes, readdir, rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const TOOL = join(HERE, '..', 'clean-screendiffs.mjs');

async function run(args) {
  try {
    const { stdout } = await execFileAsync('node', [TOOL, ...args]);
    return JSON.parse(stdout);
  } catch (err) {
    return JSON.parse(err.stdout);
  }
}

async function makeFixture() {
  const root = await mkdtemp(join(tmpdir(), 'clean-screendiffs-test-'));
  const oldDir = join(root, '.qa-screendiff', 'old-block');
  const newDir = join(root, '.qa-screendiff', 'new-block');
  await mkdir(oldDir, { recursive: true });
  await mkdir(newDir, { recursive: true });
  await writeFile(join(oldDir, 'a.png'), 'x');
  await writeFile(join(newDir, 'b.png'), 'x');
  const tenDaysAgo = new Date(Date.now() - 10 * 86400000);
  await utimes(join(oldDir, 'a.png'), tenDaysAgo, tenDaysAgo);
  return root;
}

test('refuses to run with no --older-than and no --all', async () => {
  const root = await makeFixture();
  try {
    const result = await run([`--root=${root}`]);
    assert.match(result.error, /Refusing to run with no scope/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('--older-than only removes directories past the age cutoff', async () => {
  const root = await makeFixture();
  try {
    const result = await run([`--root=${root}`, '--older-than=5']);
    assert.deepEqual(result.removed.map((r) => r.block), ['old-block']);
    const remaining = await readdir(join(root, '.qa-screendiff'));
    assert.deepEqual(remaining, ['new-block']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('--dry-run reports removals without deleting anything', async () => {
  const root = await makeFixture();
  try {
    const result = await run([`--root=${root}`, '--all', '--dry-run']);
    assert.equal(result.removed.length, 2);
    const remaining = await readdir(join(root, '.qa-screendiff'));
    assert.equal(remaining.length, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('--block scopes to a single block and errors if it does not exist', async () => {
  const root = await makeFixture();
  try {
    const missing = await run([`--root=${root}`, '--block=nope', '--all']);
    assert.match(missing.error, /No \.qa-screendiff directory found/);

    const result = await run([`--root=${root}`, '--block=new-block', '--all']);
    assert.deepEqual(result.removed.map((r) => r.block), ['new-block']);
    const remaining = await readdir(join(root, '.qa-screendiff'));
    assert.deepEqual(remaining, ['old-block']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('running against a repo with no .qa-screendiff dir is a clean no-op', async () => {
  const root = await mkdtemp(join(tmpdir(), 'clean-screendiffs-test-empty-'));
  try {
    const result = await run([`--root=${root}`, '--all']);
    assert.deepEqual(result.removed, []);
    assert.equal(result.bytesFreed, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
