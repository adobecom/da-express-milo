/* eslint-disable import/prefer-default-export -- named export for createStripsRenderer */
import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import { createSearchAdapter, createPaletteAdapter, createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';
import { createStripWithColorBlindness } from './createStripContainerRenderer.js';
import { createPaletteVariant, PALETTE_VARIANT } from '../palettes/createPaletteVariantFactory.js';
import { createPaletteSummaryRenderer } from './createPaletteSummaryRenderer.js';
import { loadIconsRail } from '../spectrum/load-spectrum.js';
import { wrapInTheme } from '../spectrum/utils/theme.js';

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
    const focusable = config?.cardFocusable !== false;
    if (focusable) {
      card.setAttribute('role', 'group');
      card.setAttribute('aria-label', `Palette: ${palette.name || palette.id}`);
      card.setAttribute('tabindex', '0');
    } else {
      card.setAttribute('tabindex', '-1');
    }

    const stripWrap = createTag('div', { class: 'palette-card__strip-wrap' });
    stripWrap.appendChild(stripEl);
    card.appendChild(stripWrap);

    const footer = createTag('div', { class: 'palette-card__footer' });
    const nameEl = createTag('div', { class: 'palette-name' });
    nameEl.textContent = palette.name || `Palette ${palette.id}`;
    footer.appendChild(nameEl);

    const iconAction = (ariaLabel, iconEl, href, onClick, openInNewTab = true) => {
      const el = href
        ? createTag('a', { class: 'palette-card__action', href })
        : createTag('button', { type: 'button', class: 'palette-card__action' });
      el.setAttribute('aria-label', ariaLabel);
      el.setAttribute('title', ariaLabel);
      if (href && openInNewTab) el.setAttribute('target', '_blank');
      iconEl.setAttribute('aria-hidden', 'true');
      if (iconEl.tagName?.toLowerCase().startsWith('sp-icon')) iconEl.setAttribute('size', 's');
      el.appendChild(iconEl);
      if (onClick) el.addEventListener('click', (e) => { e.stopPropagation(); onClick(e); });
      return el;
    };
    const demoActions = !!config?.showDemoVariants;
    const editBaseUrl = config?.editPaletteBaseUrl;
    const editLink = demoActions
      ? '#'
      : (palette.editLink || (editBaseUrl
        ? `${editBaseUrl}${editBaseUrl.includes('?') ? '&' : '?'}palette=${encodeURIComponent(palette.id || palette.name || '')}`
        : null));
    const viewLink = demoActions ? null : palette.viewLink;
    const viewOnClick = (!viewLink || demoActions) ? () => emit('palette-click', palette) : undefined;
    const editIcon = document.createElement('sp-icon-edit');
    const viewIcon = document.createElement('sp-icon-open-in');
    const actions = createTag('div', { class: 'palette-card__actions' });
    actions.appendChild(iconAction('Edit palette', editIcon, editLink, editLink ? undefined : undefined, false));
    actions.appendChild(iconAction('View palette', viewIcon, viewLink, viewOnClick));
    if (showDimensions) {
      const dimensionsEl = createTag('span', { class: 'palette-card-dimensions' });
      dimensionsEl.setAttribute('aria-hidden', 'true');
      footer.appendChild(dimensionsEl);
    }
    footer.appendChild(actions);
    card.appendChild(footer);
    return wrapInTheme(card, { system: 'spectrum-two' });
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
    const cardFocusable = config?.cardFocusable;
    data.forEach((palette) => {
      const { element } = createPaletteVariant(palette, variant, { emit, registry, cardFocusable });
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

    /* Ensure Spectrum icons load for palette cards (Edit, View) and rails */
    loadIconsRail();

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

      /* Scope covered / What to review — at top of Demo for PR reviewers */
      const scopeSection = createTag('section', { class: 'strip-demo-scope', 'aria-label': 'Demo scope and review checklist' });
      const scopeTitle = createTag('h2', { class: 'strip-demo-scope__title' });
      scopeTitle.textContent = 'Demo scope (MWPW-187682)';
      scopeSection.appendChild(scopeTitle);
      const scopeCovered = createTag('div', { class: 'strip-demo-scope__block' });
      const scopeCoveredHeading = createTag('h3', { class: 'strip-demo-scope__heading' });
      scopeCoveredHeading.textContent = 'Scope covered';
      scopeCovered.appendChild(scopeCoveredHeading);
      const scopeList = createTag('ul', { class: 'strip-demo-scope__list' });
      ['Vertical (2 and 10 colors), Stacked, Stacked in 400px container', 'Strips (L/M/S) and Palette summary', 'Layout ready; spacing/radii/tokens to align with Figma (blue lines)'].forEach((text) => {
        const li = createTag('li');
        li.textContent = text;
        scopeList.appendChild(li);
      });
      scopeCovered.appendChild(scopeList);
      scopeSection.appendChild(scopeCovered);
      const reviewBlock = createTag('div', { class: 'strip-demo-scope__block' });
      const reviewHeading = createTag('h3', { class: 'strip-demo-scope__heading' });
      reviewHeading.textContent = 'What to review';
      reviewBlock.appendChild(reviewHeading);
      const reviewList = createTag('ul', { class: 'strip-demo-scope__list' });
      ['Layout and proportions: Vertical, Stacked, L/M/S cards, Palette summary', 'Keyboard in Interactive Demo: Enter → inside strip, arrows only (Tab trapped), Escape back to column', 'Out of scope for this PR: Color Blindness layout/icons, add left/right + empty (two-column), strip-level roving'].forEach((text) => {
        const li = createTag('li');
        li.textContent = text;
        reviewList.appendChild(li);
      });
      reviewBlock.appendChild(reviewList);
      scopeSection.appendChild(reviewBlock);
      container.appendChild(scopeSection);

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
        config: { ...config, fullWidthSummary: true },
      });
      demoSummaryRenderer.render(paletteSummaryContent);

      /* Strip container (feature-MWPW-187682): 4 vertical variants — each on its own row. */
      const sectionStripContainer = createTag('div', { class: 'color-explore-section color-explore--strip-container palette-variants-section' });
      sectionStripContainer.setAttribute('data-variant', 'strip-container');
      const titleStripContainer = createTag('h3', { class: 'palette-variants-section-title' });
      titleStripContainer.textContent = 'Strip container';
      sectionStripContainer.appendChild(titleStripContainer);
      const stripContainerContent = createTag('div', { class: 'strip-variants color-explorer-strip-container' });
      sectionStripContainer.appendChild(stripContainerContent);
      container.appendChild(sectionStripContainer);

      const basePalette = data[0];
      const railOpts = (orientation) => {
        const opts = { orientation };
        if (config?.swatchFeatures != null) opts.swatchFeatures = config.swatchFeatures;
        return opts;
      };
      if (basePalette) {
        const palette2 = { ...basePalette, colors: basePalette.colors.slice(0, 2) };
        const palette10 = { ...basePalette, colors: [...basePalette.colors, ...basePalette.colors] };

        /* Variant 1: Stacked */
        const variantStacked = createTag('div', { class: 'strip-variant strip-variant--stacked' });
        const titleStacked = createTag('h4', { class: 'strip-variant__title' });
        titleStacked.textContent = 'Stacked';
        variantStacked.appendChild(titleStacked);
        variantStacked.appendChild(createSwatchRailAdapter(basePalette, railOpts('stacked')).element);
        stripContainerContent.appendChild(variantStacked);

        /* Variant 2: Stacked in 400px container */
        const variantStackedFixed = createTag('div', { class: 'strip-variant strip-variant--stacked-fixed' });
        const titleStackedFixed = createTag('h4', { class: 'strip-variant__title' });
        titleStackedFixed.textContent = 'Stacked in 400px height container (example)';
        variantStackedFixed.appendChild(titleStackedFixed);
        const stackedFixedContent = createTag('div', { class: 'strip-variant--stacked-fixed__content' });
        stackedFixedContent.appendChild(createSwatchRailAdapter(basePalette, railOpts('stacked')).element);
        variantStackedFixed.appendChild(stackedFixedContent);
        stripContainerContent.appendChild(variantStackedFixed);

        /* Variant 3: Two rows (2×6 + color blindness) — commented out for demo; move down or re-enable when ready */
        // const variantTwoRows = createTag('div', { class: 'strip-variant strip-variant--two-rows' });
        // const titleTwoRows = createTag('h4', { class: 'strip-variant__title' });
        // titleTwoRows.textContent = 'Two rows (2 × 6 colors)';
        // variantTwoRows.appendChild(titleTwoRows);
        // const twoRowsContent = createTag('div', { class: 'strip-variant--two-rows__content' });
        // const twoRowsColors = basePalette.colors || [];
        // const totalColors = twoRowsColors.length;
        // const twoRowsPalette = { ...basePalette, colors: twoRowsColors.length ? twoRowsColors : ['#e5e5e5'] };
        // const twoRowsRailOpts = {
        //   orientation: 'two-rows',
        //   swatchFeatures: {
        //     ...(config?.swatchFeatures || {}),
        //     copy: true,
        //     hexCode: true,
        //     emptyStrip: totalColors < 12,
        //   },
        // };
        // const twoRowsAdapter = createSwatchRailAdapter(twoRowsPalette, twoRowsRailOpts);
        // const twoRowsExtendedWrap = createStripWithColorBlindness(twoRowsAdapter, 'two-rows');
        // twoRowsContent.appendChild(twoRowsAdapter.element);
        // variantTwoRows.appendChild(twoRowsContent);
        // stripContainerContent.appendChild(variantTwoRows);
        /* Placeholders so applyFeatures does not reference undefined when Two rows variant is commented out. Remove when re-enabling above. */
        let twoRowsAdapter = null;
        let twoRowsExtendedWrap = null;
        let twoRowsContent = null;

        /* Variant 4: Vertical (2 colors) */
        const variantVertical2 = createTag('div', { class: 'strip-variant strip-variant--vertical' });
        const titleVertical2 = createTag('h4', { class: 'strip-variant__title' });
        titleVertical2.textContent = 'Vertical (2 colors)';
        variantVertical2.appendChild(titleVertical2);
        variantVertical2.appendChild(createSwatchRailAdapter(palette2, railOpts('vertical')).element);
        stripContainerContent.appendChild(variantVertical2);

        /* Variant 5: Vertical (10 colors) */
        const variantVertical10 = createTag('div', { class: 'strip-variant strip-variant--vertical' });
        const titleVertical10 = createTag('h4', { class: 'strip-variant__title' });
        titleVertical10.textContent = 'Vertical (10 colors)';
        variantVertical10.appendChild(titleVertical10);
        variantVertical10.appendChild(createSwatchRailAdapter(palette10, railOpts('vertical')).element);
        stripContainerContent.appendChild(variantVertical10);

        /* Variant 6: Interactive demo — vertical by default */
        const row5 = createTag('div', { class: 'strip-variant strip-variant--interactive strip-variant--interactive-vertical' });
        const interactiveDemoTitle = createTag('h2', { class: 'strip-container-interactive-demo-title' });
        interactiveDemoTitle.textContent = 'Interactive Demo Strips — toggle options to see the interaction of the features';
        row5.appendChild(interactiveDemoTitle);
        const allFeaturesPanel = createTag('div', { class: 'strip-container-feature-controls' });
        const allFeaturesLabel = createTag('h4', { class: 'strip-container-feature-controls__title' });
        allFeaturesLabel.textContent = 'Icon options';
        allFeaturesPanel.appendChild(allFeaturesLabel);

        const orientationWrap = createTag('div', { class: 'strip-container-feature-controls__orientation' });
        const orientationLabel = createTag('label', { class: 'strip-container-feature-control' });
        orientationLabel.textContent = 'Orientation: ';
        orientationWrap.appendChild(orientationLabel);
        const orientationVertical = createTag('input', { type: 'radio', name: 'rail-orientation-demo', value: 'vertical', id: 'rail-orientation-vertical' });
        orientationVertical.checked = true;
        const orientationVerticalLabel = createTag('label', { for: 'rail-orientation-vertical', class: 'strip-container-feature-control' });
        orientationVerticalLabel.textContent = 'Vertical';
        orientationVerticalLabel.style.cursor = 'pointer';
        const orientationStacked = createTag('input', { type: 'radio', name: 'rail-orientation-demo', value: 'stacked', id: 'rail-orientation-stacked' });
        const orientationStackedLabel = createTag('label', { for: 'rail-orientation-stacked', class: 'strip-container-feature-control' });
        orientationStackedLabel.textContent = 'Stacked';
        orientationStackedLabel.style.cursor = 'pointer';
        orientationWrap.appendChild(orientationVertical);
        orientationWrap.appendChild(orientationVerticalLabel);
        orientationWrap.appendChild(orientationStacked);
        orientationWrap.appendChild(orientationStackedLabel);
        allFeaturesPanel.appendChild(orientationWrap);

        const FEATURE_OPTIONS = [
          { key: 'copy', label: 'Copy hex' },
          { key: 'colorPicker', label: 'Edit Color' },
          { key: 'editTint', label: 'Edit tint' },
          { key: 'hexCode', label: 'Hex code' },
          { key: 'lock', label: 'Lock' },
          { key: 'trash', label: 'Trash' },
          { key: 'drag', label: 'Drag' },
          /* addLeft / addRight disabled in demo — not exposed in Icon options */
          { key: 'colorBlindness', label: 'Color blindness' },
          { key: 'baseColor', label: 'Base color' },
          { key: 'emptyStrip', label: 'Empty strip', disabled: true },
          { key: 'editColorDisabled', label: 'Edit disabled' },
        ];

        const featureState = FEATURE_OPTIONS.reduce((acc, { key }) => ({
          ...acc,
          [key]: key !== 'editColorDisabled',
        }), {});

        const checkboxesWrap = createTag('div', { class: 'strip-container-feature-controls__checkboxes' });
        FEATURE_OPTIONS.forEach((opt) => {
          const { key, label, disabled: optDisabled } = opt;
          const labelEl = createTag('label', { class: `strip-container-feature-control${optDisabled ? ' strip-container-feature-control--disabled' : ''}` });
          const input = createTag('input', { type: 'checkbox', 'data-feature': key });
          input.checked = featureState[key];
          if (optDisabled) input.disabled = true;
          labelEl.appendChild(input);
          labelEl.appendChild(document.createTextNode(` ${label}`));
          checkboxesWrap.appendChild(labelEl);
        });
        allFeaturesPanel.appendChild(checkboxesWrap);

        const resetBtn = createTag('button', {
          type: 'button',
          class: 'strip-container-feature-controls__reset',
          title: 'Set strip to 5 colors and enable Empty strip',
          'aria-label': 'Reset strip to 5 colors and empty slot',
        });
        resetBtn.textContent = 'Reset: 5 + empty';
        resetBtn.addEventListener('click', () => {
          const fiveColors = (basePalette?.colors || []).slice(0, 5);
          const palette = fiveColors.length ? { ...basePalette, colors: fiveColors } : { ...basePalette, colors: ['#808080', '#a0a0a0', '#c0c0c0', '#e0e0e0', '#f0f0f0'] };
          railAdapter.update(palette);
          const emptyInput = checkboxesWrap.querySelector('input[data-feature="emptyStrip"]');
          if (emptyInput) {
            emptyInput.checked = true;
            applyFeatures();
          }
        });
        allFeaturesPanel.appendChild(resetBtn);

        row5.appendChild(allFeaturesPanel);

        const railAdapter = createSwatchRailAdapter(basePalette, { orientation: 'vertical', swatchFeatures: featureState });
        const railWrap = createTag('div', { class: 'strip-container-feature-rail-wrap' });
        railWrap.appendChild(railAdapter.element);
        row5.appendChild(railWrap);

        const applyFeatures = () => {
          const next = {};
          checkboxesWrap.querySelectorAll('input[data-feature]').forEach((input) => {
            next[input.dataset.feature] = input.checked;
          });
          railAdapter.setSwatchFeatures(next);
          if (twoRowsAdapter) twoRowsAdapter.setSwatchFeatures(next);
          /* When Color blindness checked: add 3 rows (Deuteranopia, Protanopia, Tritanopia) per strip */
          const cbChecked = next.colorBlindness === true;
          railWrap.innerHTML = '';
          if (cbChecked) {
            railWrap.appendChild(createStripWithColorBlindness(railAdapter));
          } else {
            railWrap.appendChild(railAdapter.element);
          }
          /* Two-rows: extend with color blindness rows only when colorBlindness feature is active (when section enabled) */
          if (twoRowsContent) {
            twoRowsContent.innerHTML = '';
            if (cbChecked && twoRowsExtendedWrap) {
              twoRowsExtendedWrap.insertBefore(twoRowsAdapter.element, twoRowsExtendedWrap.firstChild);
              twoRowsContent.appendChild(twoRowsExtendedWrap);
            } else if (twoRowsAdapter) {
              twoRowsContent.appendChild(twoRowsAdapter.element);
            }
          }
        };
        const applyOrientation = () => {
          const orientation = orientationVertical.checked ? 'vertical' : 'stacked';
          railAdapter.setOrientation(orientation);
          row5.classList.toggle('strip-variant--interactive-vertical', orientation === 'vertical');
          row5.classList.toggle('strip-variant--interactive-stacked', orientation === 'stacked');
        };
        checkboxesWrap.querySelectorAll('input[data-feature]').forEach((input) => {
          input.addEventListener('change', applyFeatures);
        });
        orientationVertical.addEventListener('change', applyOrientation);
        orientationStacked.addEventListener('change', applyOrientation);
        applyFeatures(); /* Apply initial state (e.g. colorBlindness → 3 rows) */
        applyOrientation(); /* Set initial vertical/stacked class so rail is visible */
        stripContainerContent.appendChild(row5);
      }

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
