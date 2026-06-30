// Window-keyed state bridge for the font-generator → Express sign-in redirect.
// Mirrors susiRedirect.js used by the Colors tool.
// The stored URL survives the SUSI modal open/close within the same page load
// but does NOT survive a full page navigation (by design — keeps it simple).

const KEY = '__susiFontRedirect';

export function setFontRedirect(url) {
  window[KEY] = url;
}

export function consumeFontRedirect() {
  const url = window[KEY];
  delete window[KEY];
  return url || null;
}
