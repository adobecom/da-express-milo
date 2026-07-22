import { FAIL, WCAG_THRESHOLDS } from '../utils/contrastConstants.js';
import {
  isValidHex,
  normalizeHex,
} from '../../../scripts/color-shared/utils/utilities.js';

function hexToRGB(hex) {
  const normalizedHex = normalizeHex(hex);
  if (!normalizedHex) return null;

  const cleaned = normalizedHex.slice(1);
  const num = Number.parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255, // eslint-disable-line no-bitwise
    g: (num >> 8) & 255, // eslint-disable-line no-bitwise
    b: num & 255, // eslint-disable-line no-bitwise
  };
}

function linearize(channel) {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance({ r, g, b }) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export default function createContrastDataService() {
  let cache = new Map();

  function calculateRatio(foreground, background) {
    const normalizedForeground = normalizeHex(foreground);
    const normalizedBackground = normalizeHex(background);
    if (!normalizedForeground || !normalizedBackground) return 0;

    const cacheKey = `${normalizedForeground}-${normalizedBackground}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const lum1 = getRelativeLuminance(hexToRGB(normalizedForeground));
    const lum2 = getRelativeLuminance(hexToRGB(normalizedBackground));

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    const rounded = Math.round(ratio * 100) / 100;
    cache.set(cacheKey, rounded);
    return rounded;
  }

  function checkWCAG(foreground, background) {
    const ratio = calculateRatio(foreground, background);

    return {
      ratio,
      normalAA: ratio >= WCAG_THRESHOLDS.NORMAL_AA,
      largeAA: ratio >= WCAG_THRESHOLDS.LARGE_AA,
      normalAAA: ratio >= WCAG_THRESHOLDS.NORMAL_AAA,
      largeAAA: ratio >= WCAG_THRESHOLDS.LARGE_AAA,
      uiComponents: ratio >= WCAG_THRESHOLDS.UI_AA,
    };
  }

  function getWCAGLevel(results) {
    const { normalAAA, largeAAA, normalAA, largeAA, uiComponents } = results;
    if (normalAAA && largeAAA && normalAA && largeAA && uiComponents) {
      return 'AAA';
    }
    if (results.normalAA && results.largeAA && results.uiComponents) {
      return 'AA';
    }
    return FAIL;
  }

  function calculateRatioDirectional(foreground, background) {
    const normalizedForeground = normalizeHex(foreground);
    const normalizedBackground = normalizeHex(background);
    if (!normalizedForeground || !normalizedBackground) return 0;

    const lumFg = getRelativeLuminance(hexToRGB(normalizedForeground));
    const lumBg = getRelativeLuminance(hexToRGB(normalizedBackground));
    const ratio = (lumBg + 0.05) / (lumFg + 0.05);
    return Math.round(ratio * 100) / 100;
  }

  function clearCache() {
    cache = new Map();
  }

  function getLuminanceForHex(hex) {
    if (!isValidHex(hex)) return 0;
    return getRelativeLuminance(hexToRGB(hex));
  }

  function findBrightestAndDarkest(colors) {
    if (!Array.isArray(colors) || colors.length < 2) {
      return { brightest: null, darkest: null };
    }

    const validColors = colors.map((hex) => normalizeHex(hex)).filter(Boolean);
    if (validColors.length < 2) {
      return { brightest: null, darkest: null };
    }

    const withLuminance = validColors.map((hex) => ({
      hex,
      luminance: getLuminanceForHex(hex),
    }));

    withLuminance.sort((a, b) => b.luminance - a.luminance);

    return {
      brightest: withLuminance[0].hex,
      darkest: withLuminance.at(-1).hex,
    };
  }

  return {
    hexToRGB,
    linearize,
    getRelativeLuminance,
    calculateRatio,
    calculateRatioDirectional,
    checkWCAG,
    getWCAGLevel,
    isValidHex,
    clearCache,
    getLuminanceForHex,
    findBrightestAndDarkest,
  };
}
