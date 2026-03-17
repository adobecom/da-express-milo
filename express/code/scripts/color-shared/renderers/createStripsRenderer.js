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

function formatCount(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

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
      e.preventDefault();
      e.stopPropagation();
      if (btn) {
        gridNavEnabled = true;
        getCardBtns(parentCard).forEach((b) => b.setAttribute('tabindex', '-1'));
      }
      navigate(e.key, cardIdx, e);
      return;
    }

    if (e.key === 'Enter' && isCard && gridNavEnabled) {
      e.preventDefault();
      e.stopPropagation();
      const btns = getCardBtns(e.target);
      if (btns.length) {
        gridNavEnabled = false;
        btns[0].setAttribute('tabindex', '0');
        btns[0].focus();
      }
      return;
    }

    if (e.key === 'Tab' && btn && parentCard) {
      const btns = getCardBtns(parentCard);
      if (btns.length > 1) {
        e.preventDefault();
        const cur = btns.indexOf(btn);
        const next = e.shiftKey
          ? (cur - 1 + btns.length) % btns.length
          : (cur + 1) % btns.length;
        btns[cur].setAttribute('tabindex', '-1');
        btns[next].setAttribute('tabindex', '0');
        btns[next].focus();
      }
      return;
    }

    if (e.key === 'Escape' && btn && parentCard) {
      gridNavEnabled = true;
      getCardBtns(parentCard).forEach((b) => b.setAttribute('tabindex', '-1'));
      // factory's capture Escape handler already calls parentCard.focus()
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
  return { reinit: initTabIndexes };
}

export function createStripsRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData, setData, emit, createGrid, config } = base;

  let gridElement = null;
  let searchAdapter = null;
  let filtersComponent = null;
  let resultsCountEl = null;
  let gridNavReinit = null;
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

    gridNavReinit = setupPaletteGridNav(grid).reinit;
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
      if (content) {
        button.removeAttribute('title');
        button.querySelectorAll?.('sp-tooltip, sp-theme').forEach((el) => el.remove());
        button.addEventListener('mouseenter', () => button.removeAttribute('title'));
        button.addEventListener('focusin', () => button.removeAttribute('title'));
        try {
          // eslint-disable-next-line no-await-in-loop
          await createExpressTooltip({ targetEl: button, content, placement: 'top' });
        } catch (error) {
          ignoreError(error);
        }
      }
    }
  }

  function scheduleGridTooltips(gridEl) {
    requestAnimationFrame(() => {
      initPaletteVariantCardTooltips(gridEl).catch(ignoreError);
    });
  }

  async function render(container) {
    container.replaceChildren();
    container.classList.add('color-explorer-strips');
    await loadIconsRail();

    if (config?.renderGridVariant === 'summary') {
      const filtersUI = await createFilters();
      const data = getData();
      const count = Array.isArray(data) ? data.length : 0;
      const countLabel = formatCount(count);
      const headerEl = createTag('div', { class: 'gradients-header' });
      resultsCountEl = createTag('span', { class: 'results-count' });
      resultsCountEl.textContent = `${countLabel} palettes`;
      headerEl.appendChild(resultsCountEl);
      headerEl.appendChild(filtersUI);

      const sectionEl = createTag('section', { class: 'gradients-main-section' });
      gridElement = createPalettesGridForVariant(PALETTE_VARIANT.SUMMARY);
      sectionEl.appendChild(gridElement);
      container.appendChild(headerEl);
      container.appendChild(sectionEl);
      scheduleGridTooltips(gridElement);
      return;
    }

    const searchUI = createSearchUI();
    const filtersUI = await createFilters();
    gridElement = createPalettesGridDefault();

    const data = getData();
    const count = Array.isArray(data) ? data.length : 0;
    const countLabel = formatCount(count);
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
    scheduleGridTooltips(gridElement);

    if (resultsCountEl) {
      const count = newData.length;
      const countLabel = formatCount(count);
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
