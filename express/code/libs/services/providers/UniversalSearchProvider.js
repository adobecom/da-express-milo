import BaseProvider from './BaseProvider.js';
import { UniversalSearchTopics, UniversalSearchActionGroups } from '../plugins/universal/topics.js';
import { DEFAULT_BATCH_SIZE, DEFAULT_PAGE_NUMBER } from '../plugins/universal/constants.js';

export default class UniversalSearchProvider extends BaseProvider {
  #actions = {};

  /** @param {Object} plugin - Plugin instance */
  constructor(plugin) {
    super(plugin);
    this.#initActions();
  }

  #initActions() {
    const { SEARCH, URL } = UniversalSearchActionGroups;

    this.#actions = {
      searchByImage: this.plugin.useAction(SEARCH, UniversalSearchTopics.SEARCH.BY_IMAGE),
      checkDataAvailability: this.plugin.useAction(
        SEARCH,
        UniversalSearchTopics.SEARCH.CHECK_AVAILABILITY,
      ),
      getSearchUrl: this.plugin.useAction(URL, UniversalSearchTopics.URL.GET),
    };
  }

  /**
   * @param {File} imageFile - Image file to search with
   * @param {Object} [options] - Search options
   * @param {number} [options.limit=20] - Result limit per page
   * @param {number} [options.startIndex=0] - Start index for pagination
   * @param {number} [options.page=1] - Page number (1-indexed); used if startIndex not set
   * @returns {Promise<Object|null>} Parsed response with themes and total_results,
   *   or null on failure
   */
  async searchByImage(imageFile, options = {}) {
    const criteria = {
      imageFile,
      limit: options.limit ?? DEFAULT_BATCH_SIZE,
      startIndex: options.startIndex,
      pageNumber: options.page ?? DEFAULT_PAGE_NUMBER,
    };
    return this.safeExecute(() => this.#actions.searchByImage(criteria));
  }

  /**
   * @param {File} imageFile - Image file to check
   * @returns {Promise<boolean>} True if at least one result is available;
   *   false on error or no results
   */
  async checkDataAvailability(imageFile) {
    if (!imageFile || !(imageFile instanceof File)) {
      return false;
    }
    return this.safeExecute(() => this.#actions.checkDataAvailability({ imageFile })) ?? false;
  }

  /**
   * @param {boolean} [isLoggedIn] - Override auth state; if omitted, uses current user
   * @returns {{ fullUrl: string, basePath: string, api: string, searchPath: string }|null}
   */
  getSearchUrl(isLoggedIn) {
    return this.safeExecute(() => this.#actions.getSearchUrl(isLoggedIn));
  }
}

/**
 * @param {Object} plugin - Plugin instance
 * @returns {UniversalSearchProvider} New provider instance
 */
export function createUniversalSearchProvider(plugin) {
  return new UniversalSearchProvider(plugin);
}
