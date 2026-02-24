import BaseProvider from './BaseProvider.js';
import { KulerTopics, KulerActionGroups } from '../plugins/kuler/topics.js';

export default class KulerProvider extends BaseProvider {
  /** @type {Object} */
  #actions = {};

  /** @param {Object} plugin */
  constructor(plugin) {
    super(plugin);
    this.#initActions();
  }

  #initActions() {
    const {
      SEARCH, EXPLORE, THEME, GRADIENT, LIKE,
    } = KulerActionGroups;

    this.#actions = {
      searchThemes: this.plugin.useAction(SEARCH, KulerTopics.SEARCH.THEMES),
      searchGradients: this.plugin.useAction(SEARCH, KulerTopics.SEARCH.GRADIENTS),
      searchPublished: this.plugin.useAction(SEARCH, KulerTopics.SEARCH.PUBLISHED),
      exploreThemes: this.plugin.useAction(EXPLORE, KulerTopics.EXPLORE.THEMES),
      exploreGradients: this.plugin.useAction(EXPLORE, KulerTopics.EXPLORE.GRADIENTS),
      getTheme: this.plugin.useAction(THEME, KulerTopics.THEME.GET),
      saveTheme: this.plugin.useAction(THEME, KulerTopics.THEME.SAVE),
      deleteTheme: this.plugin.useAction(THEME, KulerTopics.THEME.DELETE),
      saveGradient: this.plugin.useAction(GRADIENT, KulerTopics.GRADIENT.SAVE),
      deleteGradient: this.plugin.useAction(GRADIENT, KulerTopics.GRADIENT.DELETE),
      updateLike: this.plugin.useAction(LIKE, KulerTopics.LIKE.UPDATE),
    };
  }

  /**
   * @param {string} query
   * @param {Object} [options]
   * @returns {Object}
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
   * Search themes via search.adobe.io.
   * @param {string} query
   * @param {Object} [options]
   * @param {'term'|'tag'|'hex'|'similarHex'} [options.typeOfQuery='term']
   * @param {number} [options.page=1]
   * @returns {Promise<Object|null>}
   */
  async searchThemes(query, options = {}) {
    const criteria = this.#transformSearchParams(query, options);
    return this.safeExecute(() => this.#actions.searchThemes(criteria));
  }

  /**
   * Search gradients via search.adobe.io.
   * @param {string} query
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async searchGradients(query, options = {}) {
    const criteria = this.#transformSearchParams(query, options);
    return this.safeExecute(() => this.#actions.searchGradients(criteria));
  }

  /**
   * Browse/explore themes via themesb3.adobe.io.
   * @param {Object} [options]
   * @param {string} [options.filter='public'] - 'public' or 'my_themes'
   * @param {string} [options.sort='create_time'] - Sort field
   * @param {string} [options.time='month'] - Time filter: 'all', 'month', 'week'
   * @param {number} [options.page=1]
   * @returns {Promise<Object|null>}
   */
  async exploreThemes(options = {}) {
    const criteria = {
      filter: options.filter || 'public',
      sort: options.sort || 'create_time',
      time: options.time || 'month',
      pageNumber: options.page || 1,
    };
    return this.safeExecute(() => this.#actions.exploreThemes(criteria));
  }

  /**
   * Browse/explore gradients via themesb3.adobe.io.
   * @param {Object} [options]
   * @param {string} [options.filter='public'] - 'public' or 'my_themes'
   * @param {string} [options.sort='create_time'] - Sort field
   * @param {string} [options.time='month'] - Time filter: 'all', 'month', 'week'
   * @param {number} [options.page=1]
   * @returns {Promise<Object|null>}
   */
  async exploreGradients(options = {}) {
    const criteria = {
      filter: options.filter || 'public',
      sort: options.sort || 'create_time',
      time: options.time || 'month',
      pageNumber: options.page || 1,
    };
    return this.safeExecute(() => this.#actions.exploreGradients(criteria));
  }

  /**
   * @param {string} themeId
   * @returns {Promise<Object|null>}
   */
  async getTheme(themeId) {
    return this.safeExecute(() => this.#actions.getTheme(themeId));
  }

  /**
   * @param {Object} themeData
   * @param {Object} ccLibrariesResponse
   * @returns {Promise<Object|null>}
   */
  async saveTheme(themeData, ccLibrariesResponse) {
    return this.safeExecute(() => this.#actions.saveTheme(themeData, ccLibrariesResponse));
  }

  /**
   * @param {Object} payload
   * @param {string} payload.id
   * @param {string} payload.name
   * @returns {Promise<Object|null>}
   */
  async deleteTheme(payload) {
    return this.safeExecute(() => this.#actions.deleteTheme(payload));
  }

  /**
   * @param {Object} gradientData
   * @param {Object} [ccLibrariesResponse]
   * @returns {Promise<Object|null>}
   */
  async saveGradient(gradientData, ccLibrariesResponse) {
    return this.safeExecute(() => this.#actions.saveGradient(gradientData, ccLibrariesResponse));
  }

  /**
   * @param {Object} payload
   * @param {string} payload.id
   * @param {string} payload.name
   * @returns {Promise<Object|null>}
   */
  async deleteGradient(payload) {
    return this.safeExecute(() => this.#actions.deleteGradient(payload));
  }

  /**
   * @param {Object} payload
   * @param {string} payload.id
   * @param {Object} payload.like
   * @param {string} payload.source
   * @returns {Promise<void|null>}
   */
  async updateLike(payload) {
    return this.safeExecute(() => this.#actions.updateLike(payload));
  }

  /**
   * Search for a published theme/gradient by URL.
   * @param {string} url - Full search URL
   * @returns {Promise<Object|null>}
   */
  async searchPublished(url) {
    return this.safeExecute(() => this.#actions.searchPublished(url));
  }

  /**
   * Check if a gradient/theme is published on Kuler by its CC Library asset ID.
   * @param {string} assetId - The CC Library asset ID
   * @param {string} [assetType='GRADIENT'] - THEME or GRADIENT
   * @returns {Promise<Object|null>}
   */
  async checkIfPublished(assetId, assetType = 'GRADIENT') {
    return this.safeExecute(
      () => this.#actions.searchPublished({ assetId, assetType }),
    );
  }
}

/**
 * @param {Object} plugin
 * @returns {KulerProvider}
 */
export function createKulerProvider(plugin) {
  return new KulerProvider(plugin);
}
