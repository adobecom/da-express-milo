import BaseApiService from '../../core/BaseApiService.js';

/**
 * BehancePlugin - Plugin for Behance API
 *
 * Provides access to Behance for project searches.
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
   * Search Behance projects
   *
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.query - Search query
   * @param {string} [criteria.sort='featured_date'] - Sort order
   * @param {number} [criteria.page=1] - Page number
   * @returns {Promise<Object>} Promise resolving to projects response
   */
  async searchProjects(criteria) {
    const path = this.endpoints.projects;

    const params = {
      q: criteria.query,
      sort: criteria.sort || 'featured_date',
      page: criteria.page || 1,
    };

    return this.get(path, { params });
  }
}

