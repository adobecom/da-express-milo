import BaseApiService from '../../core/BaseApiService.js';
import { UniversalSearchActionGroups } from './topics.js';
import { SearchActions, UrlActions } from './actions/UniversalSearchActions.js';

/** @param {{ serviceConfig: Object, appConfig: Object }} options */
export default class UniversalSearchPlugin extends BaseApiService {
  static get serviceName() {
    return 'UniversalSearch';
  }

  /** @param {{ serviceConfig?: Object, appConfig?: Object }} [options] */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
    this.registerActionGroups();
  }

  /** @param {Object} appConfigParam @returns {boolean} */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_UNIVERSAL !== false;
  }

  registerActionGroups() {
    this.registerActionGroup(UniversalSearchActionGroups.SEARCH, new SearchActions(this));
    this.registerActionGroup(UniversalSearchActionGroups.URL, new UrlActions(this));
  }

  /** @returns {string[]} */
  getActionGroupNames() {
    return Array.from(this.actionGroups.keys());
  }
}
