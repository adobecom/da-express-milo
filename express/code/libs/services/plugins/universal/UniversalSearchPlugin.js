import BaseApiService from '../../core/BaseApiService.js';

/**
 * UniversalSearchPlugin - Plugin for Universal Search API
 *
 * Provides image-based search functionality.
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.serviceConfig - Universal search service config
 * @param {Object} options.appConfig - Application config (features, environment)
 */
export default class UniversalSearchPlugin extends BaseApiService {
  /**
   * Service name identifier
   */
  static get serviceName() {
    return 'UniversalSearch';
  }

  /**
   * Dynamic base URL (set based on auth state)
   */
  #baseUrlOverride = null;

  /**
   * @param {Object} [options] - Configuration options
   * @param {Object} [options.serviceConfig] - Service-specific config
   * @param {Object} [options.appConfig] - Application-level config
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
  }

  /**
   * Override baseUrl with dynamic value
   */
  get baseUrl() {
    return this.#baseUrlOverride || '';
  }

  /**
   * Set dynamic base URL
   */
  set baseUrl(value) {
    this.#baseUrlOverride = value;
  }

  /**
   * Check if plugin should be activated.
   * @param {Object} appConfigParam - Application config with features
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_UNIVERSAL !== false;
  }

  /**
   * Search by image
   *
   * @param {Object} criteria - Search criteria
   * @param {File} criteria.imageFile - Image file to search
   * @param {number} [criteria.limit=20] - Result limit
   * @param {number} [criteria.startIndex=0] - Start index for pagination
   * @returns {Promise<Object>} Promise resolving to search results
   */
  async searchByImage(criteria) {
    const isLoggedIn = window?.adobeIMS?.isSignedInUser() || false;

    let endpoint = '';

    if (isLoggedIn) {
      this.baseUrl = this.serviceConfig.baseUrl;
      endpoint = this.endpoints.similarity;
    } else {
      const anonymousUrl = this.endpoints.anonymousImageSearch || '';
      this.baseUrl = anonymousUrl.replace('/imageSearch', '');
      endpoint = '/imageSearch';
    }

    const formData = new FormData();
    formData.append('request', JSON.stringify({
      scope: ['stock'],
      limit: criteria.limit || 20,
      start_index: criteria.startIndex || 0,
      asset_type: ['images'],
    }));
    formData.append('image', criteria.imageFile);

    const headers = {
      'x-product': 'Color',
      'x-product-location': 'Color Website',
    };

    if (!isLoggedIn) {
      headers['x-api-key'] = this.appConfig?.services?.kuler?.apiKey;
    }

    return this.post(endpoint, formData, { headers });
  }
}
