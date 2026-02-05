import BaseProvider from './BaseProvider.js';

/**
 * Curated Provider
 *
 * Provides a clean API for fetching curated theme data.
 * Wraps CuratedPlugin methods with error-safe execution.
 *
 * @example
 * const curated = await serviceManager.getProvider('curated');
 * const data = await curated.fetchCuratedData();
 * const behanceThemes = await curated.fetchBySource('BEHANCE');
 */
export default class CuratedProvider extends BaseProvider {
  /**
   * @param {Object} plugin - Plugin instance
   */
  constructor(plugin) {
    super(plugin);
  }

  /**
   * Fetch all curated data
   *
   * @returns {Promise<Object|null>} Curated data with files array or null on failure
   */
  async fetchCuratedData() {
    return this.safeExecute(() => this.plugin.fetchCuratedData());
  }

  /**
   * Fetch curated themes filtered by source
   *
   * @param {string} source - Source to filter by (BEHANCE, KULER, STOCK, COLOR_GRADIENTS)
   * @returns {Promise<Object|null>} Filtered themes or null on failure
   */
  async fetchBySource(source) {
    return this.safeExecute(() => this.plugin.fetchBySource(source));
  }

  /**
   * Fetch curated themes grouped by source
   *
   * @returns {Promise<Object|null>} Themes grouped by source or null on failure
   */
  async fetchGroupedBySource() {
    return this.safeExecute(() => this.plugin.fetchGroupedBySource());
  }
}

/**
 * Factory function to create a new Curated provider instance.
 * Useful for testing or when isolated instances are needed.
 *
 * @param {Object} plugin - Plugin instance
 * @returns {CuratedProvider} New provider instance
 */
export function createCuratedProvider(plugin) {
  return new CuratedProvider(plugin);
}
