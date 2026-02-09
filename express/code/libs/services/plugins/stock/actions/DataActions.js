import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { StockTopics } from '../topics.js';

/**
 * Parse Stock API response for availability check.
 *
 * @param {Object} data - Raw Stock API response
 * @returns {Object} Parsed with themes array
 */
function parseStockData(data) {
  const parsed = { ...data };
  parsed.themes = parsed.files || [];
  delete parsed.files;
  return parsed;
}

/**
 * DataActions - Handles data availability checks
 *
 * Actions:
 * - checkAvailability - Check if data is available at a Stock endpoint URL
 */
export default class DataActions extends BaseActionGroup {
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
