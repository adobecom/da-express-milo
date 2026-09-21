import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../lib/slugify.mjs';

test('lowercases and hyphenates', () => {
  assert.equal(slugify('Grid Marquee'), 'grid-marquee');
});

test('collapses runs of non-alphanumeric characters into one hyphen', () => {
  assert.equal(slugify('a___b---c   d'), 'a-b-c-d');
});

test('strips leading and trailing hyphens', () => {
  assert.equal(slugify('--grid-marquee--'), 'grid-marquee');
});

test('handles ticket-style branch names', () => {
  assert.equal(slugify('MWPW-204684/Add-Ara'), 'mwpw-204684-add-ara');
});

test('empty/all-punctuation input slugifies to an empty string', () => {
  assert.equal(slugify('!!!'), '');
  assert.equal(slugify(''), '');
});

test('already-clean input is unchanged', () => {
  assert.equal(slugify('grid-marquee'), 'grid-marquee');
});
