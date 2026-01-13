/**
 * Color Explorer - Strips Renderer (Palettes)
 * Renders color palette strips in a grid
 * Reference: Figma 5504-181748 (Explore Palette)
 */

import { createTag } from '../../../scripts/utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';

/**
 * Create strips renderer for color palettes
 * @param {Object} options - Configuration options
 * @returns {Object} Renderer instance
 */
export function createStripsRenderer(options) {
  // Compose with base renderer
  const base = createBaseRenderer(options);
  const { createCard, createGrid, getData, emit } = base;

  // Private state
  let gridElement = null;

  /**
   * Create palette card
   * @param {Object} palette - Palette data
   * @returns {HTMLElement} Card element
   */
  function createPaletteCard(palette) {
    const card = createCard(palette);
    card.classList.add('palette-card');

    // Create color strips
    const stripsContainer = createTag('div', { class: 'palette-strips' });

    if (palette.colors && Array.isArray(palette.colors)) {
      palette.colors.forEach((color) => {
        const strip = createTag('div', {
          class: 'color-strip',
          style: `background-color: ${color}`,
          'aria-label': color,
        });
        stripsContainer.append(strip);
      });
    }

    // Palette name
    if (palette.name) {
      const nameEl = createTag('p', { class: 'palette-name' }, palette.name);
      card.append(nameEl);
    }

    card.append(stripsContainer);

    // Click handler
    card.addEventListener('click', () => emit('item-click', palette));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        emit('item-click', palette);
      }
    });

    return card;
  }

  /**
   * Render function
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement} Rendered content
   */
  async function render(container) {
    const wrapper = createTag('div', { class: 'strips-renderer' });

    // Create grid
    const grid = createGrid();
    const data = getData();

    if (data.length === 0) {
      const emptyMsg = createTag('p', { class: 'empty-message' }, 'No palettes found.');
      wrapper.append(emptyMsg);
      return wrapper;
    }

    data.forEach((palette) => {
      const card = createPaletteCard(palette);
      grid.append(card);
    });

    wrapper.append(grid);
    gridElement = grid;

    return wrapper;
  }

  /**
   * Update function
   * @param {Array} newData - New data
   */
  function update(newData) {
    base.setData(newData);

    if (!gridElement) return;

    gridElement.innerHTML = '';

    if (newData.length === 0) {
      const emptyMsg = createTag('p', { class: 'empty-message' }, 'No palettes found.');
      gridElement.append(emptyMsg);
      return;
    }

    newData.forEach((palette) => {
      const card = createPaletteCard(palette);
      gridElement.append(card);
    });
  }

  // Return public API (extends base)
  return {
    ...base,
    render,
    update,
    createPaletteCard,
  };
}

