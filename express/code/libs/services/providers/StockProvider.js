import BaseProvider from './BaseProvider.js';
import { StockTopics, StockActionGroups } from '../plugins/stock/topics.js';

export default class StockProvider extends BaseProvider {
  /** @type {Object} */
  #actions = {};

  /** @param {Object} plugin - Plugin instance */
  constructor(plugin) {
    super(plugin);
    this.#initActions();
  }

  #initActions() {
    const { SEARCH, GALLERY, DATA, REDIRECT } = StockActionGroups;

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
   * @returns {Promise<Object|null>} Gallery list or null on failure
   */
  async getCuratedGalleries() {
    return this.safeExecute(() => this.#actions.getCuratedList());
  }

  /**
   * @param {string} name - Gallery name
   * @param {Object} [options] - Search options
   * @returns {Promise<Object|null|undefined>} Gallery data or null/undefined on failure
   */
  async getGalleryByName(name, options = {}) {
    const criteria = this.#transformSearchParams(name, options);
    return this.safeExecute(() => this.#actions.getGalleryByName(criteria));
  }

  /**
   * @param {string} endpoint - Full endpoint URL to check
   * @returns {Promise<boolean|null>} Availability status or null on failure
   */
  async checkDataAvailability(endpoint) {
    return this.safeExecute(() => this.#actions.checkAvailability(endpoint));
  }

  /**
   * @param {string|number} fileId - Stock file ID
   * @returns {string|null} URL to stock.adobe.com or null on failure
   */
  getFileRedirectUrl(fileId) {
    return this.safeExecuteSync(() => this.#actions.getFileUrl(fileId));
  }

  /**
   * @param {string|number} creatorId - Creator ID
   * @returns {string|null} URL to contributor page or null on failure
   */
  getContributorUrl(creatorId) {
    return this.safeExecuteSync(() => this.#actions.getContributorUrl(creatorId));
  }
}

/**
 * @param {Object} plugin - Plugin instance
 * @returns {StockProvider} New provider instance
 */
export function createStockProvider(plugin) {
  return new StockProvider(plugin);
}
