import BaseProvider from './BaseProvider.js';
import { KulerTopics, KulerActionGroups } from '../plugins/kuler/topics.js';

/**
 * Kuler Provider
 *
 * Provides a clean API for searching color themes and gradients.
 * Uses the useAction pattern for cached, reusable action functions.
 *
 * @example
 * const kuler = await serviceManager.getProvider('kuler');
 * const themes = await kuler.searchThemes('sunset', { page: 1 });
 */
export default class KulerProvider extends BaseProvider {
  /**
   * Cached action functions
   * @type {Object}
   */
  #actions = {};

  /**
   * @param {Object} plugin - Plugin instance
   */
  constructor(plugin) {
    super(plugin);
    this.#initActions();
  }

  /**
   * Initialize action functions from plugin using useAction.
   * Actions are bound once and reused for all calls, providing:
   * - Better performance (no topic lookup on each call)
   * - Cleaner method bodies
   * - Centralized topic management
   */
  #initActions() {
    const { SEARCH, THEME, GRADIENT, LIKE } = KulerActionGroups;

    this.#actions = {
      searchThemes: this.plugin.useAction(SEARCH, KulerTopics.SEARCH.THEMES),
      searchGradients: this.plugin.useAction(SEARCH, KulerTopics.SEARCH.GRADIENTS),
      searchPublished: this.plugin.useAction(SEARCH, KulerTopics.SEARCH.PUBLISHED),
      getTheme: this.plugin.useAction(THEME, KulerTopics.THEME.GET),
      saveTheme: this.plugin.useAction(THEME, KulerTopics.THEME.SAVE),
      deleteTheme: this.plugin.useAction(THEME, KulerTopics.THEME.DELETE),
      saveGradient: this.plugin.useAction(GRADIENT, KulerTopics.GRADIENT.SAVE),
      deleteGradient: this.plugin.useAction(GRADIENT, KulerTopics.GRADIENT.DELETE),
      updateLike: this.plugin.useAction(LIKE, KulerTopics.LIKE.UPDATE),
    };
  }

  /**
   * Private transform for search parameters
   *
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @returns {Object} Transformed criteria for plugin
   */
  // eslint-disable-next-line class-methods-use-this
  #transformSearchParams(query, options = {}) {
    return {
      main: query,
      typeOfQuery: options.typeOfQuery || 'term',
      pageNumber: options.page || 1,
    };
  }

  /**
   * Search for color themes
   *
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @param {string} [options.typeOfQuery='term'] - Query type: 'term' | 'tag' | 'hex' | 'similarHex'
   * @param {number} [options.page=1] - Page number (1-indexed)
   * @returns {Promise<Object|null>} Search results or null on failure
   */
  async searchThemes(query, options = {}) {
    const criteria = this.#transformSearchParams(query, options);
    return this.safeExecute(() => this.#actions.searchThemes(criteria));
  }

  /**
   * Search for gradients
   *
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @returns {Promise<Object|null>} Search results or null on failure
   */
  async searchGradients(query, options = {}) {
    const criteria = this.#transformSearchParams(query, options);
    return this.safeExecute(() => this.#actions.searchGradients(criteria));
  }

  /**
   * Get a specific theme by ID
   *
   * @param {string} themeId - Theme ID
   * @returns {Promise<Object|null>} Theme data or null on failure
   */
  async getTheme(themeId) {
    return this.safeExecute(() => this.#actions.getTheme(themeId));
  }

  /**
   * Save/publish a theme
   *
   * @param {Object} themeData - Theme data
   * @param {Object} ccLibrariesResponse - CC Libraries response
   * @returns {Promise<Object|null>} Save result or null on failure
   */
  async saveTheme(themeData, ccLibrariesResponse) {
    return this.safeExecute(() => this.#actions.saveTheme(themeData, ccLibrariesResponse));
  }

  /**
   * Delete a theme
   *
   * @param {Object} payload - Delete payload with id and name
   * @returns {Promise<Object|null>} Delete result or null on failure
   */
  async deleteTheme(payload) {
    return this.safeExecute(() => this.#actions.deleteTheme(payload));
  }

  /**
   * Save/publish a gradient
   *
   * @param {Object} gradientData - Gradient data
   * @param {Object} [ccLibrariesResponse] - CC Libraries response
   * @returns {Promise<Object|null>} Save result or null on failure
   */
  async saveGradient(gradientData, ccLibrariesResponse) {
    return this.safeExecute(() => this.#actions.saveGradient(gradientData, ccLibrariesResponse));
  }

  /**
   * Delete a gradient
   *
   * @param {Object} payload - Delete payload with id and name
   * @returns {Promise<Object|null>} Delete result or null on failure
   */
  async deleteGradient(payload) {
    return this.safeExecute(() => this.#actions.deleteGradient(payload));
  }

  /**
   * Update like status for a theme
   *
   * @param {Object} payload - Like payload with id, like, source
   * @returns {Promise<void|null>} Promise or null on failure
   */
  async updateLike(payload) {
    return this.safeExecute(() => this.#actions.updateLike(payload));
  }

  /**
   * Search for a published theme
   *
   * @param {string} url - Search URL
   * @returns {Promise<Object|null>} Search results or null on failure
   */
  async searchPublished(url) {
    return this.safeExecute(() => this.#actions.searchPublished(url));
  }
}

/**
 * Factory function to create a new Kuler provider instance.
 * Useful for testing or when isolated instances are needed.
 *
 * @param {Object} plugin - Plugin instance
 * @returns {KulerProvider} New provider instance
 */
export function createKulerProvider(plugin) {
  return new KulerProvider(plugin);
}
