/**
 * WCAG contrast ratio calculation service.
 * Follows the same closure-based pattern as color-shared/services/createColorDataService.
 */

function hexToRGB(hex) {
  const cleaned = hex.replace('#', '');
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

function isValidHex(hex) {
  return /^#?[0-9A-Fa-f]{6}$/.test(hex);
}

export default function createContrastDataService() {
  let cache = new Map();

  function calculateRatio(foreground, background) {
    const cacheKey = `${foreground}-${background}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const lum1 = getRelativeLuminance(hexToRGB(foreground));
    const lum2 = getRelativeLuminance(hexToRGB(background));

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
      normalAA: ratio >= 4.5,
      largeAA: ratio >= 3,
      normalAAA: ratio >= 7,
      largeAAA: ratio >= 4.5,
      uiComponents: ratio >= 3,
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
    return 'FAIL';
  }

  function calculateRatioDirectional(foreground, background) {
    const lumFg = getRelativeLuminance(hexToRGB(foreground));
    const lumBg = getRelativeLuminance(hexToRGB(background));
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

    const validColors = colors.filter(isValidHex);
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
