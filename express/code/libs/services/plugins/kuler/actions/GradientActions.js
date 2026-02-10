import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { KulerTopics } from '../topics.js';

/**
 * GradientActions - Handles all gradient-related operations for Kuler
 *
 * Actions:
 * - saveGradient - Create/publish a gradient
 * - deleteGradient - Delete a published gradient
 *
 * Uses ValidationError for input validation failures.
 */
export default class GradientActions extends BaseActionGroup {
  /**
   * Map topics to specific methods in this class
   */
  getHandlers() {
    return {
      [KulerTopics.GRADIENT.SAVE]: this.saveGradient.bind(this),
      [KulerTopics.GRADIENT.DELETE]: this.deleteGradient.bind(this),
    };
  }

  /**
   * Builds the gradient save URL
   *
   * @returns {string} Complete gradient save URL
   */
  buildGradientSaveUrl() {
    const { endpoints } = this.plugin;
    const basePath = endpoints.gradientBaseUrl || 'https://gradient.adobe.io';
    const api = endpoints.api || '/api/v2';
    const gradientPath = endpoints.gradientPath || '/gradient';

    return `${basePath}${api}${gradientPath}`;
  }

  /**
   * Builds the gradient delete URL
   *
   * @param {string} gradientId - Gradient ID
   * @returns {string} Complete delete URL
   */
  buildGradientDeleteUrl(gradientId) {
    const { endpoints } = this.plugin;
    const basePath = endpoints.gradientBaseUrl || 'https://gradient.adobe.io';
    const api = endpoints.api || '/api/v2';
    const gradientPath = endpoints.gradientPath || '/gradient';

    return `${basePath}${api}${gradientPath}/${gradientId}`;
  }

  /**
   * Helper method to make a request with a full URL
   *
   * @param {string} fullUrl - Complete URL for the request
   * @param {string} method - HTTP method ('GET', 'POST', 'DELETE', etc.)
   * @param {Object} [body] - Request body (for POST/PUT)
   * @returns {Promise<Object>} Promise resolving to response data
   */
  async makeRequestWithFullUrl(fullUrl, method = 'GET', body = null) {
    const headers = this.plugin.getHeaders();

    const options = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = body instanceof FormData ? body : JSON.stringify(body);
      if (body instanceof FormData) {
        delete options.headers['Content-Type'];
      }
    }

    const response = await fetch(fullUrl, options);
    return this.plugin.handleResponse(response);
  }

  /**
   * Save/publish a gradient to Kuler
   *
   * @param {Object} gradientData - Gradient data to save
   * @param {Object} [ccLibrariesResponse] - CC Libraries response (optional)
   * @returns {Promise<Object>} Promise resolving to saved gradient response
   * @throws {ValidationError} If gradientData is missing
   */
  // eslint-disable-next-line no-unused-vars
  async saveGradient(gradientData, ccLibrariesResponse) {
    if (!gradientData) {
      throw new ValidationError('Gradient data is required', {
        field: 'gradientData',
        serviceName: 'Kuler',
        topic: 'GRADIENT.SAVE',
      });
    }
    const url = this.buildGradientSaveUrl();
    return this.makeRequestWithFullUrl(url, 'POST', gradientData);
  }

  /**
   * Delete a published gradient
   *
   * @param {Object} payload - Delete payload
   * @param {string} payload.id - Gradient ID
   * @param {string} payload.name - Gradient name
   * @returns {Promise<Object>} Promise resolving to delete response
   * @throws {ValidationError} If payload.id is missing
   */
  async deleteGradient(payload) {
    if (!payload?.id) {
      throw new ValidationError('Gradient ID is required for deletion', {
        field: 'payload.id',
        serviceName: 'Kuler',
        topic: 'GRADIENT.DELETE',
      });
    }
    const url = this.buildGradientDeleteUrl(payload.id);
    const response = await this.makeRequestWithFullUrl(url, 'DELETE');
    return {
      response,
      gradientName: payload.name,
    };
  }
}
