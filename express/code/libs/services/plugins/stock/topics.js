/**
 * Stock Plugin Topics
 *
 * Topics define the available actions for the Stock service.
 * Topic names are generic and functionality-focused.
 * Use these with plugin.dispatch() for direct API access,
 * or use the StockProvider for a friendlier interface.
 */
export const StockTopics = {
  SEARCH: {
    FILES: 'stock.search.files',
  },
  GALLERY: {
    GET_CURATED_LIST: 'stock.gallery.getCuratedList',
    GET_BY_NAME: 'stock.gallery.getByName',
  },
  DATA: {
    CHECK_AVAILABILITY: 'stock.data.checkAvailability',
  },
  REDIRECT: {
    GET_FILE_URL: 'stock.redirect.getFileUrl',
    GET_CONTRIBUTOR_URL: 'stock.redirect.getContributorUrl',
  },
};

/**
 * Action group identifiers
 */
export const StockActionGroups = {
  SEARCH: 'search',
  GALLERY: 'gallery',
  DATA: 'data',
  REDIRECT: 'redirect',
};
