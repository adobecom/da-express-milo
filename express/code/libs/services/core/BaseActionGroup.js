export default class BaseActionGroup {
  /** @type {BaseApiService} */
  #plugin = null;

  /** @param {BaseApiService} plugin */
  constructor(plugin) {
    this.#plugin = plugin;
  }

  /** @returns {BaseApiService} */
  get plugin() {
    return this.#plugin;
  }

  /** @returns {BaseApiService} */
  getPlugin() {
    return this.#plugin;
  }

  /**
   * @returns {Object<string, Function>}
   * @abstract
   */
  getHandlers() {
    throw new Error('Subclasses must implement getHandlers()');
  }

  /**
   * @param {BasePlugin} pluginInstance
   * @returns {string[]}
   */
  static getRegisteredGroupNames(pluginInstance) {
    return Array.from(pluginInstance.actionGroups?.keys() || []);
  }
}
