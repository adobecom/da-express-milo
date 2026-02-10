import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { CuratedTopics, CuratedSources } from '../topics.js';

/**
 * CuratedDataActions - Handles all curated data fetch operations
 *
 * Actions:
 * - fetchCuratedData - Fetch all curated data from CDN endpoint
 * - fetchBySource - Fetch curated themes filtered by source (KULER, BEHANCE, STOCK, COLOR_GRADIENTS)
 * - fetchGroupedBySource - Fetch curated data grouped by source
 *
 * Uses ValidationError for invalid source in fetchBySource.
 */
export default class CuratedDataActions extends BaseActionGroup {
  /**
   * Map topics to specific methods in this class
   */
  getHandlers() {
    return {
      [CuratedTopics.DATA.FETCH]: this.fetchCuratedData.bind(this),
      [CuratedTopics.DATA.FETCH_BY_SOURCE]: this.fetchBySource.bind(this),
      [CuratedTopics.DATA.FETCH_GROUPED_BY_SOURCE]: this.fetchGroupedBySource.bind(this),
    };
  }

  /**
   * Fetch all curated data from the configured endpoint.
   * BaseUrl is the full URL to the JSON file (e.g. curaredData.json).
   *
   * @returns {Promise<Object>} Promise resolving to curated data with files array
   */
  async fetchCuratedData() {
    return this.plugin.get('');
  }

  /**
   * Fetch curated themes filtered by source.
   *
   * @param {string} source - Source to filter by (BEHANCE, KULER, STOCK, COLOR_GRADIENTS)
   * @returns {Promise<Object>} Promise resolving to { themes } for the given source
   * @throws {ValidationError} If source is invalid
   */
  async fetchBySource(source) {
    const validSources = Object.values(CuratedSources);
    if (!validSources.includes(source)) {
      throw new ValidationError(`Invalid source: ${source}. Must be one of: ${validSources.join(', ')}`, {
        field: 'source',
        serviceName: 'Curated',
        topic: CuratedTopics.DATA.FETCH_BY_SOURCE,
      });
    }

    const data = await this.fetchCuratedData();
    const themes = data?.files?.filter((item) => item.source === source) || [];
    return { themes };
  }

  /**
   * Fetch curated data grouped by source (behance, kuler, stock, gradients).
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
