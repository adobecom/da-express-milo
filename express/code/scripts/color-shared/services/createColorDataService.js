export function createColorDataService(config) {
  let cache = null;
  let fetchPromise = null;

  function getMockData(variant) {
    if (variant === 'strips') {
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

  async function fetch(filters = {}) {
    if (cache && !filters.forceRefresh) {
      return cache;
    }

    if (fetchPromise) {
      return fetchPromise;
    }

    fetchPromise = (async () => {
      try {
        const isLocalhost = window.location.hostname === 'localhost' 
          || window.location.hostname.includes('.aem.page');

        if (isLocalhost || !config.apiEndpoint) {
          const data = getMockData(config.variant);
          cache = data;
          return data;
        }

        const params = new URLSearchParams(filters);
        const response = await window.fetch(`${config.apiEndpoint}?${params}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        cache = data;
        return data;
      } catch (error) {
        console.error('[DataService] Fetch error:', error);
        const data = getMockData(config.variant);
        cache = data;
        return data;
      } finally {
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  }

  function search(query) {
    if (!cache) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return cache.filter(item => 
      item.name?.toLowerCase().includes(lowerQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  function filter(criteria) {
    if (!cache) {
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

  function clearCache() {
    cache = null;
  }

  function loadMore() {
    return cache || [];
  }

  return {
    fetchData: fetch,
    fetch,
    search,
    filter,
    clearCache,
    loadMore,
  };
}
