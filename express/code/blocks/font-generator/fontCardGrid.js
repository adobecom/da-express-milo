import { createTag } from '../../scripts/utils.js';
import { subscribe, setState, getState } from './state.js';
import { createFontCard } from './fontCard.js';

const LOAD_MORE_STEP = 12;

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

  let cardInstances = new Map();

  let lastFontIds = '';
  let lastVisible = 0;

  subscribe((state) => {
    const { activeFonts, visibleCount, previewText, fontSize } = state;

    const visible = activeFonts.slice(0, visibleCount);
    const fontIds = visible.map((f) => f.id).join(',');
    const listChanged = fontIds !== lastFontIds || visibleCount !== lastVisible;

    if (listChanged) {
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
      cardInstances.forEach((instance) => instance.update({ previewText, fontSize }));
    }

    loadMoreWrapper.hidden = visibleCount >= activeFonts.length;
  });
}
