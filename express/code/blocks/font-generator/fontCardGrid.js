// @import { FontDef, State } from './types.js'
import { getState, setState, subscribe } from './state.js';
import { LOAD_MORE_STEP } from './types.js';
import { createFontCard, updateFontCard } from './fontCard.js';

const FONT_SHEET_PATH = '/express/code/blocks/font-generator/font-sheets/font-styles.json';
const STYLESHEET_HREF = '/express/code/blocks/font-generator/fontCardGrid.css';

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected || document.querySelector(`link[href="${STYLESHEET_HREF}"]`)) return;
  stylesInjected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLESHEET_HREF;
  document.head.appendChild(link);
}

function getFilteredFonts(fonts, activeFilters) {
  if (!activeFilters || activeFilters.length === 0) return fonts;
  return fonts.filter((f) => activeFilters.includes(f.category));
}

/**
 * Creates and mounts the font card grid. Loads font-styles.json, builds all cards once,
 * then updates them in-place on every state change — no card is ever recreated.
 *
 * @returns {Promise<{ container: HTMLElement, unsubscribe: function }>}
 */
export default async function createFontCardGrid(config = {}) {
  injectStyles();

  const container = document.createElement('div');
  container.className = 'font-card-grid-container';

  let fonts = [];
  try {
    const res = await fetch(FONT_SHEET_PATH);
    const data = await res.json();
    fonts = data.fonts ?? [];
  } catch (e) {
    // Font sheet failed to load — grid stays empty.
    return { container, unsubscribe: () => {} };
  }

  setState({ activeFonts: fonts });

  const grid = document.createElement('div');
  grid.className = 'font-card-grid';
  grid.setAttribute('role', 'list');

  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.type = 'button';
  loadMoreBtn.className = 'font-card-load-more';
  loadMoreBtn.hidden = true;
  const loadMoreIcon = document.createElement('span');
  loadMoreIcon.className = 'load-more-icon';
  loadMoreIcon.setAttribute('aria-hidden', 'true');
  const loadMoreText = document.createElement('span');
  loadMoreText.className = 'load-more-text';
  loadMoreText.textContent = 'Load more';
  loadMoreBtn.append(loadMoreIcon, loadMoreText);

  // Build all cards once upfront — never recreated, only updated.
  const { previewText: initText, fontSize: initSize } = getState();
  const { cardCta } = config;
  /** @type {Map<string, { card: HTMLElement, fontDef: import('./types.js').FontDef }>} */
  const cardMap = new Map();
  fonts.forEach((fontDef) => {
    const card = createFontCard(fontDef, initText, initSize, cardCta);
    card.setAttribute('role', 'listitem');
    cardMap.set(fontDef.id, { card, fontDef });
  });

  let prevFilterKey = '';
  let prevVisibleCount = -1;
  let prevPreviewText = initText;
  let prevFontSize = initSize;
  // Track activeFilters reference so we can update activeFonts in state
  // exactly once per filter change without triggering a render loop.
  let prevActiveFilters = getState().activeFilters;

  function render({ previewText, fontSize, activeFilters, visibleCount, layout }) {
    const filtered = getFilteredFonts(fonts, activeFilters);
    const visible = filtered.slice(0, visibleCount);

    const textOrSizeChanged = previewText !== prevPreviewText || fontSize !== prevFontSize;
    const filterKey = activeFilters.join(',');
    const visibleSetChanged = filterKey !== prevFilterKey || visibleCount !== prevVisibleCount;

    // Re-run transformations only when text/size changed, or when the visible
    // set changes (newly visible cards may carry stale content from a prior
    // text/size update they missed while filtered out). Pure layout changes
    // only toggle a CSS class and must not re-trigger transformation.
    if (textOrSizeChanged || visibleSetChanged) {
      if (textOrSizeChanged) {
        prevPreviewText = previewText;
        prevFontSize = fontSize;
      }
      visible.forEach(({ id }) => {
        const entry = cardMap.get(id);
        if (entry) updateFontCard(entry.card, entry.fontDef, previewText, fontSize);
      });
    }

    // Rebuild DOM list only when the visible set changes.
    if (visibleSetChanged) {
      prevFilterKey = filterKey;
      prevVisibleCount = visibleCount;
      grid.replaceChildren(...visible.map(({ id }) => cardMap.get(id).card));
      loadMoreBtn.hidden = filtered.length <= visibleCount;
    }

    // Layout toggle: single class drives the CSS grid switch.
    grid.classList.toggle('is-list', layout === 'list');

    // Keep activeFonts in sync for the toolbar count. setState triggers one
    // more subscriber call but filter key won't change, so no loop.
    if (activeFilters !== prevActiveFilters) {
      prevActiveFilters = activeFilters;
      setState({ activeFonts: filtered });
    }
  }

  loadMoreBtn.addEventListener('click', () => {
    setState({ visibleCount: getState().visibleCount + LOAD_MORE_STEP });
  });

  render(getState());

  const unsubscribe = subscribe(render);

  container.append(grid, loadMoreBtn);
  return { container, unsubscribe };
}
