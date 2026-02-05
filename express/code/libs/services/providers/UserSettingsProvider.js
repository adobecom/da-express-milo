import BaseProvider from './BaseProvider.js';

/**
 * User Settings Provider
 *
 * Provides a clean API for managing user settings.
 * Wraps UserSettingsPlugin methods with error-safe execution.
 *
 * @example
 * const userSettings = await serviceManager.getProvider('userSettings');
 * await userSettings.updateSettings({ theme: 'dark' });
 */
export default class UserSettingsProvider extends BaseProvider {
  /**
   * @param {Object} plugin - Plugin instance
   */
  constructor(plugin) {
    super(plugin);
  }

  /**
   * Update user settings
   *
   * @param {Object} payload - Settings payload
   * @returns {Promise<Object|null>} Update response or null on failure
   */
  async updateSettings(payload) {
    return this.safeExecute(() => this.plugin.updateSettings(payload));
  }
}

/**
 * Factory function to create a new User Settings provider instance.
 * Useful for testing or when isolated instances are needed.
 *
 * @param {Object} plugin - Plugin instance
 * @returns {UserSettingsProvider} New provider instance
 */
export function createUserSettingsProvider(plugin) {
  return new UserSettingsProvider(plugin);
}
