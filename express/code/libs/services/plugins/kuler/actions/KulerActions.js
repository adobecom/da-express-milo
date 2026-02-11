/* eslint-disable max-classes-per-file */
import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { KulerTopics } from '../topics.js';

const KULER_DEFAULT_BATCH_SIZE = 72;

export class SearchActions extends BaseActionGroup {
  getHandlers() {
    return {
      [KulerTopics.SEARCH.THEMES]: this.fetchThemeList.bind(this),
      [KulerTopics.SEARCH.GRADIENTS]: this.fetchGradientList.bind(this),
      [KulerTopics.SEARCH.PUBLISHED]: this.searchPublishedTheme.bind(this),
    };
  }

  /**
   * @param {Object} criteria
   * @param {string} criteria.main
   * @param {string} [criteria.typeOfQuery]
   * @returns {string}
   */
  static buildKulerQuery(criteria) {
    const type = criteria.typeOfQuery || 'term';
    const queryObj = { [type]: criteria.main };
    return JSON.stringify(queryObj);
  }

  /**
   * @param {Object} criteria
   * @param {string} criteria.main
   * @param {string} [criteria.typeOfQuery]
   * @param {number} criteria.pageNumber
   * @param {string} assetType
   * @returns {string}
   */
  buildSearchUrl(criteria, assetType = 'THEME') {
    const basePath = this.plugin.baseUrl;
    const searchPath = this.plugin.endpoints.search;

    const pageNum = Number.parseInt(String(criteria.pageNumber || 1), 10);
    const startIndex = (pageNum - 1) * KULER_DEFAULT_BATCH_SIZE;
    const queryParam = encodeURIComponent(SearchActions.buildKulerQuery(criteria));

    let url = `${basePath}${searchPath}?q=${queryParam}`;

    const auth = this.plugin.getAuthState();
    if (auth.isLoggedIn) {
      url = `${url}&metadata=all`;
    }

    url = `${url}&startIndex=${startIndex}&maxNumber=${KULER_DEFAULT_BATCH_SIZE}&assetType=${assetType}`;

    return url;
  }

  /**
   * @param {Object} criteria
   * @param {string} criteria.main
   * @param {string} [criteria.typeOfQuery]
   * @param {number} criteria.pageNumber
   * @param {string} [assetType]
   * @returns {Promise<Object>}
   */
  async fetchThemeList(criteria, assetType = 'THEME') {
    const url = this.buildSearchUrl(criteria, assetType);
    return this.makeRequestWithFullUrl(url, 'GET');
  }

  /**
   * @param {Object} criteria
   * @param {string} criteria.main
   * @param {string} [criteria.typeOfQuery]
   * @param {number} criteria.pageNumber
   * @returns {Promise<Object>}
   */
  async fetchGradientList(criteria) {
    return this.fetchThemeList(criteria, 'GRADIENT');
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
   * @param {string} url
   * @returns {Promise<Object>}
   */
  async searchPublishedTheme(url) {
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `${this.plugin.baseUrl}${url}`;
    }

    return this.makeRequestWithFullUrl(fullUrl, 'GET');
  }
}

export class ThemeActions extends BaseActionGroup {
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

  /**
   * @returns {string}
   */
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

export class GradientActions extends BaseActionGroup {
  getHandlers() {
    return {
      [KulerTopics.GRADIENT.SAVE]: this.saveGradient.bind(this),
      [KulerTopics.GRADIENT.DELETE]: this.deleteGradient.bind(this),
    };
  }

  /**
   * @returns {string}
   */
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

export class LikeActions extends BaseActionGroup {
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
