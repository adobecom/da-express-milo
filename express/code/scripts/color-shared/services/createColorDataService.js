/* eslint-disable import/prefer-default-export -- named export for createColorDataService */

/**
 * Fallback palettes for the palette grid. Sourced from Figma CCEX-221263 node 5504-181749
 * (Explore color palettes grid). First palette matches card 3088-201177.
 */
const FIGMA_PALETTE_GRID_5504_181749 = [
  {
    id: 'palette-figma-3088-201177',
    name: 'Palette name lorem ipsum',
    colors: ['#7A9CA3', '#E0F2F7', '#573E2F', '#C3927C', '#EB5733'],
    category: 'neutral',
    tags: ['neutral', 'earth'],
  },
  {
    id: 'palette-figma-5504-181749-2',
    name: 'Palette name lorem ipsum',
    colors: ['#F07DF2', '#6A65D9', '#000326', '#182573', '#1D64F2'],
    category: 'vibrant',
    tags: ['vibrant', 'cool'],
  },
  {
    id: 'palette-figma-5504-181749-3',
    name: 'The half sunshine of the spotted blind',
    colors: ['#7B9EA6', '#59391D', '#D99066', '#F2EFE8', '#F34822'],
    category: 'nature',
    tags: ['nature', 'warm'],
  },
];

/** @deprecated Use FIGMA_PALETTE_GRID_5504_181749[0] for first palette. */
const FIGMA_EXPLORE_PALETTE = FIGMA_PALETTE_GRID_5504_181749[0];

/** @deprecated Use FIGMA_PALETTE_GRID_5504_181749[0].colors. */
const FIGMA_EXPLORE_PALETTE_COLORS = FIGMA_PALETTE_GRID_5504_181749[0].colors;

export function createColorDataService(config) {
  let cache = null;
  let fetchPromise = null;

  function getMockPaletteList(len = 24) {
    const list = [...FIGMA_PALETTE_GRID_5504_181749];
    const fallbackColors = FIGMA_PALETTE_GRID_5504_181749[0].colors;
    for (let i = list.length; i < len; i += 1) {
      const fromGrid = FIGMA_PALETTE_GRID_5504_181749[i % FIGMA_PALETTE_GRID_5504_181749.length];
      list.push({
        id: `palette-${i + 1}`,
        name: `Palette ${i + 1}`,
        colors: fromGrid?.colors ?? fallbackColors,
        category: ['nature', 'abstract', 'vibrant'][i % 3],
        tags: ['popular', 'new', 'trending'],
      });
    }
    return list;
  }

  function getMockData(variant) {
    if (variant === 'strips') {
      return getMockPaletteList(24);
    }

    if (variant === 'palettes') {
      return getMockPaletteList(24);
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
        const isPreview = window.location.hostname === 'localhost'
          || window.location.hostname.includes('.aem.page')
          || window.location.hostname.includes('.aem.live');

        if (isPreview || !config.apiEndpoint) {
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
        // eslint-disable-next-line no-console -- report fetch failure
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
    return cache.filter((item) => (
      item.name?.toLowerCase().includes(lowerQuery)
      || item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    ));
  }

  function filter(criteria) {
    if (!cache) {
      return [];
    }

    return cache.filter((item) => {
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
