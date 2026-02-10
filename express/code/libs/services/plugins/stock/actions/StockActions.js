import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { StockTopics } from '../topics.js';
import {
  STOCK_DEFAULT_BATCH_SIZE,
  CURATED_GALLERIES_STOCK,
  ASYNC_REQUEST_STATUS,
} from '../constants.js';

/**
 * StockActions - Handles all Stock-related operations
 *
 * Actions:
 * - fetchStockThemeList - Search Stock for images
 * - isDataAvailableForStock - Check if data is available
 * - fetchStockGalleryList - Get curated gallery list
 * - fetchStockGalleryByName - Get specific gallery by name
 */
export default class StockActions extends BaseActionGroup {
  /**
   * Map topics to specific methods in this class
   */
  getHandlers() {
    return {
      [StockTopics.STOCK.GET_THEME_LIST]: this.fetchStockThemeList.bind(this),
      [StockTopics.STOCK.CHECK_DATA_AVAILABILITY]: this.isDataAvailableForStock.bind(this),
      [StockTopics.STOCK.GET_CURATED_GALLERY_LIST]: this.fetchStockGalleryList.bind(this),
      [StockTopics.STOCK.GET_GALLERY_BY_NAME]: this.fetchStockGalleryByName.bind(this),
    };
  }

  /**
   * Parse Stock API response
   * Transforms 'files' property to 'themes' for consistency
   *
   * @param {Object} data - Raw Stock API response
   * @returns {Object} Parsed response with 'themes' property
   */
  // eslint-disable-next-line class-methods-use-this
  parseStockData(data) {
    const parsed = { ...data };
    parsed.themes = parsed.files || [];
    delete parsed.files;
    return parsed;
  }

  /**
   * Handle API errors
   *
   * @param {Error} error - Original error
   * @param {string} method - Method name where error occurred
   * @returns {Error} Enhanced error object
   */
  // eslint-disable-next-line class-methods-use-this
  handleError(error, method) {
    let errorStatus = ASYNC_REQUEST_STATUS.COMPLETED_WITH_GENERIC_ERROR;

    if (error.response && error.response.status) {
      errorStatus = error.response.status;
    }

    const apiError = new Error(`StockApiService.${method} failed: ${error.message}`);
    apiError.status = errorStatus;
    apiError.originalError = error;

    // eslint-disable-next-line no-console
    console.error(`StockApiService.${method} error:`, error);

    return apiError;
  }

  /**
   * Build Stock search parameters
   *
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.main - Search query
   * @param {number} [criteria.pageNumber=1] - Page number
   * @returns {Object} Stock API search parameters
   */
  // eslint-disable-next-line class-methods-use-this
  buildStockSearchParams(criteria) {
    const startIndex = (
      Number.parseInt(String(criteria.pageNumber || 1), 10) - 1) * STOCK_DEFAULT_BATCH_SIZE;
    const limit = STOCK_DEFAULT_BATCH_SIZE;
    return {
      locale: 'en-US',
      'search_parameters[words]': criteria.main || criteria.query,
      'search_parameters[filters][content_type:photo]': '1',
      'search_parameters[filters][premium]': 'false',
      'search_parameters[limit]': String(limit),
      'search_parameters[offset]': String(startIndex),
    };
  }

  /**
   * Fetch Stock theme list based on search criteria
   *
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object>} Promise resolving to parsed Stock response
   */
  async fetchStockThemeList(criteria) {
    const { endpoints } = this.plugin;
    const path = endpoints.search;
    const params = this.buildStockSearchParams(criteria);

    try {
      const response = await this.plugin.get(path, { params });
      return this.parseStockData(response);
    } catch (error) {
      throw this.handleError(error, 'fetchStockThemeList');
    }
  }

  /**
   * Check if data is available for a Stock endpoint
   *
   * @param {string} endPoint - Full endpoint URL to check
   * @returns {Promise<boolean>} Promise resolving to availability status
   */
  async isDataAvailableForStock(endPoint) {
    try {
      const headers = this.plugin.getHeaders();
      const response = await fetch(endPoint, { method: 'GET', headers });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const json = await response.json();
      const parsed = this.parseStockData(json);
      return parsed.themes.length > 0;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('StockApiService.isDataAvailableForStock error:', error);
      return false;
    }
  }

  /**
   * Fetch curated Stock gallery list
   *
   * @returns {Object} Object with themes array containing gallery titles
   */
  // eslint-disable-next-line class-methods-use-this
  fetchStockGalleryList() {
    const themes = CURATED_GALLERIES_STOCK.map((title) => ({ title }));
    return { themes };
  }

  /**
   * Fetch Stock gallery by name
   *
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.main - Gallery name
   * @returns {Promise<Object|undefined>} Promise resolving to gallery data or undefined
   */
  async fetchStockGalleryByName(criteria) {
    if (!CURATED_GALLERIES_STOCK.includes(criteria.main)) {
      return undefined;
    }
    return this.fetchStockThemeList(criteria);
  }
}
