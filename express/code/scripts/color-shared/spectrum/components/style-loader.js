/**
 * Dynamic CSS Loader for Spectrum Override Styles
 *
 * Each component loads its override stylesheet exactly once.
 */

const loaded = new Set();

/**
 * Load an override stylesheet if not already loaded.
 *
 * @param {string} key  — unique identifier (e.g. 'picker', 'button')
 * @param {string} href — path to the CSS file
 * @returns {Promise<void>}
 */
export async function loadOverrideStyles(key, href) {
  if (loaded.has(key)) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.spectrumOverride = key;
  document.head.appendChild(link);

  await new Promise((resolve) => {
    link.onload = resolve;
    link.onerror = resolve; // resolve even on error to avoid blocking
  });

  loaded.add(key);
}
