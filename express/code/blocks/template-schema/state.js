/**
 * Global state and constants for the Template Schema block
 */

export const STORAGE_KEY = 'daas';

// Global state for repeater management and authentication
export const state = {
  cachedPlainHtml: null,
  repeaterCounts: {}, // { faq: 1, etc: 2 }
  authToken: null, // Bearer token for API calls
  authSource: null, // 'ims' or 'code' - where the token came from
};

