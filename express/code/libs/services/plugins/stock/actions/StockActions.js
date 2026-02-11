/* eslint max-classes-per-file: "off" */
import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { StockTopics } from '../topics.js';
import { STOCK_DEFAULT_BATCH_SIZE, CURATED_GALLERIES_STOCK } from '../constants.js';

/**
 * Parse Stock API response.
 * Transforms 'files' to 'themes' for consistency with internal format.
 * Optionally computes `hasMore` when offset is provided.
 *
 * @param {Object} data - Raw Stock API response
 * @param {number} [offset] - Current pagination offset used in the request
 * @returns {Object} Parsed response with 'themes' property
 */
function parseStockData(data, offset) {
  const parsed = { ...data };
  parsed.themes = parsed.files || [];
  delete parsed.files;
  if (offset !== undefined) {
    parsed.hasMore = offset + parsed.themes.length < (parsed.nb_results || 0);
  }
  return parsed;
}

/**
 * SearchActions - Handles Stock Search/Files API
 *
 * Actions:
 * - searchFiles - Search for stock images by keyword (GET /Search/Files)
 */
export class SearchActions extends BaseActionGroup {
  /**
   * Map topics to specific methods in this class
   */
  getHandlers() {
    return {
      [StockTopics.SEARCH.FILES]: this.searchFiles.bind(this),
    };
  }

  /**
   * Build Stock Search/Files query parameters per STOCK_API.md
   *
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.main - Search query (or criteria.query)
   * @param {number} [criteria.pageNumber=1] - Page number (1-indexed)
   * @returns {Object} Query params for plugin.get()
   */
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

  /**
   * Search for stock files (images) by keyword
   *
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.main - Search query
   * @param {string} [criteria.query] - Search query (alias)
   * @param {number} [criteria.pageNumber=1] - Page number
   * @returns {Promise<Object>} Parsed response with themes (files) and nb_results
   */
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

/**
 * GalleryActions - Handles curated Stock galleries
 *
 * Actions:
 * - getCuratedList - Return predefined gallery names (no API call)
 * - getByName - Fetch gallery content by name (uses Search/Files with gallery name as query)
 */
export class GalleryActions extends BaseActionGroup {
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
  // eslint-disable-next-line class-methods-use-this
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

/**
 * DataActions - Handles data availability checks
 *
 * Actions:
 * - checkAvailability - Check if data is available at a Stock endpoint URL
 */
export class DataActions extends BaseActionGroup {
  /**
   * Map topics to specific methods in this class
   */
  getHandlers() {
    return {
      [StockTopics.DATA.CHECK_AVAILABILITY]: this.checkAvailability.bind(this),
    };
  }

  /**
   * Check if data is available for a Stock endpoint (e.g. Search/Files URL)
   *
   * @param {string} endPoint - Full endpoint URL to check
   * @returns {Promise<boolean>} True if response has files/themes with length > 0
   */
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

/**
 * RedirectActions - Builds Stock website URLs (no HTTP calls)
 *
 * Actions:
 * - getFileUrl - URL to view a stock file on stock.adobe.com
 * - getContributorUrl - URL to view contributor profile
 */
export class RedirectActions extends BaseActionGroup {
  /**
   * Map topics to specific methods in this class
   */
  getHandlers() {
    return {
      [StockTopics.REDIRECT.GET_FILE_URL]: this.getFileUrl.bind(this),
      [StockTopics.REDIRECT.GET_CONTRIBUTOR_URL]: this.getContributorUrl.bind(this),
    };
  }

  /**
   * Get redirect URL for a stock file (STOCK_API.md: getStockRedirectUrl)
   *
   * @param {string|number} fileId - Stock file ID
   * @returns {string} URL to https://stock.adobe.com/images/id/{fileId}
   */
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

  /**
   * Get contributor profile URL (STOCK_API.md: getStockContributorUrl)
   *
   * @param {string|number} creatorId - Creator/contributor ID
   * @returns {string} URL to https://stock.adobe.com/contributor/{creatorId}
   */
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
