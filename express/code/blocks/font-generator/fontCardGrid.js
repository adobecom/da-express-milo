// @import { FontDef, State } from './types.js'
import { getState, setState, subscribe } from './state.js';
import { LOAD_MORE_STEP } from './types.js';
import { createFontCard, updateFontCard } from './fontCard.js';

const FONT_SHEET_PATH = '/express/code/blocks/font-generator/font-sheets/v2/v2.json';
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
  return fonts.filter((f) => activeFilters.includes(f.grouping));
}

/**
 * Creates and mounts the font card grid. Loads v2.json, builds all cards once,
 * then updates them in-place on every state change — no card is ever recreated.
 *
 * @returns {Promise<{ container: HTMLElement, unsubscribe: function }>}
 */
export async function createFontCardGrid() {
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
  loadMoreBtn.textContent = 'Load more';
  loadMoreBtn.hidden = true;

  // Build all cards once upfront — never recreated, only updated.
  const { previewText: initText, fontSize: initSize } = getState();
  /** @type {Map<string, { card: HTMLElement, fontDef: import('./types.js').FontDef }>} */
  const cardMap = new Map();
  fonts.forEach((fontDef) => {
    const card = createFontCard(fontDef, initText, initSize);
    card.setAttribute('role', 'listitem');
    cardMap.set(fontDef.id, { card, fontDef });
  });

  let prevFilterKey = '';
  let prevVisibleCount = -1;

  function render({ previewText, fontSize, activeFilters, visibleCount }) {
    const filtered = getFilteredFonts(fonts, activeFilters);
    const visible = filtered.slice(0, visibleCount);

    // Always update preview text for all currently visible cards.
    visible.forEach(({ id }) => {
      const entry = cardMap.get(id);
      if (entry) updateFontCard(entry.card, entry.fontDef, previewText, fontSize);
    });

    // Rebuild DOM list only when the visible set changes.
    const filterKey = activeFilters.join(',');
    if (filterKey !== prevFilterKey || visibleCount !== prevVisibleCount) {
      prevFilterKey = filterKey;
      prevVisibleCount = visibleCount;
      grid.replaceChildren(...visible.map(({ id }) => cardMap.get(id).card));
      loadMoreBtn.hidden = filtered.length <= visibleCount;
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
