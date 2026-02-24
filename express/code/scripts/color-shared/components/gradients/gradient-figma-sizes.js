/**
 * Gradient component sizes from Figma (CCEX-221263).
 * See GRADIENT-FIGMA-SIZES.md for node IDs and breakpoints.
 * Use for layout, demos, or tests.
 */

/** Gradient editor: s 343×80, m 488×80, l 668×80 (Figma 6198-370556, 6223-154851) */
export const GRADIENT_EDITOR_FIGMA_SIZES = {
  s: { width: 343, height: 80, handles: false },
  m: { width: 488, height: 80, handles: false },
  l: { width: 668, height: 80, handles: true },
};

/** Gradient strip tall / modal: S 343×200, M 488×300, L 834×400, XL 1200×575 (modal max-width expansion) */
export const GRADIENT_STRIP_TALL_FIGMA_SIZES = {
  s: { width: 343, height: 200, radius: 8 },
  m: { width: 488, height: 300, radius: 8 },
  l: { width: 834, height: 400, radius: 16 },
  xl: { width: 1200, height: 575, radius: 16 },
};

/** Breakpoints for responsive gradient strip (match gradient-strip-tall.css; XL aligns with modal at 1280px) */
export const GRADIENT_BREAKPOINTS = {
  s: { maxWidth: 679 },
  m: { minWidth: 680, maxWidth: 1199 },
  l: { minWidth: 1200, maxWidth: 1279 },
  xl: { minWidth: 1280 },
};

/** Gradient extract: S 343×80, L 668×80 */
export const GRADIENT_EXTRACT_FIGMA_SIZES = {
  s: { width: 343, height: 80 },
  l: { width: 668, height: 80 },
};
