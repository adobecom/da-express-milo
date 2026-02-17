import BaseProvider from './BaseProvider.js';
import { CCLibraryTopics, CCLibraryActionGroups } from '../plugins/cclibrary/topics.js';
import {
  LIBRARY_OWNERSHIP,
  LIBRARY_ROLE,
  COLOR_MODE,
  GRADIENT_ELEMENT_TYPE,
  GRADIENT_REPRESENTATION_TYPE,
  CLIENT_INFO,
  COLOR_PROFILE,
  CC_LIBRARY_COLOR_MODE,
} from '../plugins/cclibrary/constants.js';

export default class CCLibraryProvider extends BaseProvider {
  #actions = {};

  constructor(plugin) {
    super(plugin);
    this.#initActions();
  }

  #initActions() {
    const { LIBRARY, THEME } = CCLibraryActionGroups;

    this.#actions = {
      createLibrary: this.plugin.useAction(LIBRARY, CCLibraryTopics.LIBRARY.CREATE),
      fetchLibraries: this.plugin.useAction(LIBRARY, CCLibraryTopics.LIBRARY.FETCH),
      fetchLibraryElements: this.plugin.useAction(LIBRARY, CCLibraryTopics.LIBRARY.ELEMENTS),
      saveTheme: this.plugin.useAction(THEME, CCLibraryTopics.THEME.SAVE),
      saveGradient: this.plugin.useAction(THEME, CCLibraryTopics.THEME.SAVE_GRADIENT),
      deleteTheme: this.plugin.useAction(THEME, CCLibraryTopics.THEME.DELETE),
      updateTheme: this.plugin.useAction(THEME, CCLibraryTopics.THEME.UPDATE),
      updateElementMetadata: this.plugin.useAction(THEME, CCLibraryTopics.THEME.UPDATE_METADATA),
    };
  }

  async createLibrary(name) {
    return this.safeExecute(() => this.#actions.createLibrary(name));
  }

  async fetchLibraries(params) {
    return this.safeExecute(() => this.#actions.fetchLibraries(params));
  }

  async fetchLibraryElements(libraryId, params) {
    return this.safeExecute(() => this.#actions.fetchLibraryElements(libraryId, params));
  }

  async saveTheme(libraryId, themeData) {
    return this.safeExecute(() => this.#actions.saveTheme(libraryId, themeData));
  }

  async saveGradient(libraryId, gradientData) {
    return this.safeExecute(() => this.#actions.saveGradient(libraryId, gradientData));
  }

  async deleteTheme(libraryId, themeId) {
    return this.safeExecute(() => this.#actions.deleteTheme(libraryId, themeId));
  }

  async updateTheme(libraryId, elementId, payload) {
    return this.safeExecute(() => this.#actions.updateTheme(libraryId, elementId, payload));
  }

  async updateElementMetadata(libraryId, elements) {
    return this.safeExecute(() => this.#actions.updateElementMetadata(libraryId, elements));
  }

  /**
   * @param {Object} library - Library object from the API
   * @returns {boolean}
   */
  isLibraryWritable(library) {
    if (!library) return false;
    if (library.ownership === LIBRARY_OWNERSHIP.PRIVATE) return true;
    if (library.bookmark?.role === LIBRARY_ROLE.EDITOR) return true;
    const aclKey = this.plugin.serviceConfig.assetAclDirectoryKey;
    const directoryAccess = library.asset_acl?.[aclKey];
    if (directoryAccess?.includes('write')) return true;
    return false;
  }

  /**
   * @param {Array<Object>} libraries - Array of library objects from the API
   * @returns {Array<Object>} Writable libraries only
   */
  filterWritableLibraries(libraries) {
    if (!Array.isArray(libraries)) return [];
    return libraries.filter((lib) => this.isLibraryWritable(lib));
  }

  /**
   * Build a Melville-compliant gradient payload for POST /libraries/{id}/elements.
   *
   * @param {Object} options
   * @param {string}  options.name  - Gradient display name
   * @param {number}  [options.angle=90] - Gradient angle in degrees
   * @param {number}  [options.aspectRatio=1] - Gradient aspect ratio
   * @param {string}  [options.interpolation='linear'] - Color interpolation
   * @param {string}  [options.type='linear'] - Gradient type
   * @param {Array<{color: string, position: number}>} options.stops
   *   Each stop has a CSS color string (hex or rgb/rgba) and a position (0-1 float).
   * @returns {Object} Melville-ready element payload
   */
  // eslint-disable-next-line class-methods-use-this
  buildGradientPayload({
    name,
    angle = 90,
    aspectRatio = 1,
    interpolation = 'linear',
    type = 'linear',
    stops = [],
  }) {
    return {
      name: name || 'Untitled gradient',
      type: GRADIENT_ELEMENT_TYPE,
      client: { ...CLIENT_INFO },
      representations: [
        {
          rel: 'primary',
          type: GRADIENT_REPRESENTATION_TYPE,
          'gradient#data': {
            interpolation,
            angle,
            aspectRatio,
            type,
            stops: stops.map((stop) => ({
              color: [
                {
                  mode: CC_LIBRARY_COLOR_MODE.RGB,
                  value: CCLibraryProvider.#parseColorToRgb(stop.color),
                  profileName: COLOR_PROFILE,
                },
              ],
              offset: stop.position,
              opacity: 1,
            })),
            opacityStops: [],
          },
        },
      ],
    };
  }

  /**
   * Parse a CSS color string (hex or rgb/rgba) into an { r, g, b } object (0-255 integers).
   *
   * @param {string} color - CSS color string, e.g. "#FF5733" or "rgb(255, 87, 51)"
   * @returns {{ r: number, g: number, b: number }}
   */
  static #parseColorToRgb(color) {
    if (!color || typeof color !== 'string') return { r: 0, g: 0, b: 0 };

    if (color.startsWith('#')) {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      return {
        r: Number.parseInt(hex.substring(0, 2), 16),
        g: Number.parseInt(hex.substring(2, 4), 16),
        b: Number.parseInt(hex.substring(4, 6), 16),
      };
    }

    const match = color.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: Number.parseInt(match[1], 10),
        g: Number.parseInt(match[2], 10),
        b: Number.parseInt(match[3], 10),
      };
    }

    return { r: 0, g: 0, b: 0 };
  }

  /**
   * Extract Pantone metadata from a swatch if present.
   *
   * @param {Object} swatch
   * @returns {Object} Pantone fields to merge, or empty object
   */
  static #getPantoneData(swatch) {
    if (!swatch.pantone) return {};
    return {
      type: swatch.isSpotColor ? 'spot' : 'process',
      spotColorName: `PANTONE ${swatch.pantone}`,
    };
  }

  /**
   * @param {Object} swatch - Internal swatch object
   * @param {Object} swatch.rgb - RGB values (each 0-1 float)
   * @param {number} swatch.rgb.r - Red channel 0-1
   * @param {number} swatch.rgb.g - Green channel 0-1
   * @param {number} swatch.rgb.b - Blue channel 0-1
   * @param {Object} [swatch.cmyk] - CMYK values (each 0-100)
   * @param {Object} [swatch.hsb] - HSB values (h 0-360, s/b 0-100)
   * @param {Object} [swatch.lab] - LAB values (l 0-100, a/b -128..127)
   * @param {string} [swatch.pantone] - Pantone identifier (e.g. "185 C")
   * @param {boolean} [swatch.isSpotColor] - Whether the swatch is a spot color
   * @param {string} colorMode - Primary color mode ('RGB', 'CMYK', 'HSB', 'LAB')
   * @returns {Array<Object>} CC Library swatch array
   */
  // eslint-disable-next-line class-methods-use-this
  convertSwatchToCCFormat(swatch, colorMode) {
    const result = [];

    if (colorMode.toUpperCase() !== COLOR_MODE.RGB) {
      const modeEntry = CCLibraryProvider.#buildModeEntry(swatch, colorMode);
      if (modeEntry) result.push(modeEntry);
    }

    const rgbEntry = {
      mode: CC_LIBRARY_COLOR_MODE.RGB,
      value: {
        r: Math.round(swatch.rgb.r * 255),
        g: Math.round(swatch.rgb.g * 255),
        b: Math.round(swatch.rgb.b * 255),
      },
    };

    Object.assign(rgbEntry, CCLibraryProvider.#getPantoneData(swatch));

    result.push(rgbEntry);
    return result;
  }

  /**
   * @param {Array<Object>} swatches - Array of internal swatch objects
   * @param {string} colorMode - Primary color mode
   * @returns {Array<Array<Object>>} Array of CC Library swatch arrays
   */
  convertSwatchesToCCFormat(swatches, colorMode) {
    if (!Array.isArray(swatches)) return [];
    return swatches.map((swatch) => this.convertSwatchToCCFormat(swatch, colorMode));
  }

  /**
   * @param {Object} swatch - Internal swatch object
   * @param {string} mode - Color mode key
   * @returns {Object|null} Mode entry or null if data is missing
   */
  static #buildModeEntry(swatch, mode) {
    let entry = null;

    switch (mode) {
      case COLOR_MODE.CMYK: {
        if (!swatch.cmyk) return null;
        entry = {
          mode: CC_LIBRARY_COLOR_MODE.CMYK,
          value: {
            c: Math.round(swatch.cmyk.c),
            m: Math.round(swatch.cmyk.m),
            y: Math.round(swatch.cmyk.y),
            k: Math.round(swatch.cmyk.k),
          },
        };
        break;
      }
      case 'HSV':
      case COLOR_MODE.HSB: {
        const hsData = swatch.hsv || swatch.hsb;
        if (!hsData) return null;
        entry = {
          mode: CC_LIBRARY_COLOR_MODE.HSB,
          value: {
            h: Math.round(hsData.h),
            s: Math.round(hsData.s),
            b: Math.round((hsData.v ?? hsData.b)),
          },
        };
        break;
      }
      case COLOR_MODE.LAB: {
        if (!swatch.lab) return null;
        entry = {
          mode: CC_LIBRARY_COLOR_MODE.LAB,
          value: {
            l: Math.round(swatch.lab.l),
            a: Math.round(swatch.lab.a),
            b: Math.round(swatch.lab.b),
          },
        };
        break;
      }
      default:
        return null;
    }

    Object.assign(entry, CCLibraryProvider.#getPantoneData(swatch));

    return entry;
  }
}

/**
 * @param {Object} plugin - Plugin instance
 * @returns {CCLibraryProvider} New provider instance
 */
export function createCCLibraryProvider(plugin) {
  return new CCLibraryProvider(plugin);
}
