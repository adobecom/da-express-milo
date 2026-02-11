import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { KulerTopics } from '../topics.js';

/**
 * ThemeActions - Handles all theme-related operations for Kuler
 *
 * Actions:
 * - fetchTheme - Get a specific theme by ID
 * - saveTheme - Create/publish a theme
 * - deleteTheme - Delete a published theme
 *
 * Uses ValidationError for input validation failures.
 */
export default class ThemeActions extends BaseActionGroup {
  /**
   * Map topics to specific methods in this class
   */
  getHandlers() {
    return {
      [KulerTopics.THEME.GET]: this.fetchTheme.bind(this),
      [KulerTopics.THEME.SAVE]: this.saveTheme.bind(this),
      [KulerTopics.THEME.DELETE]: this.deleteTheme.bind(this),
    };
  }

  /**
   * Builds the theme detail URL
   *
   * @param {string} themeId - Theme ID
   * @returns {string} Complete theme detail URL
   */
  buildThemeUrl(themeId) {
    const { endpoints } = this.plugin;
    const basePath = endpoints.themeBaseUrl || 'https://themes.adobe.io';
    const api = endpoints.api || '/api/v2';
    const themePath = endpoints.themePath || '/themes';

    return `${basePath}${api}${themePath}/${themeId}`;
  }

  /**
   * Builds the theme save URL
   *
   * @returns {string} Complete theme save URL
   */
  buildThemeSaveUrl() {
    const { endpoints } = this.plugin;
    const basePath = endpoints.themeBaseUrl || 'https://themes.adobe.io';
    const api = endpoints.api || '/api/v2';
    const themePath = endpoints.themePath || '/themes';

    return `${basePath}${api}${themePath}`;
  }

  /**
   * Builds the theme delete URL
   *
   * @param {string} themeId - Theme ID
   * @returns {string} Complete delete URL
   */
  buildThemeDeleteUrl(themeId) {
    return this.buildThemeUrl(themeId);
  }

  /**
   * Convert swatches to Kuler format
   *
   * @param {Array} swatches - Array of swatch objects
   * @param {Object} themeData - Theme data
   * @returns {Array} Array of swatches in Kuler format
   */
  static convertSwatchesToKulerFormat(swatches, themeData) {
    const COLOR_MODE = {
      RGB: 'rgb',
      CMYK: 'cmyk',
      HSV: 'hsv',
      LAB: 'lab',
    };

    let colorMode = COLOR_MODE.RGB;
    if (swatches.length > 0) {
      const firstSwatch = swatches[0];
      if (firstSwatch.cmyk) colorMode = COLOR_MODE.CMYK;
      else if (firstSwatch.hsv) colorMode = COLOR_MODE.HSV;
      else if (firstSwatch.lab) colorMode = COLOR_MODE.LAB;
    }

    return swatches.map((swatch, index) => {
      let values = [];

      switch (colorMode) {
        case COLOR_MODE.RGB:
          if (swatch.rgb) {
            values = [swatch.rgb.r, swatch.rgb.g, swatch.rgb.b];
          }
          break;
        case COLOR_MODE.CMYK:
          if (swatch.cmyk) {
            values = [swatch.cmyk.c, swatch.cmyk.m, swatch.cmyk.y, swatch.cmyk.k];
          }
          break;
        case COLOR_MODE.HSV:
          if (swatch.hsv) {
            values = [swatch.hsv.h, swatch.hsv.s, swatch.hsv.v];
          }
          break;
        case COLOR_MODE.LAB:
          if (swatch.lab) {
            values = [swatch.lab.l, swatch.lab.a, swatch.lab.b];
          }
          break;
        default: return swatch;
      }

      const result = {
        mode: colorMode,
        values,
      };

      if (themeData.swatches?.[index]?.label) {
        result.swatchLabel = themeData.swatches[index].label;
      }

      return result;
    });
  }

  /**
   * Build theme post data from theme data and CC Libraries response
   *
   * @param {Object} themeData - Theme data
   * @param {Object} ccLibrariesResponse - CC Libraries response
   * @returns {Object} Theme save request payload
   */
  static buildThemePostData(themeData, ccLibrariesResponse) {
    const swatches = ThemeActions.convertSwatchesToKulerFormat(themeData.swatches || [], themeData);

    return {
      name: themeData.name || 'My Color Theme',
      swatches,
      assets: {
        assetid: ccLibrariesResponse.id,
        libraryid: ccLibrariesResponse.libraryid,
      },
      tags: themeData.tags || [],
      harmony: {
        baseSwatchIndex: themeData.harmony?.baseSwatchIndex || 0,
        mood: themeData.harmony?.mood?.toLowerCase(),
        rule: (themeData.harmony?.rule || 'custom').toLowerCase(),
        sourceURL: themeData.harmony?.sourceURL || '',
      },
      ...(themeData.accessibilityData && { accessibilityData: themeData.accessibilityData }),
    };
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
   * Fetch a single theme by ID
   *
   * @param {string} themeId - Theme ID
   * @returns {Promise<Object>} Promise resolving to theme data
   * @throws {ValidationError} If themeId is missing
   */
  async fetchTheme(themeId) {
    if (!themeId) {
      throw new ValidationError('Theme ID is required', {
        field: 'themeId',
        serviceName: 'Kuler',
        topic: 'THEME.GET',
      });
    }
    const url = this.buildThemeUrl(themeId);
    return this.makeRequestWithFullUrl(url, 'GET');
  }

  /**
   * Save/publish a theme to Kuler
   *
   * @param {Object} themeData - Theme data to save
   * @param {string} themeData.name - Theme name
   * @param {Array} themeData.swatches - Array of swatch objects
   * @param {Array} [themeData.tags] - Array of tags
   * @param {Object} [themeData.harmony] - Harmony data
   * @param {Object} ccLibrariesResponse - CC Libraries response (contains asset info)
   * @param {string} ccLibrariesResponse.id - Asset ID
   * @param {string} ccLibrariesResponse.libraryid - Library ID
   * @returns {Promise<Object>} Promise resolving to saved theme response
   * @throws {ValidationError} If required fields are missing
   */
  async saveTheme(themeData, ccLibrariesResponse) {
    if (!themeData) {
      throw new ValidationError('Theme data is required', {
        field: 'themeData',
        serviceName: 'Kuler',
        topic: 'THEME.SAVE',
      });
    }
    if (!themeData.swatches?.length) {
      throw new ValidationError('Theme must have at least one swatch', {
        field: 'themeData.swatches',
        serviceName: 'Kuler',
        topic: 'THEME.SAVE',
      });
    }
    if (!ccLibrariesResponse?.id) {
      throw new ValidationError('CC Libraries response ID is required', {
        field: 'ccLibrariesResponse.id',
        serviceName: 'Kuler',
        topic: 'THEME.SAVE',
      });
    }
    if (!ccLibrariesResponse?.libraryid) {
      throw new ValidationError('CC Libraries response library ID is required', {
        field: 'ccLibrariesResponse.libraryid',
        serviceName: 'Kuler',
        topic: 'THEME.SAVE',
      });
    }
    const url = this.buildThemeSaveUrl();
    const postData = ThemeActions.buildThemePostData(themeData, ccLibrariesResponse);
    return this.makeRequestWithFullUrl(url, 'POST', postData);
  }

  /**
   * Delete a published theme
   *
   * @param {Object} payload - Delete payload
   * @param {string} payload.id - Theme ID
   * @param {string} payload.name - Theme name
   * @returns {Promise<Object>} Promise resolving to delete response
   * @throws {ValidationError} If payload.id is missing
   */
  async deleteTheme(payload) {
    if (!payload?.id) {
      throw new ValidationError('Theme ID is required for deletion', {
        field: 'payload.id',
        serviceName: 'Kuler',
        topic: 'THEME.DELETE',
      });
    }
    const url = this.buildThemeDeleteUrl(payload.id);
    const response = await this.makeRequestWithFullUrl(url, 'DELETE');
    return {
      response,
      themeName: payload.name,
    };
  }
}
