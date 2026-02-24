/**
 * WCAG contrast ratio calculation service.
 * Follows the same closure-based pattern as color-shared/services/createColorDataService.
 */

function hexToRGB(hex) {
  const cleaned = hex.replace('#', '');
  const num = Number.parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
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

  function clearCache() {
    cache = new Map();
  }

  return {
    hexToRGB,
    getRelativeLuminance,
    calculateRatio,
    checkWCAG,
    isValidHex,
    clearCache,
  };
}
