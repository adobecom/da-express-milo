export function createColorDataService(config) {
  let cache = null;
  let lastFetch = null;
  const CACHE_TTL = 5 * 60 * 1000;
  const eventListeners = new Map();

  function on(event, callback) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, []);
    }
    eventListeners.get(event).push(callback);
  }

  function emit(event, eventData) {
    const listeners = eventListeners.get(event) || [];
    listeners.forEach((callback) => callback(eventData));
  }

  function isCacheValid() {
    if (!cache || !lastFetch) return false;
    return Date.now() - lastFetch < CACHE_TTL;
  }

  async function fetch(options = {}) {
    if (isCacheValid() && !options.force) {
      return cache;
    }

    try {
      const endpoint = options.endpoint || config.apiEndpoint;
      const limit = options.limit || config.limit || 24;

      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set('limit', limit);

      if (options.search) {
        url.searchParams.set('search', options.search);
      }

      if (options.tags && options.tags.length > 0) {
        url.searchParams.set('tags', options.tags.join(','));
      }

      const response = await window.fetch(url.toString());

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      cache = data;
      lastFetch = Date.now();

      emit('data-fetched', data);

      return data;
    } catch (error) {
      if (window.lana) {
        window.lana.log(`Color Data Service fetch error: ${error.message}`, {
          tags: 'color-explore,data-service',
        });
      }

      return [];
    }
  }

  function clearCache() {
    cache = null;
    lastFetch = null;
  }

  async function search(query) {
    return fetch({ search: query, force: true });
  }

  async function filterByTags(tags) {
    return fetch({ tags, force: true });
  }

  return {
    fetch,
    search,
    filterByTags,
    clearCache,
    on,
    emit,
  };
}

