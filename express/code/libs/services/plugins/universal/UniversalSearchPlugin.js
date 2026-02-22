import BaseApiService from '../../core/BaseApiService.js';

export default class UniversalSearchPlugin extends BaseApiService {
  static get serviceName() {
    return 'UniversalSearch';
  }

  #baseUrlOverride = null;

  /**
   * @param {Object} [options]
   * @param {Object} [options.serviceConfig]
   * @param {Object} [options.appConfig]
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
  }

  /** @returns {string} */
  get baseUrl() {
    return this.#baseUrlOverride || '';
  }

  /** @param {string} value */
  set baseUrl(value) {
    this.#baseUrlOverride = value;
  }

  /**
   * @param {Object} appConfigParam
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_UNIVERSAL !== false;
  }

  /**
   * @param {Object} criteria
   * @param {File} criteria.imageFile
   * @param {number} [criteria.limit=20]
   * @param {number} [criteria.startIndex=0]
   * @returns {Promise<Object>}
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
