import BasePlugin from './BasePlugin.js';
import { ApiError } from './Errors.js';

/**
 * Abstract Base Class for all API Services.
 * Extends BasePlugin to add HTTP capabilities.
 *
 * Handles:
 * - Common fetch logic
 * - Error handling (using ApiError for HTTP failures)
 * - Header injection (Auth, API Keys)
 *
 * Subclasses inherit baseUrl, apiKey, endpoints from BasePlugin via serviceConfig.
 */
export default class BaseApiService extends BasePlugin {
  /**
   * @param {Object} [options] - Configuration options
   * @param {Object} [options.serviceConfig] - Service-specific config (baseUrl, apiKey, endpoints)
   * @param {Object} [options.appConfig] - Application-level config (features, environment)
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
    // baseUrl, apiKey, endpoints now available via getters from BasePlugin
  }

  /**
   * Helper to build query string from parameters object.
   * Filters out undefined and null values.
   *
   * @param {Object} params - Query parameters object
   * @returns {string} URL-encoded query string
   */
  static buildQueryString(params) {
    if (!params) return '';
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return query.toString();
  }

  /**
   * Get default headers for API requests.
   * Includes Content-Type, Accept, API key (if configured), and Authorization (if authenticated).
   * Can be overridden by subclasses.
   *
   * @param {Object} [options] - Request options
   * @param {Object} [options.headers] - Additional headers to merge
   * @param {boolean} [options.skipAuth] - Skip authentication header
   * @returns {Object} Headers object
   */
  getHeaders(options = {}) {
    const auth = this.getAuthState();
    const { headers: additionalHeaders = {}, skipAuth = false } = options;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...additionalHeaders,
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    if (!skipAuth && auth.isLoggedIn && auth.token) {
      headers.Authorization = `Bearer ${auth.token}`;
    }

    return headers;
  }

  /**
   * Get the current authentication state from auth middleware (adobeIMS).
   * Gets the actual auth state including login status and access token.
   * Can be overridden by subclasses to provide custom auth state.
   *
   * @returns {Object} Authentication state object with isLoggedIn and token properties
   */
  // eslint-disable-next-line class-methods-use-this
  getAuthState() {
    const isLoggedIn = window?.adobeIMS?.isSignedInUser() || false;
    const token = window?.adobeIMS?.getAccessToken()?.token;

    return {
      isLoggedIn,
      token,
    };
  }

  /**
   * Handle HTTP response, converting errors and empty responses appropriately.
   *
   * @param {Response} response - Fetch API response object
   * @returns {Promise<Object>} Parsed JSON response or empty object for 204 status
   * @throws {ApiError} If response is not ok
   */
  async handleResponse(response) {
    if (!response.ok) {
      const errorBody = await response.text();
      const serviceName = this.constructor.serviceName || 'Unknown';
      throw new ApiError(`${response.status} ${response.statusText}`, {
        statusCode: response.status,
        responseBody: errorBody,
        serviceName,
      });
    }
    if (response.status === 204) {
      return {};
    }
    return response.json();
  }

  /**
   * Generic GET request.
   *
   * @param {string} path - API endpoint path
   * @param {Object} [options] - Request options
   * @param {Object} [options.params] - Query parameters object
   * @returns {Promise<Object>} Parsed JSON response
   */
  async get(path, options = {}) {
    const { params } = options;
    const query = BaseApiService.buildQueryString(params);
    const queryString = query ? `?${query}` : '';
    const url = `${this.baseUrl}${path}${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(options),
    });

    return this.handleResponse(response);
  }

  /**
   * Generic POST request.
   * Automatically handles FormData by removing Content-Type header.
   *
   * @param {string} path - API endpoint path
   * @param {Object|FormData} body - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Parsed JSON response
   */
  async post(path, body, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getHeaders(options);

    if (body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
    });

    return this.handleResponse(response);
  }

  /**
   * Generic PUT request.
   *
   * @param {string} path - API endpoint path
   * @param {Object} body - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Parsed JSON response
   */
  async put(path, body, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(options),
      body: JSON.stringify(body),
    });

    return this.handleResponse(response);
  }

  /**
   * Generic DELETE request.
   *
   * @param {string} path - API endpoint path
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Parsed JSON response
   */
  async delete(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(options),
    });

    return this.handleResponse(response);
  }
}

