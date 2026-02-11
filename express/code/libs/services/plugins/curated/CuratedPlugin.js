import BaseApiService from '../../core/BaseApiService.js';
import { CuratedActionGroups } from './topics.js';
import CuratedDataActions from './actions/CuratedDataActions.js';

/**
 * CuratedPlugin - Plugin for Curated Data API
 *
 * Fetches curated theme data from a CloudFront-hosted JSON endpoint.
 * Uses action groups (similar to Kuler/Stock) for fetch operations.
 *
 * Key characteristics:
 * - Public JSON endpoint (no authentication required)
 * - No API key required
 * - BaseUrl IS the full URL to the JSON file
 * - Response contains themes from multiple sources (Behance, Kuler, Stock, Gradients)
 *
 * Action Groups:
 * - CuratedDataActions: fetchCuratedData, fetchBySource, fetchGroupedBySource
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.serviceConfig - Curated service config (baseUrl)
 * @param {Object} options.appConfig - Application config (features, environment)
 */
export default class CuratedPlugin extends BaseApiService {
  /**
   * Service name identifier
   */
  static get serviceName() {
    return 'Curated';
  }

  /**
   * @param {Object} [options] - Configuration options
   * @param {Object} [options.serviceConfig] - Service-specific config
   * @param {Object} [options.appConfig] - Application-level config
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
    this.registerActionGroups();
  }

  /**
   * Check if plugin should be activated.
   * @param {Object} appConfigParam - Application config with features
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_CURATED !== false;
  }

  /**
   * Register all action groups for this plugin
   */
  registerActionGroups() {
    this.registerActionGroup(CuratedActionGroups.DATA, new CuratedDataActions(this));
  }

  /**
   * Get all registered action group names
   *
   * @returns {string[]} Array of action group names
   */
  getActionGroupNames() {
    return Array.from(this.actionGroups.keys());
  }

  /**
   * Override getHeaders to provide minimal headers for public endpoint.
   * Curated endpoint is a public JSON file - no API key or auth required.
   *
   * @param {Object} [options] - Request options
   * @returns {Object} Headers object
   */
  // eslint-disable-next-line class-methods-use-this
  getHeaders(options = {}) {
    const { headers: additionalHeaders = {} } = options;
    return {
      Accept: 'application/json',
      ...additionalHeaders,
    };
  }
}
