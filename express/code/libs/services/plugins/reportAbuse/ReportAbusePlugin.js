import BaseApiService from '../../core/BaseApiService.js';

/**
 * ReportAbusePlugin - Plugin for Report Abuse API
 *
 * Provides functionality to report abusive content.
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.serviceConfig - Report abuse service config
 * @param {Object} options.appConfig - Application config (features, environment)
 */
export default class ReportAbusePlugin extends BaseApiService {
  /**
   * Service name identifier
   */
  static get serviceName() {
    return 'ReportAbuse';
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
   * Override baseUrl to use vader service
   */
  get baseUrl() {
    return this.appConfig.services?.vader?.baseUrl || this.serviceConfig.baseUrl;
  }

  /**
   * Override apiKey to use kuler's apiKey
   */
  get apiKey() {
    return this.appConfig.services?.kuler?.apiKey || this.serviceConfig.apiKey;
  }

  /**
   * Check if plugin should be activated.
   * @param {Object} appConfigParam - Application config with features
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_REPORTABUSE !== false;
  }

  /**
   * Report abusive content
   *
   * @param {Object} payload - Report payload
   * @returns {Promise<Object>} Promise resolving to report response
   */
  async reportAbuse(payload) {
    const vaderConfig = this.appConfig.services?.vader;
    const path = vaderConfig?.endpoints?.api || '/prod';
    return this.post(path, payload);
  }
}
