/**
 * Behance Plugin Topics
 *
 * Topics define the available actions for the Behance service.
 * Use these with plugin.dispatch() for direct API access,
 * or use the BehanceProvider for a friendlier interface.
 *
 * API reference: docs/api/BEHANCE_API.md
 */
export const BehanceTopics = {
  PROJECTS: {
    SEARCH: 'projects.search',
  },
  GALLERIES: {
    LIST: 'galleries.list',
    PROJECTS: 'galleries.projects',
  },
  GRAPHQL: {
    GRAPHIC_DESIGN_LIST: 'graphql.graphicDesignList',
  },
};

/**
 * Action group identifiers
 */
export const BehanceActionGroups = {
  PROJECTS: 'projects',
  GALLERIES: 'galleries',
  GRAPHQL: 'graphql',
};
