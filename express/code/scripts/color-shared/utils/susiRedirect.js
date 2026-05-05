import { createColorPaletteParamApi } from './utilities.js';

const KEY = '__susiColorRedirect';

export function setSusiColorRedirect(url) {
  window[KEY] = url;
}

export function consumeSusiColorRedirect() {
  const url = window[KEY];
  delete window[KEY];
  return url || null;
}

function pageHasBlock(...classNames) {
  return classNames.some((cls) => document.querySelector(`.${cls}`));
}

export function buildColorSignInRedirectUrl(colors, name, id = null, openInExpress = false) {
  const { setOnUrl } = createColorPaletteParamApi();
  const url = new URL(window.location.href);

  if (pageHasBlock('color-explore')) {
    if (id) url.searchParams.set('id', id);
  } else {
    setOnUrl(url, colors, { name });
  }

  if (openInExpress) url.searchParams.set('openInExpress', 'true');
  return url.toString();
}
