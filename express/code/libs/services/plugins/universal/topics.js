/**
 * Universal Search Plugin Topics
 *
 * Topics define the available actions for the Universal Search (similarity/image search) service.
 * Use these with plugin.dispatch() for direct API access,
 * or use the UniversalSearchProvider for a friendlier interface.
 */
export const UniversalSearchTopics = {
  SEARCH: {
    /** Find visually similar stock images by uploading an image (auth or anonymous) */
    BY_IMAGE: 'search.byImage',
    /** Check if similarity search returns results for given image/formData */
    CHECK_AVAILABILITY: 'search.checkAvailability',
  },
  URL: {
    /** Get endpoint URL and path based on auth state (authenticated vs anonymous) */
    GET: 'url.get',
  },
};

/**
 * Action group identifiers
 */
export const UniversalSearchActionGroups = {
  SEARCH: 'search',
  URL: 'url',
};
