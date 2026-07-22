import { ConfigError } from './Errors.js';

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
  // eslint-disable-next-line class-methods-use-this
  getHandlers() {
    throw new Error('Subclasses must implement getHandlers()');
  }

  /**
   * Validate that all required config values are present.
   * @param {Object<string, *>} values - Key-value pairs to validate
   * @param {string} serviceName - Service name for error reporting
   * @throws {ConfigError} If any values are falsy
   */
  static requireConfig(values, serviceName) {
    const missing = Object.entries(values)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length > 0) {
      throw new ConfigError(
        `Missing required ${serviceName} config: ${missing.join(', ')}`,
        { serviceName, configKey: missing[0] },
      );
    }
  }

  /**
   * @param {BasePlugin} pluginInstance
   * @returns {string[]}
   */
  static getRegisteredGroupNames(pluginInstance) {
    return Array.from(pluginInstance.actionGroups?.keys() || []);
  }
}
