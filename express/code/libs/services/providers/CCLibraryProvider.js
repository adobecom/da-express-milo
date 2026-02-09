import BaseProvider from './BaseProvider.js';
import { CCLibraryTopics, CCLibraryActionGroups } from '../plugins/cclibrary/topics.js';

/**
 * CC Library Provider
 *
 * Provides a clean API for managing Creative Cloud Libraries.
 * Wraps all topic actions with safeExecute() and uses the useAction pattern.
 *
 * @example
 * const ccLibrary = await serviceManager.getProvider('cclibrary');
 * const libraries = await ccLibrary.fetchLibraries();
 * await ccLibrary.createLibrary('My Library');
 */
export default class CCLibraryProvider extends BaseProvider {
  #actions = {};

  constructor(plugin) {
    super(plugin);
    this.#initActions();
  }

  #initActions() {
    const { LIBRARY, THEME } = CCLibraryActionGroups;

    this.#actions = {
      createLibrary: this.plugin.useAction(LIBRARY, CCLibraryTopics.LIBRARY.CREATE),
      fetchLibraries: this.plugin.useAction(LIBRARY, CCLibraryTopics.LIBRARY.FETCH),
      fetchLibraryElements: this.plugin.useAction(LIBRARY, CCLibraryTopics.LIBRARY.ELEMENTS),
      saveTheme: this.plugin.useAction(THEME, CCLibraryTopics.THEME.SAVE),
      saveGradient: this.plugin.useAction(THEME, CCLibraryTopics.THEME.SAVE_GRADIENT),
      deleteTheme: this.plugin.useAction(THEME, CCLibraryTopics.THEME.DELETE),
      updateTheme: this.plugin.useAction(THEME, CCLibraryTopics.THEME.UPDATE),
      updateElementMetadata: this.plugin.useAction(THEME, CCLibraryTopics.THEME.UPDATE_METADATA),
    };
  }

  async createLibrary(name) {
    return this.safeExecute(() => this.#actions.createLibrary(name));
  }

  async fetchLibraries(params) {
    return this.safeExecute(() => this.#actions.fetchLibraries(params));
  }

  async fetchLibraryElements(libraryId, params) {
    return this.safeExecute(() => this.#actions.fetchLibraryElements(libraryId, params));
  }

  async saveTheme(libraryId, themeData) {
    return this.safeExecute(() => this.#actions.saveTheme(libraryId, themeData));
  }

  async saveGradient(libraryId, gradientData) {
    return this.safeExecute(() => this.#actions.saveGradient(libraryId, gradientData));
  }

  async deleteTheme(libraryId, themeId) {
    return this.safeExecute(() => this.#actions.deleteTheme(libraryId, themeId));
  }

  async updateTheme(libraryId, elementId, payload) {
    return this.safeExecute(() => this.#actions.updateTheme(libraryId, elementId, payload));
  }

  async updateElementMetadata(libraryId, elements) {
    return this.safeExecute(() => this.#actions.updateElementMetadata(libraryId, elements));
  }
}

/**
 * Factory function to create a new CC Library provider instance.
 *
 * @param {Object} plugin - Plugin instance
 * @returns {CCLibraryProvider} New provider instance
 */
export function createCCLibraryProvider(plugin) {
  return new CCLibraryProvider(plugin);
}
