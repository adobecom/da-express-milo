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
  isRestoringData: false, // Flag to suppress re-render during data restoration
  isRerendering: false, // Flag to prevent re-renders while one is in progress

  // Edit mode state (when daas-page-path URL param is present)
  isEditMode: false, // True if editing an existing page
  editPagePath: null, // The DA path of the page being edited (e.g., "/adobecom/repo/express/colors/green")
  editPageData: null, // The extracted form data from the existing page
};

