import BaseApiService from '../../core/BaseApiService.js';
import StockActions from './actions/StockActions.js';
import { StockActionGroups } from './topics.js';

/**
 * StockPlugin - Plugin for Adobe Stock API
 *
 * Provides access to Adobe Stock for color-based image searches.
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.serviceConfig - Stock service config (baseUrl, apiKey, endpoints)
 * @param {Object} options.appConfig - Application config (features, environment)
 */
export default class StockPlugin extends BaseApiService {
  /**
   * Service name identifier
   */
  static get serviceName() {
    return 'Stock';
  }

  /**
   * @param {Object} [options] - Configuration options
   * @param {Object} [options.serviceConfig] - Service-specific config
   * @param {Object} [options.appConfig] - Application-level config
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
    this.registerActionGroups();
  }

  /**
   * Check if plugin should be activated.
   * @param {Object} appConfigParam - Application config with features
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_STOCK !== false;
  }

  /**
   * Register all action groups for this plugin
   */
  registerActionGroups() {
    this.registerActionGroup(StockActionGroups.STOCK, new StockActions(this));
  }

  /**
   * Override getHeaders to add Stock-specific headers
   * @param {Object} [options] - Request options
   * @returns {Object} Headers object
   */
  getHeaders(options) {
    const headers = super.getHeaders(options);
    headers['x-product'] = 'AdobeColor/4.0';
    return headers;
  }
}
