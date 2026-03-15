import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import {
  createSearchAdapter,
} from '../adapters/litComponentAdapters.js';
import { createFiltersComponent } from '../components/createFiltersComponent.js';
import { createPaletteVariant, PALETTE_VARIANT } from '../palettes/createPaletteVariantFactory.js';
import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';
import { loadIconsRail } from '../spectrum/load-spectrum.js';

const ignoreError = () => {};

export function createStripsRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData, setData, emit, createGrid, config } = base;

  let gridElement = null;
  let searchAdapter = null;
  let filtersComponent = null;
  let resultsCountEl = null;
  const paletteStrips = [];

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

  function createPaletteCard(palette, variantOverride = null) {
    const variant = variantOverride
      || (config?.stripVariant === 'compact' ? PALETTE_VARIANT.COMPACT : PALETTE_VARIANT.SUMMARY);
    const { element } = createPaletteVariant(palette, variant, {
      emit,
      cardFocusable: config?.cardFocusable !== false,
      registry: {
        pushStrip: (strip) => paletteStrips.push(strip),
      },
    });
    return element;
  }

  function createPalettesGridForVariant(variant) {
    const grid = createGrid();
    grid.classList.add('palettes-grid');
    grid.setAttribute('data-palette-strip-variant', variant);

    const data = getData();
    data.forEach((palette) => {
      const card = createPaletteCard(palette, variant);
      grid.appendChild(card);
    });

    return grid;
  }

  function createPalettesGridDefault() {
    const variant = config?.stripVariant === 'compact'
      ? PALETTE_VARIANT.COMPACT
      : PALETTE_VARIANT.SUMMARY;
    return createPalettesGridForVariant(variant);
  }

  async function initPaletteVariantCardTooltips(gridEl) {
    const buttons = gridEl?.querySelectorAll?.('.color-card-action-btn[data-tooltip-content]') || [];
    for (const button of buttons) {
      const content = button.getAttribute('data-tooltip-content') || '';
      if (!content) continue;
      button.removeAttribute('title');
      button.querySelectorAll?.('sp-tooltip, sp-theme').forEach((el) => el.remove());
      button.addEventListener('mouseenter', () => button.removeAttribute('title'));
      button.addEventListener('focusin', () => button.removeAttribute('title'));
      try {
        await createExpressTooltip({ targetEl: button, content, placement: 'top' });
      } catch (error) {
        ignoreError(error);
      }
    }
  }

  function scheduleGridTooltips(gridEl) {
    requestAnimationFrame(() => {
      initPaletteVariantCardTooltips(gridEl).catch(ignoreError);
    });
  }

  async function render(container) {
    container.innerHTML = '';
    container.classList.add('color-explorer-strips');
    await loadIconsRail();

    if (config?.renderGridVariant === 'summary') {
      const filtersUI = await createFilters();
      const data = getData();
      const count = Array.isArray(data) ? data.length : 0;
      const countLabel = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);
      const resultsHeader = createTag('div', { class: 'results-header' });
      resultsCountEl = createTag('span', { class: 'results-count' });
      resultsCountEl.textContent = `${countLabel} palettes`;
      resultsHeader.appendChild(resultsCountEl);
      resultsHeader.appendChild(filtersUI);

      gridElement = createPalettesGridForVariant(PALETTE_VARIANT.SUMMARY);
      container.appendChild(resultsHeader);
      container.appendChild(gridElement);
      scheduleGridTooltips(gridElement);
      return;
    }

    const searchUI = createSearchUI();
    const filtersUI = await createFilters();
    gridElement = createPalettesGridDefault();

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
    scheduleGridTooltips(gridElement);
  }

  function update(newData) {
    if (!Array.isArray(newData) || !gridElement) return;

    setData(newData);

    paletteStrips.forEach((strip) => strip.destroy?.());
    paletteStrips.length = 0;
    gridElement.innerHTML = '';

    const variant = config?.renderGridVariant === 'summary'
      ? PALETTE_VARIANT.SUMMARY
      : (config?.stripVariant === 'compact' ? PALETTE_VARIANT.COMPACT : PALETTE_VARIANT.SUMMARY);
    gridElement.setAttribute('data-palette-strip-variant', variant);

    getData().forEach((palette) => {
      gridElement.appendChild(createPaletteCard(palette, variant));
    });
    scheduleGridTooltips(gridElement);

    if (resultsCountEl) {
      const count = newData.length;
      const countLabel = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);
      resultsCountEl.textContent = `${countLabel} palettes`;
    }
  }

  function destroy() {
    filtersComponent?.reset?.();
    searchAdapter?.destroy();
    paletteStrips.forEach((strip) => strip.destroy?.());
    paletteStrips.length = 0;
  }

  return {
    ...base,
    render,
    update,
    destroy,
  };
}

export default createStripsRenderer;
