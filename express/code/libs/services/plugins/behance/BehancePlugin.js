import BaseApiService from '../../core/BaseApiService.js';
import { BehanceActionGroups } from './topics.js';
import ProjectActions from './actions/ProjectActions.js';
import GalleryActions from './actions/GalleryActions.js';
import GraphQLActions from './actions/GraphQLActions.js';

/**
 * BehancePlugin - Plugin for Behance API
 *
 * Provides access to Behance for project search, gallery list, gallery projects,
 * and GraphQL (e.g. graphic design list for home page).
 *
 * Action Groups:
 * - ProjectActions: searchProjects
 * - GalleryActions: getGalleryList, getGalleryProjects
 * - GraphQLActions: getGraphicDesignList
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.serviceConfig - Behance service config (baseUrl, apiKey, endpoints)
 * @param {Object} options.appConfig - Application config (features, environment)
 */
export default class BehancePlugin extends BaseApiService {
  /**
   * Service name identifier
   */
  static get serviceName() {
    return 'Behance';
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
    return appConfigParam?.features?.ENABLE_BEHANCE !== false;
  }

  /**
   * Register all action groups for this plugin
   */
  registerActionGroups() {
    this.registerActionGroup(BehanceActionGroups.PROJECTS, new ProjectActions(this));
    this.registerActionGroup(BehanceActionGroups.GALLERIES, new GalleryActions(this));
    this.registerActionGroup(BehanceActionGroups.GRAPHQL, new GraphQLActions(this));
  }

  /**
   * Get all registered action group names
   *
   * @returns {string[]} Array of action group names
   */
  getActionGroupNames() {
    return Array.from(this.actionGroups.keys());
  }
}
