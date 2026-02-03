/**
 * Color Data Service
 * 
 * WIREFRAME FILE - Shows data layer structure
 * 
 * Responsibilities:
 * - Fetch data from API
 * - Cache data
 * - Search & filter operations
 * - Handle mock data for development
 * 
 * Does NOT:
 * - Render UI
 * - Manage state (uses BlockMediator externally)
 */

/**
 * Create color data service
 * @param {Object} config - Configuration
 * @returns {Object} Service API
 */
export function createColorDataService(config) {
  console.log('[DataService] Initializing for variant:', config.variant);

  // Private state
  let cache = null;
  let isFetching = false;

  /**
   * Generate mock data for development
   * @param {string} variant - Variant type
   * @returns {Array} Mock data
   */
  function getMockData(variant) {
    console.log('[DataService] Generating mock data for:', variant);

    if (variant === 'strips') {
      // Mock palette data (5 colors each)
      return Array.from({ length: 24 }, (_, i) => ({
        id: `palette-${i + 1}`,
        name: `Palette ${i + 1}`,
        colors: [
          `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
          `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
          `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
          `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
          `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        ],
        category: ['nature', 'abstract', 'vibrant'][i % 3],
        tags: ['popular', 'new', 'trending'],
      }));
    }

    if (variant === 'gradients') {
      // Mock gradient data
      return Array.from({ length: 34 }, (_, i) => ({
        id: `gradient-${i + 1}`,
        name: `Gradient ${i + 1}`,
        type: 'linear',
        angle: 90,
        colorStops: [
          { color: '#FF6B6B', position: 0 },
          { color: '#4ECDC4', position: 1 },
        ],
        coreColors: ['#FF6B6B', '#FF8E53', '#4ECDC4', '#45B7D1', '#96CEB4'],
      }));
    }

    return [];
  }

  /**
   * Fetch data from API or mock
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Data array
   */
  async function fetch(filters = {}) {
    console.log('[DataService] Fetching data with filters:', filters);

    // Return cached data if available
    if (cache && !filters.forceRefresh) {
      console.log('[DataService] Returning cached data');
      return cache;
    }

    // Prevent concurrent fetches
    if (isFetching) {
      console.warn('[DataService] Already fetching, waiting...');
      // TODO: Return promise that resolves when current fetch completes
    }

    isFetching = true;

    try {
      // Check if localhost (use mock data)
      const isLocalhost = window.location.hostname === 'localhost' 
        || window.location.hostname.includes('.aem.page');

      if (isLocalhost || !config.apiEndpoint) {
        console.log('[DataService] Using mock data');
        const data = getMockData(config.variant);
        cache = data;
        return data;
      }

      // Fetch from API
      console.log('[DataService] Fetching from API:', config.apiEndpoint);
      const params = new URLSearchParams(filters);
      const response = await window.fetch(`${config.apiEndpoint}?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[DataService] Fetched', data.length, 'items from API');
      
      cache = data;
      return data;
    } catch (error) {
      console.error('[DataService] Fetch error:', error);
      // Fallback to mock data on error
      const data = getMockData(config.variant);
      cache = data;
      return data;
    } finally {
      isFetching = false;
    }
  }

  /**
   * Search data by query
   * @param {string} query - Search query
   * @returns {Array} Filtered data
   */
  function search(query) {
    console.log('[DataService] Searching for:', query);

    if (!cache) {
      console.warn('[DataService] No cached data to search');
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return cache.filter(item => 
      item.name?.toLowerCase().includes(lowerQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Filter data by criteria
   * @param {Object} criteria - Filter criteria
   * @returns {Array} Filtered data
   */
  function filter(criteria) {
    console.log('[DataService] Filtering by:', criteria);

    if (!cache) {
      console.warn('[DataService] No cached data to filter');
      return [];
    }

    return cache.filter(item => {
      if (criteria.category && item.category !== criteria.category) {
        return false;
      }
      if (criteria.type && item.type !== criteria.type) {
        return false;
      }
      return true;
    });
  }

  /**
   * Clear cache
   */
  function clearCache() {
    console.log('[DataService] Clearing cache');
    cache = null;
  }

  /**
   * Load more data (pagination)
   * @returns {Array} Current cached data
   */
  function loadMore() {
    // This is a placeholder. Real pagination logic would be here.
    // For now, it just returns the current cache.
    console.log('[DataService] Load more requested');
    return cache || [];
  }

  // Public API
  return {
    fetchData: fetch, // Expose as fetchData for clarity
    fetch,            // Keep fetch for backward compatibility
    search,
    filter,
    clearCache,
    loadMore,
  };
}
