import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { StockTopics } from '../topics.js';

/**
 * RedirectActions - Builds Stock website URLs (no HTTP calls)
 *
 * Actions:
 * - getFileUrl - URL to view a stock file on stock.adobe.com
 * - getContributorUrl - URL to view contributor profile
 */
export default class RedirectActions extends BaseActionGroup {
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
        topic: 'REDIRECT.GET_FILE_URL',
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
        topic: 'REDIRECT.GET_CONTRIBUTOR_URL',
      });
    }
    const base = this.plugin.endpoints?.redirect || 'https://stock.adobe.com';
    const contributorPath = this.plugin.endpoints?.contributor || '/contributor';
    return `${base}${contributorPath}/${creatorId}`;
  }
}
