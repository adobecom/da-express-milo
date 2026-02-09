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
   * @param {Object} [params] - Query parameters
   * @param {string} [params.owner='all'] - Owner filter: 'self', 'shared', or 'all'
   * @param {number} [params.start=0] - Pagination start index
   * @param {number} [params.limit=40] - Results per page
   * @param {string} [params.selector='details'] - Data detail level: 'details', 'summary'
   * @param {string} [params.orderBy='-modified'] - Sort: '-modified' (newest), 'name' (alphabetical)
   * @param {string} [params.toolkit='none'] - Set to 'none' to exclude toolkit data
   * @returns {Promise<Object>} Promise resolving to { total_count, libraries, _links }
   */
  async fetchLibraries(params = {}) {
    const path = this.endpoints.libraries;
    const queryParams = {
      owner: params.owner ?? 'all',
      start: params.start ?? 0,
      limit: params.limit ?? 40,
      selector: params.selector ?? 'details',
      orderBy: params.orderBy ?? '-modified',
      toolkit: params.toolkit ?? 'none',
    };
    return this.get(path, { params: queryParams });
  }

  /**
   * List elements (themes/gradients) in a library
   *
   * @param {string} libraryId - Library ID (library_urn or id)
   * @param {Object} [params] - Query parameters
   * @param {number} [params.start=0] - Pagination start index
   * @param {number} [params.limit=50] - Results per page
   * @param {string} [params.selector='representations'] - Data detail level
   * @param {string} [params.type] - Filter by element type (theme and/or gradient MIME types, comma-separated)
   * @returns {Promise<Object>} Promise resolving to { total_count, elements }
   */
  async fetchLibraryElements(libraryId, params = {}) {
    const path = `${this.endpoints.libraries}/${libraryId}${this.endpoints.themes}`;
    const queryParams = {
      start: params.start ?? 0,
      limit: params.limit ?? 50,
      selector: params.selector ?? 'representations',
      ...(params.type != null && { type: params.type }),
    };
    return this.get(path, { params: queryParams });
  }

  /**
   * Save a theme to a library (create element type colortheme)
   *
   * @param {string} libraryId - Library ID
   * @param {Object} themeData - Theme data (name, type, client, representations per API)
   * @returns {Promise<Object>} Promise resolving to { elements: [{ id, name, type, ... }] }
   */
  async saveTheme(libraryId, themeData) {
    const path = `${this.endpoints.libraries}/${libraryId}${this.endpoints.themes}`;
    return this.post(path, themeData);
  }

  /**
   * Save a gradient to a library (create element type gradient)
   *
   * @param {string} libraryId - Library ID
   * @param {Object} gradientData - Gradient data (name, type, client, representations per API)
   * @returns {Promise<Object>} Promise resolving to { elements: [{ id, name, type, ... }] }
   */
  async saveGradient(libraryId, gradientData) {
    const path = `${this.endpoints.libraries}/${libraryId}${this.endpoints.themes}`;
    return this.post(path, gradientData);
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
   * Update an element's representation data (theme or gradient)
   *
   * @param {string} libraryId - Library ID
   * @param {string} elementId - Element ID
   * @param {Object} payload - Update payload (client, type, representations per API)
   * @returns {Promise<Object>} Promise resolving to { id, representations }
   */
  async updateTheme(libraryId, elementId, payload) {
    const path = `${this.endpoints.libraries}/${libraryId}${this.endpoints.themes}/${elementId}/representations`;
    return this.put(path, payload);
  }

  /**
   * Update element metadata (e.g. name) without changing representations
   *
   * @param {string} libraryId - Library ID
   * @param {Array<{id: string, name?: string}>} elements - Elements to update (id and fields to set)
   * @returns {Promise<Object>} Promise resolving to empty object (204 No Content)
   */
  async updateElementMetadata(libraryId, elements) {
    const path = `${this.endpoints.libraries}/${libraryId}${this.endpoints.themes}${this.endpoints.metadata}`;
    return this.put(path, { elements });
  }
}

