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
   * @returns {Promise<Object|null>} Libraries list or null on failure
   */
  async fetchLibraries() {
    return this.safeExecute(() => this.plugin.fetchLibraries());
  }

  /**
   * Save a theme to a library
   *
   * @param {string} libraryId - Library ID
   * @param {Object} themeData - Theme data to save
   * @returns {Promise<Object|null>} Saved theme or null on failure
   */
  async saveTheme(libraryId, themeData) {
    return this.safeExecute(() => this.plugin.saveTheme(libraryId, themeData));
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
   * Update a theme in a library
   *
   * @param {string} libraryId - Library ID
   * @param {string} themeId - Theme ID
   * @param {Object} themeData - Updated theme data
   * @returns {Promise<Object|null>} Updated theme or null on failure
   */
  async updateTheme(libraryId, themeId, themeData) {
    return this.safeExecute(() => this.plugin.updateTheme(libraryId, themeId, themeData));
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
