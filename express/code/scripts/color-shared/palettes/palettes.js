/**
 * Shared UI: Palette Strips – all variants (components only).
 * MWPW-187682. Ship one variant at a time; first = Explore variant (summary strip).
 *
 * Variants (one per ship):
 * - explore: summary strip (card with title, strip, actions) – used by color-explore.
 * - extract, compact, vertical, etc. – later.
 *
 * Import: from '../../scripts/color-shared/palettes/palettes.js'
 */

import { createPaletteAdapter } from '../adapters/litComponentAdapters.js';

/** Ship one variant at a time. First = Explore (summary strip). */
export const PALETTE_STRIP_VARIANTS = {
  EXPLORE: 'explore',
};

/**
 * Creates a palette strip component. Currently implements Explore variant (horizontal strip + adapter).
 * Returns { element, update(newData), destroy() }.
 * @param {Object} paletteData - { id, name, colors }
 * @param {Object} callbacks - { onSelect(selectedPalette) }
 * @param {string} [variant] - PALETTE_STRIP_VARIANTS.EXPLORE (default)
 */
export function createPaletteStrip(paletteData, callbacks = {}, variant = PALETTE_STRIP_VARIANTS.EXPLORE) {
  const adapter = createPaletteAdapter(paletteData, {
    onSelect: (selectedPalette) => callbacks.onSelect?.(selectedPalette),
  });

  /* Explore card shows name in color-card-info; hide duplicate name/tooltip from color-palette */
  if (variant === PALETTE_STRIP_VARIANTS.EXPLORE) {
    adapter.element.setAttribute('show-name-tooltip', 'false');
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'color-shared-palette-strip';
  wrapper.setAttribute('data-palette-strip', '');
  wrapper.setAttribute('data-palette-strip-variant', variant);
  wrapper.appendChild(adapter.element);

  return {
    element: wrapper,
    update: (newData) => adapter.update(newData),
    destroy: () => {
      adapter.destroy();
      wrapper.remove();
    },
  };
}
