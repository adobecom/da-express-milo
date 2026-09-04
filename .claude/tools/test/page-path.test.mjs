import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPagePath } from '../lib/page-path.mjs';

test('a plain page maps to its path, .html stripped', () => {
  assert.equal(toPagePath('content/express/pricing.html'), '/express/pricing');
});

test('a top-level index.html maps to the directory root', () => {
  assert.equal(toPagePath('content/express/index.html'), '/express');
});

test('a nested index.html maps to its parent directory', () => {
  assert.equal(toPagePath('content/express/discover/index.html'), '/express/discover');
});

test('deeply nested fragment paths are preserved', () => {
  assert.equal(
    toPagePath('content/express/fragments/pricing-table/individuals-ff-bundle.html'),
    '/express/fragments/pricing-table/individuals-ff-bundle',
  );
});

test('collapses accidental double slashes', () => {
  assert.equal(toPagePath('content/express//pricing.html'), '/express/pricing');
});

test('a bare content/index.html maps to the site root', () => {
  assert.equal(toPagePath('content/index.html'), '/');
});
