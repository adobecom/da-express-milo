import { createPaletteAdapter } from '../adapters/litComponentAdapters.js';

export const PALETTE_STRIP_VARIANTS = {
  EXPLORE: 'explore',
  COMPACT: 'compact',
};

/**
 * Creates a palette strip component. Explore (summary card) + Compact (48px) variants.
 * Returns { element, update(newData), destroy() }.
 * @param {Object} paletteData - { id, name, colors }
 * @param {Object} callbacks - { onSelect(selectedPalette) }
 * @param {string} [variant] - PALETTE_STRIP_VARIANTS.EXPLORE | PALETTE_STRIP_VARIANTS.COMPACT
 */
export function createPaletteStrip(paletteData, callbacks = {}, variant = PALETTE_STRIP_VARIANTS.EXPLORE) {
  const adapter = createPaletteAdapter(paletteData, {
    onSelect: (selectedPalette) => callbacks.onSelect?.(selectedPalette),
  });

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
