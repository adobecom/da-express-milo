import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { KulerTopics } from '../topics.js';

export default class GradientActions extends BaseActionGroup {
  getHandlers() {
    return {
      [KulerTopics.GRADIENT.SAVE]: this.saveGradient.bind(this),
      [KulerTopics.GRADIENT.DELETE]: this.deleteGradient.bind(this),
    };
  }

  /** @returns {string} */
  buildGradientSaveUrl() {
    const { endpoints } = this.plugin;
    const basePath = endpoints.gradientBaseUrl || 'https://gradient.adobe.io';
    const api = endpoints.api || '/api/v2';
    const gradientPath = endpoints.gradientPath || '/gradient';

    return `${basePath}${api}${gradientPath}`;
  }

  /**
   * @param {string} gradientId
   * @returns {string}
   */
  buildGradientDeleteUrl(gradientId) {
    const { endpoints } = this.plugin;
    const basePath = endpoints.gradientBaseUrl || 'https://gradient.adobe.io';
    const api = endpoints.api || '/api/v2';
    const gradientPath = endpoints.gradientPath || '/gradient';

    return `${basePath}${api}${gradientPath}/${gradientId}`;
  }

  /**
   * @param {string} fullUrl
   * @param {string} method
   * @param {Object} [body]
   * @returns {Promise<Object>}
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
   * @param {Object} gradientData
   * @param {Object} [ccLibrariesResponse]
   * @returns {Promise<Object>}
   * @throws {ValidationError}
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
   * @param {Object} payload
   * @param {string} payload.id
   * @param {string} payload.name
   * @returns {Promise<Object>}
   * @throws {ValidationError}
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
