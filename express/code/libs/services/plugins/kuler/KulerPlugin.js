import BaseApiService from '../../core/BaseApiService.js';
import { KulerActionGroups } from './topics.js';
import SearchActions from './actions/SearchActions.js';
import ThemeActions from './actions/ThemeActions.js';
import GradientActions from './actions/GradientActions.js';
import LikeActions from './actions/LikeActions.js';

/**
 * KulerPlugin - Main plugin for Kuler/Adobe Themes API
 *
 * This plugin uses a modular action group architecture where related actions
 * are organized into separate action group classes. This design allows:
 * - Better code organization and maintainability
 * - Easier testing of individual action groups
 * - Extensibility - new action groups can be added without modifying the main plugin
 * - Reusability - other plugins can follow the same pattern
 *
 * Action Groups:
 * - SearchActions: fetchThemeList, fetchGradientList, searchPublishedTheme
 * - ThemeActions: fetchTheme, saveTheme, deleteTheme
 * - GradientActions: saveGradient, deleteGradient
 * - LikeActions: updateLikeStatus
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.serviceConfig - Kuler service config (baseUrl, apiKey, endpoints)
 * @param {Object} options.appConfig - Application config (features, environment)
 */
export default class KulerPlugin extends BaseApiService {
  /**
   * Service name identifier
   */
  static get serviceName() {
    return 'Kuler';
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
    return appConfigParam?.features?.ENABLE_KULER !== false;
  }

  /**
   * Register all action groups for this plugin
   * This method can be overridden or extended to add custom action groups
   */
  registerActionGroups() {
    this.registerActionGroup(KulerActionGroups.SEARCH, new SearchActions(this));
    this.registerActionGroup(KulerActionGroups.THEME, new ThemeActions(this));
    this.registerActionGroup(KulerActionGroups.GRADIENT, new GradientActions(this));
    this.registerActionGroup(KulerActionGroups.LIKE, new LikeActions(this));
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

