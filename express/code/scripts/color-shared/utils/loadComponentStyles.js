const loadedStyles = new Set();

/**
 * Lazily loads a CSS file for a component
 * Ensures each CSS file is only loaded once
 *
 * @param {string} cssPath - Path to CSS file (relative to calling module)
 * @param {string} [baseUrl=import.meta.url] - Base URL for resolving relative paths
 * @returns {Promise<void>} Resolves when CSS is loaded
 */
export async function loadComponentStyles(cssPath, baseUrl) {
  const resolvedPath = new URL(cssPath, baseUrl).href;

  if (loadedStyles.has(resolvedPath)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = resolvedPath;

    link.onload = () => {
      loadedStyles.add(resolvedPath);
      resolve();
    };

    link.onerror = () => {
      reject(new Error(`Failed to load CSS: ${resolvedPath}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Check if a CSS file has already been loaded
 *
 * @param {string} cssPath - Path to CSS file
 * @param {string} [baseUrl] - Base URL for resolving
 * @returns {boolean}
 */
export function isCSSLoaded(cssPath, baseUrl) {
  const resolvedPath = new URL(cssPath, baseUrl).href;
  return loadedStyles.has(resolvedPath);
}

/**
 * Preload multiple CSS files in parallel
 *
 * @param {Array<{path: string, baseUrl: string}>} cssFiles - Array of CSS file configs
 * @returns {Promise<void[]>}
 */
export function preloadCSS(cssFiles) {
  return Promise.all(
    cssFiles.map(({ path, baseUrl }) => loadComponentStyles(path, baseUrl)),
  );
}

