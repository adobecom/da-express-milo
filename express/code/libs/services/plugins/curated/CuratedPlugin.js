import BaseApiService from '../../core/BaseApiService.js';
import { CuratedActionGroups } from './topics.js';
import CuratedDataActions from './actions/CuratedDataActions.js';

export default class CuratedPlugin extends BaseApiService {
  static get serviceName() {
    return 'Curated';
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
   * @param {Object} appConfigParam - Application config with features
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_CURATED !== false;
  }

  registerActionGroups() {
    this.registerActionGroup(CuratedActionGroups.DATA, new CuratedDataActions(this));
  }

  registerActionGroups() {
    this.registerActionGroup(CuratedActionGroups.DATA, new CuratedDataActions(this));
  }

  /**
   * @returns {string[]} Array of action group names
   */
  getActionGroupNames() {
    return Array.from(this.actionGroups.keys());
  }

  /**
   * @param {Object} [options] - Request options
   * @returns {Object} Headers object
   */
  // eslint-disable-next-line class-methods-use-this
  getHeaders(options = {}) {
    const { headers: additionalHeaders = {} } = options;
    return {
      Accept: 'application/json',
      ...additionalHeaders,
    };
  }
}
