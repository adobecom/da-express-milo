const KEY = '__susiFontRedirect';

export function setFontRedirect(url) {
  window[KEY] = url;
}

export function consumeFontRedirect() {
  const url = window[KEY];
  delete window[KEY];
  return url || null;
}
