/**
 * Curated Plugin Topics
 *
 * Topics define the available actions for the Curated service.
 * Use these with plugin.dispatch() for direct API access,
 * or use the CuratedProvider for a friendlier interface.
 */

/**
 * Source types for curated themes (Kuler, Behance, Stock, Color Gradients)
 */
export const CuratedSources = {
  BEHANCE: 'BEHANCE',
  KULER: 'KULER',
  STOCK: 'STOCK',
  COLOR_GRADIENTS: 'COLOR_GRADIENTS',
};

/**
 * Curated data topics
 */
export const CuratedTopics = {
  DATA: {
    FETCH: 'curated.data.fetch',
    FETCH_BY_SOURCE: 'curated.data.fetchBySource',
    FETCH_GROUPED_BY_SOURCE: 'curated.data.fetchGroupedBySource',
  },
};

/**
 * Action group identifiers
 */
export const CuratedActionGroups = {
  DATA: 'data',
};
