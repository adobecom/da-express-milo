import { createColorPaletteParamApi } from './utilities.js';

const KEY = '__susiColorRedirect';

export function setSusiColorRedirect(url) {
  try {
    sessionStorage.setItem(KEY, url);
  } catch {
    window[KEY] = url;
  }
}

export function consumeSusiColorRedirect() {
  let url;
  try {
    url = sessionStorage.getItem(KEY);
    if (url) sessionStorage.removeItem(KEY);
  } catch {
    url = window[KEY];
    delete window[KEY];
  }
  return url || null;
}

function pageHasBlock(...classNames) {
  return classNames.some((cls) => document.querySelector(`.${cls}`));
}

export function buildColorSignInRedirectUrl(colors, name, id = null) {
  const { setOnUrl } = createColorPaletteParamApi();

  if (pageHasBlock('color-explore')) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('id', id);
    url.searchParams.set('pendingSave', '1');
    return url.toString();
  }

  const url = new URL(window.location.href);
  setOnUrl(url, colors, { name });
  url.searchParams.set('pendingSave', '1');
  return url.toString();
}
