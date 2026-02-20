import BaseApiService from '../../core/BaseApiService.js';
import StockActions from './actions/StockActions.js';
import { StockActionGroups } from './topics.js';

export default class StockPlugin extends BaseApiService {
  static get serviceName() {
    return 'Stock';
  }

  /**
   * @param {Object} [options]
   * @param {Object} [options.serviceConfig]
   * @param {Object} [options.appConfig]
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
    this.registerActionGroups();
  }

  /**
   * @param {Object} appConfigParam
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_STOCK !== false;
  }

  registerActionGroups() {
    this.registerActionGroup(StockActionGroups.STOCK, new StockActions(this));
  }

  /**
   * @param {Object} [options]
   * @returns {Object}
   */
  getHeaders(options) {
    const headers = super.getHeaders(options);
    headers['x-product'] = 'AdobeColor/4.0';
    return headers;
  }
}
