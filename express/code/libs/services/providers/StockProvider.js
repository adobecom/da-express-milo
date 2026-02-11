import BaseProvider from './BaseProvider.js';
import { StockTopics, StockActionGroups } from '../plugins/stock/topics.js';

/**
 * Stock Provider
 *
 * Provides a clean API for Adobe Stock: search, galleries, data checks, and redirect URLs.
 * Uses the useAction pattern for cached, reusable action functions.
 *
 * @example
 * const stock = await serviceManager.getProvider('stock');
 * const results = await stock.searchThemes('sunset', { page: 1 });
 * const fileUrl = stock.getFileRedirectUrl(123456789);
 */
export default class StockProvider extends BaseProvider {
  /**
   * Cached action functions
   * @type {Object}
   */
  #actions = {};

  /**
   * @param {Object} plugin - Plugin instance
   */
  constructor(plugin) {
    super(plugin);
    this.#initActions();
  }

  /**
   * Initialize action functions from plugin using useAction.
   * Redirect actions are resolved directly from the action group
   * to avoid the async dispatch() path — they are pure URL builders.
   */
  #initActions() {
    const { SEARCH, GALLERY, DATA, REDIRECT } = StockActionGroups;

    // Resolve redirect handlers directly (sync — no dispatch overhead)
    const redirectGroup = this.plugin.useAction(REDIRECT);
    const redirectHandlers = redirectGroup?.getHandlers?.() || {};

    this.#actions = {
      searchFiles: this.plugin.useAction(SEARCH, StockTopics.SEARCH.FILES),
      getCuratedList: this.plugin.useAction(GALLERY, StockTopics.GALLERY.GET_CURATED_LIST),
      getGalleryByName: this.plugin.useAction(GALLERY, StockTopics.GALLERY.GET_BY_NAME),
      checkAvailability: this.plugin.useAction(DATA, StockTopics.DATA.CHECK_AVAILABILITY),
      getFileUrl: redirectHandlers[StockTopics.REDIRECT.GET_FILE_URL],
      getContributorUrl: redirectHandlers[StockTopics.REDIRECT.GET_CONTRIBUTOR_URL],
    };
  }

  /**
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @returns {Object} Criteria for plugin
   */
  // eslint-disable-next-line class-methods-use-this
  #transformSearchParams(query, options = {}) {
    return {
      main: query,
      query,
      pageNumber: options.page || 1,
    };
  }

  /**
   * Search for Stock themes/images (Search/Files API)
   *
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @param {number} [options.page=1] - Page number (1-indexed)
   * @returns {Promise<Object|null>} Search results (themes, nb_results) or null on failure
   */
  async searchThemes(query, options = {}) {
    const criteria = this.#transformSearchParams(query, options);
    return this.safeExecute(() => this.#actions.searchFiles(criteria));
  }

  /**
   * Get curated gallery list (static list: Wilderness, Flavour, Travel)
   *
   * @returns {Promise<Object|null>} Gallery list or null on failure
   */
  async getCuratedGalleries() {
    return this.safeExecute(() => this.#actions.getCuratedList());
  }

  /**
   * Get gallery by name (searches Stock with gallery name as query)
   *
   * @param {string} name - Gallery name
   * @param {Object} [options] - Search options
   * @returns {Promise<Object|null|undefined>}
   * Gallery data or null/undefined on failure or unknown name
   */
  async getGalleryByName(name, options = {}) {
    const criteria = this.#transformSearchParams(name, options);
    return this.safeExecute(() => this.#actions.getGalleryByName(criteria));
  }

  /**
   * Check if data is available for a Stock endpoint URL
   *
   * @param {string} endpoint - Full endpoint URL to check
   * @returns {Promise<boolean|null>} Availability status or null on failure
   */
  async checkDataAvailability(endpoint) {
    return this.safeExecute(() => this.#actions.checkAvailability(endpoint));
  }

  /**
   * Get Stock website URL for a file (redirect to view image)
   *
   * @param {string|number} fileId - Stock file ID
   * @returns {string|null} URL to stock.adobe.com or null on failure
   */
  getFileRedirectUrl(fileId) {
    return this.safeExecuteSync(() => this.#actions.getFileUrl(fileId));
  }

  /**
   * Get Stock website URL for a contributor profile
   *
   * @param {string|number} creatorId - Creator ID
   * @returns {string|null} URL to contributor page or null on failure
   */
  getContributorUrl(creatorId) {
    return this.safeExecuteSync(() => this.#actions.getContributorUrl(creatorId));
  }
}

/**
 * Factory function to create a new Stock provider instance.
 *
 * @param {Object} plugin - Plugin instance
 * @returns {StockProvider} New provider instance
 */
export function createStockProvider(plugin) {
  return new StockProvider(plugin);
}
