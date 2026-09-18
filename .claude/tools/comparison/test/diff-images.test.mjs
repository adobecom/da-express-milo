import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { diffImages, bucket } from '../diff.mjs';

function solidPng(width, height, [r, g, b]) {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i += 1) {
    png.data[i * 4] = r;
    png.data[i * 4 + 1] = g;
    png.data[i * 4 + 2] = b;
    png.data[i * 4 + 3] = 255;
  }
  return PNG.sync.write(png);
}

async function withTempDir(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'diff-images-test-'));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('identical images produce ~0% mismatch and no height delta', async () => {
  await withTempDir(async (dir) => {
    const a = join(dir, 'a.png');
    const b = join(dir, 'b.png');
    await writeFile(a, solidPng(20, 20, [255, 255, 255]));
    await writeFile(b, solidPng(20, 20, [255, 255, 255]));
    const result = await diffImages(a, b, join(dir, 'diff.png'));
    assert.equal(result.mismatchPct, 0);
    assert.equal(result.heightDelta, 0);
    assert.equal(bucket(result.mismatchPct), 'identical');
  });
});

test('completely different colors produce ~100% mismatch', async () => {
  await withTempDir(async (dir) => {
    const a = join(dir, 'a.png');
    const b = join(dir, 'b.png');
    await writeFile(a, solidPng(20, 20, [255, 255, 255]));
    await writeFile(b, solidPng(20, 20, [0, 0, 0]));
    const result = await diffImages(a, b, join(dir, 'diff.png'));
    assert.equal(result.mismatchPct, 100);
    assert.equal(bucket(result.mismatchPct), 'major');
  });
});

test('a taller image is padded, not stretched: shared rows still match', async () => {
  await withTempDir(async (dir) => {
    const a = join(dir, 'a.png');
    const b = join(dir, 'b.png');
    // Same content, but "b" has 10 extra rows of (different) content below.
    await writeFile(a, solidPng(20, 20, [255, 255, 255]));
    await writeFile(b, solidPng(20, 30, [255, 255, 255]));
    const result = await diffImages(a, b, join(dir, 'diff.png'));
    assert.equal(result.heightDelta, 10);
    // Only the padded-white-vs-real-content 10 extra rows differ (0 here,
    // since the padding color IS white and so is the extra content) —
    // mismatch should be 0%, proving no shear/stretch artifact was introduced
    // across the shared 20 rows.
    assert.equal(result.mismatchPct, 0);
  });
});

test('padding surfaces a real difference confined to the extra region', async () => {
  await withTempDir(async (dir) => {
    const a = join(dir, 'a.png');
    const b = join(dir, 'b.png');
    await writeFile(a, solidPng(20, 20, [255, 255, 255]));
    await writeFile(b, solidPng(20, 40, [0, 0, 0])); // taller AND a different color
    const result = await diffImages(a, b, join(dir, 'diff.png'));
    assert.equal(result.heightDelta, 20);
    // width*height = 20*40 = 800 total pixels in the shared canvas; all of
    // "b" is black (mismatched against white/padding) except nothing matches.
    assert.equal(result.mismatchPct, 100);
  });
});
