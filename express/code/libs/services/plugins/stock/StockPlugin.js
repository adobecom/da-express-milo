import BaseApiService from '../../core/BaseApiService.js';
import { StockActionGroups } from './topics.js';
import {
  SearchActions,
  GalleryActions,
  DataActions,
  RedirectActions,
} from './actions/StockActions.js';

/**
 * StockPlugin - Plugin for Adobe Stock API
 *
 * Provides access to Adobe Stock for color-based image searches.
 * Uses action groups similar to Kuler:
 * - SearchActions: searchFiles (Search/Files API)
 * - GalleryActions: getCuratedList, getByName
 * - DataActions: checkAvailability
 * - RedirectActions: getFileUrl, getContributorUrl (URL builders)
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
    this.registerActionGroup(StockActionGroups.SEARCH, new SearchActions(this));
    this.registerActionGroup(StockActionGroups.GALLERY, new GalleryActions(this));
    this.registerActionGroup(StockActionGroups.DATA, new DataActions(this));
    this.registerActionGroup(StockActionGroups.REDIRECT, new RedirectActions(this));
  }

  /**
   * Override getHeaders to add Stock-specific headers (STOCK_API.md)
   * @param {Object} [options] - Request options
   * @returns {Object} Headers object
   */
  getHeaders(options) {
    const headers = super.getHeaders(options);
    headers['x-product'] = 'AdobeColor/4.0';
    return headers;
  }
}
