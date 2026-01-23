import BaseApiService from '../../core/BaseApiService.js';
import { CuratedTopics, CuratedSources } from './topics.js';

/**
 * CuratedPlugin - Plugin for Curated Data API
 *
 * Fetches curated/popular search terms and curated theme data from
 * CloudFront-hosted JSON endpoints.
 *
 * Key characteristics:
 * - Public JSON endpoint (no authentication required)
 * - No API key required
 * - BaseUrl IS the full URL to the JSON file
 * - Response contains themes from multiple sources (Behance, Kuler, Stock, Gradients)
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
    this.registerHandlers({
      [CuratedTopics.FETCH_DATA]: this.fetchCuratedData.bind(this),
      [CuratedTopics.FETCH_BY_SOURCE]: this.fetchBySource.bind(this),
    });
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

  /**
   * Fetch all curated data from the configured endpoint.
   * The baseUrl is the full URL to the JSON file, so we pass empty string as path.
   *
   * @returns {Promise<Object>} Promise resolving to curated data with files array
   */
  async fetchCuratedData() {
    return this.get('');
  }

  /**
   * Fetch curated themes filtered by source.
   *
   * @param {string} source - Source to filter by (BEHANCE, KULER, STOCK, COLOR_GRADIENTS)
   * @returns {Promise<Object>} Promise resolving to filtered themes
   * @throws {Error} If source is invalid
   */
  async fetchBySource(source) {
    const validSources = Object.values(CuratedSources);
    if (!validSources.includes(source)) {
      throw new Error(
        `Invalid source: ${source}. Must be one of: ${validSources.join(', ')}`,
      );
    }

    const data = await this.fetchCuratedData();
    const themes = data?.files?.filter((item) => item.source === source) || [];

    return { themes };
  }

  /**
   * Fetch curated themes grouped by source.
   * Convenience method that returns all themes organized by their source.
   *
   * @returns {Promise<Object>} Promise resolving to themes grouped by source
   */
  async fetchGroupedBySource() {
    const data = await this.fetchCuratedData();
    const files = data?.files || [];

    return {
      behance: { themes: files.filter((item) => item.source === CuratedSources.BEHANCE) },
      kuler: { themes: files.filter((item) => item.source === CuratedSources.KULER) },
      stock: { themes: files.filter((item) => item.source === CuratedSources.STOCK) },
      gradients: { themes: files.filter((item) => item.source === CuratedSources.COLOR_GRADIENTS) },
    };
  }
}
