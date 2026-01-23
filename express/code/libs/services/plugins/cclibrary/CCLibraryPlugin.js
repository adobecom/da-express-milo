import BaseApiService from '../../core/BaseApiService.js';

/**
 * CCLibraryPlugin - Plugin for Creative Cloud Libraries API
 *
 * Provides access to Creative Cloud Libraries for saving and managing themes.
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.serviceConfig - CCLibraries service config (baseUrl, endpoints)
 * @param {Object} options.appConfig - Application config (features, environment)
 */
export default class CCLibraryPlugin extends BaseApiService {
  /**
   * Service name identifier
   */
  static get serviceName() {
    return 'CCLibrary';
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
   * Override baseUrl to use melvilleBasePath
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
   * Create a new library
   *
   * @param {string} name - Library name
   * @returns {Promise<Object>} Promise resolving to created library
   */
  async createLibrary(name) {
    const path = this.endpoints.libraries;
    const body = { name };

    return this.post(path, body);
  }

  /**
   * Fetch all libraries
   *
   * @returns {Promise<Object>} Promise resolving to libraries list
   */
  async fetchLibraries() {
    const path = this.endpoints.libraries;
    return this.get(path);
  }

  /**
   * Save a theme to a library
   *
   * @param {string} libraryId - Library ID
   * @param {Object} themeData - Theme data to save
   * @returns {Promise<Object>} Promise resolving to saved theme
   */
  async saveTheme(libraryId, themeData) {
    const path = `${this.endpoints.libraries}/${libraryId}${this.endpoints.themes}`;
    return this.post(path, themeData);
  }

  /**
   * Delete a theme from a library
   *
   * @param {string} libraryId - Library ID
   * @param {string} themeId - Theme ID
   * @returns {Promise<Object>} Promise resolving to delete response
   */
  async deleteTheme(libraryId, themeId) {
    const path = `${this.endpoints.libraries}/${libraryId}${this.endpoints.themes}/${themeId}`;
    return this.delete(path);
  }

  /**
   * Update a theme in a library
   *
   * @param {string} libraryId - Library ID
   * @param {string} themeId - Theme ID
   * @param {Object} themeData - Updated theme data
   * @returns {Promise<Object>} Promise resolving to updated theme
   */
  async updateTheme(libraryId, themeId, themeData) {
    const path = `${this.endpoints.libraries}/${libraryId}${this.endpoints.themes}/${themeId}/representations`;
    return this.post(path, themeData);
  }
}

