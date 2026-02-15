// ── Request Defaults ──
export const DEFAULT_BATCH_SIZE = 20;
export const DEFAULT_PAGE_NUMBER = 1;
export const AVAILABILITY_CHECK_BATCH_SIZE = 1;

// ── FormData Field Names ──
export const FORM_FIELD_REQUEST = 'request';
export const FORM_FIELD_IMAGE = 'image';

// ── Search Request Body ──
export const SEARCH_SCOPE = Object.freeze(['stock']);
export const SEARCH_ASSET_TYPE = Object.freeze(['images']);

// ── Custom Headers (universal-specific) ──
export const HEADER_X_PRODUCT = 'x-product';
export const HEADER_X_PRODUCT_LOCATION = 'x-product-location';
export const PRODUCT_NAME = 'Color';
export const PRODUCT_LOCATION = 'Color Website';

// ── Validation Messages ──
export const ERROR_IMAGE_REQUIRED_SEARCH = 'imageFile (File) is required for similarity search';
export const ERROR_IMAGE_REQUIRED_CHECK = 'imageFile (File) is required for availability check';
export const ERROR_FIELD_IMAGE = 'criteria.imageFile';
