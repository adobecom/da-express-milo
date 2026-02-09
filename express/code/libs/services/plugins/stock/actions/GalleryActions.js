import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { StockTopics } from '../topics.js';
import { CURATED_GALLERIES_STOCK } from '../constants.js';

/**
 * GalleryActions - Handles curated Stock galleries
 *
 * Actions:
 * - getCuratedList - Return predefined gallery names (no API call)
 * - getByName - Fetch gallery content by name (uses Search/Files with gallery name as query)
 */
export default class GalleryActions extends BaseActionGroup {
  /**
   * Map topics to specific methods in this class
   */
  getHandlers() {
    return {
      [StockTopics.GALLERY.GET_CURATED_LIST]: this.getCuratedList.bind(this),
      [StockTopics.GALLERY.GET_BY_NAME]: this.getByName.bind(this),
    };
  }

  /**
   * Get curated gallery list (static list per STOCK_API.md)
   *
   * @returns {Object} Object with themes array of gallery titles
   */
  getCuratedList() {
    const themes = CURATED_GALLERIES_STOCK.map((title) => ({ title }));
    return { themes };
  }

  /**
   * Get gallery content by name (searches Stock with gallery name as query)
   *
   * @param {Object} criteria - Criteria with main or query as gallery name
   * @param {string} criteria.main - Gallery name
   * @param {string} [criteria.query] - Gallery name (alias)
   * @param {number} [criteria.pageNumber=1] - Page number
   * @returns {Promise<Object|undefined>} Gallery search results or undefined if not a curated name
   */
  async getByName(criteria) {
    const name = criteria?.main || criteria?.query;
    if (!CURATED_GALLERIES_STOCK.includes(name)) {
      return undefined;
    }
    return this.plugin.dispatch(StockTopics.SEARCH.FILES, { ...criteria, main: name, query: name });
  }
}
