import BaseApiService from '../../core/BaseApiService.js';

/**
 * UserSettingsPlugin - Plugin for User Settings API
 *
 * Provides functionality to manage user settings.
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.serviceConfig - User settings service config
 * @param {Object} options.appConfig - Application config (features, environment)
 */
export default class UserSettingsPlugin extends BaseApiService {
  /**
   * Service name identifier
   */
  static get serviceName() {
    return 'UserSettings';
  }

  /**
   * @param {Object} [options] - Configuration options
   * @param {Object} [options.serviceConfig] - Service-specific config
   * @param {Object} [options.appConfig] - Application-level config
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
  }

  /**
   * Override baseUrl to use accessPlatform service
   */
  get baseUrl() {
    return this.appConfig.services?.accessPlatform?.baseUrl || this.serviceConfig.baseUrl;
  }

  /**
   * Check if plugin should be activated.
   * @param {Object} appConfigParam - Application config with features
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_USERSETTINGS !== false;
  }

  /**
   * Update user settings
   *
   * @param {Object} payload - Settings payload
   * @returns {Promise<Object>} Promise resolving to update response
   */
  async updateSettings(payload) {
    const accessConfig = this.appConfig.services?.accessPlatform;
    const path = accessConfig?.endpoints?.profile || 'webapps/access_profile/v3';
    return this.post(path, payload);
  }
}

