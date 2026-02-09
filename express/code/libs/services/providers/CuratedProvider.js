import BaseProvider from './BaseProvider.js';
import { CuratedTopics, CuratedActionGroups } from '../plugins/curated/topics.js';

/**
 * Curated Provider
 *
 * Provides a clean API for fetching curated theme data (Kuler, Behance, Stock, Gradients).
 * Uses the useAction pattern for cached, reusable action functions.
 *
 * @example
 * const curated = await serviceManager.getProvider('curated');
 * const data = await curated.fetchCuratedData();
 * const stockThemes = await curated.fetchBySource('STOCK');
 * const grouped = await curated.fetchGroupedBySource();
 */
export default class CuratedProvider extends BaseProvider {
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
   * Actions are bound once and reused for all calls.
   */
  #initActions() {
    const { DATA } = CuratedActionGroups;

    this.#actions = {
      fetchCuratedData: this.plugin.useAction(DATA, CuratedTopics.DATA.FETCH),
      fetchBySource: this.plugin.useAction(DATA, CuratedTopics.DATA.FETCH_BY_SOURCE),
      fetchGroupedBySource: this.plugin.useAction(DATA, CuratedTopics.DATA.FETCH_GROUPED_BY_SOURCE),
    };
  }

  /**
   * Fetch all curated data
   *
   * @returns {Promise<Object|null>} Curated data with files array or null on failure
   */
  async fetchCuratedData() {
    return this.safeExecute(() => this.#actions.fetchCuratedData());
  }

  /**
   * Fetch curated themes filtered by source
   *
   * @param {string} source - Source to filter by (BEHANCE, KULER, STOCK, COLOR_GRADIENTS)
   * @returns {Promise<Object|null>} Filtered themes or null on failure
   */
  async fetchBySource(source) {
    return this.safeExecute(() => this.#actions.fetchBySource(source));
  }

  /**
   * Fetch curated themes grouped by source
   *
   * @returns {Promise<Object|null>} Themes grouped by source or null on failure
   */
  async fetchGroupedBySource() {
    return this.safeExecute(() => this.#actions.fetchGroupedBySource());
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
