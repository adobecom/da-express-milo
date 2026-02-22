import BaseApiService from '../../core/BaseApiService.js';
import { StockActionGroups } from './topics.js';
import {
  SearchActions,
  GalleryActions,
  DataActions,
  RedirectActions,
} from './actions/StockActions.js';

/**
 * @typedef {Object} StockPluginOptions
 * @property {Object} [serviceConfig]
 * @property {Object} [appConfig]
 */

export default class StockPlugin extends BaseApiService {
  static get serviceName() {
    return 'Stock';
  }

  /** @param {StockPluginOptions} [options] */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
    this.registerActionGroups();
  }

  /** @param {Object} appConfigParam @returns {boolean} */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_STOCK !== false;
  }

  registerActionGroups() {
    this.registerActionGroup(StockActionGroups.SEARCH, new SearchActions(this));
    this.registerActionGroup(StockActionGroups.GALLERY, new GalleryActions(this));
    this.registerActionGroup(StockActionGroups.DATA, new DataActions(this));
    this.registerActionGroup(StockActionGroups.REDIRECT, new RedirectActions(this));
  }

  /** @param {Object} [options] @returns {Object} */
  getHeaders(options) {
    const headers = super.getHeaders(options);
    headers['x-product'] = 'AdobeColor/4.0';
    return headers;
  }
}
