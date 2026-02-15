import BaseProvider from './BaseProvider.js';
import { CCLibraryTopics, CCLibraryActionGroups } from '../plugins/cclibrary/topics.js';
import {
  LIBRARY_OWNERSHIP,
  LIBRARY_ROLE,
  COLOR_MODE,
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
  // eslint-disable-next-line class-methods-use-this
  isLibraryWritable(library) {
    if (!library) return false;
    if (library.ownership === LIBRARY_OWNERSHIP.PRIVATE) return true;
    if (library.bookmark?.role === LIBRARY_ROLE.EDITOR) return true;
    if (library.asset_acl?.directory_access?.includes('write')) return true;
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

    if (colorMode !== COLOR_MODE.RGB) {
      const modeEntry = CCLibraryProvider.#buildModeEntry(swatch, colorMode);
      if (modeEntry) result.push(modeEntry);
    }

    const rgbEntry = {
      mode: COLOR_MODE.RGB,
      value: {
        r: Math.round(swatch.rgb.r * 255),
        g: Math.round(swatch.rgb.g * 255),
        b: Math.round(swatch.rgb.b * 255),
      },
    };

    if (swatch.pantone) {
      rgbEntry.type = swatch.isSpotColor ? 'spot' : 'process';
      rgbEntry.spotColorName = `PANTONE ${swatch.pantone}`;
    }

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
    switch (mode) {
      case COLOR_MODE.CMYK: {
        if (!swatch.cmyk) return null;
        return {
          mode: COLOR_MODE.CMYK,
          value: {
            c: Math.round(swatch.cmyk.c),
            m: Math.round(swatch.cmyk.m),
            y: Math.round(swatch.cmyk.y),
            k: Math.round(swatch.cmyk.k),
          },
        };
      }
      case COLOR_MODE.HSB: {
        if (!swatch.hsb) return null;
        return {
          mode: COLOR_MODE.HSB,
          value: {
            h: Math.round(swatch.hsb.h),
            s: Math.round(swatch.hsb.s),
            b: Math.round(swatch.hsb.b),
          },
        };
      }
      case COLOR_MODE.LAB: {
        if (!swatch.lab) return null;
        return {
          mode: COLOR_MODE.LAB,
          value: {
            l: Math.round(swatch.lab.l),
            a: Math.round(swatch.lab.a),
            b: Math.round(swatch.lab.b),
          },
        };
      }
      default:
        return null;
    }
  }
}

/**
 * @param {Object} plugin - Plugin instance
 * @returns {CCLibraryProvider} New provider instance
 */
export function createCCLibraryProvider(plugin) {
  return new CCLibraryProvider(plugin);
}
