import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { UniversalSearchTopics } from '../topics.js';

/**
 * Default batch size for pagination
 */
const DEFAULT_BATCH_SIZE = 20;

/**
 * Build FormData for Universal Search API (similarity-search / imageSearch).
 *
 * @param {File} imageFile - Image file to search with
 * @param {number} [pageNumber=1] - Page number (1-indexed)
 * @param {number} [batchSize=20] - Results per page
 * @returns {FormData}
 */
function buildUniversalSearchFormData(imageFile, pageNumber = 1, batchSize = DEFAULT_BATCH_SIZE) {
  const startIndex = (pageNumber - 1) * batchSize;
  const formData = new FormData();
  formData.append('request', JSON.stringify({
    scope: ['stock'],
    limit: batchSize,
    start_index: startIndex,
    asset_type: ['images'],
  }));
  formData.append('image', imageFile);
  return formData;
}

/**
 * Parse API response into internal format with themes array.
 *
 * @param {Object} data - Raw API response
 * @returns {Object} Parsed data with themes array
 */
function parseUniversalSearchData(data) {
  const parsed = { ...data };
  parsed.themes = [];

  if (data.result_sets?.[0]?.items) {
    parsed.themes = data.result_sets[0].items;
    parsed.total_results = data.result_sets[0].total_results ?? 0;
  }

  return parsed;
}

/**
 * SearchActions - Handles similarity/image search for Universal Search
 *
 * Actions:
 * - searchByImage - Find visually similar stock images by image upload
 * - checkDataAvailability - Check if search returns results for an image
 */
export default class SearchActions extends BaseActionGroup {
  getHandlers() {
    return {
      [UniversalSearchTopics.SEARCH.BY_IMAGE]: this.searchByImage.bind(this),
      [UniversalSearchTopics.SEARCH.CHECK_AVAILABILITY]: this.checkDataAvailability.bind(this),
    };
  }

  /**
   * Get full URL for the current auth state
   *
   * @param {boolean} isLoggedIn
   * @returns {{ fullUrl: string, basePath: string, searchPath: string }}
   */
  #getUrl(isLoggedIn) {
    const config = this.plugin.serviceConfig || {};
    const endpoints = config.endpoints || {};

    if (isLoggedIn) {
      const basePath = (config.baseUrl || '').replace(/\/$/, '');
      const searchPath = endpoints.similarity || '/similarity-search';
      return {
        fullUrl: `${basePath}${searchPath}`,
        basePath,
        searchPath,
      };
    }

    const fullUrl = endpoints.anonymousImageSearch || 'https://search.adobe.io/imageSearch';
    const basePath = fullUrl.replace(/\/imageSearch$/, '');
    return {
      fullUrl,
      basePath,
      searchPath: '/imageSearch',
    };
  }

  /**
   * Get headers for the request based on auth state
   *
   * @param {boolean} isLoggedIn
   * @param {string} [token]
   * @returns {Object}
   */
  #getHeaders(isLoggedIn, token) {
    const headers = {
      'x-product': 'Color',
      'x-product-location': 'Color Website',
      'x-api-key': isLoggedIn ? (this.plugin.serviceConfig?.apiKey || 'ColorWeb') : 'KulerBackendClientId',
    };
    if (isLoggedIn && token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Execute POST with FormData to full URL (no Content-Type for multipart)
   *
   * @param {string} fullUrl
   * @param {FormData} formData
   * @param {Object} headers
   * @returns {Promise<Object>}
   */
  async #postFormData(fullUrl, formData, headers) {
    const reqHeaders = { ...headers };
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: reqHeaders,
      body: formData,
    });
    return this.plugin.handleResponse(response);
  }

  /**
   * Search by image (similarity search). Uses authenticated or anonymous endpoint based on auth.
   *
   * @param {Object} criteria - Search criteria
   * @param {File} criteria.imageFile - Image file to search with
   * @param {number} [criteria.pageNumber=1] - Page number (1-indexed)
   * @param {number} [criteria.batchSize=20] - Results per page
   * @param {number} [criteria.limit] - Alias for batchSize
   * @param {number} [criteria.startIndex] - Override start index (if set, pageNumber ignored)
   * @returns {Promise<Object>} Parsed response with themes and total_results
   */
  async searchByImage(criteria) {
    const imageFile = criteria?.imageFile;
    if (!imageFile || !(imageFile instanceof File)) {
      throw new ValidationError('imageFile (File) is required for similarity search', {
        field: 'criteria.imageFile',
        serviceName: 'UniversalSearch',
        topic: UniversalSearchTopics.SEARCH.BY_IMAGE,
      });
    }

    const auth = this.plugin.getAuthState();
    const pageNumber = criteria.pageNumber ?? 1;
    const batchSize = criteria.batchSize ?? criteria.limit ?? DEFAULT_BATCH_SIZE;
    let startIndex = criteria.startIndex;
    if (startIndex === undefined || startIndex === null) {
      startIndex = (pageNumber - 1) * batchSize;
    }
    const formData = buildUniversalSearchFormData(imageFile, 1, batchSize);
    if (startIndex > 0) {
      formData.set('request', JSON.stringify({
        scope: ['stock'],
        limit: batchSize,
        start_index: startIndex,
        asset_type: ['images'],
      }));
    }

    const { fullUrl } = this.#getUrl(auth.isLoggedIn);
    const headers = this.#getHeaders(auth.isLoggedIn, auth.token);

    const data = await this.#postFormData(fullUrl, formData, headers);
    return parseUniversalSearchData(data);
  }

  /**
   * Check if similarity search returns any results for the given image.
   *
   * @param {Object} criteria - Same as searchByImage (imageFile required)
   * @returns {Promise<boolean>} True if at least one result is available
   */
  async checkDataAvailability(criteria) {
    const imageFile = criteria?.imageFile;
    if (!imageFile || !(imageFile instanceof File)) {
      throw new ValidationError('imageFile (File) is required for availability check', {
        field: 'criteria.imageFile',
        serviceName: 'UniversalSearch',
        topic: UniversalSearchTopics.SEARCH.CHECK_AVAILABILITY,
      });
    }

    try {
      const result = await this.searchByImage({
        imageFile,
        pageNumber: 1,
        batchSize: 1,
      });
      const themes = result?.themes || [];
      return themes.length > 0;
    } catch (error) {
      if (typeof window !== 'undefined' && window.console?.error) {
        window.console.error('Universal search availability check failed:', error);
      }
      return false;
    }
  }
}

export { buildUniversalSearchFormData, parseUniversalSearchData };
