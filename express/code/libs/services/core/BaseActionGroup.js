/**
 * Base class for action groups in plugins.
 *
 * Action groups allow plugins to organize related actions into separate modules,
 * making the codebase more maintainable and allowing for better code organization.
 *
 * Each action group should extend this class and implement action methods.
 * The plugin will register these action groups and expose their methods.
 */
export default class BaseActionGroup {
  /**
   * Reference to the plugin instance that owns this action group
   * @type {BaseApiService}
   */
  #plugin = null;

  /**
   * Initialize the action group with a reference to the plugin
   * @param {BaseApiService} plugin - The plugin instance
   */
  constructor(plugin) {
    this.#plugin = plugin;
  }

  /**
   * Get the plugin instance
   * @returns {BaseApiService}
   */
  get plugin() {
    return this.#plugin;
  }

  /**
   * Alias for plugin getter
   * @returns {BaseApiService}
   */
  getPlugin() {
    return this.#plugin;
  }

  /**
   * Returns a map of Topics to handler methods.
   * This explicitly defines what this group handles.
   *
   * MUST be an instance method (not static) because handlers
   * need to be bound to `this` for access to plugin reference.
   *
   * @returns {Object<string, Function>} Map of Topic -> bound handler
   * @abstract
   */
  getHandlers() {
    throw new Error('Subclasses must implement getHandlers()');
  }

  /**
   * Get all registered action group names from a plugin.
   * Utility method for debugging and introspection.
   *
   * @param {BasePlugin} pluginInstance - Plugin instance
   * @returns {string[]} Array of action group names
   */
  static getRegisteredGroupNames(pluginInstance) {
    return Array.from(pluginInstance.actionGroups?.keys() || []);
  }
}
