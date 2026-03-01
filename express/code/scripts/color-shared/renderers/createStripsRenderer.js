/* eslint-disable import/prefer-default-export -- named export for createStripsRenderer */
import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import { createSearchAdapter, createPaletteAdapter } from '../adapters/litComponentAdapters.js';
import { createPaletteVariant, PALETTE_VARIANT } from '../palettes/createPaletteVariantFactory.js';
import { createPaletteSummaryRenderer } from './createPaletteSummaryRenderer.js';
import { createStripContainerRenderer } from './createStripContainerRenderer.js';

const VARIANT_SIZES = ['l', 'm', 's'];
const MAX_SIMPLE_VARIANTS = 3;

/**
 * Strips renderer: Summary (Figma 5806-89102) = one variant; explore page = Palette Strips (this grid) + Compact, Simplified, Horizontal.
 * Uses palette variant factory for all strip variants.
 * When config.simpleSizeVariants === true: renders 3 cards (L/M/S) with palette-card + color-palette (feature-MWPW-187682-palette-strips flow).
 *
 * Keyboard/tab: config.cardFocusable (default true) — when true (standalone), the card is a tab stop then strip → edit → view.
 * When false (grid/explore), card gets tabindex="-1" so the grid can control tab order (e.g. roving tabindex per cell).
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
  let demoSummaryRenderer = null;
  let demoStripContainerRenderer = null;
  let demoLmsWrap = null;

  const registry = {
    pushStrip: (strip) => paletteStrips.push(strip),
    pushController: (controller) => swatchRailControllers.push(controller),
    pushAdapter: (adapter) => swatchRailAdapters.push(adapter),
  };

  /** Feature-branch flow: 3 cards with .palette-card, .palette-name, color-palette WC (same DOM/CSS as feature-MWPW-187682-palette-strips). */
  function createPaletteCard(palette, size, options = {}) {
    const { showDimensions = false } = options;
    /* Strips L/M/S use horizontal layout; do not use STRIP_CONTAINER_DEFAULTS (orientation: 'vertical'). */
    const stripOptions = config?.stripOptions ?? { orientation: 'horizontal' };
    const adapter = createPaletteAdapter(palette, {
      onSelect: () => emit('palette-click', palette),
      stripOptions,
    });
    const stripEl = adapter.element;
    stripEl.setAttribute('palette-aria-label', 'Color {hex}, swatch {index}');
    paletteStrips.push(adapter);

    const card = createTag('div', { class: `palette-card palette-card--size-${size}` });
    card.setAttribute('role', 'button');
    const focusable = config?.cardFocusable !== false;
    card.setAttribute('tabindex', focusable ? '0' : '-1');
    card.setAttribute('aria-label', `Open palette: ${palette.name || palette.id}`);
    card.addEventListener('click', (e) => {
      if (e.target.closest('.palette-card__action') || e.target.closest('color-palette')) return;
      emit('palette-click', palette);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!e.target.closest('.palette-card__action')) emit('palette-click', palette);
      }
    });

    card.appendChild(stripEl);

    const footer = createTag('div', { class: 'palette-card__footer' });
    const nameEl = createTag('div', { class: 'palette-name' });
    nameEl.textContent = palette.name || `Palette ${palette.id}`;
    footer.appendChild(nameEl);

    const iconBase = options?.iconBaseUrl ?? '/express/code/icons';
    const iconAction = (ariaLabel, iconName, href, onClick) => {
      const el = href
        ? createTag('a', { class: 'palette-card__action', href })
        : createTag('button', { type: 'button', class: 'palette-card__action' });
      el.setAttribute('aria-label', ariaLabel);
      el.setAttribute('title', ariaLabel);
      if (href) el.setAttribute('target', '_blank');
      const img = createTag('img', { src: `${iconBase}/${iconName}.svg`, alt: '', width: 32, height: 32 });
      img.setAttribute('aria-hidden', 'true');
      el.appendChild(img);
      if (onClick) el.addEventListener('click', (e) => { e.stopPropagation(); onClick(e); });
      return el;
    };
    const actions = createTag('div', { class: 'palette-card__actions' });
    actions.appendChild(iconAction('Edit palette', 'palette-edit', palette.editLink));
    actions.appendChild(iconAction('View palette', 'palette-view', palette.viewLink, palette.viewLink ? undefined : () => emit('palette-click', palette)));
    if (showDimensions) {
      const dimensionsEl = createTag('span', { class: 'palette-card-dimensions' });
      dimensionsEl.setAttribute('aria-hidden', 'true');
      footer.appendChild(dimensionsEl);
    }
    footer.appendChild(actions);
    card.appendChild(footer);
    return card;
  }

  /* Demo: static spec dimensions so label always shows correct values. M (Tablet) 600–679px = 610×88 (Figma 5659-62614). */
  const DEMO_SPEC_DIMENSIONS = { l: '437 × 116 px', m: '410 × 88 px', s: '342 × 88 px', 'm-tablet': '610 × 88 px' };

  function updateDemoCardDimensions(wrap) {
    if (!wrap) return;
    const cards = wrap.querySelectorAll('.palette-card');
    cards.forEach((card) => {
      const dimEl = card.querySelector('.palette-card-dimensions');
      if (dimEl) {
        const sizeMatch = card.className.match(/palette-card--size-(l|m-tablet|m|s)/);
        const size = sizeMatch ? sizeMatch[1] : 'm';
        dimEl.textContent = DEMO_SPEC_DIMENSIONS[size] ?? DEMO_SPEC_DIMENSIONS.m;
      }
    });
  }

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
    container.innerHTML = '';
    paletteStrips.length = 0;

    if (config.simpleSizeVariants) {
      container.classList.add('color-explorer-strips', 'palettes-variants');
      containerElement = container;
      const data = getData().slice(0, MAX_SIMPLE_VARIANTS);
      VARIANT_SIZES.forEach((size, i) => {
        const palette = data[i];
        if (palette) container.appendChild(createPaletteCard(palette, size));
      });
      return;
    }

    /* Demo/review: variants only (no search, no filter). */
    if (config.showDemoVariants) {
      container.classList.add('color-explorer-strips', 'palettes-variants');
      container.setAttribute('data-demo-variants', 'true');
      const data = getData();

      const lmsOuter = createTag('div', { class: 'color-explore--strips-demo color-explorer-strips palettes-variants' });
      const sectionStripsLMS = createTag('div', { class: 'palette-variants-section' });
      sectionStripsLMS.setAttribute('data-variant', 'strips-lms');
      const titleStripsLMS = createTag('h3', { class: 'palette-variants-section-title' });
      titleStripsLMS.textContent = 'Strips (L/M/S)';
      sectionStripsLMS.appendChild(titleStripsLMS);
      const demoPalette = data[0];
      const demoPalette2 = data[1];
      const demoPalette3 = data[2];

      /* Demo row 1: three L (437×116) in one row. */
      const rowL = createTag('div', { class: 'color-explore-variant-wrap color-explore-variant-wrap--row-l' });
      if (demoPalette) {
        [demoPalette, demoPalette2 ?? demoPalette, demoPalette3 ?? demoPalette].forEach((palette) => {
          rowL.appendChild(createPaletteCard(palette, 'l', { showDimensions: true }));
        });
      }
      sectionStripsLMS.appendChild(rowL);

      /* Demo row 2: two M (410×88) next to each other in one row. */
      const rowM = createTag('div', { class: 'color-explore-variant-wrap color-explore-variant-wrap--row-m' });
      if (demoPalette) {
        [demoPalette, demoPalette2 ?? demoPalette].forEach((palette) => {
          rowM.appendChild(createPaletteCard(palette, 'm', { showDimensions: true }));
        });
      }
      sectionStripsLMS.appendChild(rowM);

      /* Demo row 3: 610 (tablet) on its own row. */
      const row610 = createTag('div', { class: 'color-explore-variant-wrap color-explore-variant-wrap--lms' });
      if (demoPalette) row610.appendChild(createPaletteCard(demoPalette, 'm-tablet', { showDimensions: true }));
      sectionStripsLMS.appendChild(row610);

      /* Demo row 4: S (mobile) on its own row. */
      const rowS = createTag('div', { class: 'color-explore-variant-wrap color-explore-variant-wrap--lms' });
      if (demoPalette) rowS.appendChild(createPaletteCard(demoPalette, 's', { showDimensions: true }));
      sectionStripsLMS.appendChild(rowS);

      lmsOuter.appendChild(sectionStripsLMS);
      container.appendChild(lmsOuter);
      demoLmsWrap = sectionStripsLMS;
      requestAnimationFrame(() => {
        updateDemoCardDimensions(rowL);
        updateDemoCardDimensions(rowM);
        updateDemoCardDimensions(row610);
        updateDemoCardDimensions(rowS);
      });

      /* Palette summary (feature-MWPW-187682): ax-color-strip-summary-card. */
      const sectionPaletteSummary = createTag('div', { class: 'color-explore-section color-explore--palette-summary palette-variants-section' });
      sectionPaletteSummary.setAttribute('data-variant', 'palette-summary');
      const titlePaletteSummary = createTag('h3', { class: 'palette-variants-section-title' });
      titlePaletteSummary.textContent = 'Palette summary';
      sectionPaletteSummary.appendChild(titlePaletteSummary);
      const paletteSummaryContent = createTag('div');
      sectionPaletteSummary.appendChild(paletteSummaryContent);
      container.appendChild(sectionPaletteSummary);
      demoSummaryRenderer = createPaletteSummaryRenderer({
        container: paletteSummaryContent,
        data,
        config,
      });
      demoSummaryRenderer.render(paletteSummaryContent);

      /* Strip container (feature-MWPW-187682): color-swatch-rail horizontal/stacked. */
      const sectionStripContainer = createTag('div', { class: 'color-explore-section color-explore--strip-container palette-variants-section' });
      sectionStripContainer.setAttribute('data-variant', 'strip-container');
      const titleStripContainer = createTag('h3', { class: 'palette-variants-section-title' });
      titleStripContainer.textContent = 'Strip container';
      sectionStripContainer.appendChild(titleStripContainer);
      const stripContainerContent = createTag('div');
      sectionStripContainer.appendChild(stripContainerContent);
      container.appendChild(sectionStripContainer);
      const stripContainerPalette = data[0];
      demoStripContainerRenderer = createStripContainerRenderer({
        container: stripContainerContent,
        data: stripContainerPalette ? [stripContainerPalette, stripContainerPalette] : [],
        config: { ...config, stripContainerOrientations: ['vertical', 'stacked'] },
      });
      demoStripContainerRenderer.render(stripContainerContent);

      /* Compact removed from demo — variant needs work, not matching anything yet. */
      const sectionSimplified = createTag('div', { class: 'palette-variants-section' });
      sectionSimplified.setAttribute('data-variant', 'simplified');
      const titleSimplified = createTag('h3', { class: 'palette-variants-section-title' });
      titleSimplified.textContent = 'Simplified (Figma 5639-129905)';
      sectionSimplified.appendChild(titleSimplified);
      const simplifiedWrap = createTag('div', { class: 'palette-variants-simplified-wrap' });
      [data[0], data[1]].filter(Boolean).forEach((palette) => {
        const { element } = createPaletteVariant(palette, PALETTE_VARIANT.SIMPLIFIED, { emit, registry });
        simplifiedWrap.appendChild(element);
      });
      sectionSimplified.appendChild(simplifiedWrap);
      container.appendChild(sectionSimplified);
      return;
    }

    if (config.renderGridVariant === 'summary') {
      container.classList.add('color-explorer-strips');
      container.setAttribute('data-palette-grid', 'integration');
      const result = createPalettesGridForVariant(PALETTE_VARIANT.SUMMARY);
      container.appendChild(result.grid);
      gridElement = result.grid;
      return;
    }

    container.classList.add('color-explorer-strips');
    const searchUI = createSearchUI();
    const filtersUI = createFilters();
    const data = getData();

    if (config.showAllPaletteVariants) {
      container.appendChild(searchUI);
      container.appendChild(filtersUI);

      if (!config.showReviewVariantsOnly) {
        const sectionSummary = createTag('div', { class: 'palette-variants-section' });
        sectionSummary.setAttribute('data-variant', 'summary');
        const titleSummary = createTag('h3', { class: 'palette-variants-section-title' });
        titleSummary.textContent = 'Palette Strips';
        sectionSummary.appendChild(titleSummary);
        const resultExplore = createPalettesGridForVariant(PALETTE_VARIANT.SUMMARY);
        sectionSummary.appendChild(resultExplore.grid);
        container.appendChild(sectionSummary);
        gridElement = resultExplore.grid;
      }

      const sectionCompact = createTag('div', { class: 'palette-variants-section' });
      sectionCompact.setAttribute('data-variant', 'compact');
      sectionCompact.setAttribute('data-review-only', 'true');
      const titleCompact = createTag('h3', { class: 'palette-variants-section-title' });
      titleCompact.textContent = 'Compact (review only)';
      sectionCompact.appendChild(titleCompact);
      const resultCompact = createPalettesGridForVariant(PALETTE_VARIANT.COMPACT);
      sectionCompact.appendChild(resultCompact.grid);
      container.appendChild(sectionCompact);

      const sectionSimplified = createTag('div', { class: 'palette-variants-section' });
      sectionSimplified.setAttribute('data-variant', 'simplified');
      sectionSimplified.setAttribute('data-review-only', 'true');
      const titleSimplified = createTag('h3', { class: 'palette-variants-section-title' });
      titleSimplified.textContent = 'Simplified (Figma 5639-129905) (review only)';
      sectionSimplified.appendChild(titleSimplified);
      const simplifiedWrap = createTag('div', { class: 'palette-variants-simplified-wrap' });
      [data[0], data[1]].filter(Boolean).forEach((palette) => {
        const { element } = createPaletteVariant(palette, PALETTE_VARIANT.SIMPLIFIED, { emit, registry });
        simplifiedWrap.appendChild(element);
      });
      sectionSimplified.appendChild(simplifiedWrap);
      container.appendChild(sectionSimplified);
    } else {
      const result = createPalettesGridDefault();
      gridElement = result.grid;
      container.appendChild(searchUI);
      container.appendChild(filtersUI);
      container.appendChild(gridElement);
    }
  }

  function update(newData) {
    if (config.simpleSizeVariants) {
      newData.slice(0, MAX_SIMPLE_VARIANTS).forEach((palette, i) => {
        paletteStrips[i]?.update(palette);
      });
      return;
    }
    if (config.showDemoVariants) {
      const demoPaletteData = newData[0];
      if (demoPaletteData) {
        paletteStrips.forEach((strip) => strip?.update(demoPaletteData)); /* All demo cards same palette on data update */
      }
      demoSummaryRenderer?.update(newData);
      demoStripContainerRenderer?.update(newData);
      requestAnimationFrame(() => updateDemoCardDimensions(demoLmsWrap));
      const n = newData.length;
      if (n >= 2) {
        swatchRailControllers[0]?.updateFromPalette(newData[0]);
        swatchRailControllers[1]?.updateFromPalette(newData[1]);
      }
      if (n >= 3) {
        swatchRailControllers[2]?.updateFromPalette(newData[0]);
        swatchRailControllers[3]?.updateFromPalette(newData[1]);
        swatchRailControllers[4]?.updateFromPalette(newData[2]);
      }
      return;
    }
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
