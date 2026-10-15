/**
 * Pixel-diff two PNG files, padding (never stretching) onto a shared canvas
 * first — see canvas-size.mjs for why. Extracted out of compare-branches.mjs
 * so it's importable/testable without going through the CLI's arg parsing.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { Jimp } from 'jimp';
import { computeCanvasSize } from '../lib/canvas-size.mjs';

export async function diffImages(pathA, pathB, outPath, threshold = 0.1) {
  const [bufA, bufB] = await Promise.all([readFile(pathA), readFile(pathB)]);
  const [imgA, imgB] = await Promise.all([Jimp.read(bufA), Jimp.read(bufB)]);

  const { width, height, heightDelta } = computeCanvasSize(imgA.bitmap, imgB.bitmap);

  const canvasA = new Jimp({ width, height, color: 0xffffffff });
  const canvasB = new Jimp({ width, height, color: 0xffffffff });
  canvasA.composite(imgA, 0, 0);
  canvasB.composite(imgB, 0, 0);

  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(
    canvasA.bitmap.data,
    canvasB.bitmap.data,
    diff.data,
    width,
    height,
    { threshold, includeAA: false },
  );
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, PNG.sync.write(diff));
  return {
    mismatchPct: (100 * mismatched) / (width * height), width, height, heightDelta,
  };
}

export function bucket(pct) {
  if (pct < 0.5) return 'identical';
  if (pct <= 3) return 'minor';
  return 'major';
}
