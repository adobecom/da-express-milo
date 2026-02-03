/**
 * Color Explore Block - Constants
 * 
 * Default values and configuration constants for the color-explore block
 */

export const VARIANTS = {
  STRIPS: 'strips',
  GRADIENTS: 'gradients',
};

export const DEFAULTS = {
  variant: VARIANTS.STRIPS,
  initialLoad: 24,
  loadMoreIncrement: 10,
  maxItems: 100,
  enableFilters: true,
  enableSearch: true,
};

export const CSS_CLASSES = {
  BLOCK: 'color-explore',
  CONTAINER: 'color-explore-container',
  LOADING: 'is-loading',
  ERROR: 'has-error',
};

export const EVENTS = {
  PALETTE_CLICK: 'palette-click',
  GRADIENT_CLICK: 'gradient-click',
  SEARCH: 'search',
  FILTER: 'filter',
  LOAD_MORE: 'load-more',
};
