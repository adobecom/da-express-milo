/* eslint-disable */
import HarmonyAdapter from '../utils/harmony/HarmonyEngineExpress.js';
import { hexToHSB } from '../../../libs/color-components/utils/ColorConversions.js';

const DEFAULT_COLORS = ['#FF0000', '#FF7F00', '#FFFF00', '#00A8FF', '#7F00FF'];
const NUMBER_SWATCHES = 10;

const ensureHex = (value = '#000000') => {
  if (typeof value !== 'string') {
    return '#000000';
  }
  return value.startsWith('#') ? value.toUpperCase() : `#${value}`.toUpperCase();
};

const createSwatch = (hex, overrides = {}) => {
  const normalizedHex = ensureHex(hex);
  const hsv = overrides.hsv || hexToHSB(normalizedHex) || { hue: 0, saturation: 100, brightness: 100 };

  return {
    hex: normalizedHex,
    hsv: {
      h: hsv.hue ?? hsv.h ?? 0,
      s: hsv.saturation ?? hsv.s ?? 100,
      v: hsv.brightness ?? hsv.v ?? 100,
    },
  };
};

export const randomHex = () => {
  const value = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0');
  return `#${value}`.toUpperCase();
};

/**
 * Express color-tools theme controller based on ColorThemeController from libs/color-components.
 */
export default class ColorThemeExpressController {
  constructor({
    swatches = DEFAULT_COLORS,
    harmonyRule = 'ANALOGOUS',
    baseColorIndex = 0,
    activeSwatchIndex,
    name = 'My Color Theme',
    config = {},
  } = {}) {
    this.subscribers = new Set();
    this.config = { analyticsChannel: 'color-tools', ...config };
    this.metadata = { mood: 'colorful', isLocked: false };

    this._handleHarmonyUpdates = this._handleHarmonyUpdates.bind(this);

    const initialActive = activeSwatchIndex != null ? activeSwatchIndex : baseColorIndex;
    this.theme = {
      name,
      harmonyRule,
      baseColorIndex,
      activeSwatchIndex: initialActive,
      swatches: this._normalizeSwatches(swatches),
    };
    if (this.theme.activeSwatchIndex == null) {
      this.theme.activeSwatchIndex = this.theme.baseColorIndex;
    }

    this.harmonyAdapter = new HarmonyAdapter(this.theme, this._handleHarmonyUpdates);
  }

  subscribe(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }

    this.subscribers.add(callback);
    callback(this.getState());

    return () => {
      this.subscribers.delete(callback);
    };
  }

  getState() {
    return JSON.parse(JSON.stringify(this.theme));
  }

  setHarmonyRule(rule) {
    if (!rule || this.theme.harmonyRule === rule) {
      return;
    }
    this.theme.harmonyRule = rule;
    this.harmonyAdapter.onRuleChange(rule);
    this._notify({ source: 'harmony-rule', rule });
    this._trackAction('change-rule', { rule });
  }

  setBaseColor(hex) {
    const normalized = createSwatch(hex);
    const index = this.theme.baseColorIndex;
    this.theme.swatches[index] = normalized;
    this.harmonyAdapter.onBaseColorChange();
    this._notify({ source: 'base-color' });
  }

  setBaseColorIndex(index = 0) {
    if (index < 0 || index >= this.theme.swatches.length) {
      return;
    }
    this.theme.baseColorIndex = index;
    this._notify({ source: 'base-index' });
    this._trackAction('set-base-index', { index });
  }

  setActiveSwatchIndex(index) {
    if (index < 0 || index >= this.theme.swatches.length) {
      return;
    }
    if (this.theme.activeSwatchIndex === index) {
      return;
    }
    this.theme.activeSwatchIndex = index;
    this._notify({ source: 'active-index' });
    this._trackAction('set-active-index', { index });
  }

  setSwatchHex(index, hex) {
    if (index < 0 || index >= this.theme.swatches.length) {
      return;
    }
    this.theme.swatches[index] = createSwatch(hex);
    if (index === this.theme.baseColorIndex) {
      this.harmonyAdapter.onBaseColorChange();
    } else if (typeof this.harmonyAdapter.onColorChange === 'function') {
      this.harmonyAdapter.onColorChange(index);
    }
    this._notify({ source: 'swatch' });
  }

  /**
   * Replace all swatches (e.g. after image extraction). Resizes the theme to match hex count.
   * @param {string[]} hexList
   * @param {{ baseIndex?: number, harmonyRule?: string }} [options]
   */
  replaceSwatchesFromHexes(hexList, options = {}) {
    const { baseIndex = 0, harmonyRule = 'CUSTOM' } = options;
    const normalized = (hexList || [])
      .map((h) => ensureHex(typeof h === 'string' ? h : ''))
      .filter(Boolean)
      .slice(0, NUMBER_SWATCHES);
    if (!normalized.length) return;

    this.theme.swatches = normalized.map((hex) => createSwatch(hex));
    this.theme.harmonyRule = harmonyRule;
    const bi = Math.min(Math.max(0, baseIndex), this.theme.swatches.length - 1);
    this.theme.baseColorIndex = bi;
    this.theme.activeSwatchIndex = bi;

    this.harmonyAdapter.setNewTheme({
      harmonyRule: this.theme.harmonyRule,
      baseColorIndex: bi,
      swatches: this.theme.swatches,
    });
    this._notify({ source: 'palette-replace' });
  }

  randomizePalette() {
    const swatches = Array.from({ length: this.theme.swatches.length }).map(() => createSwatch(randomHex()));
    this.theme.swatches = swatches;
    this.harmonyAdapter.setNewTheme({
      harmonyRule: this.theme.harmonyRule,
      baseColorIndex: this.theme.baseColorIndex,
      swatches,
    });
    this._notify({ source: 'randomize' });
    this._trackAction('randomize');
  }

  rotatePalette(amount = 1) {
    const length = this.theme.swatches.length;
    const offset = ((amount % length) + length) % length;
    const rotated = this.theme.swatches.map((_, idx, arr) => arr[(idx - offset + length) % length]);
    this.theme.swatches = rotated;
    this.theme.baseColorIndex = (this.theme.baseColorIndex + offset) % length;
    this.theme.activeSwatchIndex = (this.theme.activeSwatchIndex + offset) % length;
    this.harmonyAdapter.setNewTheme({
      harmonyRule: this.theme.harmonyRule,
      baseColorIndex: this.theme.baseColorIndex,
      swatches: rotated,
    });
    this._notify({ source: 'rotate' });
    this._trackAction('rotate', { amount });
  }

  setMetadata(updates = {}) {
    this.metadata = { ...this.metadata, ...updates };
    if (updates.name) {
      this.theme.name = updates.name;
    }
    this._notify({ source: 'metadata', updates });
  }

  destroy() {
    this.subscribers.clear();
    if (this.harmonyAdapter?.resetMode) {
      this.harmonyAdapter.resetMode();
    }
  }

  _normalizeSwatches(swatches) {
    const incoming =
      Array.isArray(swatches) && swatches.length
        ? swatches.slice(0, NUMBER_SWATCHES)
        : DEFAULT_COLORS;
    return incoming.map((color) => createSwatch(color.hex || color));
  }

  _handleHarmonyUpdates(swatchList = []) {
    swatchList.forEach(({ i, swatch }) => {
      if (typeof i !== 'number' || !swatch) {
        return;
      }
      this.theme.swatches[i] = createSwatch(swatch.hex || this.theme.swatches[i].hex, swatch);
    });
    this._notify({ source: 'harmony' });
  }

  _notify(detail = {}) {
    const snapshot = this.getState();
    this.subscribers.forEach((callback) => {
      callback(snapshot, detail);
    });
  }

  _trackAction(action, details = {}) {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent('express:color-tools-action', {
      bubbles: true,
      detail: {
        action,
        channel: this.config.analyticsChannel,
        workflow: 'color-tools',
        timestamp: Date.now(),
        ...details,
      },
    });
    window.dispatchEvent(event);
  }
}
