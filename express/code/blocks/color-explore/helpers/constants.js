/** Page-level variants only. Block has no "strips" — only palettes and gradients. */
export const VARIANTS = {
  PALETTES: 'palettes',
  GRADIENTS: 'gradients',
};

/** Sub-variants under palettes (each has its own factory). */
export const PALETTE_SUBVARIANTS = {
  STRIPS: 'strips',
  STRIP_CONTAINER: 'strip-container',
  PALETTE_WC: 'palette-wc', // variant that depends on <color-palette> WC
};

/** Sub-variants under gradients (Grid, Modal, Extract groups). */
export const GRADIENT_SUBVARIANTS = {
  GRID: 'grid',
  MODAL: 'modal',
  EXTRACT: 'extract',
};

export const DEFAULTS = {
  variant: VARIANTS.PALETTES,
  paletteSubVariant: PALETTE_SUBVARIANTS.STRIP_CONTAINER,
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
