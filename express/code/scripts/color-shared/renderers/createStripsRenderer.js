import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import {
  createPaletteAdapter,
  createSearchAdapter,
} from '../adapters/litComponentAdapters.js';
import { createFiltersComponent } from '../components/createFiltersComponent.js';

export function createStripsRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData, setData, emit, createGrid } = base;

  let gridElement = null;
  let searchAdapter = null;
  let filtersComponent = null;
  let resultsCountEl = null;
  const paletteAdapters = [];

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

  async function createFilters() {
    filtersComponent = await createFiltersComponent({
      variant: 'strips',
      onFilterChange: (filterValues) => emit('filter', filterValues),
    });
    return filtersComponent.element;
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

  async function render(container) {
    container.innerHTML = '';
    container.classList.add('color-explorer-strips');

    const searchUI = createSearchUI();
    const filtersUI = await createFilters();
    gridElement = createPalettesGrid();

    const data = getData();
    const count = Array.isArray(data) ? data.length : 0;
    const countLabel = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);
    const resultsHeader = createTag('div', { class: 'results-header' });
    resultsCountEl = createTag('span', { class: 'results-count' });
    resultsCountEl.textContent = `${countLabel} palettes`;
    resultsHeader.appendChild(resultsCountEl);
    resultsHeader.appendChild(filtersUI);

    container.appendChild(searchUI);
    container.appendChild(resultsHeader);
    container.appendChild(gridElement);
  }

  function update(newData) {
    if (!Array.isArray(newData) || !gridElement) return;

    setData(newData);

    paletteAdapters.forEach((adapter) => adapter.destroy?.());
    paletteAdapters.length = 0;
    gridElement.innerHTML = '';

    getData().forEach((palette) => {
      gridElement.appendChild(createPaletteCard(palette));
    });

    if (resultsCountEl) {
      const count = newData.length;
      const countLabel = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);
      resultsCountEl.textContent = `${countLabel} palettes`;
    }
  }

  function destroy() {
    filtersComponent?.reset?.();
    searchAdapter?.destroy();
    paletteAdapters.forEach((adapter) => adapter.destroy());
    paletteAdapters.length = 0;
  }

  return {
    ...base,
    render,
    update,
    destroy,
  };
}

export default createStripsRenderer;
