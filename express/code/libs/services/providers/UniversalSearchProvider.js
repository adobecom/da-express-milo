import BaseProvider from './BaseProvider.js';

/**
 * Universal Search Provider
 *
 * Provides a clean API for image-based search functionality.
 * Wraps UniversalSearchPlugin methods with error-safe execution.
 *
 * @example
 * const universalSearch = await serviceManager.getProvider('universal');
 * const results = await universalSearch.searchByImage(imageFile, { limit: 10 });
 */
export default class UniversalSearchProvider extends BaseProvider {
  /**
   * @param {Object} plugin - Plugin instance
   */
  constructor(plugin) {
    super(plugin);
  }

  /**
   * Search by image
   *
   * @param {File} imageFile - Image file to search
   * @param {Object} [options] - Search options
   * @param {number} [options.limit=20] - Result limit
   * @param {number} [options.startIndex=0] - Start index for pagination
   * @returns {Promise<Object|null>} Search results or null on failure
   */
  async searchByImage(imageFile, options = {}) {
    const criteria = {
      imageFile,
      limit: options.limit || 20,
      startIndex: options.startIndex || 0,
    };
    return this.safeExecute(() => this.plugin.searchByImage(criteria));
  }
}

/**
 * Factory function to create a new Universal Search provider instance.
 * Useful for testing or when isolated instances are needed.
 *
 * @param {Object} plugin - Plugin instance
 * @returns {UniversalSearchProvider} New provider instance
 */
export function createUniversalSearchProvider(plugin) {
  return new UniversalSearchProvider(plugin);
}
