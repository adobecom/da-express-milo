export { DEFAULTS, MOODS, MOOD_LIST } from '../../../scripts/color-shared/utils/constants.js';

export const VARIANTS = {
  PALETTE: 'palette',
  GRADIENT: 'gradient',
};

export const MARKER = {
  DIAMETER: 33,
  RADIUS: 16.5,
  ACTIVE_DIAMETER: 56,
  ACTIVE_RADIUS: 28,
  MAGNIFIED_DIAMETER: 80,
  MAGNIFIED_RADIUS: 40,
  CENTER_DOT: 8,
  ZOOM_SCALE: 8,
  ZOOM_SIZE: 120,
  LOUPE_WIDTH: 70,
  LOUPE_HEIGHT: 93,
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
  MOOD_CHANGE: 'mood-change',
  MARKER_MOVE: 'marker-move',
  SWATCH_SELECT: 'swatch-select',
};
