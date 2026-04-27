import { loadPlaceholders } from './utils.js';

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

export function createColorSearchMarqueePlaceholders(overrides = {}) {
  return { ...DEFAULT_PLACEHOLDERS, ...overrides };
}

export default function loadColorSearchMarqueePlaceholders() {
  return loadPlaceholders(PLACEHOLDER_KEY_MAP, createColorSearchMarqueePlaceholders);
}
