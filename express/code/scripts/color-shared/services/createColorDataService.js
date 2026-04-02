/* eslint-disable import/prefer-default-export -- named export for createColorDataService */
import { serviceManager } from '../../../libs/services/core/ServiceManager.js';
import { gradientApiResponsesToGradients, themesToGradients } from '../../../libs/services/providers/transforms.js';

const MOCK_PALETTES = [
  {
    id: 'mock-palette-5',
    name: 'Eternal Sunshine of the Spotless Mind',
    colors: ['#FFE0FE', '#EDC3FF', '#BCB2FF', '#ACAAED', '#B3BBED'],
    coreColors: ['#FFE0FE', '#EDC3FF', '#BCB2FF', '#ACAAED', '#B3BBED'],
    category: 'neutral',
    tags: ['Orange', 'Cinematic', 'Summer', 'Water'],
  },{
    id: 'mock-palette-6',
    name: 'Misty Terrain',
    colors: ['#7B9EA6', '#D0ECF2', '#573E2F', '#C3927C', '#EB5733', '#F2EFE8'],
    coreColors: ['#7B9EA6', '#D0ECF2', '#573E2F', '#C3927C', '#EB5733', '#F2EFE8'],
    category: 'nature',
    tags: ['Nature', 'Earth', 'Warm', 'Water'],
  },{
    id: 'mock-palette-7',
    name: 'Misty Terrain',
    colors: ['#7B9EA6', '#D0ECF2', '#573E2F', '#C3927C', '#EB5733', '#F2EFE8', '#E9E9E9'],
    coreColors: ['#7B9EA6', '#D0ECF2', '#573E2F', '#C3927C', '#EB5733', '#F2EFE8', '#E9E9E9'],
    category: 'nature',
    tags: ['Nature', 'Earth', 'Warm', 'Water'],
  },{
    id: 'mock-palette-8',
    name: 'Misty Terrain',
    colors: ['#7B9EA6', '#D0ECF2', '#573E2F', '#C3927C', '#EB5733', '#F2EFE8', '#E9E9E9', '#F8F8F8'],
    coreColors: ['#7B9EA6', '#D0ECF2', '#573E2F', '#C3927C', '#EB5733', '#F2EFE8', '#E9E9E9', '#F8F8F8'],
    category: 'nature',
    tags: ['Nature', 'Earth', 'Warm', 'Water'],
  },{
    id: 'mock-palette-9',
    name: 'Misty Terrain',
    colors: ['#7B9EA6', '#D0ECF2', '#573E2F', '#C3927C', '#EB5733', '#F2EFE8', '#E9E9E9', '#F8F8F8', '#FFFFFF'],
    coreColors: ['#7B9EA6', '#D0ECF2', '#573E2F', '#C3927C', '#EB5733', '#F2EFE8', '#E9E9E9', '#F8F8F8', '#FFFFFF'],
    category: 'nature',
    tags: ['Nature', 'Earth', 'Warm', 'Water'],
  },
  {
    id: 'mock-palette-10',
    name: 'Misty Terrain',
    colors: ['#7B9EA6', '#D0ECF2', '#573E2F', '#C3927C', '#EB5733', '#F2EFE8', '#E9E9E9', '#F8F8F8', '#FFFFFF', '#E1E1E1'],
    coreColors: ['#7B9EA6', '#D0ECF2', '#573E2F', '#C3927C', '#EB5733', '#F2EFE8', '#E9E9E9', '#F8F8F8', '#FFFFFF', '#E1E1E1'],
    category: 'nature',
    tags: ['Nature', 'Earth', 'Warm', 'Water'],
  },
];

function palettesToGradients(palettes) {
  return palettes.map((palette) => {
    const colors = palette.colors || palette.coreColors || [];
    const colorStops = colors.map((color, index) => ({
      color,
      position: colors.length > 1 ? index / (colors.length - 1) : 0,
    }));
    return {
      id: palette.id.replace('palette', 'gradient'),
      name: palette.name,
      type: 'linear',
      angle: 90,
      colorStops,
      coreColors: colors,
      likes: 0,
      liked: false,
      creator: { name: '', guid: '', imageUrl: null },
      tags: palette.tags || [],
      href: null,
    };
  });
}

export const PALETTE_10_COLORS_MODAL = {
  id: 'palette-1',
  name: 'Eternal Sunshine of the Spotless Mind',
  colors: ['#7B9EA6', '#D0ECF2', '#573E2F', '#C3927C', '#EB5733', '#F2EFE8', '#E9E9E9', '#F8F8F8', '#FFFFFF', '#E1E1E1'],
  category: 'neutral',
  tags: ['Orange', 'Cinematic', 'Summer', 'Water'],
};

export function createColorDataService(config) {
  let cache = null;
  let fetchPromise = null;
  let _searchQuery = '';
  let _searchOpts = {};
  let _searchPage = 0;
  let _searchHasNextPage = false;
  let _searchResults = [];
  const DAY_MS = 24 * 60 * 60 * 1000;
  const MOCK_AGE_DAY_CYCLE = [1, 3, 6, 10, 15, 24, 38, 62, 95];

  function toTimestamp(value) {
    if (!value) return 0;
    const ts = new Date(value).getTime();
    return Number.isFinite(ts) ? ts : 0;
  }

  function getMockAgeInDays(index) {
    const base = MOCK_AGE_DAY_CYCLE[index % MOCK_AGE_DAY_CYCLE.length];
    const spread = Math.floor(index / MOCK_AGE_DAY_CYCLE.length);
    return base + spread;
  }

  function hashString(input) {
    const str = String(input || '');
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash * 31 + str.charCodeAt(i)) % 2147483647;
    }
    return Math.abs(hash);
  }

  function withDerivedMeta(items) {
    const now = Date.now();
    return (Array.isArray(items) ? items : []).map((item, index) => {
      const ageDays = getMockAgeInDays(index);
      const createdAtTs = now - (ageDays * DAY_MS);
      const fallbackCreatedAt = new Date(createdAtTs).toISOString();
      const fallbackLastUsedAt = new Date(
        createdAtTs + Math.floor((ageDays * DAY_MS) / 2),
      ).toISOString();
      const stableId = item?.sourceId || item?.id || '';
      const seed = hashString(`${stableId}:${item?.name || ''}:${index}`);
      const fallbackUsageCount = Math.max(
        1,
        50 + (seed % 850),
      );
      const fallbackPopularityScore = Number(
        (fallbackUsageCount * (0.55 + ((seed % 200) / 200))).toFixed(2),
      );

      return {
        ...item,
        usageCount: Number.isFinite(item?.usageCount)
          ? item.usageCount
          : fallbackUsageCount,
        popularityScore: Number.isFinite(item?.popularityScore)
          ? item.popularityScore
          : fallbackPopularityScore,
        createdAt: item?.createdAt || fallbackCreatedAt,
        lastUsedAt: item?.lastUsedAt || fallbackLastUsedAt,
      };
    });
  }

  function applyTimeRange(items, timeRange) {
    if (!timeRange || timeRange === 'all-time') return items;

    let maxAgeDays = null;
    if (timeRange === 'this-week') {
      maxAgeDays = 7;
    } else if (timeRange === 'this-month') {
      maxAgeDays = 30;
    }

    if (!maxAgeDays) return items;

    const now = Date.now();
    return items.filter((item) => {
      const stamp = toTimestamp(item?.lastUsedAt) || toTimestamp(item?.createdAt);
      if (!stamp) return false;
      return now - stamp <= maxAgeDays * DAY_MS;
    });
  }

  function sortItems(items, sort) {
    if (!sort || sort === 'all') return items;

    const getPopularity = (item) => (
      Number.isFinite(item?.popularityScore)
        ? item.popularityScore
        : Number(item?.usageCount) || 0
    );

    const getUsageCount = (item) => (
      Number.isFinite(item?.usageCount)
        ? item.usageCount
        : 0
    );

    if (sort === 'most-popular') {
      return [...items].sort((a, b) => getPopularity(b) - getPopularity(a));
    }

    if (sort === 'most-used') {
      return [...items].sort((a, b) => getUsageCount(b) - getUsageCount(a));
    }

    if (sort === 'random') {
      const randomized = items.map((item) => ({ item, rank: Math.random() }));
      randomized.sort((a, b) => a.rank - b.rank);
      return randomized.map((entry) => entry.item);
    }

    return items;
  }

  function ensurePaletteColors(items) {
    return items.map((item) => (
      item.colors ? item : { ...item, colors: item.coreColors || [] }
    ));
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
        const kuler = await serviceManager.getProvider('kuler');
        if (kuler) {
          let raw = null;
          if (config.variant === 'gradients') {
            raw = await kuler.exploreGradients({ filter: 'public', sort: 'create_time', time: 'month' });
            // eslint-disable-next-line no-console
            console.log('[DataService] Kuler gradients raw response:', raw);
            const items = raw?.gradients || raw?.themes || raw?.items
              || (Array.isArray(raw) ? raw : null);
            if (Array.isArray(items) && items.length > 0) {
              const data = withDerivedMeta(gradientApiResponsesToGradients(items));
              // eslint-disable-next-line no-console
              console.log('[DataService] Kuler gradients normalized:', data);
              cache = data;
              return data;
            }
          } else if (config.variant === 'strips' || config.variant === 'palettes') {
            raw = await kuler.exploreThemes({ filter: 'public', sort: 'create_time', time: 'month' });
            // eslint-disable-next-line no-console
            console.log('[DataService] Kuler themes raw response:', raw);
            const items = raw?.themes || raw?.items || (Array.isArray(raw) ? raw : null);
            if (Array.isArray(items) && items.length > 0) {
              const data = ensurePaletteColors(withDerivedMeta(themesToGradients(items)));
              // eslint-disable-next-line no-console
              console.log('[DataService] Kuler themes normalized:', data);
              cache = data;
              return data;
            }
          }
        }

        const mockData = config.variant === 'gradients'
          ? withDerivedMeta(palettesToGradients(MOCK_PALETTES))
          : withDerivedMeta(MOCK_PALETTES);
        cache = mockData;
        return cache;
      } catch (error) {
        window.lana?.log(`[DataService] Fetch error: ${error?.message}`, {
          tags: 'color-explore,data-service',
          severity: 'error',
        });
        const mockData = config.variant === 'gradients'
          ? withDerivedMeta(palettesToGradients(MOCK_PALETTES))
          : withDerivedMeta(MOCK_PALETTES);
        cache = mockData;
        return cache;
      } finally {
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  }

  function localSearch(query) {
    if (!cache) return [];
    const lowerQuery = String(query || '').toLowerCase();
    return cache.filter((item) => (
      item.name?.toLowerCase().includes(lowerQuery)
      || item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    ));
  }

  async function search(query, options = {}) {
    _searchQuery = query || '';
    _searchPage = 1;
    _searchHasNextPage = false;
    _searchResults = [];

    if (!query) return cache || [];

    const searchOptions = {};
    if (options.typeOfQuery) searchOptions.typeOfQuery = options.typeOfQuery;
    _searchOpts = searchOptions;

    try {
      const kuler = await serviceManager.getProvider('kuler');
      if (kuler) {
        let raw = null;
        if (config.variant === 'gradients') {
          raw = await kuler.searchGradients(query, { ...searchOptions, page: 1 });
          _searchHasNextPage = !!raw?.hasNextPage;
          const items = raw?.gradients || raw?.themes || raw?.items
            || (Array.isArray(raw) ? raw : null);
          if (Array.isArray(items) && items.length > 0) {
            _searchResults = withDerivedMeta(gradientApiResponsesToGradients(items));
            return _searchResults;
          }
        } else {
          raw = await kuler.searchThemes(query, { ...searchOptions, page: 1 });
          _searchHasNextPage = !!raw?.hasNextPage;
          const items = raw?.themes || raw?.items
            || (Array.isArray(raw) ? raw : null);
          if (Array.isArray(items) && items.length > 0) {
            _searchResults = ensurePaletteColors(withDerivedMeta(themesToGradients(items)));
            return _searchResults;
          }
        }
      }
    } catch (error) {
      window.lana?.log(`[DataService] Search API error: ${error?.message}`, {
        tags: 'color-explore,data-service',
        severity: 'warning',
      });
    }

    _searchResults = localSearch(query);
    return _searchResults;
  }

  async function searchMore() {
    if (!_searchHasNextPage || !_searchQuery) return _searchResults;

    _searchPage += 1;
    try {
      const kuler = await serviceManager.getProvider('kuler');
      if (!kuler) return _searchResults;

      let raw = null;
      if (config.variant === 'gradients') {
        raw = await kuler.searchGradients(_searchQuery, { ..._searchOpts, page: _searchPage });
        _searchHasNextPage = !!raw?.hasNextPage;
        const items = raw?.gradients || raw?.themes || raw?.items
          || (Array.isArray(raw) ? raw : null);
        if (Array.isArray(items) && items.length > 0) {
          const newItems = withDerivedMeta(gradientApiResponsesToGradients(items));
          _searchResults = [..._searchResults, ...newItems];
        }
      } else {
        raw = await kuler.searchThemes(_searchQuery, { ..._searchOpts, page: _searchPage });
        _searchHasNextPage = !!raw?.hasNextPage;
        const items = raw?.themes || raw?.items
          || (Array.isArray(raw) ? raw : null);
        if (Array.isArray(items) && items.length > 0) {
          const newItems = ensurePaletteColors(withDerivedMeta(themesToGradients(items)));
          _searchResults = [..._searchResults, ...newItems];
        }
      }
    } catch (error) {
      window.lana?.log(`[DataService] Search pagination error: ${error?.message}`, {
        tags: 'color-explore,data-service',
        severity: 'warning',
      });
    }

    return _searchResults;
  }

  async function toggleLike(item) {
    try {
      const kuler = await serviceManager.getProvider('kuler');
      if (!kuler) {
        window.lana?.log('[DataService] Kuler provider unavailable for like toggle', {
          tags: 'color-explore,data-service',
          severity: 'warning',
        });
        return item?.liked ?? false;
      }
      await kuler.updateLike({
        id: item?.id,
        like: item?.liked ? null : { user: true },
        source: 'color-explore',
      });
      return item?.liked ?? false;
    } catch (error) {
      window.lana?.log(`[DataService] Toggle like error: ${error?.message}`, {
        tags: 'color-explore,data-service',
        severity: 'warning',
      });
      return item?.liked ?? false;
    }
  }

  function filter(criteria) {
    if (!cache) {
      return [];
    }

    const nextCriteria = criteria || {};
    let results = [...cache];

    if (nextCriteria.category && nextCriteria.category !== 'all') {
      results = results.filter((item) => item.category === nextCriteria.category);
    }
    if (nextCriteria.type && nextCriteria.type !== 'all') {
      results = results.filter((item) => item.type === nextCriteria.type);
    }

    results = applyTimeRange(results, nextCriteria.timeRange);
    results = sortItems(results, nextCriteria.sort);

    return results;
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
    searchMore,
    filter,
    clearCache,
    loadMore,
    toggleLike,
  };
}
