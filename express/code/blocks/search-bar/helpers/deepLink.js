import { DEFAULT_DEEP_LINK_CONFIG } from './constants.js';

// ==============================================
// Deep Link Manager
// ==============================================

/**
 * Creates a deep link manager for search query params
 * @param {Object} config - Deep link configuration
 * @param {boolean} [config.enabled=true] - Whether deep linking is enabled
 * @param {string} [config.queryParam='q'] - URL query parameter name
 * @param {boolean} [config.updateOnSearch=true] - Update URL on search
 * @param {boolean} [config.autoPopulate=true] - Auto-populate from URL on load
 * @returns {Object} Deep link manager API
 */
export function createDeepLinkManager(config = {}) {
  const mergedConfig = { ...DEFAULT_DEEP_LINK_CONFIG, ...config };
  const {
    enabled,
    queryParam,
    updateOnSearch,
  } = mergedConfig;

  /**
   * Gets the search query from URL
   * @returns {string|null} Query value or null
   */
  function getQueryFromUrl() {
    if (!enabled) return null;

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(queryParam);
  }

  /**
   * Updates the URL with the search query
   * @param {string} query - Search query to set
   * @param {Object} [options] - Update options
   * @param {boolean} [options.replace=true] - Use replaceState instead of pushState
   */
  function updateUrl(query, options = {}) {
    if (!enabled || !updateOnSearch) return;

    const { replace = true } = options;
    const url = new URL(window.location.href);

    if (query && query.trim()) {
      url.searchParams.set(queryParam, query.trim());
    } else {
      url.searchParams.delete(queryParam);
    }

    const newUrl = url.toString();

    if (newUrl !== window.location.href) {
      if (replace) {
        window.history.replaceState({}, '', newUrl);
      } else {
        window.history.pushState({}, '', newUrl);
      }
    }
  }

  /**
   * Clears the search query from URL
   */
  function clearUrl() {
    updateUrl('');
  }

  /**
   * Listens for popstate events (back/forward navigation)
   * @param {Function} callback - Called with query value on navigation
   * @returns {Function} Cleanup function
   */
  function onPopState(callback) {
    if (!enabled) return () => {};

    const handler = () => {
      const query = getQueryFromUrl();
      callback(query);
    };

    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }

  return {
    getQueryFromUrl,
    updateUrl,
    clearUrl,
    onPopState,
    isEnabled: () => enabled,
  };
}
