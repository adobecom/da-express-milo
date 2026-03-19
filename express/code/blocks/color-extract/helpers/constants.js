export const VARIANTS = {
  PALETTE: 'palette',
  GRADIENT: 'gradient',
};

export const DEFAULTS = {
  VARIANT: VARIANTS.PALETTE,
  MAX_COLORS: 10,
  ENABLE_IMAGE_UPLOAD: true,
  ENABLE_URL_INPUT: true,
};

export const CSS_CLASSES = {
  BLOCK: 'color-extract',
  CONTAINER: 'color-extract-container',
  LOADING: 'is-loading',
  ERROR: 'has-error',
};

export const EVENTS = {
  IMAGE_UPLOAD: 'image-upload',
  URL_INPUT: 'url-input',
  COLOR_EXTRACT: 'color-extract',
  PALETTE_CLICK: 'palette-click',
  GRADIENT_CLICK: 'gradient-click',
};
