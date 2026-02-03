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
  VARIANT: VARIANTS.STRIPS,
  INITIAL_LOAD: 24,
  LOAD_MORE_INCREMENT: 10,
  MAX_ITEMS: 100,
  ENABLE_FILTERS: true,
  ENABLE_SEARCH: true,
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
