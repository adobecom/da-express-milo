/* eslint-disable import/prefer-default-export -- named export for createColorDataService */
import { serviceManager } from '../../../libs/services/core/ServiceManager.js';
import { gradientApiResponsesToGradients, themesToGradients } from '../../../libs/services/providers/transforms.js';

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
              const data = withDerivedMeta(themesToGradients(items));
              // eslint-disable-next-line no-console
              console.log('[DataService] Kuler themes normalized:', data);
              cache = data;
              return data;
            }
          }
        }

        cache = [];
        return cache;
      } catch (error) {
        window.lana?.log(`[DataService] Fetch error: ${error?.message}`, {
          tags: 'color-explore,data-service',
          severity: 'error',
        });
        cache = [];
        return cache;
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

    const lowerQuery = String(query || '').toLowerCase();
    return cache.filter((item) => (
      item.name?.toLowerCase().includes(lowerQuery)
      || item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    ));
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
    filter,
    clearCache,
    loadMore,
  };
}
