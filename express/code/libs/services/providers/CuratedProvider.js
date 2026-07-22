import BaseProvider from './BaseProvider.js';
import { CuratedTopics, CuratedActionGroups } from '../plugins/curated/topics.js';

export default class CuratedProvider extends BaseProvider {
  /**
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

  #initActions() {
    const { DATA } = CuratedActionGroups;

    this.#actions = {
      fetchCuratedData: this.plugin.useAction(DATA, CuratedTopics.DATA.FETCH),
      fetchBySource: this.plugin.useAction(DATA, CuratedTopics.DATA.FETCH_BY_SOURCE),
      fetchGroupedBySource: this.plugin.useAction(DATA, CuratedTopics.DATA.FETCH_GROUPED_BY_SOURCE),
    };
  }

  /**
   * @returns {Promise<Object|null>} Curated data with files array or null on failure
   */
  async fetchCuratedData() {
    return this.safeExecute(() => this.#actions.fetchCuratedData());
  }

  /**
   * @param {string} source - Source to filter by (BEHANCE, KULER, STOCK, COLOR_GRADIENTS)
   * @returns {Promise<Object|null>} Filtered themes or null on failure
   */
  async fetchBySource(source) {
    return this.safeExecute(() => this.#actions.fetchBySource(source));
  }

  /**
   * @returns {Promise<Object|null>} Themes grouped by source or null on failure
   */
  async fetchGroupedBySource() {
    return this.safeExecute(() => this.#actions.fetchGroupedBySource());
  }
}

/**
 * @param {Object} plugin - Plugin instance
 * @returns {CuratedProvider} New provider instance
 */
export function createCuratedProvider(plugin) {
  return new CuratedProvider(plugin);
}
