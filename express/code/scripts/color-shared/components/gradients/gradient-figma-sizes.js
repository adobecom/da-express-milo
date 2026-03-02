/**
 * Gradient component sizes from Figma (CCEX-221263).
 * See README.md for node IDs, breakpoints, and variant spec.
 * Use for layout, demos, or tests.
 */

/** Gradient editor: s 343×80, m 488×80, l 668×80 (Figma 6198-370556, 6223-154851) */
export const GRADIENT_EDITOR_FIGMA_SIZES = {
  s: { width: 343, height: 80, handles: false },
  m: { width: 488, height: 80, handles: false },
  l: { width: 668, height: 80, handles: true },
};

/** Gradient strip tall / modal: S 343×200, M 488×300, L 834×400. Content stops at L. */
export const GRADIENT_STRIP_TALL_FIGMA_SIZES = {
  s: { width: 343, height: 200, radius: 8 },
  m: { width: 488, height: 300, radius: 8 },
  l: { width: 834, height: 400, radius: 16 },
};

/** Breakpoints for responsive gradient strip (match gradient-strip-tall.css) */
export const GRADIENT_BREAKPOINTS = {
  s: { maxWidth: 679 },
  m: { minWidth: 680, maxWidth: 1199 },
  l: { minWidth: 1200 },
};

/** Gradient extract: S 343×80, L 668×80 */
export const GRADIENT_EXTRACT_FIGMA_SIZES = {
  s: { width: 343, height: 80 },
  l: { width: 668, height: 80 },
};
