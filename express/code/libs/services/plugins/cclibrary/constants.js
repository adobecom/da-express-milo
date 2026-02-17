export const THEME_ELEMENT_TYPE = 'application/vnd.adobe.element.colortheme+dcx';

export const GRADIENT_ELEMENT_TYPE = 'application/vnd.adobe.element.gradient+dcx';

export const THEME_REPRESENTATION_TYPE = 'application/vnd.adobe.colortheme+json';

export const GRADIENT_REPRESENTATION_TYPE = 'application/vnd.adobe.gradient+json';

export const ALL_COLOR_ELEMENT_TYPES = `${THEME_ELEMENT_TYPE},${GRADIENT_ELEMENT_TYPE}`;

export const LIBRARIES_PAGE_SIZE = 40;

export const ELEMENTS_PAGE_SIZE = 50;

export const MAX_ELEMENTS_PER_LIBRARY = 1000;

export const LIBRARY_OWNERSHIP = {
  PRIVATE: 'private',
  SHARED: 'shared',
};

export const LIBRARY_ROLE = {
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export const ERROR_CODE = {
  STORAGE_FULL: 'STORAGE_FULL',
};

export const HTTP_STATUS = {
  STORAGE_FULL: 507,
};

export const COLOR_MODE = {
  RGB: 'RGB',
  CMYK: 'CMYK',
  HSB: 'HSB',
  LAB: 'LAB',
};

/**
 * CC Library mode strings as expected by the Melville API.
 * Note: LAB must be 'Lab' (mixed case), not 'LAB'.
 */
export const CC_LIBRARY_COLOR_MODE = {
  RGB: 'RGB',
  CMYK: 'CMYK',
  HSB: 'HSB',
  LAB: 'Lab',
};

export const CLIENT_INFO = {
  deviceId: 'express-color-explorer',
  appId: 'AdobeExpress',
};

export const COLOR_PROFILE = 'sRGB IEC61966-2.1';
