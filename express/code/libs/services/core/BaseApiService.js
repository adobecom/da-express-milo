import BasePlugin from './BasePlugin.js';
import { ApiError } from './Errors.js';

export default class BaseApiService extends BasePlugin {
  /**
   * @param {Object} [options]
   * @param {Object} [options.serviceConfig]
   * @param {Object} [options.appConfig]
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
  }

  /**
   * @param {Object} params
   * @returns {string}
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
   * @param {Object} [options]
   * @param {Object} [options.headers]
   * @param {boolean} [options.skipAuth]
   * @returns {Object}
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

  /** @returns {Object} */
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
   * @param {Response} response
   * @returns {Promise<Object>}
   * @throws {ApiError}
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
   * @param {string} fullUrl
   * @param {string} [method='GET']
   * @param {Object|FormData|null} [body=null]
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async fetchWithFullUrl(fullUrl, method = 'GET', body = null, options = {}) {
    const headers = this.getHeaders(options);
    const fetchOptions = { method, headers };

    if (body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
      if (body instanceof FormData) {
        delete fetchOptions.headers['Content-Type'];
      }
    }

    const response = await fetch(fullUrl, fetchOptions);
    return this.handleResponse(response);
  }

  /**
   * @param {string} path
   * @param {Object} [options]
   * @param {Object} [options.params]
   * @returns {Promise<Object>}
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
   * @param {string} path
   * @param {Object|FormData} body
   * @param {Object} [options]
   * @returns {Promise<Object>}
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
   * @param {string} path
   * @param {Object} body
   * @param {Object} [options]
   * @returns {Promise<Object>}
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
   * @param {string} path
   * @param {Object} [options]
   * @returns {Promise<Object>}
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
