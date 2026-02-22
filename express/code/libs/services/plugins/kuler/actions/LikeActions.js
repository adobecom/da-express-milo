import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { KulerTopics } from '../topics.js';

export default class LikeActions extends BaseActionGroup {
  getHandlers() {
    return {
      [KulerTopics.LIKE.UPDATE]: this.updateLikeStatus.bind(this),
    };
  }

  /**
   * @param {string} themeId
   * @returns {string}
   */
  buildThemeLikeUrl(themeId) {
    const { endpoints } = this.plugin;
    const basePath = endpoints.likeBaseUrl || 'https://asset.adobe.io';
    const themePath = endpoints.themePath || '/themes';

    return `${basePath}${themePath}/${themeId}/likeDuplicate`;
  }

  /**
   * @param {string} themeId
   * @returns {string}
   */
  buildThemeUnlikeUrl(themeId) {
    const { endpoints } = this.plugin;
    const basePath = endpoints.likeBaseUrl || 'https://asset.adobe.io';
    const themePath = endpoints.themePath || '/themes';

    return `${basePath}${themePath}/${themeId}/like`;
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
   * @param {Object} payload
   * @param {string} payload.id
   * @param {Object} payload.like
   * @param {Object} [payload.like.user]
   * @param {string} payload.source
   * @returns {Promise<void>}
   * @throws {ValidationError}
   */
  async updateLikeStatus(payload) {
    if (!payload?.id) {
      throw new ValidationError('Theme ID is required for like/unlike', {
        field: 'payload.id',
        serviceName: 'Kuler',
        topic: 'LIKE.UPDATE',
      });
    }
    if (payload.like?.user) {
      const url = this.buildThemeUnlikeUrl(payload.id);
      await this.makeRequestWithFullUrl(url, 'DELETE');
    } else {
      const url = this.buildThemeLikeUrl(payload.id);
      await this.makeRequestWithFullUrl(url, 'POST', {});
    }
  }
}
