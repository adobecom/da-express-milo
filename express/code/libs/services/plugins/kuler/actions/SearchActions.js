import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { KulerTopics } from '../topics.js';

/**
 * KULER_DEFAULT_BATCH_SIZE - Default batch size for pagination
 */
const KULER_DEFAULT_BATCH_SIZE = 72;

/**
 * SearchActions - Handles all search-related operations for Kuler
 *
 * Actions:
 * - fetchThemeList - Search and retrieve themes
 * - fetchGradientList - Search and retrieve gradients
 * - searchPublishedTheme - Check if a theme is already published
 */
export default class SearchActions extends BaseActionGroup {
  /**
   * Map topics to specific methods in this class
   */
  getHandlers() {
    return {
      [KulerTopics.SEARCH.THEMES]: this.fetchThemeList.bind(this),
      [KulerTopics.SEARCH.GRADIENTS]: this.fetchGradientList.bind(this),
      [KulerTopics.SEARCH.PUBLISHED]: this.searchPublishedTheme.bind(this),
    };
  }

  /**
   * Builds the Kuler query parameter
   * Kuler expects `q={"term":"value"}` encoded
   *
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.main - Search query
   * @param {string} [criteria.typeOfQuery] - Query type ('term', 'tag', 'hex', 'similarHex')
   * @returns {string} JSON stringified query object
   */
  static buildKulerQuery(criteria) {
    const type = criteria.typeOfQuery || 'term';
    const queryObj = { [type]: criteria.main };
    return JSON.stringify(queryObj);
  }

  /**
   * Builds the search URL for themes or gradients
   *
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.main - Search query
   * @param {string} [criteria.typeOfQuery] - Query type
   * @param {number} criteria.pageNumber - Page number (1-indexed)
   * @param {string} assetType - Type of asset ('THEME' or 'GRADIENT')
   * @returns {string} Complete search URL
   */
  buildSearchUrl(criteria, assetType = 'THEME') {
    const basePath = this.plugin.baseUrl;
    const searchPath = this.plugin.endpoints.search;

    const pageNum = Number.parseInt(String(criteria.pageNumber || 1), 10);
    const startIndex = (pageNum - 1) * KULER_DEFAULT_BATCH_SIZE;
    const queryParam = encodeURIComponent(SearchActions.buildKulerQuery(criteria));

    let url = `${basePath}${searchPath}?q=${queryParam}`;

    const auth = this.plugin.getAuthState();
    if (auth.isLoggedIn) {
      url = `${url}&metadata=all`;
    }

    url = `${url}&startIndex=${startIndex}&maxNumber=${KULER_DEFAULT_BATCH_SIZE}&assetType=${assetType}`;

    return url;
  }

  /**
   * Fetch list of themes based on search criteria
   *
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.main - Search query
   * @param {string} [criteria.typeOfQuery] - Query type ('term', 'tag', 'hex', 'similarHex')
   * @param {number} criteria.pageNumber - Page number (1-indexed)
   * @param {string} [assetType='THEME'] - Type of asset ('THEME' or 'GRADIENT')
   * @returns {Promise<Object>} Promise resolving to theme list response
   */
  async fetchThemeList(criteria, assetType = 'THEME') {
    const url = this.buildSearchUrl(criteria, assetType);
    return this.makeRequestWithFullUrl(url, 'GET');
  }

  /**
   * Fetch list of gradients based on search criteria
   *
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.main - Search query
   * @param {string} [criteria.typeOfQuery] - Query type
   * @param {number} criteria.pageNumber - Page number (1-indexed)
   * @returns {Promise<Object>} Promise resolving to gradient list response
   */
  async fetchGradientList(criteria) {
    return this.fetchThemeList(criteria, 'GRADIENT');
  }

  /**
   * Helper method to make a request with a full URL
   * This is needed because different Kuler operations use different base URLs
   *
   * @param {string} fullUrl - Complete URL for the request
   * @param {string} method - HTTP method ('GET', 'POST', 'DELETE', etc.)
   * @param {Object} [body] - Request body (for POST/PUT)
   * @returns {Promise<Object>} Promise resolving to response data
   */
  async makeRequestWithFullUrl(fullUrl, method = 'GET', body = null) {
    const headers = this.plugin.getHeaders();

    const options = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = body instanceof FormData ? body : JSON.stringify(body);
      if (body instanceof FormData) {
        delete options.headers['Content-Type'];
      }
    }

    const response = await fetch(fullUrl, options);
    return this.plugin.handleResponse(response);
  }

  /**
   * Search for a published theme
   *
   * @param {string} url - Search URL (can be a full URL or relative path)
   * @returns {Promise<Object>} Promise resolving to search results
   */
  async searchPublishedTheme(url) {
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `${this.plugin.baseUrl}${url}`;
    }

    return this.makeRequestWithFullUrl(fullUrl, 'GET');
  }
}
