export const ASSET_TYPE = {
  THEME: 'theme',
  GRADIENT: 'gradient',
};

export const ASSET_IMAGE_DOWNLOAD_SIZE = {
  width: 1600,
  height: 1200,
};

export const MULTI_ROW_ASSET_IMAGE_DOWNLOAD_SIZE = {
  width: 1600,
  height: 2400,
};

export const ASSET_SVG_SIZE = {
  width: 640,
  height: 640,
};

export const DEFAULT_GRADIENT_MIDPOINT = 0.5;

export const DOWNLOAD_GRADIENT_LABELS = {
  SVG: 'SVG',
  PNG: 'PNG',
};

export const EXPORT_FORMATS = {
  LESS: 'LESS',
  CSS: 'CSS',
  SASS: 'SASS',
  XML: 'XML',
};

export const COLOR_MODE_LIMITS = {
  MAX: {
    RGB: { R: 255, G: 255, B: 255 },
    HSL: { H: 360, S: 100, L: 100 },
  },
};

export const GRID_ASSETS = [
  { grid: 1, members: [1] },
  { grid: 2, members: [2] },
  { grid: 3, members: [3, 5, 6, 9] },
  { grid: 4, members: [4, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
];

export const ROW_ASSETS = [
  { members: [1, 2, 3, 4], height: 754 },
  { members: [5, 6, 7, 8], height: 754 },
  { members: [9, 10, 11, 12], height: 450 },
  { members: [13, 14, 15, 16], height: 250 },
  { members: [17, 18, 19, 20], height: 200 },
];

export const PANTONE_JPEG_SPECS = {
  PAGE_WIDTH: 2480,
  PAGE_HEIGHT: 1040,
  DISTANCE_BETWEEN_CARDS: 80,
  SWATCH_DIMENSION: 360,
  FILE_MARGIN_TOP: 181,
  FILE_MARGIN_LEFT_RIGHT: 180,
  PANTONE_LOGO_MARGIN_TOP: 23,
  PANTONE_LOGO_MARGIN_LEFT: 28,
  PANTONE_LOGO_WIDTH: 258,
  PANTONE_LOGO_HEIGHT: 38,
  PANTONE_COLOR_CODE_MARGIN_TOP: 9,
  CARD_HEIGHT: 540,
  COLOR_BRANDING_TEXT_MARGIN_TOP: 935,
  COPYRIGHT_TEXT_X_COORDINATES: 687,
  SEPARATOR_MARGIN_LEFT: 540,
  SEPARATOR_Y_COORDINATE_START: 900,
  SEPARATOR_Y_COORDINATE_END: 953,
  PANTONE_BRANDING_LOGO_MARGIN_LEFT: 620,
  PANTONE_BRANDING_LOGO_MARGIN_TOP: 900,
  PANTONE_BRANDING_LOGO_LINE1_MARGIN_TOP: 920,
  PANTONE_BRANDING_LOGO_LINE2_MARGIN_TOP: 940,
};

export const MIME_TYPES = {
  ASE: 'application/vnd.adobe.color-swatch',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  SVG: 'image/svg+xml;charset=utf-8',
  SVG_PLAIN: 'image/svg+xml',
};

export const MIME_TYPE_TO_EXTENSION = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

export const MAX_FILENAME_LENGTH = 100;
