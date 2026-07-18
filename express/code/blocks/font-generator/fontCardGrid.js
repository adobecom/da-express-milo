// @import { FontDef, State } from './types.js'
import { getState, setState, subscribe } from './state.js';
import { LOAD_MORE_STEP } from './types.js';
import { createFontCard, updateFontCard } from './fontCard.js';

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

// How many leading cards share the first card's offsetTop — i.e. the column
// count of row 1. Reading actual layout (rather than duplicating the CSS
// breakpoints/is-list rules here) keeps this correct for grid or list view
// at any viewport width.
function columnsPerRow(cards) {
  if (!cards.length) return 1;
  const firstTop = cards[0].offsetTop;
  let count = 0;
  for (const card of cards) {
    if (card.offsetTop !== firstTop) break;
    count += 1;
  }
  return count || 1;
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

  // Single tab stop into the grid — visibleCards/currentIndex track which
  // card that is. Kept in sync by the focusin listener below regardless of
  // *how* focus reaches a different card (arrow keys, Tab, or a click).
  let visibleCards = [];
  let currentIndex = 0;

  // Arrow keys only act when focus is directly on a cell wrapper — while
  // "entered" (focus on a child button/link), fontCard.js owns Tab/Escape
  // and this handler no-ops since event.target won't be in visibleCards.
  grid.addEventListener('keydown', (event) => {
    const idx = visibleCards.indexOf(event.target);
    if (idx === -1) return;
    const columns = columnsPerRow(visibleCards);
    let next;
    switch (event.key) {
      case 'ArrowRight': next = Math.min(idx + 1, visibleCards.length - 1); break;
      case 'ArrowLeft': next = Math.max(idx - 1, 0); break;
      case 'ArrowDown': next = Math.min(idx + columns, visibleCards.length - 1); break;
      case 'ArrowUp': next = Math.max(idx - columns, 0); break;
      case 'Home': next = 0; break;
      case 'End': next = visibleCards.length - 1; break;
      default: return;
    }
    event.preventDefault();
    if (next === idx) return;
    // Set tabindex synchronously, before focusing — don't rely on the
    // focusin listener below to do this bookkeeping reactively (focusin can
    // lag behind a same-task .focus() call in some conditions, e.g. a
    // background/unfocused frame).
    visibleCards[idx].tabIndex = -1;
    visibleCards[next].tabIndex = 0;
    currentIndex = next;
    visibleCards[next].focus();
  });

  // Backstop for focus reaching a different card by a path this module
  // doesn't otherwise see (e.g. a direct click on a child button/link) —
  // demotes the previous roving cell so exactly one card stays a tab stop.
  // Only demotes — the new card's own tabindex (0 if its wrapper has focus,
  // -1 with its children at 0 if "entered") is fontCard.js's call, made via
  // its own focusin listener, which runs first since it's the closer ancestor.
  grid.addEventListener('focusin', (event) => {
    const card = event.target.closest('.font-card');
    if (!card) return;
    const idx = visibleCards.indexOf(card);
    if (idx === -1 || idx === currentIndex) return;
    const prevCard = visibleCards[currentIndex];
    if (prevCard) prevCard.tabIndex = -1;
    currentIndex = idx;
  });

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
      visibleCards = visible.map(({ id }) => cardMap.get(id).card);
      grid.replaceChildren(...visibleCards);
      loadMoreBtn.hidden = activeFonts.length <= visibleCount;

      // Re-clamp the roving tab stop to the new list (it may have shrunk,
      // or the previously-focused card may have been filtered out) and
      // reset any card left "entered" from before the filter/page change.
      currentIndex = Math.min(Math.max(currentIndex, 0), visibleCards.length - 1);
      visibleCards.forEach((card, i) => {
        card.tabIndex = i === currentIndex ? 0 : -1;
        card.querySelectorAll('.font-card-copy-btn, .font-card-cta').forEach((el) => {
          el.tabIndex = -1;
        });
      });
    }

    // Layout toggle: single class drives the CSS grid switch.
    grid.classList.toggle('is-list', layout === 'list');
  }

  loadMoreBtn.addEventListener('click', () => {
    setState({ visibleCount: getState().visibleCount + LOAD_MORE_STEP });
  });

  // subscribe() fires immediately with the current snapshot — that first call
  // performs the initial render.
  const unsubscribe = subscribe(render);

  container.append(grid, loadMoreBtn);
  return { container, unsubscribe };
}
