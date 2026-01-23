import { serviceManager, initApiService } from '../../../libs/services/index.js';
import { themesToGradients } from '../../../libs/services/providers/transforms.js';

/**
 * Create color data service
 * @param {Object} config - Service configuration
 * @param {string} config.apiEndpoint - API endpoint
 * @param {number} config.limit - Results limit
 * @param {string} [config.trendsEndpoint] - Trends API endpoint (optional)
 * @returns {Object} Service instance with fetch, search, searchThemes, searchGradients, filterByTags, getTrends, clearCache, on, emit
 */
export function createColorDataService(config) {
  let kulerAdapter = null;

  /**
   * Get or initialize kuler adapter (lazy initialization)
   * @returns {Promise<Object>} Kuler adapter instance
   */
  async function getKulerAdapter() {
    if (!kulerAdapter) {
      await initApiService({
        plugins: ['kuler'],
      });
      kulerAdapter = await serviceManager.getAdapter('kuler');
    }
    return kulerAdapter;
  }
  
  let cache = null;
  let lastFetch = null;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  const eventListeners = new Map();

  /**
   * Subscribe to events
   * @param {string} event - Event name ('data-fetched' | 'themes-fetched' | 'gradients-fetched')
   * @param {Function} callback - Event handler
   */
  function on(event, callback) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, []);
    }
    eventListeners.get(event).push(callback);
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} eventData - Event payload
   */
  function emit(event, eventData) {
    const listeners = eventListeners.get(event) || [];
    listeners.forEach((callback) => callback(eventData));
  }

  /**
   * Check if cache is valid
   * @returns {boolean} True if cache is valid
   */
  function isCacheValid() {
    if (!cache || !lastFetch) return false;
    return Date.now() - lastFetch < CACHE_TTL;
  }

  /**
   * Fetch data from API
   * @param {Object} [options] - Fetch options
   * @param {string} [options.endpoint] - Override endpoint
   * @param {number} [options.limit] - Results limit
   * @param {string} [options.search] - Search query
   * @param {string[]} [options.tags] - Filter tags
   * @param {boolean} [options.force] - Bypass cache
   * @returns {Promise<Array>} Data array
   */
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
          tags: 'color-explorer,data-service',
        });
      }
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
   * @param {string[]} tags - Tags to filter by
   * @returns {Promise<Array>} Results
   */
  async function filterByTags(tags) {
    return fetch({ tags, force: true });
  }

  /**
   * Search Kuler themes
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @param {string} [options.typeOfQuery='term'] - Query type: 'term' | 'tag' | 'hex' | 'similarHex'
   * @param {number} [options.pageNumber=1] - Page number (1-indexed)
   * @returns {Promise<Object|null>} SearchResults with themes, totalCount, page
   */
  async function searchThemes(query, options = {}) {
    const adapter = await getKulerAdapter();
    const results = await adapter.searchThemes(query, options);

    if (results) {
      emit('themes-fetched', results);
    }

    return results;
  }

  /**
   * Search Kuler gradients
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @param {string} [options.typeOfQuery='term'] - Query type
   * @param {number} [options.pageNumber=1] - Page number
   * @returns {Promise<Object|null>} SearchResults with themes, totalCount, page
   */
  async function searchGradients(query, options = {}) {
    const adapter = await getKulerAdapter();
    const results = await adapter.searchGradients(query, options);

    if (results) {
      emit('gradients-fetched', results);
    }

    return results;
  }

  /**
   * Fetch themes from Kuler API and transform to gradient format
   * @param {string} [query=''] - Search query (empty for default/popular themes)
   * @param {Object} [options] - Search options
   * @param {string} [options.typeOfQuery='term'] - Query type
   * @param {number} [options.page=1] - Page number (1-indexed)
   * @returns {Promise<Object>} Object with gradients array and metadata
   */
  async function fetchThemesAsGradients(query = '', options = {}) {
    try {
      const adapter = await getKulerAdapter();
      const results = await adapter.searchThemes(query, {
        typeOfQuery: options.typeOfQuery || 'term',
        page: options.page || 1,
      });

      if (!results || !results.themes) {
        return { gradients: [], totalCount: 0, hasMore: false };
      }

      const gradients = themesToGradients(results.themes);
      const batchSize = 72;

      emit('gradients-fetched', {
        gradients,
        totalCount: results.totalCount || gradients.length,
        page: options.page || 1,
      });

      return {
        gradients,
        totalCount: results.totalCount || gradients.length,
        hasMore: results.themes.length === batchSize,
      };
    } catch (error) {
      if (window.lana) {
        window.lana.log(`Color Data Service fetchThemesAsGradients error: ${error.message}`, {
          tags: 'color-explorer,data-service,gradients',
        });
      }
      return { gradients: [], totalCount: 0, hasMore: false };
    }
  }

  /**
   * Get trending/popular searches
   * @returns {Promise<Object>} Trends data with items array
   */
  async function getTrends() {
    try {
      const trendsEndpoint = config.trendsEndpoint || '/api/color/trends';
      const url = new URL(trendsEndpoint, window.location.origin);

      const response = await window.fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Trends API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (window.lana) {
        window.lana.log(`Color Data Service trends error: ${error.message}`, {
          tags: 'color-explorer,data-service,trends',
        });
      }

      return {
        items: [
          { label: 'Summer', url: '/express/colors/search?q=summer' },
          { label: 'Neutral palette', url: '/express/colors/search?q=neutral' },
          { label: 'Pastel', url: '/express/colors/search?q=pastel' },
          { label: 'Vintage', url: '/express/colors/search?q=vintage' },
          { label: 'Ocean', url: '/express/colors/search?q=ocean' },
          { label: 'Sunset', url: '/express/colors/search?q=sunset' },
          { label: 'Forest', url: '/express/colors/search?q=forest' },
          { label: 'Autumn', url: '/express/colors/search?q=autumn' },
        ],
      };
    }
  }

  return {
    fetch,
    search,
    searchThemes,
    searchGradients,
    fetchThemesAsGradients,
    filterByTags,
    getTrends,
    clearCache,
    on,
    emit,
  };
}
