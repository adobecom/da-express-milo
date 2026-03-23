import { DEFAULT_DEEP_LINK_CONFIG } from './constants.js';

export function createDeepLinkManager(config = {}) {
  const mergedConfig = { ...DEFAULT_DEEP_LINK_CONFIG, ...config };
  const {
    enabled,
    queryParam,
    updateOnSearch,
  } = mergedConfig;

  function getQueryFromUrl() {
    if (!enabled) return null;

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(queryParam);
  }

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

  function clearUrl() {
    updateUrl('');
  }

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

export default createDeepLinkManager;
