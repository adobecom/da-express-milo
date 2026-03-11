/* eslint-disable import/prefer-default-export -- named export for createStripsRenderer */
import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import { createSearchAdapter, createPaletteAdapter, createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';
import { createFourRowsColorBlindnessLayout } from './createStripContainerRenderer.js';
import { createPaletteVariant, PALETTE_VARIANT } from '../palettes/createPaletteVariantFactory.js';
import { createPaletteSummaryRenderer } from './createPaletteSummaryRenderer.js';
import { loadIconsRail } from '../spectrum/load-spectrum.js';
import { wrapInTheme } from '../spectrum/utils/theme.js';
import { announceToScreenReader, clearScreenReaderAnnouncement } from '../spectrum/utils/a11y.js';
import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';
import { initTooltipsForColorSwatchRail } from '../modal/initTooltipsForRail.js';

const VARIANT_SIZES = ['l', 'm', 's'];
const MAX_SIMPLE_VARIANTS = 3;
const PALETTE_GRID_BREAKPOINT_TABLET = 680;
const PALETTE_GRID_BREAKPOINT_DESKTOP = 1200;

/** Desktop = vertical (Dektip), tablet + mobile = stacked. Container orchestration (1 col / 2 cols) is page CSS. */
const VERTICAL_STACKED_BREAKPOINT = '(min-width: 1200px)';

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
  const railTooltipDestroys = [];
  const paletteGridNavControllers = [];
  let containerElement = null;
  let demoSummaryRenderer = null;
  let demoLmsWrap = null;

  const registry = {
    pushStrip: (strip) => paletteStrips.push(strip),
    pushController: (controller) => swatchRailControllers.push(controller),
    pushAdapter: (adapter) => swatchRailAdapters.push(adapter),
  };

  /**
   * Attach Spectrum tooltips to palette card Edit/View actions with explicit labels.
   * Prevents analytics or other scripts from showing wrong text in tooltips.
   */
  async function initPaletteCardTooltips(cardOrWrapper) {
    /* Remove title from card so only Spectrum tooltips show (no native tooltip). */
    if (cardOrWrapper?.removeAttribute) cardOrWrapper.removeAttribute('title');
    const actions = cardOrWrapper.querySelectorAll?.('.palette-card__action');
    if (!actions?.length) return;
    const editLabel = 'Edit palette';
    const viewLabel = 'View palette';
    const [editEl, viewEl] = actions;
    actions.forEach((actionEl) => {
      actionEl.removeAttribute('title');
      actionEl.addEventListener('mouseenter', () => actionEl.removeAttribute('title'));
      actionEl.addEventListener('focusin', () => actionEl.removeAttribute('title'));
    });
    const tips = await Promise.all([
      editEl ? createExpressTooltip({ targetEl: editEl, content: editLabel, placement: 'top' }) : null,
      viewEl ? createExpressTooltip({ targetEl: viewEl, content: viewLabel, placement: 'top' }) : null,
    ].filter(Boolean));
    cardOrWrapper._actionTooltips = tips;
  }

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

    /* Do not set title on action elements — use Spectrum tooltips with explicit content so analytics/tracking cannot overwrite tooltip text. */
    const iconAction = (ariaLabel, iconEl, href, onClick, openInNewTab = true) => {
      const el = href
        ? createTag('a', { class: 'palette-card__action', href })
        : createTag('button', { type: 'button', class: 'palette-card__action' });
      el.setAttribute('aria-label', ariaLabel);
      if (href && openInNewTab) el.setAttribute('target', '_blank');
      iconEl.setAttribute('aria-hidden', 'true');
      if (iconEl.tagName?.toLowerCase().startsWith('sp-icon')) iconEl.setAttribute('size', 'm');
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
    if (focusable) {
      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const target = e.target;
        if (target === card || !card.contains(target)) return;
        e.preventDefault();
        clearScreenReaderAnnouncement();
        card.focus();
        const paletteName = palette.name || palette.id || 'palette';
        announceToScreenReader(`Focus on palette: ${paletteName}. Use Tab to move to actions or arrow keys to move between palettes.`, 'assertive', { immediate: true });
      }, true);
      card.addEventListener('focusin', (e) => {
        if (e.target !== card) return;
        if (e.relatedTarget && card.contains(e.relatedTarget)) return;
        const paletteName = palette.name || palette.id || 'palette';
        setTimeout(() => {
          announceToScreenReader(`Focus on palette: ${paletteName}. Use Tab to move to actions or arrow keys to move between palettes.`, 'assertive');
        }, 100);
      });
    }
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

  async function initPaletteVariantCardTooltips(gridEl) {
    const buttons = gridEl?.querySelectorAll?.('.color-card-action-btn[data-tooltip-content]') || [];
    const seenCards = new Set();
    for (const btn of buttons) {
      const content = btn.getAttribute('data-tooltip-content') || '';
      if (!content) continue;
      const card = btn.closest?.('.color-card');
      if (card && !seenCards.has(card)) {
        seenCards.add(card);
        card.removeAttribute('title');
      }
      btn.removeAttribute('title');
      btn.addEventListener('mouseenter', () => btn.removeAttribute('title'));
      btn.addEventListener('focusin', () => btn.removeAttribute('title'));
      try {
        await createExpressTooltip({ targetEl: btn, content, placement: 'top' });
      } catch {
        // ignore per-button failures
      }
    }
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

  function getPaletteGridColumns() {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width >= PALETTE_GRID_BREAKPOINT_DESKTOP) return 3;
    if (width >= PALETTE_GRID_BREAKPOINT_TABLET) return 2;
    return 1;
  }

  function initPaletteGridKeyboardNavigation(gridEl) {
    if (!gridEl) return;
    if (gridEl._paletteGridNavAbort) {
      gridEl._paletteGridNavAbort.abort();
    }

    const abortController = new AbortController();
    const { signal } = abortController;
    gridEl._paletteGridNavAbort = abortController;
    paletteGridNavControllers.push(abortController);

    const CARD_SELECTOR = '.color-card, .palette-card';
    let focusedCardIndex = -1;
    let gridNavigationEnabled = true;
    const NAV_KEYS = new Set(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']);

    const getCards = () => Array.from(gridEl.querySelectorAll(CARD_SELECTOR));
    const getCardActions = (card) => Array.from(
      card.querySelectorAll('.color-card-action-btn, .palette-card__action'),
    );

    const setActionsTabbable = (card, enabled) => {
      getCardActions(card).forEach((action) => {
        action.setAttribute('tabindex', enabled ? '0' : '-1');
      });
    };

    const disableAllActions = () => {
      getCards().forEach((card) => setActionsTabbable(card, false));
    };

    const updateTabIndexes = () => {
      const cards = getCards();
      if (!cards.length) return;
      if (focusedCardIndex < 0 || focusedCardIndex >= cards.length) {
        focusedCardIndex = 0;
      }
      cards.forEach((card, index) => {
        card.setAttribute('tabindex', index === focusedCardIndex ? '0' : '-1');
      });
      if (gridNavigationEnabled) {
        disableAllActions();
      }
    };

    const focusCardByIndex = (nextIndex) => {
      const cards = getCards();
      if (!cards.length) return;
      const index = Math.max(0, Math.min(nextIndex, cards.length - 1));
      focusedCardIndex = index;
      updateTabIndexes();
      cards[index].focus();
    };

    gridEl.addEventListener('focusin', (e) => {
      const card = e.target.closest?.(CARD_SELECTOR);
      if (!card || !gridEl.contains(card)) return;
      const cards = getCards();
      const index = cards.indexOf(card);
      if (index === -1) return;
      focusedCardIndex = index;
      if (e.target === card) {
        gridNavigationEnabled = true;
      } else {
        gridNavigationEnabled = false;
      }
      updateTabIndexes();
    }, { signal });

    gridEl.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!gridEl.contains(document.activeElement)) {
          gridNavigationEnabled = true;
          updateTabIndexes();
        }
      }, 0);
    }, { signal });

    gridEl.addEventListener('keydown', (e) => {
      const card = e.target.closest?.(CARD_SELECTOR);
      if (!card || !gridEl.contains(card)) return;
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      const isCardLevel = e.target === card;

      if ((e.key === 'Enter' || e.key === ' ') && isCardLevel) {
        const actions = getCardActions(card);
        if (!actions.length) return;
        e.preventDefault();
        gridNavigationEnabled = false;
        disableAllActions();
        setActionsTabbable(card, true);
        actions[0].focus();
        return;
      }

      if (e.key === 'Escape' && !isCardLevel) {
        e.preventDefault();
        gridNavigationEnabled = true;
        disableAllActions();
        card.focus();
        return;
      }

      if (e.key === 'Tab' && !isCardLevel && !gridNavigationEnabled) {
        const actions = getCardActions(card);
        if (!actions.length) return;
        const currentIndex = actions.indexOf(e.target);
        if (currentIndex === -1) return;
        e.preventDefault();
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + actions.length) % actions.length
          : (currentIndex + 1) % actions.length;
        actions[nextIndex].focus();
        return;
      }

      if (!gridNavigationEnabled || !isCardLevel || !NAV_KEYS.has(e.key)) return;

      const cards = getCards();
      if (!cards.length) return;
      const currentIndex = cards.indexOf(card);
      if (currentIndex === -1) return;

      const cols = getPaletteGridColumns();
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = Math.min(cards.length - 1, currentIndex + 1);
          break;
        case 'ArrowLeft':
          nextIndex = Math.max(0, currentIndex - 1);
          break;
        case 'ArrowDown':
          nextIndex = Math.min(cards.length - 1, currentIndex + cols);
          break;
        case 'ArrowUp':
          nextIndex = Math.max(0, currentIndex - cols);
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = cards.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      if (nextIndex !== currentIndex) {
        focusCardByIndex(nextIndex);
      }
    }, { signal });

    window.addEventListener('resize', updateTabIndexes, { signal });
    updateTabIndexes();
  }

  function clearPaletteGridKeyboardNavigation() {
    while (paletteGridNavControllers.length) {
      const controller = paletteGridNavControllers.pop();
      controller?.abort();
    }
  }

  /** Run after grid is appended to document so tooltips attach to visible elements. */
  function scheduleGridTooltips(gridEl) {
    requestAnimationFrame(() => {
      initPaletteVariantCardTooltips(gridEl).catch(() => {});
    });
  }

  function createPalettesGridDefault() {
    const variant = config.stripVariant === 'compact' ? PALETTE_VARIANT.COMPACT : PALETTE_VARIANT.SUMMARY;
    return createPalettesGridForVariant(variant);
  }

  function render(container) {
    clearPaletteGridKeyboardNavigation();
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
        if (palette) {
          const card = createPaletteCard(palette, size);
          container.appendChild(card);
          initPaletteCardTooltips(card).catch(() => {});
        }
      });
      return;
    }

    /* Demo/review: variants only (no search, no filter). */
    if (config.showDemoVariants) {
      return (async () => {
        await import('../../../libs/color-components/components/color-swatch-rail/index.js');
        container.classList.add('color-explorer-strips', 'palettes-variants');
        container.setAttribute('data-demo-variants', 'true');
        const data = getData();

      /* Scope covered / What to review — at top of Demo for PR reviewers */
      const scopeSection = createTag('section', { class: 'strip-demo-scope', 'aria-label': 'Demo scope and review checklist' });
      const scopeTitle = createTag('h2', { class: 'strip-demo-scope__title' });
      scopeTitle.textContent = 'Demo scope (MWPW-187682)';
      scopeSection.appendChild(scopeTitle);
      const scopeNote = createTag('p', { class: 'strip-demo-scope__note' });
      scopeNote.textContent = 'Scope note: Potential color blind conflicts badge/status behavior is tracked in a separate ticket and is not part of this PR.';
      scopeSection.appendChild(scopeNote);
      const scopeCovered = createTag('div', { class: 'strip-demo-scope__block' });
      const scopeCoveredHeading = createTag('h3', { class: 'strip-demo-scope__heading' });
      scopeCoveredHeading.textContent = 'Scope covered';
      scopeCovered.appendChild(scopeCoveredHeading);
      const scopeList = createTag('ul', { class: 'strip-demo-scope__list' });
      ['Vertical (2 and 10 colors), Stacked, Stacked in 400px container', 
        'Strips (L/M/S) and Palette summary', 
        'Layout ready; spacing/radii/tokens to align with Figma (blue lines)',
        'Color Blidness Desktop'].forEach((text) => {
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
      ['Layout and proportions: Vertical, Stacked, L/M/S cards, Palette summary',
        'Keyboard in Interactive Demo: Enter → inside strip, arrows only (Tab trapped), Escape back to column',
        'Out of scope for this PR: Color Blindness T and M'].forEach((text) => {
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
          const card = createPaletteCard(palette, 'l', { showDimensions: true });
          rowL.appendChild(card);
          initPaletteCardTooltips(card).catch(() => {});
        });
      }
      sectionStripsLMS.appendChild(rowL);

      /* Demo row 2: two M (410×88) next to each other in one row. */
      const rowM = createTag('div', { class: 'color-explore-variant-wrap color-explore-variant-wrap--row-m' });
      if (demoPalette) {
        [demoPalette, demoPalette2 ?? demoPalette].forEach((palette) => {
          const card = createPaletteCard(palette, 'm', { showDimensions: true });
          rowM.appendChild(card);
          initPaletteCardTooltips(card).catch(() => {});
        });
      }
      sectionStripsLMS.appendChild(rowM);

      /* Demo row 3: 610 (tablet) on its own row. */
      const row610 = createTag('div', { class: 'color-explore-variant-wrap color-explore-variant-wrap--lms' });
      if (demoPalette) {
        const card610 = createPaletteCard(demoPalette, 'm-tablet', { showDimensions: true });
        row610.appendChild(card610);
        initPaletteCardTooltips(card610).catch(() => {});
      }
      sectionStripsLMS.appendChild(row610);

      /* Demo row 4: S (mobile) on its own row. */
      const rowS = createTag('div', { class: 'color-explore-variant-wrap color-explore-variant-wrap--lms' });
      if (demoPalette) {
        const cardS = createPaletteCard(demoPalette, 's', { showDimensions: true });
        rowS.appendChild(cardS);
        initPaletteCardTooltips(cardS).catch(() => {});
      }
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
      const stackedRailOpts = () => ({
        ...railOpts('stacked'),
        swatchFeatures: { ...config?.swatchFeatures, addLeft: true, addRight: true },
      });
      if (basePalette) {
        const palette2 = { ...basePalette, colors: basePalette.colors.slice(0, 2) };
        const palette10 = { ...basePalette, colors: [...basePalette.colors, ...basePalette.colors] };

        /* Variant 1: Stacked (add left/right enabled for testing top/bottom hover slots) */
        const variantStacked = createTag('div', { class: 'strip-variant strip-variant--stacked' });
        const titleStacked = createTag('h4', { class: 'strip-variant__title' });
        titleStacked.textContent = 'Stacked';
        variantStacked.appendChild(titleStacked);
        variantStacked.appendChild(createSwatchRailAdapter(basePalette, stackedRailOpts()).element);
        stripContainerContent.appendChild(variantStacked);

        /* Variant 2: Stacked in 400px container (add left/right enabled for testing) */
        const variantStackedFixed = createTag('div', { class: 'strip-variant strip-variant--stacked-fixed' });
        const titleStackedFixed = createTag('h4', { class: 'strip-variant__title' });
        titleStackedFixed.textContent = 'Stacked in 400px height container (example)';
        variantStackedFixed.appendChild(titleStackedFixed);
        const stackedFixedContent = createTag('div', { class: 'strip-variant--stacked-fixed__content' });
        stackedFixedContent.appendChild(createSwatchRailAdapter(basePalette, stackedRailOpts()).element);
        variantStackedFixed.appendChild(stackedFixedContent);
        stripContainerContent.appendChild(variantStackedFixed);

        /* Variant 4 & 5: Adapter API vertical-responsive = assume <1200 stacked, ≥1200 vertical; adapter owns resize. */
        const mqVerticalStacked = typeof window !== 'undefined' && window.matchMedia(VERTICAL_STACKED_BREAKPOINT);
        const getVerticalStackedOrientation = () => (mqVerticalStacked?.matches ? 'vertical' : 'stacked');
        const adapterVertical2 = createSwatchRailAdapter(palette2, railOpts('vertical-responsive'));
        const adapterVertical10 = createSwatchRailAdapter(palette10, railOpts('vertical-responsive'));

        const variantVertical2 = createTag('div', { class: 'strip-variant strip-variant--vertical strip-variant--vertical-responsive' });
        const titleVertical2 = createTag('h4', { class: 'strip-variant__title' });
        titleVertical2.textContent = 'Vertical (2 colors)';
        variantVertical2.appendChild(titleVertical2);
        variantVertical2.appendChild(adapterVertical2.element);
        stripContainerContent.appendChild(variantVertical2);

        const variantVertical10 = createTag('div', { class: 'strip-variant strip-variant--vertical strip-variant--vertical-responsive' });
        const titleVertical10 = createTag('h4', { class: 'strip-variant__title' });
        titleVertical10.textContent = 'Vertical (10 colors)';
        variantVertical10.appendChild(titleVertical10);
        const descVertical10 = createTag('p', { class: 'strip-variant__description' });
        descVertical10.textContent = 'Two-column layout.';
        variantVertical10.appendChild(descVertical10);
        variantVertical10.appendChild(adapterVertical10.element);
        stripContainerContent.appendChild(variantVertical10);

        /* Vertical (20 colors) 4 rows — swatch-rail vertical--four-rows, 5×4 grid */
        const palette20Colors = [
          '#FFE0FE', '#EDC3FF', '#BCB2FF', '#ACAAED', '#B3BBED',
          '#FFE0FE', '#EDC3FF', '#BCB2FF', '#ACAAED', '#B3BBED',
          '#FFE0FE', '#EDC3FF', '#BCB2FF', '#ACAAED', '#B3BBED',
          '#FFE0FE', '#EDC3FF', '#BCB2FF', '#ACAAED', '#B3BBED',
        ];
        const palette20 = { ...basePalette, colors: palette20Colors };
        const variantVertical20 = createTag('div', { class: 'strip-variant strip-variant--four-rows' });
        const titleVertical20 = createTag('h4', { class: 'strip-variant__title' });
        titleVertical20.textContent = 'Color Blindness Variant';
        variantVertical20.appendChild(titleVertical20);
        const adapterVertical20 = createSwatchRailAdapter(palette20, {
          orientation: 'four-rows',
          hexCopyFirstRowOnly: true,
          swatchFeatures: {
            ...(config?.swatchFeatures || {}),
            copy: true,
            hexCode: true,
            emptyStrip: false,
          },
        });
        const fourRowsLayout = createFourRowsColorBlindnessLayout(adapterVertical20);
        variantVertical20.appendChild(fourRowsLayout);
        stripContainerContent.appendChild(variantVertical20);

        /* Variant 6: Interactive demo — orientation follows viewport (same breakpoint as variants 4 & 5) */
        const row5 = createTag('div', { class: 'strip-variant strip-variant--interactive strip-variant--interactive-vertical' });
        const interactiveDemoTitle = createTag('h2', { class: 'strip-container-interactive-demo-title' });
        interactiveDemoTitle.textContent = 'Interactive Demo Strips — toggle options to see the interaction of the features (except color blindness)';
        row5.appendChild(interactiveDemoTitle);
        const allFeaturesPanel = createTag('div', { class: 'strip-container-feature-controls' });
        const orientationTitle = createTag('h4', { class: 'strip-container-feature-controls__title' });
        orientationTitle.textContent = 'Orientation';
        allFeaturesPanel.appendChild(orientationTitle);

        const orientationWrap = createTag('div', { class: 'strip-container-feature-controls__orientation' });
        const orientationLabel = createTag('label', { class: 'strip-container-feature-control' });
        orientationLabel.textContent = 'Orientation: ';
        orientationWrap.appendChild(orientationLabel);
        const initialOrientation = getVerticalStackedOrientation();
        const orientationVertical = createTag('input', { type: 'radio', name: 'rail-orientation-demo', value: 'vertical', id: 'rail-orientation-vertical' });
        orientationVertical.checked = initialOrientation === 'vertical';
        const orientationVerticalLabel = createTag('label', { for: 'rail-orientation-vertical', class: 'strip-container-feature-control' });
        orientationVerticalLabel.textContent = 'Vertical';
        orientationVerticalLabel.style.cursor = 'pointer';
        const orientationStacked = createTag('input', { type: 'radio', name: 'rail-orientation-demo', value: 'stacked', id: 'rail-orientation-stacked' });
        orientationStacked.checked = initialOrientation === 'stacked';
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
          { key: 'addLeft', label: 'Add left' },
          { key: 'addRight', label: 'Add right' },
          { key: 'baseColor', label: 'Base color' },
          { key: 'emptyStrip', label: 'Empty strip' },
          { key: 'editColorDisabled', label: 'Edit disabled' },
        ];

        const featureState = FEATURE_OPTIONS.reduce((acc, { key }) => ({
          ...acc,
          [key]: key !== 'editColorDisabled',
        }), {});
        featureState.colorBlindness = true;

        const colorBlindnessWrap = createTag('div', { class: 'strip-container-feature-controls__color-blindness' });
        const colorBlindnessTitle = createTag('h4', { class: 'strip-container-feature-controls__title' });
        colorBlindnessTitle.textContent = 'Color Blidness case';
        colorBlindnessWrap.appendChild(colorBlindnessTitle);
        const colorBlindnessLabel = createTag('label', { class: 'strip-container-feature-control' });
        const colorBlindnessInput = createTag('input', {
          type: 'checkbox',
          'data-feature': 'colorBlindness',
        });
        colorBlindnessInput.checked = featureState.colorBlindness === true;
        colorBlindnessLabel.appendChild(colorBlindnessInput);
        colorBlindnessLabel.appendChild(document.createTextNode(' Color blindness'));
        colorBlindnessWrap.appendChild(colorBlindnessLabel);
        allFeaturesPanel.appendChild(colorBlindnessWrap);

        const iconOptionsTitle = createTag('h4', { class: 'strip-container-feature-controls__title' });
        iconOptionsTitle.textContent = 'Icon options';
        allFeaturesPanel.appendChild(iconOptionsTitle);
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

        const railAdapter = createSwatchRailAdapter(basePalette, { orientation: getVerticalStackedOrientation(), swatchFeatures: featureState });
        const railWrap = createTag('div', { class: 'strip-container-feature-rail-wrap' });
        railWrap.appendChild(railAdapter.element);
        row5.appendChild(railWrap);

        let scheduleRailTooltipsRafId = null;
        let wasColorBlindnessEnabled = false;
        const scheduleRailTooltips = () => {
          railTooltipDestroys.forEach((d) => d());
          railTooltipDestroys.length = 0;
          if (scheduleRailTooltipsRafId != null) cancelAnimationFrame(scheduleRailTooltipsRafId);
          scheduleRailTooltipsRafId = requestAnimationFrame(() => {
            scheduleRailTooltipsRafId = null;
            initTooltipsForColorSwatchRail(container, railTooltipDestroys).catch(() => {});
          });
        };
        const applyFeatures = () => {
          const next = {};
          checkboxesWrap.querySelectorAll('input[data-feature]').forEach((input) => {
            next[input.dataset.feature] = input.checked;
          });
          next.colorBlindness = colorBlindnessInput.checked;
          const cbChecked = next.colorBlindness === true;

          if (cbChecked && !wasColorBlindnessEnabled) {
            const enforced = {
              copy: true,
              colorPicker: true,
              editTint: false,
              hexCode: true,
              lock: false,
              trash: false,
              drag: false,
              addLeft: false,
              addRight: false,
              colorBlindness: true,
              baseColor: false,
              emptyStrip: false,
              editColorDisabled: false,
            };
            colorBlindnessInput.checked = true;
            checkboxesWrap.querySelectorAll('input[data-feature]').forEach((input) => {
              const key = input.dataset.feature;
              input.checked = enforced[key] === true;
              next[key] = input.checked;
            });
            next.colorBlindness = true;
            orientationVertical.checked = true;
          }

          railAdapter.setSwatchFeatures(next);
          const selectedOrientation = orientationVertical.checked ? 'vertical' : 'stacked';
          railWrap.innerHTML = '';
          if (cbChecked) {
            railAdapter.setOrientation('four-rows');
            railAdapter.rail.hexCopyFirstRowOnly = true;
            railAdapter.rail.setAttribute('hex-copy-first-row-only', '');
            orientationVertical.disabled = false;
            orientationStacked.disabled = true;
            railWrap.appendChild(createFourRowsColorBlindnessLayout(railAdapter));
          } else {
            railAdapter.rail.hexCopyFirstRowOnly = false;
            railAdapter.rail.removeAttribute('hex-copy-first-row-only');
            orientationVertical.disabled = false;
            orientationStacked.disabled = false;
            railAdapter.setOrientation(selectedOrientation);
            railWrap.appendChild(railAdapter.element);
          }
          row5.classList.toggle('strip-variant--interactive-vertical', !cbChecked && selectedOrientation === 'vertical');
          row5.classList.toggle('strip-variant--interactive-stacked', !cbChecked && selectedOrientation === 'stacked');
          wasColorBlindnessEnabled = cbChecked;
          scheduleRailTooltips();
        };
        const applyOrientation = () => {
          if (colorBlindnessInput.checked) return;
          const orientation = orientationVertical.checked ? 'vertical' : 'stacked';
          railAdapter.setOrientation(orientation);
          row5.classList.toggle('strip-variant--interactive-vertical', orientation === 'vertical');
          row5.classList.toggle('strip-variant--interactive-stacked', orientation === 'stacked');
          scheduleRailTooltips();
        };
        checkboxesWrap.querySelectorAll('input[data-feature]').forEach((input) => {
          input.addEventListener('change', applyFeatures);
        });
        colorBlindnessInput.addEventListener('change', applyFeatures);
        orientationVertical.addEventListener('change', applyOrientation);
        orientationStacked.addEventListener('change', applyOrientation);
        applyFeatures(); /* Apply initial state (e.g. colorBlindness → 3 rows) */
        applyOrientation(); /* Set initial vertical/stacked class so rail is visible */

        /* Responsive: variant wrapper classes + Interactive Demo follow viewport; variants 4 & 5 rails use adapter vertical-responsive. */
        const applyVerticalStackedResponsive = () => {
          const orientation = getVerticalStackedOrientation();
          [variantVertical2, variantVertical10].forEach((wrap) => {
            wrap.classList.toggle('strip-variant--vertical', orientation === 'vertical');
            wrap.classList.toggle('strip-variant--stacked', orientation === 'stacked');
          });
          orientationVertical.checked = orientation === 'vertical';
          orientationStacked.checked = orientation === 'stacked';
          applyFeatures();
        };
        mqVerticalStacked?.addEventListener?.('change', applyVerticalStackedResponsive);
        applyVerticalStackedResponsive();

        stripContainerContent.appendChild(row5);
        scheduleRailTooltips();
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
      })();
    }

    if (config.renderGridVariant === 'summary') {
      container.classList.add('color-explorer-strips');
      container.setAttribute('data-palette-grid', 'integration');
      const result = createPalettesGridForVariant(PALETTE_VARIANT.SUMMARY);
      container.appendChild(result.grid);
      gridElement = result.grid;
      scheduleGridTooltips(result.grid);
      initPaletteGridKeyboardNavigation(result.grid);
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
        scheduleGridTooltips(resultExplore.grid);
        initPaletteGridKeyboardNavigation(resultExplore.grid);
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
      scheduleGridTooltips(resultCompact.grid);
      initPaletteGridKeyboardNavigation(resultCompact.grid);

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
      scheduleGridTooltips(gridElement);
      initPaletteGridKeyboardNavigation(gridElement);
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
    clearPaletteGridKeyboardNavigation();
    railTooltipDestroys.forEach((d) => d());
    railTooltipDestroys.length = 0;
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
