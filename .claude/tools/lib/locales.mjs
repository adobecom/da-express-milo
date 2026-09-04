/**
 * Locale registry helpers, shared by query-content-blocks.mjs,
 * sync-locale-content.mjs, and anything else that needs to know which
 * locales exist and where each one's content tree lives on disk.
 *
 * Every locale gets its own `aem content clone` checkout (the clone tool
 * bakes a single `rootPath` into `.da-config.json` per checkout, so one
 * checkout can never serve two locales). The `en` locale keeps its existing
 * in-repo, gitignored `content/` checkout; every other locale is cloned
 * OUTSIDE the repo, under `~/.aem-content-cache/<repo-name>/<locale-key>/`,
 * so N locale checkouts (each with their own nested `.git`) never clutter
 * the working tree or confuse repo-wide tools (find/grep/editor indexing).
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
 * Where this locale's `aem content clone` checkout lives. `en` reuses the
 * existing in-repo `content/` dir; every other locale clones outside the
 * repo (see module docstring).
 */
export function resolveLocaleContentDir(repoRoot, locale) {
  if (locale.key === 'en') return join(repoRoot, 'content');
  return join(homedir(), '.aem-content-cache', REPO_NAME, locale.key);
}

/**
 * The directory query-content-blocks.mjs should actually scan for this
 * locale: the checkout dir plus its rootPath (e.g.
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
