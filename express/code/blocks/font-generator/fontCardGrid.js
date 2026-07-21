// @import { FontDef, State } from './types.js'
import { getState, setState, subscribe } from './state.js';
import { LOAD_MORE_STEP } from './types.js';
import { createFontCard, updateFontCard } from './fontCard.js';
import handleOpenInExpress from './expressHandoff.js';

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

/**
 * Creates and mounts the font card grid. Builds all cards once from the passed
 * catalog, then updates them in-place on every state change — no card is ever
 * recreated. The catalog is loaded by the block entry point (font-generator.js)
 * and passed in via config.fonts; the grid never fetches.
 *
 * @param {{ cardCta?: object, fonts?: import('./types.js').FontDef[], strings?: object }} [config]
 * @returns {{ container: HTMLElement, unsubscribe: function }}
 */
export default function createFontCardGrid(config = {}) {
  injectStyles();

  const container = document.createElement('div');
  container.className = 'font-card-grid-container';

  const { cardCta, fonts = [], strings = {} } = config;
  const { sampleText } = strings;

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
  if (strings.loadMore) loadMoreText.textContent = strings.loadMore;
  loadMoreBtn.append(loadMoreIcon, loadMoreText);

  // Build all cards once upfront — never recreated, only updated.
  const { previewText: initText, fontSize: initSize } = getState();
  /** @type {Map<string, { card: HTMLElement, fontDef: import('./types.js').FontDef }>} */
  const cardMap = new Map();
  fonts.forEach((fontDef) => {
    const card = createFontCard(fontDef, initText, initSize, cardCta, strings);
    card.setAttribute('role', 'listitem');
    cardMap.set(fontDef.id, { card, fontDef });
  });

  let prevFilterKey = '';
  let prevVisibleCount = -1;
  let prevPreviewText = initText;
  let prevFontSize = initSize;

  // activeFonts is derived by the store (deriveActiveFonts) — the grid just
  // reads it, so no filtering or activeFonts write-back happens here.
  function render({ previewText, fontSize, activeFilters, activeFonts, visibleCount, layout }) {
    const visible = activeFonts.slice(0, visibleCount);

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
        if (entry) updateFontCard(entry.card, entry.fontDef, previewText, fontSize, sampleText);
      });
    }

    // Rebuild DOM list only when the visible set changes.
    if (visibleSetChanged) {
      prevFilterKey = filterKey;
      prevVisibleCount = visibleCount;
      grid.replaceChildren(...visible.map(({ id }) => cardMap.get(id).card));
      loadMoreBtn.hidden = activeFonts.length <= visibleCount;
    }

    // Layout toggle: single class drives the CSS grid switch.
    grid.classList.toggle('is-list', layout === 'list');
  }

  loadMoreBtn.addEventListener('click', () => {
    setState({ visibleCount: getState().visibleCount + LOAD_MORE_STEP });
  });

  grid.addEventListener('click', (e) => {
    const cta = e.target.closest('.font-card-cta');
    if (!cta) return;
    e.preventDefault();
    const cardEl = cta.closest('.font-card');
    const entry = cardEl && cardMap.get(cardEl.dataset.fontId);
    if (!entry) return;
    const { previewText, fontSize } = getState();
    handleOpenInExpress({
      styleId: entry.fontDef.id,
      text: previewText || sampleText || '',
      fontSupported: entry.fontDef.fontSupported,
      fontSize,
      strings,
    });
  });

  // subscribe() fires immediately with the current snapshot — that first call
  // performs the initial render.
  const unsubscribe = subscribe(render);

  container.append(grid, loadMoreBtn);
  return { container, unsubscribe };
}
