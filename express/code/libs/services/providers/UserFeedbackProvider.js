import BaseProvider from './BaseProvider.js';

/**
 * User Feedback Provider
 *
 * Provides a clean API for submitting user feedback.
 * Wraps UserFeedbackPlugin methods with error-safe execution.
 *
 * @example
 * const userFeedback = await serviceManager.getProvider('userFeedback');
 * await userFeedback.sendFeedback({ rating: 5, comment: 'Great!' });
 */
export default class UserFeedbackProvider extends BaseProvider {
  /**
   * @param {Object} plugin - Plugin instance
   */
  constructor(plugin) {
    super(plugin);
  }

  /**
   * Send user feedback
   *
   * @param {Object} payload - Feedback payload
   * @returns {Promise<Object|null>} Feedback response or null on failure
   */
  async sendFeedback(payload) {
    return this.safeExecute(() => this.plugin.sendFeedback(payload));
  }
}

/**
 * Factory function to create a new User Feedback provider instance.
 * Useful for testing or when isolated instances are needed.
 *
 * @param {Object} plugin - Plugin instance
 * @returns {UserFeedbackProvider} New provider instance
 */
export function createUserFeedbackProvider(plugin) {
  return new UserFeedbackProvider(plugin);
}
