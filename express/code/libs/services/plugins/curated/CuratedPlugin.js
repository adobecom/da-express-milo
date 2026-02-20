import BaseApiService from '../../core/BaseApiService.js';
import { CuratedTopics, CuratedSources } from './topics.js';

export default class CuratedPlugin extends BaseApiService {
  static get serviceName() {
    return 'Curated';
  }

  /**
   * @param {Object} [options]
   * @param {Object} [options.serviceConfig]
   * @param {Object} [options.appConfig]
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
    this.registerHandlers({
      [CuratedTopics.FETCH_DATA]: this.fetchCuratedData.bind(this),
      [CuratedTopics.FETCH_BY_SOURCE]: this.fetchBySource.bind(this),
    });
  }

  /**
   * @param {Object} appConfigParam
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_CURATED !== false;
  }

  /**
   * @param {Object} [options]
   * @returns {Object}
   */
  // eslint-disable-next-line class-methods-use-this
  getHeaders(options = {}) {
    const { headers: additionalHeaders = {} } = options;
    return {
      Accept: 'application/json',
      ...additionalHeaders,
    };
  }

  /** @returns {Promise<Object>} */
  async fetchCuratedData() {
    return this.get('');
  }

  /**
   * @param {string} source
   * @returns {Promise<Object>}
   * @throws {Error}
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

  /** @returns {Promise<Object>} */
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
