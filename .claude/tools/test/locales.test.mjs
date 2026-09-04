import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  rootPathFor, resolveLocaleContentDir, scanDirFor, loadLocales, findLocale,
} from '../lib/locales.mjs';

test('rootPathFor: the default (en) locale has no url prefix', () => {
  assert.equal(rootPathFor({ urlPrefix: '' }), '/express');
});

test('rootPathFor: a prefixed locale nests express under its prefix', () => {
  assert.equal(rootPathFor({ urlPrefix: '/de' }), '/de/express');
});

test('resolveLocaleContentDir: en reuses the in-repo content/ checkout', () => {
  assert.equal(
    resolveLocaleContentDir('/repo', { key: 'en' }),
    join('/repo', 'content'),
  );
});

test('resolveLocaleContentDir: other locales clone outside the repo, under the home dir', () => {
  const dir = resolveLocaleContentDir('/repo', { key: 'de' });
  assert.equal(dir, join(homedir(), '.aem-content-cache', 'da-express-milo', 'de'));
});

test('scanDirFor: en scans content/express', () => {
  assert.equal(
    scanDirFor('/repo', { key: 'en', urlPrefix: '' }),
    join('/repo', 'content', 'express'),
  );
});

test('scanDirFor: a prefixed locale scans <checkout>/<prefix>/express', () => {
  const dir = scanDirFor('/repo', { key: 'de', urlPrefix: '/de' });
  assert.equal(dir, join(homedir(), '.aem-content-cache', 'da-express-milo', 'de', 'de', 'express'));
});

test('loadLocales: the shipped registry includes en and at least one RTL locale', async () => {
  const locales = await loadLocales();
  const en = findLocale(locales, 'en');
  assert.ok(en, 'expected an "en" locale entry');
  assert.equal(en.urlPrefix, '');

  const rtl = locales.filter((l) => l.dir === 'rtl');
  assert.ok(rtl.length >= 1, 'expected at least one RTL locale (e.g. ara)');
});

test('findLocale: returns undefined for an unknown key', async () => {
  const locales = await loadLocales();
  assert.equal(findLocale(locales, 'not-a-real-locale'), undefined);
});

test('loadLocales: rejects a missing config file', async () => {
  await assert.rejects(() => loadLocales('/does/not/exist/locales.json'));
});
