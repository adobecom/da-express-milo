export const VARIANTS = {
  STRIPS: 'strips',
  GRADIENTS: 'gradients',
};

export const GRADIENT_VIEW = {
  STRIP: 'gradient-strip',
  STRIP_TALL: 'gradient-strip-tall',
  EDITOR: 'gradient-editor',
};

export const VARIANT_CLASSES = {
  GRADIENTS: 'gradients',
  PALETTES: 'palettes',
};

export const DEFAULTS = {
  variant: VARIANTS.STRIPS,
  initialLoad: 24,
  loadMoreIncrement: 10,
  maxItems: 100,
  enableFilters: false, /* off for review */
  enableSearch: true,
  enableGradientEditor: true, /* inline gradient editor before strips (PR demo) */
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
