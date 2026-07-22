import { normalizeTheme, buildPaletteEditUrl } from '../color-shared/utils/utilities.js';

const COLOR_THEME_PATTERN = /color-theme-(\d+)\/?$/;
const API_BASE = 'https://themesb3.adobe.io/api/v2/themes';
const API_KEY = 'KulerBackendClientId';
const COLOR_WHEEL_PATH = '/create/color-wheel';

/**
 * Extract the numeric Kuler theme ID from a URL path.
 * e.g. "/Green-Shades-color-theme-628525/" → "628525"
 * Returns null if the path does not match the legacy deeplink pattern.
 */
export function extractThemeId(pathname) {
  const match = pathname.match(COLOR_THEME_PATTERN);
  return match ? match[1] : null;
}

/**
 * Build the redirect URL for a given Kuler API theme response.
 * Exported for testability — all pure logic, no side effects.
 *
 * @param {Object} raw - Raw Kuler API theme response
 * @param {string} localePrefix - e.g. '/de' or ''
 * @returns {string|null} redirect URL or null if theme has no colors
 */
export function buildRedirectUrl(raw, localePrefix = '') {
  const theme = normalizeTheme(raw);
  if (!theme.colors.length) return null;
  return buildPaletteEditUrl(
    `${localePrefix}${COLOR_WHEEL_PATH}`,
    theme.colors,
    theme.name,
  );
}

/**
 * Resolve a legacy color.adobe.com deeplink and redirect to the color-wheel.
 *
 * Called from loadPage() in scripts.js when the URL path matches
 * the *-color-theme-{id} pattern. Hides the page body immediately
 * to prevent a flash of 404 content, fetches the theme from the
 * Kuler API, and redirects to /create/color-wheel with the palette
 * encoded as query params.
 *
 * @param {Object} config - Milo config from setConfig()
 * @returns {boolean} true if a redirect was initiated
 */
export default async function colorThemeRedirect(config) {
  const themeId = extractThemeId(window.location.pathname);
  if (!themeId) return false;

  document.body.style.display = 'none';

  try {
    const resp = await fetch(`${API_BASE}/${themeId}?metadata=all`, {
      headers: { 'x-api-key': API_KEY, Accept: 'application/json' },
    });
    if (!resp.ok) {
      document.body.style.display = '';
      return false;
    }

    const raw = await resp.json();
    const localePrefix = config?.locale?.prefix || '';
    const redirectUrl = buildRedirectUrl(raw, localePrefix);

    if (!redirectUrl) {
      document.body.style.display = '';
      return false;
    }

    window.location.replace(redirectUrl);
    return true;
  } catch {
    document.body.style.display = '';
    return false;
  }
}
