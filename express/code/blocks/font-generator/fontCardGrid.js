import { createTag } from '../../scripts/utils.js';
import { subscribe, setState, getState } from './state.js';
import { createFontCard } from './fontCard.js';

const LOAD_MORE_STEP = 12;

/**
 * Initialises the font card grid inside `el`.
 * Subscribes to the state store and keeps DOM in sync with minimal churn:
 * - Cards are created once per fontDef and reused across text/size updates.
 * - The card list is rebuilt only when `activeFonts` or `visibleCount` changes.
 *
 * @param {HTMLElement} el
 * @param {{ prodBaseUrl?: string, labels?: object }} [options]
 */
export function init(el, { prodBaseUrl, labels } = {}) {
  const grid = createTag('div', { class: 'fg-grid' });
  const loadMoreWrapper = createTag('div', { class: 'fg-load-more-wrapper' });
  const loadMoreBtn = createTag('button', {
    class: 'fg-load-more-btn',
    type: 'button',
  });
  loadMoreBtn.textContent = labels?.loadMore ?? 'Load more';
  loadMoreBtn.addEventListener('click', () => {
    setState({ visibleCount: getState().visibleCount + LOAD_MORE_STEP });
  });
  loadMoreWrapper.append(loadMoreBtn);
  el.append(grid, loadMoreWrapper);

  // card instances keyed by fontDef.id — reused across text/size updates
  let cardInstances = new Map();
  // track the last activeFonts + visibleCount to detect list changes
  let lastFontIds = '';
  let lastVisible = 0;

  subscribe((state) => {
    const { activeFonts, visibleCount, previewText, fontSize } = state;

    const visible = activeFonts.slice(0, visibleCount);
    const fontIds = visible.map((f) => f.id).join(',');
    const listChanged = fontIds !== lastFontIds || visibleCount !== lastVisible;

    if (listChanged) {
      // Rebuild the visible card set. Reuse existing instances where possible.
      const next = new Map();
      const fragment = document.createDocumentFragment();

      visible.forEach((fontDef) => {
        let instance = cardInstances.get(fontDef.id);
        if (!instance) {
          instance = createFontCard({ previewText, fontSize, fontDef, prodBaseUrl, labels });
        } else {
          instance.update({ previewText, fontSize });
        }
        next.set(fontDef.id, instance);
        fragment.append(instance.element);
      });

      grid.replaceChildren(fragment);
      cardInstances = next;
      lastFontIds = fontIds;
      lastVisible = visibleCount;
    } else {
      // Only text or size changed — update cards in place, no DOM restructure needed
      cardInstances.forEach((instance) => instance.update({ previewText, fontSize }));
    }

    // Show/hide load more
    loadMoreWrapper.hidden = visibleCount >= activeFonts.length;
  });
}
