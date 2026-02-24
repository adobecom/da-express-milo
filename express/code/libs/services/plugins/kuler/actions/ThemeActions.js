import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { KulerTopics } from '../topics.js';

export default class ThemeActions extends BaseActionGroup {
  getHandlers() {
    return {
      [KulerTopics.THEME.GET]: this.fetchTheme.bind(this),
      [KulerTopics.THEME.SAVE]: this.saveTheme.bind(this),
      [KulerTopics.THEME.DELETE]: this.deleteTheme.bind(this),
    };
  }

  /**
   * @param {string} themeId
   * @returns {string}
   */
  buildThemeUrl(themeId) {
    const { endpoints } = this.plugin;
    const basePath = endpoints.themeBaseUrl || 'https://themes.adobe.io';
    const api = endpoints.api || '/api/v2';
    const themePath = endpoints.themePath || '/themes';

    return `${basePath}${api}${themePath}/${themeId}`;
  }

  /** @returns {string} */
  buildThemeSaveUrl() {
    const { endpoints } = this.plugin;
    const basePath = endpoints.themeBaseUrl || 'https://themes.adobe.io';
    const api = endpoints.api || '/api/v2';
    const themePath = endpoints.themePath || '/themes';

    return `${basePath}${api}${themePath}`;
  }

  /**
   * @param {string} themeId
   * @returns {string}
   */
  buildThemeDeleteUrl(themeId) {
    return this.buildThemeUrl(themeId);
  }

  /**
   * @param {Array} swatches
   * @param {Object} themeData
   * @returns {Array}
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
   * @param {Object} themeData
   * @param {Object} ccLibrariesResponse
   * @returns {Object}
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
   * @param {string} themeId
   * @returns {Promise<Object>}
   * @throws {ValidationError}
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
   * @param {Object} themeData
   * @param {string} themeData.name
   * @param {Array} themeData.swatches
   * @param {Array} [themeData.tags]
   * @param {Object} [themeData.harmony]
   * @param {Object} ccLibrariesResponse
   * @param {string} ccLibrariesResponse.id
   * @param {string} ccLibrariesResponse.libraryid
   * @returns {Promise<Object>}
   * @throws {ValidationError}
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
   * @param {Object} payload
   * @param {string} payload.id
   * @param {string} payload.name
   * @returns {Promise<Object>}
   * @throws {ValidationError}
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
