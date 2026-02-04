import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { KulerTopics } from '../topics.js';

/**
 * LikeActions - Handles all like/unlike operations for Kuler
 *
 * Actions:
 * - updateLikeStatus - Like/unlike a theme
 *
 * Uses ValidationError for input validation failures.
 */
export default class LikeActions extends BaseActionGroup {
  /**
   * Map topics to specific methods in this class
   */
  getHandlers() {
    return {
      [KulerTopics.LIKE.UPDATE]: this.updateLikeStatus.bind(this),
    };
  }

  /**
   * Builds the theme like URL
   *
   * @param {string} themeId - Theme ID
   * @returns {string} Complete like URL
   */
  buildThemeLikeUrl(themeId) {
    const { endpoints } = this.plugin;
    const basePath = endpoints.likeBaseUrl || 'https://asset.adobe.io';
    const themePath = endpoints.themePath || '/themes';

    return `${basePath}${themePath}/${themeId}/likeDuplicate`;
  }

  /**
   * Builds the theme unlike URL
   *
   * @param {string} themeId - Theme ID
   * @returns {string} Complete unlike URL
   */
  buildThemeUnlikeUrl(themeId) {
    const { endpoints } = this.plugin;
    const basePath = endpoints.likeBaseUrl || 'https://asset.adobe.io';
    const themePath = endpoints.themePath || '/themes';

    return `${basePath}${themePath}/${themeId}/like`;
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
   * Update theme like status (like or unlike)
   *
   * @param {Object} payload - Like status payload
   * @param {string} payload.id - Theme ID
   * @param {Object} payload.like - Like object
   * @param {Object} [payload.like.user] - User object if already liked
   * @param {string} payload.source - Source ('KULER')
   * @returns {Promise<void>} Promise resolving when complete
   * @throws {ValidationError} If payload.id is missing
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

