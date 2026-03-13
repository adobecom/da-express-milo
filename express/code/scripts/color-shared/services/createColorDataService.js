/* eslint-disable import/prefer-default-export -- named export for createColorDataService */
export const PALETTE_10_COLORS_MODAL = {
  id: 'palette-1',
  name: 'Eternal Sunshine of the Spotless Mind',
  colors: ['#7B9EA6', '#D0ECF2', '#573E2F', '#C3927C', '#EB5733', '#F2EFE8', '#E9E9E9', '#F8F8F8', '#FFFFFF', '#E1E1E1'],
  category: 'neutral',
  tags: ['Orange', 'Cinematic', 'Summer', 'Water'],
};

const DEMO_PALETTE_GRID = [
  {
    id: 'palette-1',
    name: 'Eternal Sunshine of the Spotless Mind',
    colors: ['#FFE0FE', '#EDC3FF', '#BCB2FF', '#ACAAED', '#B3BBED'],
    category: 'neutral',
    tags: ['Orange', 'Cinematic', 'Summer', 'Water'],
  },
  {
    id: 'palette-2',
    name: 'Palette name lorem ipsum',
    colors: ['#F07DF2', '#6A65D9', '#000326', '#182573', '#1D64F2'],
    category: 'vibrant',
    tags: ['vibrant', 'cool'],
  },
  {
    id: 'palette-3',
    name: 'The half sunshine of the spotted blind',
    colors: ['#7B9EA6', '#59391D', '#D99066', '#F2EFE8', '#F34822'],
    category: 'nature',
    tags: ['nature', 'warm'],
  },
];

const DEMO_PALETTE_GRID_EXTENDED = [
  ...DEMO_PALETTE_GRID,
  { id: 'palette-4', name: 'Ocean depth', colors: ['#0A1172', '#1B2B8C', '#2C3FA6', '#3D52C0', '#4E65DA'], category: 'cool', tags: ['blue', 'deep'] },
  { id: 'palette-5', name: 'Sunset vibes', colors: ['#FF6B6B', '#FF8E53', '#FFA07A', '#FFD093', '#FFE4B5'], category: 'warm', tags: ['sunset', 'warm'] },
  { id: 'palette-6', name: 'Forest mist', colors: ['#0D3B0D', '#1E5C1E', '#2F7D2F', '#409E40', '#51BF51'], category: 'nature', tags: ['green', 'forest'] },
  { id: 'palette-7', name: 'Lavender fields', colors: ['#E6E6FA', '#DDA0DD', '#DA70D6', '#BA55D3', '#9370DB'], category: 'cool', tags: ['purple', 'soft'] },
  { id: 'palette-8', name: 'Desert heat', colors: ['#FFE259', '#FFC34D', '#FFA741', '#FF8629', '#FF6B11'], category: 'warm', tags: ['desert', 'earth'] },
  { id: 'palette-9', name: 'Midnight sky', colors: ['#001F3F', '#003D5C', '#005B7A', '#007998', '#0097B6'], category: 'cool', tags: ['dark', 'blue'] },
  { id: 'palette-10', name: 'Cherry blossom', colors: ['#FFB7C5', '#FFC9D4', '#FFDBE3', '#FFEDF2', '#FFFFFF'], category: 'soft', tags: ['pink', 'spring'] },
  { id: 'palette-11', name: 'Autumn leaves', colors: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F4A460'], category: 'warm', tags: ['autumn', 'earth'] },
  { id: 'palette-12', name: 'Ice cold', colors: ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA'], category: 'cool', tags: ['cyan', 'frost'] },
  { id: 'palette-13', name: 'Royal purple', colors: ['#4B0082', '#6A0DAD', '#7B1FA2', '#8E24AA', '#9C27B0'], category: 'vibrant', tags: ['purple', 'rich'] },
  { id: 'palette-14', name: 'Golden hour', colors: ['#FFD700', '#FFDB4D', '#FFDF80', '#FFE4B3', '#FFE9E6'], category: 'warm', tags: ['gold', 'light'] },
  { id: 'palette-15', name: 'Slate and stone', colors: ['#37474F', '#455A64', '#546E7A', '#607D8B', '#78909C'], category: 'neutral', tags: ['gray', 'modern'] },
  { id: 'palette-16', name: 'Coral reef', colors: ['#FF6F61', '#FF8577', '#FF9B8D', '#FFB1A3', '#FFC7B9'], category: 'warm', tags: ['coral', 'vibrant'] },
  { id: 'palette-17', name: 'Misty morning', colors: ['#F5F5F5', '#E8E8E8', '#DCDCDC', '#D3D3D3', '#C0C0C0'], category: 'neutral', tags: ['gray', 'soft'] },
  { id: 'palette-18', name: 'Emerald green', colors: ['#006400', '#228B22', '#32CD32', '#00FF00', '#7FFF00'], category: 'nature', tags: ['green', 'fresh'] },
  { id: 'palette-19', name: 'Peachy keen', colors: ['#FFDAB9', '#FFDFC4', '#FFE4CF', '#FFE9DA', '#FFEEE5'], category: 'warm', tags: ['peach', 'soft'] },
  { id: 'palette-20', name: 'Stormy weather', colors: ['#2F4F4F', '#3D5656', '#4B5D5D', '#596464', '#676B6B'], category: 'cool', tags: ['dark', 'storm'] },
  { id: 'palette-21', name: 'Berry burst', colors: ['#8B008B', '#9932CC', '#BA55D3', '#DA70D6', '#EE82EE'], category: 'vibrant', tags: ['berry', 'purple'] },
  { id: 'palette-22', name: 'Citrus burst', colors: ['#FFA500', '#FFB733', '#FFC966', '#FFDB99', '#FFEDCC'], category: 'warm', tags: ['orange', 'citrus'] },
  { id: 'palette-23', name: 'Tropical paradise', colors: ['#00D9FF', '#00E6C3', '#00F387', '#7FFF4F', '#FFFF0F'], category: 'vibrant', tags: ['tropical', 'bright'] },
  { id: 'palette-24', name: 'Navy and cream', colors: ['#000080', '#1A1A9E', '#3333BC', '#4D4DDA', '#E8E8D0'], category: 'neutral', tags: ['navy', 'cream'] },
  { id: 'palette-25', name: 'Rose garden', colors: ['#DC143C', '#E03050', '#E44D64', '#E86A78', '#EC878C'], category: 'warm', tags: ['rose', 'romantic'] },
  { id: 'palette-26', name: 'Steel blue', colors: ['#4682B4', '#5A8FC4', '#6E9CD4', '#82A9E4', '#96B6F4'], category: 'cool', tags: ['blue', 'steel'] },
  { id: 'palette-27', name: 'Honey and thyme', colors: ['#D4A017', '#DBA82E', '#E2B045', '#E9B85C', '#8FBC8F'], category: 'nature', tags: ['honey', 'herb'] },
  { id: 'palette-28', name: 'Dusk gradient', colors: ['#2C1810', '#4A2C1A', '#684024', '#86542E', '#A46838'], category: 'warm', tags: ['dusk', 'earth'] },
  { id: 'palette-29', name: 'Mint fresh', colors: ['#98FF98', '#A8FFB0', '#B8FFC8', '#C8FFE0', '#D8FFF8'], category: 'nature', tags: ['mint', 'fresh'] },
  { id: 'palette-30', name: 'Wine country', colors: ['#722F37', '#8B3A42', '#A4454D', '#BD5058', '#D65B63'], category: 'warm', tags: ['wine', 'rich'] },
  { id: 'palette-31', name: 'Arctic frost', colors: ['#E0FFFF', '#D1F0F0', '#C2E1E1', '#B3D2D2', '#A4C3C3'], category: 'cool', tags: ['arctic', 'frost'] },
  { id: 'palette-32', name: 'Terracotta', colors: ['#E2725B', '#E57D6A', '#E88879', '#EB9388', '#EE9E97'], category: 'warm', tags: ['terracotta', 'earth'] },
  { id: 'palette-33', name: 'Ink and parchment', colors: ['#1C1C1C', '#363636', '#505050', '#6A6A6A', '#F4ECD8'], category: 'neutral', tags: ['ink', 'parchment'] },
  { id: 'palette-34', name: 'Sage and olive', colors: ['#9DC183', '#A8C98E', '#B3D199', '#BED9A4', '#C9E1AF'], category: 'nature', tags: ['sage', 'olive'] },
  { id: 'palette-35', name: 'Electric neon', colors: ['#FF00FF', '#FF14A3', '#FF69B4', '#FF85C1', '#FFA1CE'], category: 'vibrant', tags: ['neon', 'pink'] },
  { id: 'palette-36', name: 'Charcoal and gold', colors: ['#36454F', '#4A5F6F', '#5E7A8F', '#7295AF', '#D4AF37'], category: 'neutral', tags: ['charcoal', 'gold'] },
];

export function createColorDataService(config) {
  let cache = null;
  let fetchPromise = null;

  function getMockPaletteList(len = 36) {
    const source = DEMO_PALETTE_GRID_EXTENDED;
    const list = source.slice(0, len);
    if (list.length >= len) return list;
    const fallbackColors = DEMO_PALETTE_GRID[0].colors;
    for (let i = list.length; i < len; i += 1) {
      const fromGrid = source[i % source.length];
      list.push({
        id: `palette-${i + 1}`,
        name: fromGrid?.name ?? `Palette ${i + 1}`,
        colors: fromGrid?.colors ?? fallbackColors,
        category: fromGrid?.category ?? 'neutral',
        tags: fromGrid?.tags ?? ['popular'],
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
        window.lana?.log('[DataService] Fetch error ${error?.message}`, {
          tags: 'color-explore,data-service',
          severity: 'error',
       });
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
