import { createColorPaletteParamApi } from './utilities.js';

const KEY = '__susiColorRedirect';
const COLOR_WHEEL_PATH = '/create/color-wheel';

export function setSusiColorRedirect(url) {
  window[KEY] = url;
}

export function consumeSusiColorRedirect() {
  const url = window[KEY];
  delete window[KEY];
  return url || null;
}

/**
 * Extracts the locale prefix from the current URL pathname.
 * URL structure is locale-first: /cn/create/color-wheel, /jp/create/color-wheel, etc.
 * English (default) has no prefix: /create/color-wheel.
 *
 * Matches a leading path segment that looks like a locale code (2-3 letter lang,
 * optional region: /cn, /jp, /br, /uk, /de, /kr, /es, /fr, /it, etc.).
 * Returns the prefix with leading slash (e.g. '/cn') or empty string for default locale.
 */
function getLocalePrefix() {
  const match = window.location.pathname.match(/^\/([a-z]{2,3}(?:_[A-Z]{2})?)\//);
  return match ? `/${match[1]}` : '';
}

function pageHasBlock(...classNames) {
  return classNames.some((cls) => document.querySelector(`.${cls}`));
}

export function buildColorSignInRedirectUrl(colors, name, id = null) {
  const { setOnUrl } = createColorPaletteParamApi();

  if (pageHasBlock('color-explore')) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('id', id);
    return url.toString();
  }

  const url = new URL(window.location.href);
  setOnUrl(url, colors, { name });
  return url.toString();
}
