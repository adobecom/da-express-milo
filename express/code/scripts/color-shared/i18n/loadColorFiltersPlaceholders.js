import { getLibs } from '../../utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  searchLabel: 'Search',
  searchPlaceholder: 'Search colors and palettes...',
  searchPlaceholderShort: 'Search colors...',
  contentGradients: 'Color gradients',
  contentPalettes: 'Color palettes',
  sortPopular: 'Most popular',
  sortAll: 'All',
  sortMostUsed: 'Most used',
  sortRandom: 'Random',
  timeLabelAllTime: 'All time',
  timeMonth: 'This month',
  timeWeek: 'This week',
  sortLabel: 'Sort',
  filterLabel: 'Filter',
  sortBy: 'Sort by',
  filterBy: 'Filter by',
  filterByItem: 'Filter by {label}',
  applyLabel: 'Apply',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  searchLabel: 'color-filters-search-label',
  searchPlaceholder: 'color-filters-search-placeholder',
  searchPlaceholderShort: 'color-filters-search-placeholder-short',
  contentGradients: 'color-filters-content-gradients',
  contentPalettes: 'color-filters-content-palettes',
  sortPopular: 'color-filters-sort-popular',
  sortAll: 'color-filters-sort-all',
  sortMostUsed: 'color-filters-sort-most-used',
  sortRandom: 'color-filters-sort-random',
  timeLabelAllTime: 'color-filters-shared-time-label',
  timeMonth: 'color-filters-time-month',
  timeWeek: 'color-filters-time-week',
  sortLabel: 'color-filters-sort-label',
  filterLabel: 'color-filters-filter-label',
  sortBy: 'color-filters-sort-by',
  filterBy: 'color-filters-filter-by',
  filterByItem: 'color-filters-filter-by-item',
  applyLabel: 'color-filters-apply',
});

function isResolvedPlaceholder(value, key) {
  return value && value !== key.replaceAll('-', ' ');
}

export function createColorFiltersPlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default async function loadColorFiltersPlaceholders() {
  try {
    const [{ getConfig }, { replaceKeyArray }] = await Promise.all([
      import(`${getLibs()}/utils/utils.js`),
      import(`${getLibs()}/features/placeholders.js`),
    ]);

    const keys = Object.values(PLACEHOLDER_KEY_MAP);
    const values = await replaceKeyArray(keys, getConfig());
    const overrides = {};

    Object.entries(PLACEHOLDER_KEY_MAP).forEach(([prop, key], index) => {
      const value = values[index];
      if (isResolvedPlaceholder(value, key)) {
        overrides[prop] = value;
      }
    });

    return createColorFiltersPlaceholders(overrides);
  } catch {
    return createColorFiltersPlaceholders();
  }
}
