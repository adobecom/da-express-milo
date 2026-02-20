/* eslint-disable max-classes-per-file */
import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { UniversalSearchTopics } from '../topics.js';
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_PAGE_NUMBER,
  AVAILABILITY_CHECK_BATCH_SIZE,
  FORM_FIELD_REQUEST,
  FORM_FIELD_IMAGE,
  SEARCH_SCOPE,
  SEARCH_ASSET_TYPE,
  HEADER_X_PRODUCT,
  HEADER_X_PRODUCT_LOCATION,
  PRODUCT_NAME,
  PRODUCT_LOCATION,
  ERROR_IMAGE_REQUIRED_SEARCH,
  ERROR_IMAGE_REQUIRED_CHECK,
  ERROR_FIELD_IMAGE,
} from '../constants.js';

/**
 * @param {File} imageFile
 * @param {number} [pageNumber=1]
 * @param {number} [batchSize=20]
 * @returns {FormData}
 */
function buildUniversalSearchFormData(
  imageFile,
  pageNumber = DEFAULT_PAGE_NUMBER,
  batchSize = DEFAULT_BATCH_SIZE,
) {
  const startIndex = (pageNumber - 1) * batchSize;
  const formData = new FormData();
  formData.append(FORM_FIELD_REQUEST, JSON.stringify({
    scope: SEARCH_SCOPE,
    limit: batchSize,
    start_index: startIndex,
    asset_type: SEARCH_ASSET_TYPE,
  }));
  formData.append(FORM_FIELD_IMAGE, imageFile);
  return formData;
}

/** @param {Object} data @returns {Object} */
function parseUniversalSearchData(data) {
  const parsed = { ...data };
  parsed.themes = [];

  if (data.result_sets?.[0]?.items) {
    parsed.themes = data.result_sets[0].items;
    parsed.total_results = data.result_sets[0].total_results ?? 0;
  }

  return parsed;
}

export class SearchActions extends BaseActionGroup {
  getHandlers() {
    return {
      [UniversalSearchTopics.SEARCH.BY_IMAGE]: this.searchByImage.bind(this),
      [UniversalSearchTopics.SEARCH.CHECK_AVAILABILITY]: this.checkDataAvailability.bind(this),
    };
  }

  /**
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

    const fullUrl = endpoints.anonymousImageSearch || '';
    const basePath = fullUrl.replace(/\/imageSearch$/, '');
    return {
      fullUrl,
      basePath,
      searchPath: '/imageSearch',
    };
  }

  /** @param {boolean} isLoggedIn @param {string} [token] @returns {Object} */
  #getHeaders(isLoggedIn, token) {
    const config = this.plugin.serviceConfig || {};
    const apiKey = isLoggedIn ? config.apiKey : config.anonymousApiKey;

    const headers = {
      [HEADER_X_PRODUCT]: PRODUCT_NAME,
      [HEADER_X_PRODUCT_LOCATION]: PRODUCT_LOCATION,
    };

    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    if (isLoggedIn && token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  /**
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
   * @param {{ imageFile: File, pageNumber?: number, batchSize?: number,
   *   limit?: number, startIndex?: number }} criteria
   * @returns {Promise<Object>}
   */
  async searchByImage(criteria) {
    const imageFile = criteria?.imageFile;
    if (!imageFile || !(imageFile instanceof File)) {
      throw new ValidationError(ERROR_IMAGE_REQUIRED_SEARCH, {
        field: ERROR_FIELD_IMAGE,
        serviceName: this.plugin.serviceName,
        topic: UniversalSearchTopics.SEARCH.BY_IMAGE,
      });
    }

    const auth = this.plugin.getAuthState();
    const pageNumber = criteria.pageNumber ?? 1;
    const batchSize = criteria.batchSize ?? criteria.limit ?? DEFAULT_BATCH_SIZE;
    const { startIndex: rawStartIndex } = criteria;
    const startIndex = rawStartIndex ?? (pageNumber - 1) * batchSize;
    const formData = buildUniversalSearchFormData(imageFile, 1, batchSize);
    if (startIndex > 0) {
      formData.set(FORM_FIELD_REQUEST, JSON.stringify({
        scope: SEARCH_SCOPE,
        limit: batchSize,
        start_index: startIndex,
        asset_type: SEARCH_ASSET_TYPE,
      }));
    }

    const { fullUrl } = this.#getUrl(auth.isLoggedIn);
    const headers = this.#getHeaders(auth.isLoggedIn, auth.token);

    const data = await this.#postFormData(fullUrl, formData, headers);
    return parseUniversalSearchData(data);
  }

  /** @param {{ imageFile: File }} criteria @returns {Promise<boolean>} */
  async checkDataAvailability(criteria) {
    const imageFile = criteria?.imageFile;
    if (!imageFile || !(imageFile instanceof File)) {
      throw new ValidationError(ERROR_IMAGE_REQUIRED_CHECK, {
        field: ERROR_FIELD_IMAGE,
        serviceName: this.plugin.serviceName,
        topic: UniversalSearchTopics.SEARCH.CHECK_AVAILABILITY,
      });
    }

    try {
      const result = await this.searchByImage({
        imageFile,
        pageNumber: DEFAULT_PAGE_NUMBER,
        batchSize: AVAILABILITY_CHECK_BATCH_SIZE,
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

export class UrlActions extends BaseActionGroup {
  getHandlers() {
    return {
      [UniversalSearchTopics.URL.GET]: this.getSearchUrl.bind(this),
    };
  }

  /**
   * @param {boolean} [isLoggedIn]
   * @returns {{ fullUrl: string, basePath: string, api: string, searchPath: string }}
   */
  getSearchUrl(isLoggedIn) {
    const resolvedLoggedIn = isLoggedIn ?? this.plugin.getAuthState()?.isLoggedIn ?? false;
    const config = this.plugin.serviceConfig || {};
    const endpoints = config.endpoints || {};

    if (resolvedLoggedIn) {
      const basePath = (config.baseUrl || '').replace(/\/$/, '');
      const searchPath = endpoints.similarity || '/similarity-search';
      return {
        fullUrl: `${basePath}${searchPath}`,
        basePath,
        api: '/universal-search/v2',
        searchPath,
      };
    }

    const fullUrl = endpoints.anonymousImageSearch || '';
    const basePath = fullUrl.replace(/\/imageSearch$/, '');
    return {
      fullUrl,
      basePath,
      api: '',
      searchPath: '/imageSearch',
    };
  }
}

export { buildUniversalSearchFormData, parseUniversalSearchData };
