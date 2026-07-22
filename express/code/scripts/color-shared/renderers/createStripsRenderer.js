import { createTag } from '../../utils.js';
import createBaseRenderer from './createBaseRenderer.js';
import {
  createSearchAdapter,
} from '../adapters/litComponentAdapters.js';
import { createPaletteVariant, PALETTE_VARIANT } from '../palettes/createPaletteVariantFactory.js';
import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';
import { loadIconsRail } from '../spectrum/load-spectrum.js';
import { decorateAnalyticsAttributes } from '../utils/utilities.js';
import { createColorFiltersPlaceholders } from '../i18n/loadColorFiltersPlaceholders.js';

const ignoreError = () => {};
const FILTER_CLICK_SUPPRESS_MS = 250;

function getPaletteGridColumns() {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
  if (w >= 1200) return 3;
  if (w >= 600) return 2;
  return 1;
}

function setupPaletteGridNav(gridEl) {
  let cardCache = [];
  const getCards = () => cardCache;
  const getCardBtns = (card) => Array.from(card.querySelectorAll('.color-card-action-btn'));

  let focusedIdx = 0;
  let gridNavEnabled = true;
  let blurTimer = null;

  const ARROW_KEYS = new Set(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']);

  function initTabIndexes() {
    cardCache = Array.from(gridEl.querySelectorAll('.color-card'));
    focusedIdx = Math.min(focusedIdx, Math.max(0, cardCache.length - 1));
    cardCache.forEach((card, i) => {
      card.setAttribute('role', 'gridcell');
      card.setAttribute('tabindex', i === focusedIdx ? '0' : '-1');
      getCardBtns(card).forEach((btn) => btn.setAttribute('tabindex', '-1'));
    });
  }

  function moveTo(index) {
    const cards = getCards();
    if (index < 0 || index >= cards.length) return;
    focusedIdx = index;
    cards.forEach((c, i) => c.setAttribute('tabindex', i === index ? '0' : '-1'));
    cards[index].focus();
  }

  function navigate(key, fromIdx, event) {
    const cards = getCards();
    const cols = getPaletteGridColumns();
    const rows = Math.ceil(cards.length / cols);
    const row = Math.floor(fromIdx / cols);
    const col = fromIdx % cols;
    let next = -1;

    if (key === 'ArrowRight') next = col < cols - 1 ? fromIdx + 1 : -1;
    else if (key === 'ArrowLeft') next = col > 0 ? fromIdx - 1 : -1;
    else if (key === 'ArrowDown') {
      next = row < rows - 1 ? Math.min((row + 1) * cols + col, cards.length - 1) : -1;
    } else if (key === 'ArrowUp') next = row > 0 ? (row - 1) * cols + col : -1;
    else if (key === 'Home') next = event?.ctrlKey ? 0 : row * cols;
    else if (key === 'End') {
      next = event?.ctrlKey ? cards.length - 1 : Math.min((row + 1) * cols - 1, cards.length - 1);
    }

    if (next >= 0) moveTo(next);
  }

  gridEl.setAttribute('role', 'grid');

  gridEl.addEventListener('keydown', (e) => {
    const cards = getCards();
    if (!cards.length) return;

    const isCard = cards.includes(e.target);
    const btn = e.target.closest?.('.color-card-action-btn');
    const parentCard = btn ? btn.closest?.('.color-card') : null;
    let cardIdx = -1;
    if (isCard) cardIdx = cards.indexOf(e.target);
    else if (parentCard) cardIdx = cards.indexOf(parentCard);

    if (cardIdx < 0) return;

    if (ARROW_KEYS.has(e.key)) {
      if (btn && parentCard) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      navigate(e.key, cardIdx, e);
      return;
    }

    if (e.key === 'Enter' && isCard && gridNavEnabled) {
      e.preventDefault();
      e.stopPropagation();
      const btns = getCardBtns(e.target);
      if (btns.length) {
        gridNavEnabled = false;
        btns.forEach((b) => b.setAttribute('tabindex', '-1'));
        btns[0].setAttribute('tabindex', '0');
        btns[0].focus();
      }
      return;
    }

    if (e.key === 'Tab' && btn && parentCard) {
      const btns = getCardBtns(parentCard);
      if (!btns.length) return;
      const cur = btns.indexOf(btn);
      if (cur < 0) return;
      e.preventDefault();
      const next = e.shiftKey
        ? (cur - 1 + btns.length) % btns.length
        : (cur + 1) % btns.length;
      btns[cur].setAttribute('tabindex', '-1');
      btns[next].setAttribute('tabindex', '0');
      btns[next].focus();
      return;
    }

    if (e.key === 'Escape' && btn && parentCard) {
      e.preventDefault();
      e.stopPropagation();
      gridNavEnabled = true;
      const btns = getCardBtns(parentCard);
      btns.forEach((b) => b.setAttribute('tabindex', '-1'));
      parentCard.focus();
    }
  });

  gridEl.addEventListener('focusin', (e) => {
    const cards = getCards();
    const idx = cards.indexOf(e.target);
    if (idx < 0) return;
    if (blurTimer) {
      clearTimeout(blurTimer);
      blurTimer = null;
    }
    focusedIdx = idx;
    gridNavEnabled = true;
    cards.forEach((c, i) => c.setAttribute('tabindex', i === idx ? '0' : '-1'));
  });

  gridEl.addEventListener('focusout', () => {
    if (blurTimer) clearTimeout(blurTimer);
    blurTimer = setTimeout(() => {
      if (!gridEl.contains(document.activeElement)) {
        gridNavEnabled = true;
        initTabIndexes();
      }
      blurTimer = null;
    }, 0);
  });

  initTabIndexes();
  return {
    reinit: initTabIndexes,
    destroy: () => {},
  };
}

export function createStripsRenderer(options) {
  const {
    container: rootContainer,
    strings = createColorFiltersPlaceholders(),
    paletteCardStrings = {},
  } = options;
  const contentPalettesLabel = strings.contentPalettes || 'Color palettes';
  const base = createBaseRenderer(options);
  const { getData, setData, emit, createGrid, config } = base;

  let suppressActivationUntil = Number.isFinite(config?.initialActivationSuppressUntil)
    ? Number(config.initialActivationSuppressUntil)
    : 0;
  let filterInteractionListenerBound = false;

  function isActivationSuppressed() {
    return Date.now() < suppressActivationUntil;
  }

  function onFilterInteraction() {
    suppressActivationUntil = Date.now() + FILTER_CLICK_SUPPRESS_MS;
  }

  function emitPaletteInteractionGuarded(event, detail) {
    if (event === 'palette-click' && isActivationSuppressed()) return;
    emit(event, detail);
  }

  function bindFilterInteractionSuppressor() {
    if (!rootContainer || filterInteractionListenerBound) return;
    rootContainer.addEventListener('color-explore:filter-interaction', onFilterInteraction);
    filterInteractionListenerBound = true;
  }

  let gridElement = null;
  let searchAdapter = null;
  let resultsCountEl = null;
  let gridNavReinit = null;
  let gridNavDestroy = null;
  const paletteStrips = [];
  const tooltipControllers = new Map();
  const titleGuardCleanups = new Map();
  let tooltipInitToken = 0;

  function clearNativeTitle(targetEl) {
    if (targetEl?.hasAttribute('title')) targetEl.removeAttribute('title');
  }

  function destroyTitleGuardForTarget(targetEl) {
    if (!targetEl) return;
    const cleanup = titleGuardCleanups.get(targetEl);
    if (!cleanup) return;
    cleanup();
    titleGuardCleanups.delete(targetEl);
  }

  function ensureTitleGuardForTarget(targetEl) {
    if (!targetEl) return;
    clearNativeTitle(targetEl);
    if (titleGuardCleanups.has(targetEl)) return;

    const scrubTitle = () => clearNativeTitle(targetEl);
    targetEl.addEventListener('pointerenter', scrubTitle);
    targetEl.addEventListener('focusin', scrubTitle);

    let observer = null;
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        scrubTitle();
      });
      observer.observe(targetEl, { attributes: true, attributeFilter: ['title'] });
    }

    titleGuardCleanups.set(targetEl, () => {
      targetEl.removeEventListener('pointerenter', scrubTitle);
      targetEl.removeEventListener('focusin', scrubTitle);
      observer?.disconnect();
      observer = null;
    });
  }

  function destroyTooltipForTarget(targetEl) {
    if (!targetEl) return;
    destroyTitleGuardForTarget(targetEl);
    const controller = tooltipControllers.get(targetEl);
    if (!controller) return;
    controller.destroy?.();
    tooltipControllers.delete(targetEl);
  }

  function clearGridTooltips() {
    titleGuardCleanups.forEach((cleanup) => cleanup?.());
    titleGuardCleanups.clear();
    tooltipControllers.forEach((controller) => controller?.destroy?.());
    tooltipControllers.clear();
  }

  function createSearchUI() {
    searchAdapter = createSearchAdapter({
      placeholder: strings.searchPlaceholderShort,
      onSearch: (query) => {
        emit('search', { query });
      },
    });

    const container = createTag('div', { class: 'search-container' });
    container.appendChild(searchAdapter.element);

    return container;
  }

  function createPaletteCard(palette, variantOverride = null) {
    const variant = variantOverride
      || (config?.stripVariant === 'compact' ? PALETTE_VARIANT.COMPACT : PALETTE_VARIANT.SUMMARY);
    const { element } = createPaletteVariant(palette, variant, {
      emit: emitPaletteInteractionGuarded,
      cardFocusable: config?.cardFocusable !== false,
      strings: paletteCardStrings,
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

    gridNavDestroy?.();
    const gridNav = setupPaletteGridNav(grid);
    gridNavReinit = gridNav.reinit;
    gridNavDestroy = gridNav.destroy;
    return grid;
  }

  function createPalettesGridDefault() {
    const variant = config?.stripVariant === 'compact'
      ? PALETTE_VARIANT.COMPACT
      : PALETTE_VARIANT.SUMMARY;
    return createPalettesGridForVariant(variant);
  }

  function applyCardActionAnalytics(gridEl) {
    if (!gridEl) return;
    const buttons = Array.from(gridEl.querySelectorAll('.color-card-action-btn'));

    buttons.forEach((button) => {
      const linkLabel = button.getAttribute('data-tooltip-content')
        || button.getAttribute('aria-label')
        || 'Open';
      decorateAnalyticsAttributes(button, { linkLabel });
    });
  }

  async function initPaletteVariantCardTooltips(gridEl, token) {
    const buttons = gridEl?.querySelectorAll?.('.color-card-action-btn[data-tooltip-content]') || [];
    for (const button of buttons) {
      if (token !== tooltipInitToken) return;

      const content = button.getAttribute('data-tooltip-content') || '';
      if (content) {
        destroyTooltipForTarget(button);
        ensureTitleGuardForTarget(button);
        try {
          // eslint-disable-next-line no-await-in-loop
          const tip = await createExpressTooltip({ targetEl: button, content, placement: 'top' });
          if (token !== tooltipInitToken || !button.isConnected || !gridEl?.isConnected) {
            tip?.destroy?.();
            return;
          }
          tooltipControllers.set(button, tip);
        } catch (error) {
          ignoreError(error);
        }
      }
    }
  }

  function scheduleGridTooltips(gridEl) {
    tooltipInitToken += 1;
    const token = tooltipInitToken;
    clearGridTooltips();
    requestAnimationFrame(() => {
      initPaletteVariantCardTooltips(gridEl, token).catch(ignoreError);
    });
  }

  async function render(container) {
    bindFilterInteractionSuppressor();
    tooltipInitToken += 1;
    clearGridTooltips();
    container.replaceChildren();
    container.classList.add('color-explorer-strips');
    await loadIconsRail();

    if (config?.renderGridVariant === 'summary') {
      const headerEl = createTag('div', { class: 'explore-header' });
      resultsCountEl = createTag('span', { class: 'results-count' });
      resultsCountEl.textContent = contentPalettesLabel;
      headerEl.appendChild(resultsCountEl);

      const sectionEl = createTag('section', { class: 'explore-main-section' });
      gridElement = createPalettesGridForVariant(PALETTE_VARIANT.SUMMARY);
      sectionEl.appendChild(gridElement);
      container.append(headerEl, sectionEl);
      applyCardActionAnalytics(gridElement);
      scheduleGridTooltips(gridElement);
      return;
    }

    const searchUI = createSearchUI();
    gridElement = createPalettesGridDefault();

    const resultsHeader = createTag('div', { class: 'results-header' });
    resultsCountEl = createTag('span', { class: 'results-count' });
    resultsCountEl.textContent = contentPalettesLabel;
    resultsHeader.appendChild(resultsCountEl);

    container.append(searchUI, resultsHeader, gridElement);
    applyCardActionAnalytics(gridElement);
    scheduleGridTooltips(gridElement);
  }

  function update(newData) {
    if (!Array.isArray(newData) || !gridElement) return;

    setData(newData);
    tooltipInitToken += 1;
    clearGridTooltips();

    paletteStrips.forEach((strip) => strip.destroy?.());
    paletteStrips.length = 0;
    gridElement.replaceChildren();

    let variant = PALETTE_VARIANT.SUMMARY;
    if (config?.renderGridVariant !== 'summary' && config?.stripVariant === 'compact') {
      variant = PALETTE_VARIANT.COMPACT;
    }
    gridElement.setAttribute('data-palette-strip-variant', variant);

    getData().forEach((palette) => {
      gridElement.appendChild(createPaletteCard(palette, variant));
    });
    gridNavReinit?.();

    if (resultsCountEl) {
      resultsCountEl.textContent = contentPalettesLabel;
    }
    applyCardActionAnalytics(gridElement);
    scheduleGridTooltips(gridElement);
  }

  function destroy() {
    if (rootContainer && filterInteractionListenerBound) {
      rootContainer.removeEventListener('color-explore:filter-interaction', onFilterInteraction);
      filterInteractionListenerBound = false;
    }
    tooltipInitToken += 1;
    clearGridTooltips();
    gridNavDestroy?.();
    gridNavDestroy = null;
    gridNavReinit = null;
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
