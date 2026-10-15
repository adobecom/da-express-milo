import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeCanvasSize } from '../lib/canvas-size.mjs';

test('same-size images produce a zero height delta', () => {
  const result = computeCanvasSize({ width: 1440, height: 900 }, { width: 1440, height: 900 });
  assert.deepEqual(result, { width: 1440, height: 900, heightDelta: 0 });
});

test('takes the max width and max height of the two inputs', () => {
  const result = computeCanvasSize({ width: 1440, height: 8173 }, { width: 1440, height: 7885 });
  assert.equal(result.width, 1440);
  assert.equal(result.height, 8173);
});

test('height delta is the absolute difference, order-independent', () => {
  const a = computeCanvasSize({ width: 1440, height: 8173 }, { width: 1440, height: 7885 });
  const b = computeCanvasSize({ width: 1440, height: 7885 }, { width: 1440, height: 8173 });
  assert.equal(a.heightDelta, 288);
  assert.equal(b.heightDelta, 288);
});

test('differing widths are handled the same way as heights', () => {
  const result = computeCanvasSize({ width: 1200, height: 900 }, { width: 1440, height: 900 });
  assert.equal(result.width, 1440);
  assert.equal(result.heightDelta, 0);
});
