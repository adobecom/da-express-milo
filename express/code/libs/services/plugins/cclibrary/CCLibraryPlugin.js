import BaseApiService from '../../core/BaseApiService.js';

export default class CCLibraryPlugin extends BaseApiService {
  static get serviceName() {
    return 'CCLibrary';
  }

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
    return this.serviceConfig.melvilleBasePath || this.serviceConfig.baseUrl;
  }

  /**
   * @param {Object} appConfigParam
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_CCLIBRARY !== false;
  }

  /**
   * @param {string} name
   * @returns {Promise<Object>}
   */
  async createLibrary(name) {
    const path = this.endpoints.libraries;
    const body = { name };

    return this.post(path, body);
  }

  /** @returns {Promise<Object>} */
  async fetchLibraries() {
    const path = this.endpoints.libraries;
    return this.get(path);
  }

  /**
   * @param {string} libraryId
   * @param {Object} themeData
   * @returns {Promise<Object>}
   */
  async saveTheme(libraryId, themeData) {
    const path = `${this.endpoints.libraries}/${libraryId}${this.endpoints.themes}`;
    return this.post(path, themeData);
  }

  /**
   * @param {string} libraryId
   * @param {string} themeId
   * @returns {Promise<Object>}
   */
  async deleteTheme(libraryId, themeId) {
    const path = `${this.endpoints.libraries}/${libraryId}${this.endpoints.themes}/${themeId}`;
    return this.delete(path);
  }

  /**
   * @param {string} libraryId
   * @param {string} themeId
   * @param {Object} themeData
   * @returns {Promise<Object>}
   */
  async updateTheme(libraryId, themeId, themeData) {
    const path = `${this.endpoints.libraries}/${libraryId}${this.endpoints.themes}/${themeId}/representations`;
    return this.post(path, themeData);
  }
}
