/**
 * Kuler Plugin Topics
 *
 * Topics define the available actions for the Kuler service.
 * Topic names are generic and functionality-focused.
 * Use these with plugin.dispatch() for direct API access,
 * or use the KulerProvider for a friendlier interface.
 */
export const KulerTopics = {
  SEARCH: {
    THEMES: 'search.themes',
    GRADIENTS: 'search.gradients',
    PUBLISHED: 'search.published',
  },
  THEME: {
    GET: 'theme.get',
    SAVE: 'theme.save',
    DELETE: 'theme.delete',
    NAMES: 'theme.names',
  },
  GRADIENT: {
    SAVE: 'gradient.save',
    DELETE: 'gradient.delete',
  },
  LIKE: {
    UPDATE: 'like.update',
  },
};

/**
 * Action group identifiers
 */
export const KulerActionGroups = {
  SEARCH: 'search',
  THEME: 'theme',
  GRADIENT: 'gradient',
  LIKE: 'like',
};
