/**
 * Spectrum Theme Utility
 *
 * Creates and configures <sp-theme> wrapper elements with Express defaults.
 * All Spectrum wrapper components should use this to ensure consistent
 * theming across Color Explorer.
 */

/** Default theme settings for Express Color Explorer */
const DEFAULTS = {
  system: 'spectrum-two',
  color: 'light',
  scale: 'medium',
};

/**
 * Create a configured <sp-theme> wrapper element.
 *
 * @param {Object} [options]
 * @param {'spectrum'|'express'|'spectrum-two'} [options.system='spectrum-two']
 * @param {'lightest'|'light'|'dark'|'darkest'}  [options.color='light']
 * @param {'medium'|'large'}                      [options.scale='medium']
 * @returns {HTMLElement} — an <sp-theme> element ready to receive children
 */
export function createThemeWrapper(options = {}) {
  const { system, color, scale } = { ...DEFAULTS, ...options };

  const theme = document.createElement('sp-theme');
  theme.setAttribute('system', system);
  theme.setAttribute('color', color);
  theme.setAttribute('scale', scale);

  return theme;
}

/**
 * Wrap an existing element inside a new <sp-theme>.
 *
 * @param {HTMLElement} child — element to wrap
 * @param {Object}      [options] — same as createThemeWrapper
 * @returns {HTMLElement} — the <sp-theme> wrapper (child is now appended)
 */
export function wrapInTheme(child, options) {
  const theme = createThemeWrapper(options);
  theme.appendChild(child);
  return theme;
}
