import BaseApiService from '../../core/BaseApiService.js';

/**
 * UserFeedbackPlugin - Plugin for User Feedback API
 *
 * Provides functionality to submit user feedback.
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.serviceConfig - User feedback service config
 * @param {Object} options.appConfig - Application config (features, environment)
 */
export default class UserFeedbackPlugin extends BaseApiService {
  /**
   * Service name identifier
   */
  static get serviceName() {
    return 'UserFeedback';
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
   * Check if plugin should be activated.
   * @param {Object} appConfigParam - Application config with features
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_USERFEEDBACK !== false;
  }

  /**
   * Send user feedback
   *
   * @param {Object} payload - Feedback payload
   * @returns {Promise<Object>} Promise resolving to feedback response
   */
  async sendFeedback(payload) {
    const path = this.endpoints.feedback;
    return this.post(path, payload);
  }
}
