import BaseApiService from '../../core/BaseApiService.js';
import { BehanceActionGroups } from './topics.js';
import { ProjectActions, GalleryActions, GraphQLActions } from './actions/BehanceActions.js';

export default class BehancePlugin extends BaseApiService {
  static get serviceName() {
    return 'Behance';
  }

  /** @param {{ serviceConfig?: Object, appConfig?: Object }} [options] */
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
    return appConfigParam?.features?.ENABLE_BEHANCE !== false;
  }

  registerActionGroups() {
    this.registerActionGroup(BehanceActionGroups.PROJECTS, new ProjectActions(this));
    this.registerActionGroup(BehanceActionGroups.GALLERIES, new GalleryActions(this));
    this.registerActionGroup(BehanceActionGroups.GRAPHQL, new GraphQLActions(this));
  }

  /** @returns {string[]} */
  getActionGroupNames() {
    return Array.from(this.actionGroups.keys());
  }
}
