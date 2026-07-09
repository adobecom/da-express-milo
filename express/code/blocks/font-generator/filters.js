import { createTag } from '../../scripts/utils.js';
import { setState, getState, subscribe } from './state.js';

export function init(container, filterLabels = []) {
  if (!filterLabels.length) return;

  const bar = createTag('div', {
    class: 'fg-filters',
    role: 'group',
    'aria-label': 'Font category filters',
  });

  const buttons = filterLabels.map((label) => {
    const category = label.trim().toLowerCase();
    const isAll = category === 'all';

    const btn = createTag('button', {
      class: 'fg-filter-btn',
      type: 'button',
      'data-category': isAll ? '' : category,
      'aria-pressed': isAll ? 'true' : 'false',
    });
    btn.textContent = label.trim();
    return btn;
  });

  function syncButtons(activeFilters) {
    buttons.forEach((btn) => {
      const cat = btn.dataset.category;
      const active = cat === '' ? !activeFilters.length : activeFilters.includes(cat);
      btn.setAttribute('aria-pressed', String(active));
      btn.classList.toggle('fg-filter-btn--active', active);
    });
  }

  syncButtons(getState().activeFilters);

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.fg-filter-btn');
    if (!btn) return;
    const { category } = btn.dataset;
    if (category === '') {
      setState({ activeFilters: [] });
      return;
    }
    const current = getState().activeFilters;
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    setState({ activeFilters: next });
  });

  subscribe((snap) => syncButtons(snap.activeFilters));

  container.append(bar);
}
