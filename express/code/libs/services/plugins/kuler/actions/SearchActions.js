import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { KulerTopics } from '../topics.js';

const KULER_DEFAULT_BATCH_SIZE = 72;

export default class SearchActions extends BaseActionGroup {
  getHandlers() {
    return {
      [KulerTopics.SEARCH.THEMES]: this.fetchThemeList.bind(this),
      [KulerTopics.SEARCH.GRADIENTS]: this.fetchGradientList.bind(this),
      [KulerTopics.SEARCH.PUBLISHED]: this.searchPublishedTheme.bind(this),
    };
  }

  /**
   * @param {Object} criteria
   * @param {string} criteria.main
   * @param {string} [criteria.typeOfQuery]
   * @returns {string}
   */
  static buildKulerQuery(criteria) {
    const type = criteria.typeOfQuery || 'term';
    const queryObj = { [type]: criteria.main };
    return JSON.stringify(queryObj);
  }

  /**
   * @param {Object} criteria
   * @param {string} criteria.main
   * @param {string} [criteria.typeOfQuery]
   * @param {number} criteria.pageNumber
   * @param {string} assetType
   * @returns {string}
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
   * @param {Object} criteria
   * @param {string} criteria.main
   * @param {string} [criteria.typeOfQuery]
   * @param {number} criteria.pageNumber
   * @param {string} [assetType='THEME']
   * @returns {Promise<Object>}
   */
  async fetchThemeList(criteria, assetType = 'THEME') {
    const url = this.buildSearchUrl(criteria, assetType);
    return this.makeRequestWithFullUrl(url, 'GET');
  }

  /**
   * @param {Object} criteria
   * @param {string} criteria.main
   * @param {string} [criteria.typeOfQuery]
   * @param {number} criteria.pageNumber
   * @returns {Promise<Object>}
   */
  async fetchGradientList(criteria) {
    return this.fetchThemeList(criteria, 'GRADIENT');
  }

  /**
   * @param {string} fullUrl
   * @param {string} method
   * @param {Object} [body]
   * @returns {Promise<Object>}
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
   * @param {string} url
   * @returns {Promise<Object>}
   */
  async searchPublishedTheme(url) {
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `${this.plugin.baseUrl}${url}`;
    }

    return this.makeRequestWithFullUrl(fullUrl, 'GET');
  }
}
