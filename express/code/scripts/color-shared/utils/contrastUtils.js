/**
 * WCAG contrast ratio and pass/fail utilities.
 * Uses relative luminance per https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 * and contrast ratio per https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

/**
 * Normalize hex to #RRGGBB (3 or 6 digit).
 * @param {string} hex - #RGB or #RRGGBB
 * @returns {string} #RRGGBB
 */
function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') return '#000000';
  const cleaned = hex.replace(/^#/, '');
  if (cleaned.length === 3) {
    return `#${cleaned.split('').map((c) => c + c).join('')}`;
  }
  return cleaned.length >= 6 ? `#${cleaned.slice(0, 6)}` : '#000000';
}

/**
 * Relative luminance (0–1) for sRGB color.
 * @param {string} hex - #RRGGBB
 * @returns {number}
 */
export function getLuminance(hex) {
  const normalized = normalizeHex(hex);
  const rgb = normalized
    .replace('#', '')
    .match(/.{2}/g)
    .map((c) => parseInt(c, 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Contrast ratio between two colors (1–21).
 * Order doesn't matter; result is always >= 1.
 * @param {string} hex1 - #RRGGBB
 * @param {string} hex2 - #RRGGBB
 * @returns {number}
 */
export function getContrastRatio(hex1, hex2) {
  const L1 = getLuminance(hex1);
  const L2 = getLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG 2.1 level thresholds: normal text, large text (≥18pt or ≥14pt bold). */
const WCAG = {
  AA: { normal: 4.5, large: 3 },
  AAA: { normal: 7, large: 4.5 },
};

/**
 * Check which WCAG levels pass for normal and large text.
 * @param {number} ratio - Contrast ratio
 * @returns {{ aa: { normal: boolean, large: boolean }, aaa: { normal: boolean, large: boolean } }}
 */
export function getWcagPassFail(ratio) {
  return {
    aa: {
      normal: ratio >= WCAG.AA.normal,
      large: ratio >= WCAG.AA.large,
    },
    aaa: {
      normal: ratio >= WCAG.AAA.normal,
      large: ratio >= WCAG.AAA.large,
    },
  };
}
