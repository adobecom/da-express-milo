/* eslint-disable max-classes-per-file */
import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { KulerTopics } from '../topics.js';

const KULER_DEFAULT_BATCH_SIZE = 72;

/**
 * Criteria constants matching the Kuler API sort values.
 */
const KULER_CRITERIA = {
  ALL_THEMES: 'create_time',
  MOST_POPULAR: 'like_count',
  MOST_USED: 'view_count',
  RANDOM: 'random',
  MY_PUBLISHED: 'my_themes',
};

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
    if (auth.isLoggedIn && auth.token) {
      url = `${url}&metadata=all`;
    }

    url = `${url}&startIndex=${startIndex}&maxNumber=${KULER_DEFAULT_BATCH_SIZE}&assetType=${assetType}`;

    return url;
  }

  /**
   * Build a URL to check if an asset is published on Kuler by its CC Library asset ID.
   * @param {string} assetId - The CC Library asset ID
   * @param {string} [assetType='GRADIENT'] - THEME or GRADIENT
   * @returns {string}
   */
  buildPublishedCheckUrl(assetId, assetType = 'GRADIENT') {
    const basePath = this.plugin.baseUrl;
    const searchPath = this.plugin.endpoints.search;
    const queryObj = { asset_id: assetId };
    const queryParam = encodeURIComponent(JSON.stringify(queryObj));
    return `${basePath}${searchPath}?q=${queryParam}&maxNumber=1&assetType=${assetType}`;
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
    return this.plugin.fetchWithFullUrl(url, 'GET');
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
   * Search for a published theme/gradient by URL or asset ID.
   * @param {string|Object} urlOrParams - Full URL string, or { assetId, assetType }
   * @returns {Promise<Object>}
   * @throws {ValidationError}
   */
  async searchPublishedTheme(urlOrParams) {
    if (typeof urlOrParams === 'object' && urlOrParams.assetId) {
      const { assetId, assetType = 'GRADIENT' } = urlOrParams;
      const url = this.buildPublishedCheckUrl(assetId, assetType);
      return this.plugin.fetchWithFullUrl(url, 'GET');
    }

    let fullUrl = urlOrParams;
    if (typeof fullUrl === 'string' && !fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = `${this.plugin.baseUrl}${fullUrl}`;
    }

    return this.plugin.fetchWithFullUrl(fullUrl, 'GET');
  }
}

/**
 * ExploreActions handles the Browse/Explore flow that fetches
 * gradients and themes from the themesb3.adobe.io endpoint
 * using filter/sort/time parameters instead of search queries.
 */
export class ExploreActions extends BaseActionGroup {
  getHandlers() {
    return {
      [KulerTopics.EXPLORE.THEMES]: this.fetchExploreThemes.bind(this),
      [KulerTopics.EXPLORE.GRADIENTS]: this.fetchExploreGradients.bind(this),
    };
  }

  /**
   * Build a browse/explore URL for the B3 endpoint.
   * @param {string} assetPath - e.g. '/themes' or '/gradient'
   * @param {Object} [criteria]
   * @param {string} [criteria.filter='public']
   * @param {string} [criteria.sort='create_time']
   * @param {string} [criteria.time='month']
   * @param {number} [criteria.pageNumber=1]
   * @returns {string}
   */
  buildExploreUrl(assetPath, criteria = {}) {
    const { endpoints } = this.plugin;
    const basePath = endpoints.exploreBaseUrl || 'https://themesb3.adobe.io';
    const api = endpoints.api || '/api/v2';

    const filter = criteria.filter || 'public';
    const sort = criteria.sort || KULER_CRITERIA.ALL_THEMES;
    const time = criteria.time || 'month';
    const pageNum = Number.parseInt(String(criteria.pageNumber || 1), 10);
    const startIndex = (pageNum - 1) * KULER_DEFAULT_BATCH_SIZE;

    let url = `${basePath}${api}${assetPath}`;

    if (filter === KULER_CRITERIA.MY_PUBLISHED || filter === 'my_themes') {
      url = `${url}?filter=${filter}`;
    } else {
      url = `${url}?filter=${filter}&sort=${sort}&time=${time}`;
    }

    const auth = this.plugin.getAuthState();
    if (auth.isLoggedIn && auth.token) {
      url = `${url}&metadata=all`;
    }

    url = `${url}&startIndex=${startIndex}&maxNumber=${KULER_DEFAULT_BATCH_SIZE}`;
    return url;
  }

  /**
   * Fetch themes from the Explore/Browse endpoint.
   * @param {Object} [criteria]
   * @returns {Promise<Object>}
   */
  async fetchExploreThemes(criteria = {}) {
    const themePath = this.plugin.endpoints.themePath || '/themes';
    const url = this.buildExploreUrl(themePath, criteria);
    return this.plugin.fetchWithFullUrl(url, 'GET');
  }

  /**
   * Fetch gradients from the Explore/Browse endpoint.
   * @param {Object} [criteria]
   * @returns {Promise<Object>}
   */
  async fetchExploreGradients(criteria = {}) {
    const gradientPath = this.plugin.endpoints.gradientPath || '/gradient';
    const url = this.buildExploreUrl(gradientPath, criteria);
    return this.plugin.fetchWithFullUrl(url, 'GET');
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
   * @param {string} themeId
   * @returns {Promise<Object>}
   * @throws {ValidationError}
   */
  async fetchTheme(themeId) {
    if (!themeId) {
      throw new ValidationError('Theme ID is required', {
        field: 'themeId',
        serviceName: 'Kuler',
        topic: KulerTopics.THEME.GET,
      });
    }
    const url = this.buildThemeUrl(themeId);
    return this.plugin.fetchWithFullUrl(url, 'GET');
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
        topic: KulerTopics.THEME.SAVE,
      });
    }
    if (!themeData.swatches?.length) {
      throw new ValidationError('Theme must have at least one swatch', {
        field: 'themeData.swatches',
        serviceName: 'Kuler',
        topic: KulerTopics.THEME.SAVE,
      });
    }
    if (!ccLibrariesResponse?.id) {
      throw new ValidationError('CC Libraries response ID is required', {
        field: 'ccLibrariesResponse.id',
        serviceName: 'Kuler',
        topic: KulerTopics.THEME.SAVE,
      });
    }
    if (!ccLibrariesResponse?.libraryid) {
      throw new ValidationError('CC Libraries response library ID is required', {
        field: 'ccLibrariesResponse.libraryid',
        serviceName: 'Kuler',
        topic: KulerTopics.THEME.SAVE,
      });
    }
    const url = this.buildThemeSaveUrl();
    const postData = ThemeActions.buildThemePostData(themeData, ccLibrariesResponse);
    return this.plugin.fetchWithFullUrl(url, 'POST', postData);
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
        topic: KulerTopics.THEME.DELETE,
      });
    }
    const url = this.buildThemeDeleteUrl(payload.id);
    const response = await this.plugin.fetchWithFullUrl(url, 'DELETE');
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
        topic: KulerTopics.GRADIENT.SAVE,
      });
    }
    const url = this.buildGradientSaveUrl();
    return this.plugin.fetchWithFullUrl(url, 'POST', gradientData);
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
        topic: KulerTopics.GRADIENT.DELETE,
      });
    }
    const url = this.buildGradientDeleteUrl(payload.id);
    const response = await this.plugin.fetchWithFullUrl(url, 'DELETE');
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

    return `${basePath}${themePath}/${themeId}/like`;
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
        topic: KulerTopics.LIKE.UPDATE,
      });
    }
    if (payload.like?.user) {
      const url = this.buildThemeUnlikeUrl(payload.id);
      await this.plugin.fetchWithFullUrl(url, 'DELETE');
    } else {
      const url = this.buildThemeLikeUrl(payload.id);
      await this.plugin.fetchWithFullUrl(url, 'POST', {});
    }
  }
}
