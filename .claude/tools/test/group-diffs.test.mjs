import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupBySimilarity } from '../lib/group-diffs.mjs';

function page(path, pct) {
  return { path, pct };
}

test('empty input produces no groups', () => {
  assert.deepEqual(groupBySimilarity([], (p) => p.pct), []);
});

test('a single item is its own group', () => {
  const groups = groupBySimilarity([page('/a', 1.5)], (p) => p.pct);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].items.length, 1);
});

test('values within tolerance of the group max collapse into one group', () => {
  const items = [page('/a', 0.72), page('/b', 0.72), page('/c', 0.70), page('/d', 0.71)];
  const groups = groupBySimilarity(items, (p) => p.pct, 0.05);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].items.length, 4);
  assert.equal(groups[0].maxValue, 0.72);
  assert.equal(groups[0].minValue, 0.70);
});

test('values outside tolerance split into separate groups', () => {
  const items = [page('/a', 10), page('/b', 5), page('/c', 0.5)];
  const groups = groupBySimilarity(items, (p) => p.pct, 0.05);
  assert.equal(groups.length, 3);
});

test('drift is measured from each group\'s max, not its immediate neighbor', () => {
  // 1.00, 0.96, 0.92, 0.88 with tolerance 0.05: each neighbor gap is only
  // 0.04, which would chain everything into one group under a "distance
  // from previous" rule. Measuring from the group's max instead: 0.96 joins
  // group 1 (1.00 - 0.96 = 0.04 <= 0.05), but 0.92 does not (1.00 - 0.92 =
  // 0.08 > 0.05) and starts group 2, which 0.88 then joins (0.92 - 0.88 =
  // 0.04 <= 0.05). So this must produce exactly two groups, not one.
  const items = [page('/a', 1.00), page('/b', 0.96), page('/c', 0.92), page('/d', 0.88)];
  const groups = groupBySimilarity(items, (p) => p.pct, 0.05);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].items.map((p) => p.path), ['/a', '/b']);
  assert.deepEqual(groups[1].items.map((p) => p.path), ['/c', '/d']);
  assert.equal(groups[0].maxValue, 1.00);
});

test('original items are preserved, not just their values', () => {
  const groups = groupBySimilarity([page('/a', 1), page('/b', 1)], (p) => p.pct, 0.05);
  assert.deepEqual(groups[0].items.map((p) => p.path).sort(), ['/a', '/b']);
});
