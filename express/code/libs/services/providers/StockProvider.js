import BaseProvider from './BaseProvider.js';
import { StockTopics, StockActionGroups } from '../plugins/stock/topics.js';

/**
 * Stock Provider
 *
 * Provides a clean API for searching Adobe Stock images.
 * Uses the useAction pattern for cached, reusable action functions.
 *
 * @example
 * const stock = await serviceManager.getProvider('stock');
 * const results = await stock.searchThemes('sunset', { page: 1 });
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
   * Actions are bound once and reused for all calls, providing:
   * - Better performance (no topic lookup on each call)
   * - Cleaner method bodies
   * - Centralized topic management
   */
  #initActions() {
    const { STOCK } = StockActionGroups;

    this.#actions = {
      getThemeList: this.plugin.useAction(STOCK, StockTopics.STOCK.GET_THEME_LIST),
      checkDataAvailability: this.plugin.useAction(STOCK, StockTopics.STOCK.CHECK_DATA_AVAILABILITY),
      getCuratedGalleryList: this.plugin.useAction(STOCK, StockTopics.STOCK.GET_CURATED_GALLERY_LIST),
      getGalleryByName: this.plugin.useAction(STOCK, StockTopics.STOCK.GET_GALLERY_BY_NAME),
    };
  }

  /**
   * Private transform for search parameters
   *
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @returns {Object} Transformed criteria for plugin
   */
  #transformSearchParams(query, options = {}) {
    return {
      main: query,
      query,
      pageNumber: options.page || 1,
    };
  }

  /**
   * Search for Stock themes/images
   *
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @param {number} [options.page=1] - Page number (1-indexed)
   * @returns {Promise<Object|null>} Search results or null on failure
   */
  async searchThemes(query, options = {}) {
    const criteria = this.#transformSearchParams(query, options);
    return this.safeExecute(() => this.#actions.getThemeList(criteria));
  }

  /**
   * Check if data is available for a Stock endpoint
   *
   * @param {string} endpoint - Full endpoint URL to check
   * @returns {Promise<boolean|null>} Availability status or null on failure
   */
  async checkDataAvailability(endpoint) {
    return this.safeExecute(() => this.#actions.checkDataAvailability(endpoint));
  }

  /**
   * Get curated gallery list
   *
   * @returns {Promise<Object|null>} Gallery list or null on failure
   */
  async getCuratedGalleries() {
    return this.safeExecute(() => this.#actions.getCuratedGalleryList());
  }

  /**
   * Get gallery by name
   *
   * @param {string} name - Gallery name
   * @param {Object} [options] - Search options
   * @returns {Promise<Object|null>} Gallery data or null on failure
   */
  async getGalleryByName(name, options = {}) {
    const criteria = this.#transformSearchParams(name, options);
    return this.safeExecute(() => this.#actions.getGalleryByName(criteria));
  }
}

/**
 * Factory function to create a new Stock provider instance.
 * Useful for testing or when isolated instances are needed.
 *
 * @param {Object} plugin - Plugin instance
 * @returns {StockProvider} New provider instance
 */
export function createStockProvider(plugin) {
  return new StockProvider(plugin);
}

