import BaseProvider from './BaseProvider.js';

/**
 * Report Abuse Provider
 *
 * Provides a clean API for reporting abusive content.
 * Wraps ReportAbusePlugin methods with error-safe execution.
 *
 * @example
 * const reportAbuse = await serviceManager.getProvider('reportAbuse');
 * await reportAbuse.report({ contentId: '123', reason: 'spam' });
 */
export default class ReportAbuseProvider extends BaseProvider {
  /**
   * @param {Object} plugin - Plugin instance
   */
  constructor(plugin) {
    super(plugin);
  }

  /**
   * Report abusive content
   *
   * @param {Object} payload - Report payload
   * @returns {Promise<Object|null>} Report response or null on failure
   */
  async report(payload) {
    return this.safeExecute(() => this.plugin.reportAbuse(payload));
  }
}

/**
 * Factory function to create a new Report Abuse provider instance.
 * Useful for testing or when isolated instances are needed.
 *
 * @param {Object} plugin - Plugin instance
 * @returns {ReportAbuseProvider} New provider instance
 */
export function createReportAbuseProvider(plugin) {
  return new ReportAbuseProvider(plugin);
}
