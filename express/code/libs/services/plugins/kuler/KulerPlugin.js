import BaseApiService from '../../core/BaseApiService.js';
import { KulerActionGroups } from './topics.js';
import {
  SearchActions,
  ExploreActions,
  ThemeActions,
  GradientActions,
  LikeActions,
} from './actions/KulerActions.js';

export default class KulerPlugin extends BaseApiService {
  static get serviceName() {
    return 'Kuler';
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
    return appConfigParam?.features?.ENABLE_KULER !== false;
  }

  registerActionGroups() {
    this.registerActionGroup(KulerActionGroups.SEARCH, new SearchActions(this));
    this.registerActionGroup(KulerActionGroups.EXPLORE, new ExploreActions(this));
    this.registerActionGroup(KulerActionGroups.THEME, new ThemeActions(this));
    this.registerActionGroup(KulerActionGroups.GRADIENT, new GradientActions(this));
    this.registerActionGroup(KulerActionGroups.LIKE, new LikeActions(this));
  }

  /**
   * @returns {string[]}
   */
  getActionGroupNames() {
    return Array.from(this.actionGroups.keys());
  }
}
