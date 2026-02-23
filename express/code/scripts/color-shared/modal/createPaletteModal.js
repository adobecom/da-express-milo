/**
 * MWPW-185800 — Palette modal (MWPW-185800 structure)
 * Uses createPaletteModalContent for gradient bar, name/tags, floating toolbar.
 */

import { createPaletteModalContent } from './createPaletteModalContent.js';

export function createPaletteModal(palette, options = {}) {
  const content = createPaletteModalContent(palette || {});

  return {
    element: content,

    getPalette: () => ({ ...palette }),

    destroy: () => {},
  };
}
