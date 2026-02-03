/**
 * Strips Renderer - PHASE 1 IMPLEMENTATION
 * 
 * WIREFRAME FILE - Shows structure for Strips variant
 * 
 * Figma Reference: 5504-181748 (Explore Palettes)
 * 
 * Responsibilities:
 * - Render grid of palette strips
 * - Use Lit <color-palette> component via adapter
 * - Handle search UI via adapter
 * - Handle palette selection events
 * - Layout & orchestration
 * 
 * Does NOT:
 * - Fetch data (uses service)
 * - Directly use Lit components (uses adapters)
 * - Contain gradient/extract logic
 * 
 * Lit Components Used (via adapters):
 * - <color-palette> - Each palette strip card
 * - <color-search> - Search bar
 */

import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import { 
  createPaletteAdapter, 
  createSearchAdapter 
} from '../adapters/litComponentAdapters.js';

/**
 * Create strips renderer
 * @param {Object} options - Configuration options
 * @returns {Object} Renderer instance
 */
export function createStripsRenderer(options) {

  // 1. Get base functionality
  const base = createBaseRenderer(options);
  const { getData, emit, createGrid, config } = base;

  // 2. Private state
  let gridElement = null;
  let searchAdapter = null;
  const paletteAdapters = [];
  let containerElement = null;

  /**
   * Create search UI using Lit component adapter
   * @returns {HTMLElement} Search container
   */
  function createSearchUI() {

    // Use adapter to wrap Lit <color-search> component
    searchAdapter = createSearchAdapter({
      onSearch: (query) => {
        emit('search', { query });
      },
    });

    // Wrap in container for styling
    const container = createTag('div', { class: 'search-container' });
    container.appendChild(searchAdapter.element);

    return container;
  }

  /**
   * Create filter UI (vanilla DOM for now)
   * @returns {HTMLElement} Filters container
   */
  function createFilters() {

    const container = createTag('div', { class: 'filters-container' });

    // TODO: Add dropdown filters
    // - Type: All, Gradient, Solid, etc.
    // - Category: All, Nature, Abstract, etc.
    // - Time: All, Recent, Popular, etc.

    const placeholder = createTag('div', { class: 'filters-placeholder' });
    placeholder.textContent = 'Filters (TODO)';
    container.appendChild(placeholder);

    return container;
  }

  /**
   * Create palette card using Lit component adapter
   * @param {Object} palette - Palette data
   * @returns {HTMLElement} Card element
   */
  function createPaletteCard(palette) {

    // Use adapter to wrap Lit <color-palette> component
    const adapter = createPaletteAdapter(palette, {
      onSelect: (selectedPalette) => {
        emit('palette-click', selectedPalette);
      },
    });

    // Store adapter for later updates/cleanup
    paletteAdapters.push(adapter);

    // Wrap in card container for additional styling/info
    const card = createTag('div', { class: 'palette-card' });
    
    // Add palette name
    const nameEl = createTag('div', { class: 'palette-name' });
    nameEl.textContent = palette.name || `Palette ${palette.id}`;
    
    // Add Lit component
    card.appendChild(adapter.element);
    card.appendChild(nameEl);

    return card;
  }

  /**
   * Create grid of palette cards
   * @returns {HTMLElement} Grid element
   */
  function createPalettesGrid() {

    const grid = createGrid();
    grid.classList.add('palettes-grid');

    // Get data and create card for each palette
    const data = getData();

    data.forEach((palette) => {
      const card = createPaletteCard(palette);
      grid.appendChild(card);
    });

    return grid;
  }

  /**
   * Render strips variant
   * Main render function called by entry point
   * @param {HTMLElement} container - Container element
   */
  function render(container) {

    containerElement = container;
    container.innerHTML = '';
    container.classList.add('color-explorer-strips');

    // Build UI structure:
    // - Search bar (Lit component via adapter)
    // - Filters (vanilla DOM)
    // - Grid of palettes (Lit components via adapters)

    const searchUI = createSearchUI();
    const filtersUI = createFilters();
    gridElement = createPalettesGrid();

    container.appendChild(searchUI);
    container.appendChild(filtersUI);
    container.appendChild(gridElement);

  }

  /**
   * Update with new data
   * @param {Array} newData - New palette data
   */
  function update(newData) {

    // Option 1: Update existing adapters
    newData.forEach((palette, index) => {
      if (paletteAdapters[index]) {
        paletteAdapters[index].update(palette);
      }
    });

    // Option 2: Re-render (simpler for now)
    // render(containerElement);
  }

  /**
   * Cleanup function
   * Called when block is removed or variant changes
   */
  function destroy() {

    // Cleanup search adapter
    searchAdapter?.destroy();

    // Cleanup all palette adapters
    paletteAdapters.forEach(adapter => adapter.destroy());
    paletteAdapters.length = 0;

  }

  // Return public API
  return {
    ...base,
    render,
    update,
    destroy,
  };
}
