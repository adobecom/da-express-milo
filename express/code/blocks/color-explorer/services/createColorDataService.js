/**
 * Color Explorer - Data Service
 * Handles data fetching and caching
 * Uses functional pattern with closures
 */

/**
 * Create color data service
 * @param {Object} config - Service configuration
 * @param {string} config.apiEndpoint - API endpoint
 * @param {number} config.limit - Results limit
 * @returns {Object} Service instance
 */
export function createColorDataService(config) {
  // Private state
  let cache = null;
  let lastFetch = null;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  const eventListeners = new Map();

  /**
   * Event emitter
   */
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

  /**
   * Check if cache is valid
   */
  function isCacheValid() {
    if (!cache || !lastFetch) return false;
    return Date.now() - lastFetch < CACHE_TTL;
  }

  /**
   * Fetch data from API
   * @param {Object} options - Fetch options
   * @returns {Promise<Array>} Data
   */
  async function fetch(options = {}) {
    // Return cache if valid
    if (isCacheValid() && !options.force) {
      return cache;
    }

    try {
      const endpoint = options.endpoint || config.apiEndpoint;
      const limit = options.limit || config.limit || 24;

      // Build URL
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

      // Cache result
      cache = data;
      lastFetch = Date.now();

      emit('data-fetched', data);

      return data;
    } catch (error) {
      // Log error
      if (window.lana) {
        window.lana.log(`Color Data Service fetch error: ${error.message}`, {
          tags: 'color-explorer,data-service',
        });
      }

      // Return empty array on error
      return [];
    }
  }

  /**
   * Clear cache
   */
  function clearCache() {
    cache = null;
    lastFetch = null;
  }

  /**
   * Search data
   * @param {string} query - Search query
   * @returns {Promise<Array>} Results
   */
  async function search(query) {
    return fetch({ search: query, force: true });
  }

  /**
   * Filter by tags
   * @param {Array<string>} tags - Tags
   * @returns {Promise<Array>} Results
   */
  async function filterByTags(tags) {
    return fetch({ tags, force: true });
  }

  // Public API
  return {
    fetch,
    search,
    filterByTags,
    clearCache,
    on,
    emit,
  };
}
