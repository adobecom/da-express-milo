import BaseProvider from './BaseProvider.js';

/**
 * CC Library Provider
 *
 * Provides a clean API for managing Creative Cloud Libraries.
 * Wraps CCLibraryPlugin methods with error-safe execution.
 *
 * @example
 * const ccLibrary = await serviceManager.getProvider('cclibrary');
 * const libraries = await ccLibrary.fetchLibraries();
 * await ccLibrary.createLibrary('My Library');
 */
export default class CCLibraryProvider extends BaseProvider {
  /**
   * @param {Object} plugin - Plugin instance
   */
  constructor(plugin) {
    super(plugin);
  }

  /**
   * Create a new library
   *
   * @param {string} name - Library name
   * @returns {Promise<Object|null>} Created library or null on failure
   */
  async createLibrary(name) {
    return this.safeExecute(() => this.plugin.createLibrary(name));
  }

  /**
   * Fetch all libraries
   *
   * @param {Object} [params] - Query parameters (owner, start, limit, selector, orderBy, toolkit)
   * @returns {Promise<Object|null>} { total_count, libraries, _links } or null on failure
   */
  async fetchLibraries(params) {
    return this.safeExecute(() => this.plugin.fetchLibraries(params));
  }

  /**
   * List elements (themes/gradients) in a library
   *
   * @param {string} libraryId - Library ID
   * @param {Object} [params] - Query parameters (start, limit, selector, type)
   * @returns {Promise<Object|null>} { total_count, elements } or null on failure
   */
  async fetchLibraryElements(libraryId, params) {
    return this.safeExecute(() => this.plugin.fetchLibraryElements(libraryId, params));
  }

  /**
   * Save a theme to a library
   *
   * @param {string} libraryId - Library ID
   * @param {Object} themeData - Theme data to save
   * @returns {Promise<Object|null>} { elements } or null on failure
   */
  async saveTheme(libraryId, themeData) {
    return this.safeExecute(() => this.plugin.saveTheme(libraryId, themeData));
  }

  /**
   * Save a gradient to a library
   *
   * @param {string} libraryId - Library ID
   * @param {Object} gradientData - Gradient data to save
   * @returns {Promise<Object|null>} { elements } or null on failure
   */
  async saveGradient(libraryId, gradientData) {
    return this.safeExecute(() => this.plugin.saveGradient(libraryId, gradientData));
  }

  /**
   * Delete a theme from a library
   *
   * @param {string} libraryId - Library ID
   * @param {string} themeId - Theme ID
   * @returns {Promise<Object|null>} Delete response or null on failure
   */
  async deleteTheme(libraryId, themeId) {
    return this.safeExecute(() => this.plugin.deleteTheme(libraryId, themeId));
  }

  /**
   * Update an element's representation data (theme or gradient)
   *
   * @param {string} libraryId - Library ID
   * @param {string} elementId - Element ID
   * @param {Object} payload - Update payload (client, type, representations)
   * @returns {Promise<Object|null>} { id, representations } or null on failure
   */
  async updateTheme(libraryId, elementId, payload) {
    return this.safeExecute(() => this.plugin.updateTheme(libraryId, elementId, payload));
  }

  /**
   * Update element metadata (e.g. name) without changing representations
   *
   * @param {string} libraryId - Library ID
   * @param {Array<{id: string, name?: string}>} elements - Elements to update
   * @returns {Promise<Object|null>} Empty object or null on failure
   */
  async updateElementMetadata(libraryId, elements) {
    return this.safeExecute(() => this.plugin.updateElementMetadata(libraryId, elements));
  }
}

/**
 * Factory function to create a new CC Library provider instance.
 * Useful for testing or when isolated instances are needed.
 *
 * @param {Object} plugin - Plugin instance
 * @returns {CCLibraryProvider} New provider instance
 */
export function createCCLibraryProvider(plugin) {
  return new CCLibraryProvider(plugin);
}
