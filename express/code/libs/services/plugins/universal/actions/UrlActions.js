import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { UniversalSearchTopics } from '../topics.js';

/**
 * UrlActions - Provides URL construction for Universal Search endpoints
 *
 * Actions:
 * - getSearchUrl - Get endpoint URL and paths based on auth state
 */
export default class UrlActions extends BaseActionGroup {
  getHandlers() {
    return {
      [UniversalSearchTopics.URL.GET]: this.getSearchUrl.bind(this),
    };
  }

  /**
   * Get Universal Search endpoint URL based on authentication state.
   * Authenticated: adobesearch.adobe.io/universal-search/v2/similarity-search
   * Anonymous: search.adobe.io/imageSearch
   *
   * @param {boolean} [isLoggedIn] - If not provided, uses plugin.getAuthState()
   * @returns {{ fullUrl: string, basePath: string, api: string, searchPath: string }}
   */
  getSearchUrl(isLoggedIn) {
    const resolvedLoggedIn = isLoggedIn ?? this.plugin.getAuthState()?.isLoggedIn ?? false;
    const config = this.plugin.serviceConfig || {};
    const endpoints = config.endpoints || {};

    if (resolvedLoggedIn) {
      const basePath = (config.baseUrl || 'https://adobesearch.adobe.io/universal-search/v2').replace(/\/$/, '');
      const searchPath = endpoints.similarity || '/similarity-search';
      return {
        fullUrl: `${basePath}${searchPath}`,
        basePath,
        api: '/universal-search/v2',
        searchPath,
      };
    }

    const fullUrl = endpoints.anonymousImageSearch || 'https://search.adobe.io/imageSearch';
    const basePath = fullUrl.replace(/\/imageSearch$/, '');
    return {
      fullUrl,
      basePath,
      api: '',
      searchPath: '/imageSearch',
    };
  }
}
