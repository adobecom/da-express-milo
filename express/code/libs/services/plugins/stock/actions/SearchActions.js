import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { StockTopics } from '../topics.js';
import { STOCK_DEFAULT_BATCH_SIZE } from '../constants.js';

/**
 * Parse Stock API response.
 * Transforms 'files' to 'themes' for consistency with internal format.
 * Computes `hasMore` so consumers can paginate without extra math.
 *
 * @param {Object} data - Raw Stock API response
 * @param {number} offset - Current pagination offset used in the request
 * @returns {Object} Parsed response with 'themes' and 'hasMore' properties
 */
function parseStockData(data, offset) {
  const parsed = { ...data };
  parsed.themes = parsed.files || [];
  delete parsed.files;
  parsed.hasMore = offset + parsed.themes.length < (parsed.nb_results || 0);
  return parsed;
}

/**
 * SearchActions - Handles Stock Search/Files API
 *
 * Actions:
 * - searchFiles - Search for stock images by keyword (GET /Search/Files)
 */
export default class SearchActions extends BaseActionGroup {
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
        topic: 'SEARCH.FILES',
      });
    }
    const path = this.plugin.endpoints.search;
    const params = SearchActions.buildSearchParams(criteria);
    const offset = Number.parseInt(params['search_parameters[offset]'], 10);
    const response = await this.plugin.get(path, { params });
    return parseStockData(response, offset);
  }
}
