import BaseApiService from '../../core/BaseApiService.js';
import { CCLibraryActionGroups } from './topics.js';
import { LibraryActions, LibraryThemeActions } from './actions/CCLibraryActions.js';

/**
 * CCLibraryPlugin - Plugin for Creative Cloud Libraries (Melville) API
 *
 * Uses action group architecture. Related actions are organized into:
 * - LibraryActions: createLibrary, fetchLibraries, fetchLibraryElements
 * - LibraryThemeActions: saveTheme, saveGradient, deleteTheme, updateTheme, updateElementMetadata
 *
 * All operations require Bearer authentication (enforced by BaseApiService getHeaders).
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.serviceConfig - CCLibraries service config (melvilleBasePath, endpoints)
 * @param {Object} options.appConfig - Application config (features, environment)
 */
export default class CCLibraryPlugin extends BaseApiService {
  static get serviceName() {
    return 'CCLibrary';
  }

  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
    this.registerActionGroups();
  }

  /**
   * Override baseUrl to use melvilleBasePath (Melville API base).
   */
  get baseUrl() {
    return this.serviceConfig.melvilleBasePath || this.serviceConfig.baseUrl;
  }

  /**
   * Check if plugin should be activated.
   * @param {Object} appConfigParam - Application config with features
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_CCLIBRARY !== false;
  }

  /**
   * Register all action groups for this plugin.
   */
  registerActionGroups() {
    this.registerActionGroup(CCLibraryActionGroups.LIBRARY, new LibraryActions(this));
    this.registerActionGroup(CCLibraryActionGroups.THEME, new LibraryThemeActions(this));
  }

  /**
   * Get all registered action group names
   * @returns {string[]}
   */
  getActionGroupNames() {
    return Array.from(this.actionGroups.keys());
  }
}
