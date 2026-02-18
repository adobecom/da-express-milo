import { ServiceError } from '../core/Errors.js';

/**
 * Base Provider
 *
 * Provides a clean, error-safe API over plugins.
 * Providers are the recommended way for consumers to interact with services.
 *
 * Uses ServiceError for type checking when logging errors to extract
 * error codes for better analytics categorization.
 */
export default class BaseProvider {
  /**
   * Reference to the plugin instance
   * @type {Object}
   */
  #plugin = null;

  /**
   * @param {Object} plugin - Plugin instance
   */
  constructor(plugin) {
    this.#plugin = plugin;
  }

  /**
   * Get the plugin instance
   * @returns {Object}
   */
  get plugin() {
    return this.#plugin;
  }

  /**
   * Check if the plugin is available
   * @returns {boolean}
   */
  get isAvailable() {
    return this.#plugin !== null;
  }

  /**
   * Safely execute an async action, returning null on failure.
   * Wraps action execution with error handling.
   *
   * @param {Function} action - Action function to execute
   * @param {...any} args - Arguments to pass to the action
   * @returns {Promise<any|null>} Action result or null on failure
   */
  async safeExecute(action, ...args) {
    if (!this.isAvailable) return null;

    try {
      return await action(...args);
    } catch (error) {
      this.logError(action.name || 'unknown', error);
      return null;
    }
  }

  /**
   * Safely execute a synchronous action, returning null on failure.
   * Use this for actions that build data locally (e.g. URL builders)
   * and should never return a Promise.
   *
   * @param {Function} action - Synchronous action function to execute
   * @param {...any} args - Arguments to pass to the action
   * @returns {any|null} Action result or null on failure
   */
  safeExecuteSync(action, ...args) {
    if (!this.isAvailable) return null;

    try {
      return action(...args);
    } catch (error) {
      this.logError(action.name || 'unknown', error);
      return null;
    }
  }

  /**
   * Log an error to the analytics service.
   * Extracts error codes and types from ServiceError instances for better categorization.
   *
   * @param {string} operation - Operation that failed
   * @param {Error|ServiceError} error
   *  - Error object (may be a ServiceError with additional context)
   */
  logError(operation, error) {
    const serviceName = this.#plugin?.constructor?.serviceName || 'unknown';
    const isServiceError = error instanceof ServiceError;
    const errorCode = isServiceError ? error.code : 'UNKNOWN';
    const errorType = error.name || 'Error';

    if (window.lana) {
      window.lana.log(`${serviceName}Provider ${operation} error: ${error.message}`, {
        tags: `color-explorer,${serviceName.toLowerCase()}-provider,${operation}`,
        errorCode,
        errorType,
      });
    }
  }
}
