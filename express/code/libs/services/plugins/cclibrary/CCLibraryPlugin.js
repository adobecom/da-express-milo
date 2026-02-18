import BaseApiService from '../../core/BaseApiService.js';
import { StorageFullError } from '../../core/Errors.js';
import { CCLibraryActionGroups } from './topics.js';
import { LibraryActions, LibraryThemeActions } from './actions/CCLibraryActions.js';
import { HTTP_STATUS } from './constants.js';

/**
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

  get baseUrl() {
    return this.serviceConfig.melvilleBasePath || this.serviceConfig.baseUrl;
  }

  /**
   * @param {Object} appConfigParam - Application config with features
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_CCLIBRARY !== false;
  }

  /**
   * @param {Response} response - Fetch API response
   * @returns {Promise<Object>} Parsed response
   * @throws {StorageFullError} When HTTP 507 is returned
   */
  async handleResponse(response) {
    if (response.status === HTTP_STATUS.STORAGE_FULL) {
      const errorBody = await response.text();
      throw new StorageFullError('CC Libraries storage is full', {
        serviceName: CCLibraryPlugin.serviceName,
        responseBody: errorBody,
      });
    }
    return super.handleResponse(response);
  }

  registerActionGroups() {
    this.registerActionGroup(CCLibraryActionGroups.LIBRARY, new LibraryActions(this));
    this.registerActionGroup(CCLibraryActionGroups.THEME, new LibraryThemeActions(this));
  }

  /** @returns {string[]} */
  getActionGroupNames() {
    return Array.from(this.actionGroups.keys());
  }
}
