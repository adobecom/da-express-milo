import { ServiceError } from '../core/Errors.js';

export default class BaseProvider {
  /** @type {Object} */
  #plugin = null;

  /** @param {Object} plugin */
  constructor(plugin) {
    this.#plugin = plugin;
  }

  /** @returns {Object} */
  get plugin() {
    return this.#plugin;
  }

  /** @returns {boolean} */
  get isAvailable() {
    return this.#plugin !== null;
  }

  /**
   * @param {Function} action
   * @param {...any} args
   * @returns {Promise<any|null>}
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
   * @param {Function} action
   * @param {...any} args
   * @returns {any|null}
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
   * @param {string} operation
   * @param {Error|ServiceError} error
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
