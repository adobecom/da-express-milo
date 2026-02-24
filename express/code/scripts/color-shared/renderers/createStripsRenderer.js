import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import { createSearchAdapter } from '../adapters/litComponentAdapters.js';
import { createPaletteVariant, PALETTE_VARIANT } from '../palettes/createPaletteVariantFactory.js';

/**
 * Strips renderer: Summary (Figma 5806-89102) + Compact + Simplified (5639) + Horizontal (6215/6180).
 * Uses palette variant factory for all strip variants.
 */
export function createStripsRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData, emit, createGrid, config } = base;

  let gridElement = null;
  let searchAdapter = null;
  const paletteStrips = [];
  const swatchRailAdapters = [];
  const swatchRailControllers = [];
  let containerElement = null;

  const registry = {
    pushStrip: (strip) => paletteStrips.push(strip),
    pushController: (controller) => swatchRailControllers.push(controller),
    pushAdapter: (adapter) => swatchRailAdapters.push(adapter),
  };

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

  function createPalettesGridForVariant(variant) {
    const grid = createGrid();
    grid.classList.add('palettes-grid');
    grid.setAttribute('data-palette-strip-variant', variant);

    const data = getData();
    data.forEach((palette) => {
      const { element } = createPaletteVariant(palette, variant, { emit, registry });
      grid.appendChild(element);
    });

    return { grid };
  }

  function createPalettesGridDefault() {
    const variant = config.stripVariant === 'compact' ? PALETTE_VARIANT.COMPACT : PALETTE_VARIANT.SUMMARY;
    return createPalettesGridForVariant(variant);
  }

  function render(container) {
    containerElement = container;
    container.innerHTML = '';
    container.classList.add('color-explorer-strips');

    const searchUI = createSearchUI();
    const filtersUI = createFilters();
    const data = getData();

    if (config.showAllPaletteVariants) {
      container.appendChild(searchUI);
      container.appendChild(filtersUI);

      const sectionSummary = createTag('div', { class: 'palette-variants-section' });
      sectionSummary.setAttribute('data-variant', 'summary');
      const titleSummary = createTag('h3', { class: 'palette-variants-section-title' });
      titleSummary.textContent = 'Summary (explore)';
      sectionSummary.appendChild(titleSummary);
      const resultExplore = createPalettesGridForVariant(PALETTE_VARIANT.SUMMARY);
      sectionSummary.appendChild(resultExplore.grid);
      container.appendChild(sectionSummary);

      const sectionCompact = createTag('div', { class: 'palette-variants-section' });
      sectionCompact.setAttribute('data-variant', 'compact');
      const titleCompact = createTag('h3', { class: 'palette-variants-section-title' });
      titleCompact.textContent = 'Compact';
      sectionCompact.appendChild(titleCompact);
      const resultCompact = createPalettesGridForVariant(PALETTE_VARIANT.COMPACT);
      sectionCompact.appendChild(resultCompact.grid);
      container.appendChild(sectionCompact);

      const sectionSimplified = createTag('div', { class: 'palette-variants-section' });
      sectionSimplified.setAttribute('data-variant', 'simplified');
      const titleSimplified = createTag('h3', { class: 'palette-variants-section-title' });
      titleSimplified.textContent = 'Simplified (Figma 5639-129905)';
      sectionSimplified.appendChild(titleSimplified);
      const simplifiedWrap = createTag('div', { class: 'palettes-grid' });
      [data[0], data[1]].filter(Boolean).forEach((palette) => {
        const { element } = createPaletteVariant(palette, PALETTE_VARIANT.SIMPLIFIED, { emit, registry });
        simplifiedWrap.appendChild(element);
      });
      sectionSimplified.appendChild(simplifiedWrap);
      container.appendChild(sectionSimplified);

      const sectionHorizontal = createTag('div', { class: 'palette-variants-section' });
      sectionHorizontal.setAttribute('data-variant', 'horizontal-container');
      const titleHorizontal = createTag('h3', { class: 'palette-variants-section-title' });
      titleHorizontal.textContent = 'Color-strip-container horizontal (Figma 6215 / 6180)';
      sectionHorizontal.appendChild(titleHorizontal);
      const horizontalContainer = createTag('div', { class: 'ax-color-strip-container ax-color-strip-container--horizontal' });
      [data[0], data[1], data[2]].filter(Boolean).forEach((palette) => {
        const { element } = createPaletteVariant(palette, PALETTE_VARIANT.HORIZONTAL_CONTAINER, { emit, registry });
        horizontalContainer.appendChild(element);
      });
      sectionHorizontal.appendChild(horizontalContainer);
      container.appendChild(sectionHorizontal);

      gridElement = resultExplore.grid;
    } else {
      const result = createPalettesGridDefault();
      gridElement = result.grid;
      container.appendChild(searchUI);
      container.appendChild(filtersUI);
      container.appendChild(gridElement);
    }
  }

  function update(newData) {
    const n = newData.length;
    newData.forEach((palette, i) => {
      paletteStrips[i]?.update(palette);
      if (config.showAllPaletteVariants) paletteStrips[n + i]?.update(palette);
    });
    if (config.showAllPaletteVariants && n >= 2) {
      swatchRailControllers[0]?.updateFromPalette(newData[0]);
      swatchRailControllers[1]?.updateFromPalette(newData[1]);
    }
    if (config.showAllPaletteVariants && n >= 3) {
      swatchRailControllers[2]?.updateFromPalette(newData[0]);
      swatchRailControllers[3]?.updateFromPalette(newData[1]);
      swatchRailControllers[4]?.updateFromPalette(newData[2]);
    }
  }

  function destroy() {
    searchAdapter?.destroy();
    paletteStrips.forEach((strip) => strip.destroy());
    paletteStrips.length = 0;
    swatchRailAdapters.forEach((a) => a.destroy());
    swatchRailAdapters.length = 0;
    swatchRailControllers.length = 0;
  }

  return {
    ...base,
    render,
    update,
    destroy,
  };
}
