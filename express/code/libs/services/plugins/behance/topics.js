/**
 * @type {{
 *   PROJECTS: { SEARCH: string },
 *   GALLERIES: { LIST: string, PROJECTS: string },
 *   GRAPHQL: { GRAPHIC_DESIGN_LIST: string },
 * }}
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

/** @type {{ PROJECTS: string, GALLERIES: string, GRAPHQL: string }} */
export const BehanceActionGroups = {
  PROJECTS: 'projects',
  GALLERIES: 'galleries',
  GRAPHQL: 'graphql',
};
