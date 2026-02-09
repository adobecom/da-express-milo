import BaseApiService from '../../core/BaseApiService.js';
import { UniversalSearchActionGroups } from './topics.js';
import SearchActions from './actions/SearchActions.js';
import UrlActions from './actions/UrlActions.js';

/**
 * UniversalSearchPlugin - Plugin for Universal Search API (similarity/image search)
 *
 * Uses a modular action group architecture similar to KulerPlugin:
 * - SearchActions: searchByImage, checkDataAvailability
 * - UrlActions: getSearchUrl
 *
 * Endpoints (per UNIVERSAL_SEARCH_API.md):
 * - Authenticated: adobesearch.adobe.io/universal-search/v2/similarity-search
 * - Anonymous: search.adobe.io/imageSearch
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.serviceConfig - Universal search service config (baseUrl, apiKey, endpoints)
 * @param {Object} options.appConfig - Application config (features, environment)
 */
export default class UniversalSearchPlugin extends BaseApiService {
  static get serviceName() {
    return 'UniversalSearch';
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
    return appConfigParam?.features?.ENABLE_UNIVERSAL !== false;
  }

  /**
   * Register all action groups for this plugin
   */
  registerActionGroups() {
    this.registerActionGroup(UniversalSearchActionGroups.SEARCH, new SearchActions(this));
    this.registerActionGroup(UniversalSearchActionGroups.URL, new UrlActions(this));
  }

  /**
   * Get all registered action group names
   * @returns {string[]}
   */
  getActionGroupNames() {
    return Array.from(this.actionGroups.keys());
  }
}
