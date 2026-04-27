import { getLibs } from '../../utils.js';

export const DEFAULT_PLACEHOLDERS = Object.freeze({
  scrollRight: 'Scroll tags right',
  scrollLeft: 'Scroll tags left',
  searchPlaceholder: 'Search for colors, moods, themes, etc.',
  noResultsHeading: "'{query}' {type}",
  noResultsDesc: 'Sorry, no color gradients found for "{query}." See other gradients you might like...',
});

const PLACEHOLDER_KEY_MAP = Object.freeze({
  scrollRight: 'color-search-marquee-scroll-right',
  scrollLeft: 'color-search-marquee-scroll-left',
  searchPlaceholder: 'color-search-marquee-search-placeholder',
  noResultsHeading: 'color-search-marquee-no-results-heading',
  noResultsDesc: 'color-search-marquee-no-results-desc',
});

function isResolvedPlaceholder(value, key) {
  return value && value !== key.replaceAll('-', ' ');
}

export function createColorSearchMarqueePlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default async function loadColorSearchMarqueePlaceholders() {
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

    return createColorSearchMarqueePlaceholders(overrides);
  } catch {
    return createColorSearchMarqueePlaceholders();
  }
}
