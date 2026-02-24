import { createTag, getIconElementDeprecated } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import { createPaletteStrip, PALETTE_STRIP_VARIANTS } from '../palettes/palettes.js';
import { createSearchAdapter } from '../adapters/litComponentAdapters.js';

/**
 * Explore variant – summary strip: card with strip, title, Edit/Share actions.
 * Uses PALETTE_STRIP_VARIANTS.EXPLORE. Ship one variant at a time; next = Extract, compact, etc.
 */
export function createStripsRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData, emit, createGrid, config } = base;

  let gridElement = null;
  let searchAdapter = null;
  const paletteStrips = [];
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
    const stripVariant = (config.stripVariant === 'compact')
      ? PALETTE_STRIP_VARIANTS.COMPACT
      : PALETTE_STRIP_VARIANTS.EXPLORE;
    const strip = createPaletteStrip(
      palette,
      { onSelect: (selectedPalette) => emit('palette-click', selectedPalette) },
      stripVariant,
    );

    paletteStrips.push(strip);

    /* Shared color-card layout (visual + name + actions) */
    const card = createTag('div', { class: 'color-card' });
    card.setAttribute('data-palette-id', palette.id || '');
    const name = palette.name || `Palette ${palette.id}`;

    const visual = createTag('div', { class: 'color-card-visual' });
    visual.appendChild(strip.element);

    const info = createTag('div', { class: 'color-card-info' });
    const nameEl = createTag('p', { class: 'color-card-name' });
    nameEl.textContent = name;

    const actions = createTag('div', { class: 'color-card-actions' });
    const editBtn = createTag('button', { type: 'button', class: 'color-card-action-btn', 'aria-label': `Edit ${name}` });
    const editIconWrap = createTag('span', { class: 'action-icon' });
    editIconWrap.appendChild(getIconElementDeprecated('edit', 20, `Edit ${name}`));
    editBtn.appendChild(editIconWrap);
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      emit('palette-click', palette);
    });

    const shareBtn = createTag('button', { type: 'button', class: 'color-card-action-btn', 'aria-label': `Share ${name}` });
    const shareIconWrap = createTag('span', { class: 'action-icon' });
    shareIconWrap.appendChild(getIconElementDeprecated('Frame', 20, `Share ${name}`));
    shareBtn.appendChild(shareIconWrap);
    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      emit('share', { palette });
    });

    actions.appendChild(editBtn);
    actions.appendChild(shareBtn);
    info.appendChild(nameEl);
    info.appendChild(actions);

    card.appendChild(visual);
    card.appendChild(info);

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
      if (paletteStrips[index]) {
        paletteStrips[index].update(palette);
      }
    });
  }

  function destroy() {
    searchAdapter?.destroy();
    paletteStrips.forEach((strip) => strip.destroy());
    paletteStrips.length = 0;
  }

  return {
    ...base,
    render,
    update,
    destroy,
  };
}
