import BaseProvider from './BaseProvider.js';

/**
 * Behance Provider
 *
 * Provides a clean API for searching Behance projects.
 * Wraps BehancePlugin methods with error-safe execution.
 *
 * @example
 * const behance = await serviceManager.getProvider('behance');
 * const projects = await behance.searchProjects('sunset', { page: 1 });
 */
export default class BehanceProvider extends BaseProvider {
  /**
   * @param {Object} plugin - Plugin instance
   */
  constructor(plugin) {
    super(plugin);
  }

  /**
   * Search Behance projects
   *
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @param {string} [options.sort='featured_date'] - Sort order
   * @param {number} [options.page=1] - Page number
   * @returns {Promise<Object|null>} Projects response or null on failure
   */
  async searchProjects(query, options = {}) {
    const criteria = {
      query,
      sort: options.sort || 'featured_date',
      page: options.page || 1,
    };
    return this.safeExecute(() => this.plugin.searchProjects(criteria));
  }
}

/**
 * Factory function to create a new Behance provider instance.
 * Useful for testing or when isolated instances are needed.
 *
 * @param {Object} plugin - Plugin instance
 * @returns {BehanceProvider} New provider instance
 */
export function createBehanceProvider(plugin) {
  return new BehanceProvider(plugin);
}
