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
   * @param {string} query
   * @param {Object} [options]
   * @returns {Promise<Object|null>}
   */
  async searchGradients(query, options = {}) {
    const criteria = this.#transformSearchParams(query, options);
    return this.safeExecute(() => this.#actions.searchGradients(criteria));
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
   * @param {string} url
   * @returns {Promise<Object|null>}
   */
  async searchPublished(url) {
    return this.safeExecute(() => this.#actions.searchPublished(url));
  }
}

/**
 * @param {Object} plugin
 * @returns {KulerProvider}
 */
export function createKulerProvider(plugin) {
  return new KulerProvider(plugin);
}
