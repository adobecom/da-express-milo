import BaseApiService from '../../core/BaseApiService.js';

export default class BehancePlugin extends BaseApiService {
  static get serviceName() {
    return 'Behance';
  }

  /**
   * @param {Object} [options]
   * @param {Object} [options.serviceConfig]
   * @param {Object} [options.appConfig]
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
  }

  /**
   * @param {Object} appConfigParam
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_BEHANCE !== false;
  }

  /**
   * @param {Object} criteria
   * @param {string} criteria.query
   * @param {string} [criteria.sort='featured_date']
   * @param {number} [criteria.page=1]
   * @returns {Promise<Object>}
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
