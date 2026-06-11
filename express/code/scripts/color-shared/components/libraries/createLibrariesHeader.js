import { createTag, getIconElementDeprecated } from '../../../utils.js';
import { decorateAnalyticsAttributes } from '../../utils/utilities.js';
import { formatSavedCount } from './libraryUtils.js';

export const LIBRARY_SORT = {
  LAST_MODIFIED: 'last-modified',
  NAME: 'name',
};

const SCROLL_THRESHOLD = 8;

/**
 * Builds the persistent library search header: saved-count, the reused search
 * bar, and the sort control (Picker on L/M, icon button on S). Breakpoint-specific
 * content is toggled in CSS, so no resize JS is needed here.
 *
 * @param {Object} [options]
 * @param {Object} [options.strings] - resolved placeholders
 * @param {HTMLElement} [options.searchBarEl] - element from the search-bar component
 * @param {Function} [options.emit]
 * @param {string} [options.initialSort]
 */
export function createLibrariesHeader(options = {}) {
  const {
    strings = {},
    searchBarEl = null,
    emit = () => {},
    initialSort = LIBRARY_SORT.LAST_MODIFIED,
  } = options;

  const sortOptions = [
    { key: LIBRARY_SORT.LAST_MODIFIED, label: strings.librariesSortLastModified },
    { key: LIBRARY_SORT.NAME, label: strings.librariesSortName },
  ];
  const optionKeys = sortOptions.map((option) => option.key);

  let currentSort = optionKeys.includes(initialSort) ? initialSort : LIBRARY_SORT.LAST_MODIFIED;
  let popoverOpen = false;
  let detachDocumentHandlers = null;
  let scrollFrame = 0;

  // ── DOM ─────────────────────────────────────────────────────
  const header = createTag('div', { class: 'ax-lib-header' });
  const content = createTag('div', { class: 'ax-lib-header__content' });

  const titleSearch = createTag('div', { class: 'ax-lib-header__title-search' });
  const count = createTag('p', { class: 'ax-lib-header__count' });
  const search = createTag('div', { class: 'ax-lib-header__search' });
  if (searchBarEl) search.appendChild(searchBarEl);
  titleSearch.append(count, search);

  const sort = createTag('div', { class: 'ax-lib-header__sort' });
  const sortLabel = createTag('span', { class: 'ax-lib-header__sort-label' }, strings.librariesSortBy);

  const trigger = createTag('button', {
    type: 'button',
    class: 'ax-lib-header__sort-trigger',
    'aria-haspopup': 'listbox',
    'aria-expanded': 'false',
    'aria-label': strings.librariesSortAria,
  });
  const triggerIcon = createTag('span', { class: 'ax-lib-header__sort-icon', 'aria-hidden': 'true' });
  triggerIcon.appendChild(getIconElementDeprecated('sort'));
  const triggerValue = createTag('span', { class: 'ax-lib-header__sort-value' });
  const triggerText = createTag('span', { class: 'ax-lib-header__sort-text' }, strings.librariesSortLabel);
  const triggerChevron = createTag('span', { class: 'ax-lib-header__sort-chevron', 'aria-hidden': 'true' });
  triggerChevron.appendChild(getIconElementDeprecated('drop-down-arrow'));
  trigger.append(triggerIcon, triggerValue, triggerText, triggerChevron);
  decorateAnalyticsAttributes(trigger, { linkLabel: strings.librariesSortAria });

  const popover = createTag('div', {
    class: 'ax-lib-header__sort-popover',
    role: 'listbox',
    hidden: '',
  });
  popover.appendChild(createTag('p', { class: 'ax-lib-header__sort-heading' }, strings.librariesSortHeading));

  const optionEls = new Map();
  sortOptions.forEach((option) => {
    const optionEl = createTag('button', {
      type: 'button',
      class: 'ax-lib-header__sort-option',
      role: 'option',
      'data-sort': option.key,
      'aria-selected': String(option.key === currentSort),
    });
    const check = createTag('span', { class: 'ax-lib-header__sort-check', 'aria-hidden': 'true' });
    optionEl.append(check, createTag('span', { class: 'ax-lib-header__sort-option-label' }, option.label));
    optionEls.set(option.key, optionEl);
    popover.appendChild(optionEl);
  });

  sort.append(sortLabel, trigger, popover);
  content.append(titleSearch, sort);
  header.appendChild(content);

  // ── Behavior (defined before being wired up below) ──────────
  function syncTriggerValue() {
    const selected = sortOptions.find((option) => option.key === currentSort);
    triggerValue.textContent = selected ? selected.label : '';
  }

  function focusOption(index) {
    const clamped = Math.max(0, Math.min(index, optionKeys.length - 1));
    optionEls.get(optionKeys[clamped])?.focus();
  }

  function closePopover({ focusTrigger = false } = {}) {
    if (!popoverOpen) return;
    popoverOpen = false;
    popover.setAttribute('hidden', '');
    trigger.setAttribute('aria-expanded', 'false');
    if (detachDocumentHandlers) {
      detachDocumentHandlers();
      detachDocumentHandlers = null;
    }
    if (focusTrigger) trigger.focus();
  }

  function openPopover() {
    if (popoverOpen) return;
    popoverOpen = true;
    popover.removeAttribute('hidden');
    trigger.setAttribute('aria-expanded', 'true');

    const onDocumentClick = (event) => {
      if (!sort.contains(event.target)) closePopover();
    };
    const onDocumentKeydown = (event) => {
      if (event.key === 'Escape') {
        closePopover({ focusTrigger: true });
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const activeIndex = optionKeys.findIndex(
        (key) => optionEls.get(key) === document.activeElement,
      );
      if (activeIndex === -1) focusOption(0);
      else focusOption(event.key === 'ArrowDown' ? activeIndex + 1 : activeIndex - 1);
    };

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
    detachDocumentHandlers = () => {
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onDocumentKeydown);
    };

    optionEls.get(currentSort)?.focus();
  }

  function selectSort(key, { silent = false } = {}) {
    const changed = key !== currentSort;
    currentSort = key;
    optionEls.forEach((el, optionKey) => {
      el.setAttribute('aria-selected', String(optionKey === key));
    });
    syncTriggerValue();
    closePopover({ focusTrigger: !silent });
    if (changed && !silent) emit('sort-change', { key });
  }

  function onScroll() {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      header.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
    });
  }

  // ── Wire up ─────────────────────────────────────────────────
  syncTriggerValue();

  optionEls.forEach((optionEl, key) => {
    optionEl.addEventListener('click', () => selectSort(key));
  });

  trigger.addEventListener('click', () => {
    if (popoverOpen) closePopover({ focusTrigger: true });
    else openPopover();
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  return {
    element: header,
    setCount(total) {
      count.textContent = formatSavedCount(total, strings);
    },
    setSort(key) {
      if (key && key !== currentSort && optionEls.has(key)) {
        selectSort(key, { silent: true });
      }
    },
    getSort() {
      return currentSort;
    },
    destroy() {
      closePopover();
      window.removeEventListener('scroll', onScroll);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      header.remove();
    },
  };
}
