/**
 * CC Library Plugin Topics
 *
 * Topics define the available actions for the CC Libraries (Melville) service.
 * Use these with plugin.dispatch() for direct API access,
 * or use the CCLibraryProvider for a friendlier interface.
 */
export const CCLibraryTopics = {
  LIBRARY: {
    CREATE: 'cclibrary.library.create',
    FETCH: 'cclibrary.library.fetch',
    ELEMENTS: 'cclibrary.library.elements',
  },
  THEME: {
    SAVE: 'cclibrary.theme.save',
    SAVE_GRADIENT: 'cclibrary.theme.saveGradient',
    DELETE: 'cclibrary.theme.delete',
    UPDATE: 'cclibrary.theme.update',
    UPDATE_METADATA: 'cclibrary.theme.updateMetadata',
  },
};

/**
 * Action group identifiers
 */
export const CCLibraryActionGroups = {
  LIBRARY: 'library',
  THEME: 'theme',
};
