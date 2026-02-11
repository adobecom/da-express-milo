/* eslint max-classes-per-file: "off" */
import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { StockTopics } from '../topics.js';
import { STOCK_DEFAULT_BATCH_SIZE, CURATED_GALLERIES_STOCK } from '../constants.js';

/**
 * @typedef {Object} StockSearchCriteria
 * @property {string} main
 * @property {string} [query]
 * @property {number} [pageNumber]
 */

/**
 * @typedef {Object} StockSearchResponse
 * @property {Array<Object>} themes
 * @property {number} nb_results
 * @property {boolean} [hasMore]
 */

/** @param {Object} data @param {number} [offset] @returns {StockSearchResponse} */
function parseStockData(data, offset) {
  const parsed = { ...data };
  parsed.themes = parsed.files || [];
  delete parsed.files;
  if (offset !== undefined) {
    parsed.hasMore = offset + parsed.themes.length < (parsed.nb_results || 0);
  }
  return parsed;
}

export class SearchActions extends BaseActionGroup {
  getHandlers() {
    return {
      [StockTopics.SEARCH.FILES]: this.searchFiles.bind(this),
    };
  }

  /** @param {StockSearchCriteria} criteria @returns {Object} */
  static buildSearchParams(criteria) {
    const pageNumber = Number.parseInt(String(criteria?.pageNumber || 1), 10);
    const offset = (pageNumber - 1) * STOCK_DEFAULT_BATCH_SIZE;
    return {
      locale: 'en-US',
      'search_parameters[words]': criteria?.main || criteria?.query || '',
      'search_parameters[filters][content_type:photo]': '1',
      'search_parameters[filters][premium]': 'false',
      'search_parameters[limit]': String(STOCK_DEFAULT_BATCH_SIZE),
      'search_parameters[offset]': String(offset),
    };
  }

  /** @param {StockSearchCriteria} criteria @returns {Promise<StockSearchResponse>} */
  async searchFiles(criteria) {
    if (!criteria?.main && !criteria?.query) {
      throw new ValidationError('Search query is required', {
        field: 'criteria.main | criteria.query',
        serviceName: 'Stock',
        topic: StockTopics.SEARCH.FILES,
      });
    }
    const path = this.plugin.endpoints.search;
    const params = SearchActions.buildSearchParams(criteria);
    const offset = Number.parseInt(params['search_parameters[offset]'], 10);
    const response = await this.plugin.get(path, { params });
    return parseStockData(response, offset);
  }
}

export class GalleryActions extends BaseActionGroup {
  getHandlers() {
    return {
      [StockTopics.GALLERY.GET_CURATED_LIST]: this.getCuratedList.bind(this),
      [StockTopics.GALLERY.GET_BY_NAME]: this.getByName.bind(this),
    };
  }

  /** @returns {{ themes: Array<{ title: string }> }} */
  // eslint-disable-next-line class-methods-use-this
  getCuratedList() {
    const themes = CURATED_GALLERIES_STOCK.map((title) => ({ title }));
    return { themes };
  }

  /** @param {StockSearchCriteria} criteria @returns {Promise<StockSearchResponse|undefined>} */
  async getByName(criteria) {
    const name = criteria?.main || criteria?.query;
    if (!CURATED_GALLERIES_STOCK.includes(name)) {
      return undefined;
    }
    return this.plugin.dispatch(StockTopics.SEARCH.FILES, { ...criteria, main: name, query: name });
  }
}

export class DataActions extends BaseActionGroup {
  getHandlers() {
    return {
      [StockTopics.DATA.CHECK_AVAILABILITY]: this.checkAvailability.bind(this),
    };
  }

  /** @param {string} endPoint @returns {Promise<boolean>} */
  async checkAvailability(endPoint) {
    try {
      const headers = this.plugin.getHeaders();
      const response = await fetch(endPoint, { method: 'GET', headers });
      if (!response.ok) {
        return false;
      }
      const json = await response.json();
      const parsed = parseStockData(json);
      return Array.isArray(parsed.themes) && parsed.themes.length > 0;
    } catch {
      return false;
    }
  }
}

export class RedirectActions extends BaseActionGroup {
  getHandlers() {
    return {
      [StockTopics.REDIRECT.GET_FILE_URL]: this.getFileUrl.bind(this),
      [StockTopics.REDIRECT.GET_CONTRIBUTOR_URL]: this.getContributorUrl.bind(this),
    };
  }

  /** @param {string|number} fileId @returns {string} */
  getFileUrl(fileId) {
    if (fileId === undefined || fileId === null || fileId === '') {
      throw new ValidationError('File ID is required', {
        field: 'fileId',
        serviceName: 'Stock',
        topic: StockTopics.REDIRECT.GET_FILE_URL,
      });
    }
    const base = this.plugin.endpoints?.redirect || 'https://stock.adobe.com';
    return `${base}/images/id/${fileId}`;
  }

  /** @param {string|number} creatorId @returns {string} */
  getContributorUrl(creatorId) {
    if (creatorId === undefined || creatorId === null || creatorId === '') {
      throw new ValidationError('Creator ID is required', {
        field: 'creatorId',
        serviceName: 'Stock',
        topic: StockTopics.REDIRECT.GET_CONTRIBUTOR_URL,
      });
    }
    const base = this.plugin.endpoints?.redirect || 'https://stock.adobe.com';
    const contributorPath = this.plugin.endpoints?.contributor || '/contributor';
    return `${base}${contributorPath}/${creatorId}`;
  }
}
