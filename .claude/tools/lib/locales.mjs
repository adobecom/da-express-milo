/**
 * Locale registry helpers, shared by query-content-blocks.mjs,
 * sync-locale-content.mjs, and anything else that needs to know which
 * locales exist and where each one's content tree lives on disk.
 *
 * `aem content clone` always writes into `<cwd>/content/`, and determines
 * which da.live org/repo to pull from via the ENCLOSING directory's git
 * remote (it errors with "No git remote found" otherwise) — it does not
 * take an arbitrary destination. So each locale needs its own "project
 * dir": a directory with a `.git` whose `origin` remote points at this
 * repo (no other repo state is required — a bare `git init` +
 * `git remote add origin <url>` is enough; no fetch/checkout of actual
 * repo code, and no IMS auth for this org's public content).
 *
 * `en` reuses the real repo checkout as its project dir (it already has
 * the right remote) — that's the existing, unchanged `content/` dir every
 * other tool already expects. Every other locale gets its own minimal
 * project dir OUTSIDE the repo, under
 * `~/.aem-content-cache/<repo-name>/<locale-key>/`, so N locale checkouts
 * (each with their own `.git` + `content/`) never clutter the working tree
 * or confuse repo-wide tools (find/grep/editor indexing).
 */

import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG_PATH = join(HERE, '..', 'locales.json');
const REPO_NAME = 'da-express-milo';

/**
 * Joins a locale's urlPrefix (e.g. "" or "/de") with "/express" into a
 * single rootPath (e.g. "/express" or "/de/express"), collapsing any
 * accidental double slash.
 */
export function rootPathFor(locale) {
  return `${locale.urlPrefix}/express`.replace(/\/{2,}/g, '/');
}

/**
 * The directory `aem content clone` should be run FROM for this locale
 * (needs a `.git` with the right `origin` remote — see module docstring).
 * `en` reuses the real repo checkout; every other locale gets its own
 * external project dir.
 */
export function resolveLocaleProjectDir(repoRoot, locale) {
  if (locale.key === 'en') return repoRoot;
  return join(homedir(), '.aem-content-cache', REPO_NAME, locale.key);
}

/**
 * Where this locale's cloned content actually lands: always
 * `<projectDir>/content` (a fixed folder name the `aem` CLI itself
 * chooses, not something we control).
 */
export function resolveLocaleContentDir(repoRoot, locale) {
  return join(resolveLocaleProjectDir(repoRoot, locale), 'content');
}

/**
 * The directory query-content-blocks.mjs should actually scan for this
 * locale: the content dir plus its rootPath (e.g.
 * ".../content" + "/express" -> ".../content/express").
 */
export function scanDirFor(repoRoot, locale) {
  return join(resolveLocaleContentDir(repoRoot, locale), ...rootPathFor(locale).split('/').filter(Boolean));
}

/**
 * Loads the locale registry from locales.json (or a caller-supplied path).
 * Returns the flat `locales` array; throws if the file is missing/invalid
 * so callers can surface a clear error rather than silently scanning zero
 * locales.
 */
export async function loadLocales(configPath = DEFAULT_CONFIG_PATH) {
  const raw = await readFile(configPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.locales) || parsed.locales.length === 0) {
    throw new Error(`No locales found in ${configPath}`);
  }
  return parsed.locales;
}

export function findLocale(locales, key) {
  return locales.find((l) => l.key === key);
}
