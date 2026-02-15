import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import { 
  createPaletteAdapter, 
  createSearchAdapter 
} from '../adapters/litComponentAdapters.js';

export function createStripsRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData, emit, createGrid, config } = base;

  let gridElement = null;
  let searchAdapter = null;
  const paletteAdapters = [];
  let containerElement = null;

  function createSearchUI() {
    searchAdapter = createSearchAdapter({
      onSearch: (query) => {
        emit('search', { query });
      },
    });

    const container = createTag('div', { class: 'search-container' });
    container.appendChild(searchAdapter.element);

    return container;
  }

  function createFilters() {
    const container = createTag('div', { class: 'filters-container' });
    const placeholder = createTag('div', { class: 'filters-placeholder' });
    placeholder.textContent = 'Filters (TODO)';
    container.appendChild(placeholder);
    return container;
  }

  function createPaletteCard(palette) {
    const adapter = createPaletteAdapter(palette, {
      onSelect: (selectedPalette) => {
        emit('palette-click', selectedPalette);
      },
    });

    paletteAdapters.push(adapter);

    const card = createTag('div', { class: 'palette-card' });
    const nameEl = createTag('div', { class: 'palette-name' });
    nameEl.textContent = palette.name || `Palette ${palette.id}`;
    
    card.appendChild(adapter.element);
    card.appendChild(nameEl);

    return card;
  }

  function createPalettesGrid() {
    const grid = createGrid();
    grid.classList.add('palettes-grid');

    const data = getData();
    data.forEach((palette) => {
      const card = createPaletteCard(palette);
      grid.appendChild(card);
    });

    return grid;
  }

  function render(container) {
    containerElement = container;
    container.innerHTML = '';
    container.classList.add('color-explorer-strips');

    const searchUI = createSearchUI();
    const filtersUI = createFilters();
    gridElement = createPalettesGrid();

    container.appendChild(searchUI);
    container.appendChild(filtersUI);
    container.appendChild(gridElement);
  }

  function update(newData) {
    newData.forEach((palette, index) => {
      if (paletteAdapters[index]) {
        paletteAdapters[index].update(palette);
      }
    });
  }

  function destroy() {
    searchAdapter?.destroy();
    paletteAdapters.forEach(adapter => adapter.destroy());
    paletteAdapters.length = 0;
  }

  return {
    ...base,
    render,
    update,
    destroy,
  };
}
