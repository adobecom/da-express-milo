import { createTag, getIconElementDeprecated } from '../../../utils.js';
import { decorateAnalyticsAttributes } from '../../utils/utilities.js';
import { loadFieldLabel, loadMenu } from '../../spectrum/load-spectrum.js';
import { createExpressPicker } from '../../spectrum/components/express-picker.js';
import createExpressActionButton from '../../spectrum/components/express-action-button.js';
import { formatSavedCount } from './libraryUtils.js';

export const LIBRARY_SORT = {
  LAST_MODIFIED: 'last-modified',
  NAME: 'name',
};

const SCROLL_THRESHOLD = 8;
const NAV_STICKY_SELECTORS = ['header.global-navigation', '.feds-localnav'];

function getNavStickyOffset() {
  return NAV_STICKY_SELECTORS.reduce((max, selector) => {
    const el = document.querySelector(selector);
    if (!el) return max;
    const { bottom, height } = el.getBoundingClientRect();
    if (height <= 0 || bottom <= 0) return max;
    return Math.max(max, bottom);
  }, 0);
}

function logSpectrumFailure(message, error) {
  window.lana?.log(`${message}: ${error?.message}`, {
    tags: 'color-libraries,sort',
    severity: 'warning',
  });
}

/**
 * Builds the persistent library search header: saved-count, the reused search
 * bar, and the sort control. The sort control mirrors the Figma per breakpoint:
 *   - L/M: spectrum-two <sp-picker> ("filter picker")
 *   - S:   spectrum-two <sp-action-button> that opens a single-select <sp-menu>
 * Both controls share one selection state and emit `sort-change`. Which control
 * is visible is toggled in CSS, so no resize JS is needed here.
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
  let resizeHandler = null;
  let desktopPicker = null;
  let mobileButton = null;
  let mobileTriggerEl = null;

  // ── DOM ─────────────────────────────────────────────────────
  const header = createTag('div', { class: 'ax-lib-header' });
  const content = createTag('div', { class: 'ax-lib-header__content' });

  const titleSearch = createTag('div', { class: 'ax-lib-header__title-search' });
  const count = createTag('p', { class: 'ax-lib-header__count' });
  const search = createTag('div', { class: 'ax-lib-header__search' });
  if (searchBarEl) search.appendChild(searchBarEl);
  titleSearch.append(count, search);

  const sort = createTag('div', { class: 'ax-lib-header__sort' });

  // L/M: sp-picker (filled async). S: sp-action-button (filled async).
  const pickerSlot = createTag('div', { class: 'ax-lib-header__sort-picker' });
  const actionSlot = createTag('div', { class: 'ax-lib-header__sort-action' });

  // S dropdown: spectrum-two single-select sp-menu inside a positioned card.
  const popover = createTag('div', { class: 'ax-lib-header__sort-popover', hidden: '' });
  popover.appendChild(createTag('p', { class: 'ax-lib-header__sort-heading' }, strings.librariesSortHeading));
  const menu = createTag('sp-menu', {
    class: 'ax-lib-header__sort-menu',
    selects: 'single',
    size: 'm',
    role: 'listbox',
  });
  const optionItems = new Map();
  sortOptions.forEach((option) => {
    const item = createTag('sp-menu-item', { value: option.key });
    item.textContent = option.label;
    if (option.key === currentSort) {
      item.setAttribute('selected', '');
      item.setAttribute('aria-selected', 'true');
    }
    optionItems.set(option.key, item);
    menu.appendChild(item);
  });
  popover.appendChild(menu);

  sort.append(pickerSlot, actionSlot, popover);
  content.append(titleSearch, sort);
  header.appendChild(content);

  loadMenu().catch((error) => logSpectrumFailure('Failed loading libraries sort menu', error));

  // ── Behavior ────────────────────────────────────────────────
  function syncMenuSelection() {
    optionItems.forEach((item, key) => {
      if (key === currentSort) {
        item.setAttribute('selected', '');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.removeAttribute('selected');
        item.setAttribute('aria-selected', 'false');
      }
    });
  }

  function setMobileExpanded(expanded) {
    mobileTriggerEl?.setAttribute('aria-expanded', String(expanded));
  }

  function closePopover({ focusTrigger = false } = {}) {
    if (!popoverOpen) return;
    popoverOpen = false;
    popover.setAttribute('hidden', '');
    setMobileExpanded(false);
    if (detachDocumentHandlers) {
      detachDocumentHandlers();
      detachDocumentHandlers = null;
    }
    if (focusTrigger) mobileTriggerEl?.focus?.();
  }

  function openPopover() {
    if (popoverOpen) return;
    popoverOpen = true;
    popover.removeAttribute('hidden');
    setMobileExpanded(true);

    const onDocumentClick = (event) => {
      if (!sort.contains(event.target)) closePopover();
    };
    const onDocumentKeydown = (event) => {
      if (event.key === 'Escape') closePopover({ focusTrigger: true });
    };

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
    detachDocumentHandlers = () => {
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onDocumentKeydown);
    };

    // Move focus into the menu once visible. sp-menu handles arrow-key nav.
    window.requestAnimationFrame(() => {
      const target = menu.querySelector('sp-menu-item[selected]')
        || menu.querySelector('sp-menu-item');
      (target || menu)?.focus?.();
    });
  }

  function applySort(key, { silent = false, fromPicker = false } = {}) {
    if (!optionItems.has(key)) return;
    const changed = key !== currentSort;
    currentSort = key;
    syncMenuSelection();
    if (!fromPicker && desktopPicker?.setValue) {
      try {
        desktopPicker.setValue(key);
      } catch (error) {
        // Picker may still be settling; value is re-applied on waitForReady.
      }
    }
    if (!silent) closePopover({ focusTrigger: !fromPicker });
    if (changed && !silent) emit('sort-change', { key });
  }

  function toggleMobilePopover() {
    if (popoverOpen) closePopover({ focusTrigger: true });
    else openPopover();
  }

  function syncStickyTop() {
    const offset = getNavStickyOffset();
    header.style.setProperty('--ax-lib-header-sticky-top', `${offset}px`);
  }

  function onScroll() {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      syncStickyTop();
      header.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
    });
  }

  // ── Wire up sp-menu (S dropdown) ────────────────────────────
  const onMenuClick = (event) => {
    const item = event.target?.closest?.('sp-menu-item');
    if (item) applySort(item.getAttribute('value'));
  };
  const onMenuChange = () => {
    const value = menu.value
      || menu.querySelector('sp-menu-item[selected]')?.getAttribute('value');
    if (value) applySort(value);
  };
  menu.addEventListener('click', onMenuClick);
  menu.addEventListener('change', onMenuChange);

  // ── L/M sp-picker (async) ───────────────────────────────────
  (async () => {
    try {
      desktopPicker = await createExpressPicker({
        label: strings.librariesSortBy,
        value: currentSort,
        options: sortOptions.map((option) => ({ value: option.key, label: option.label })),
        forcePopover: true,
        id: 'libraries-sort',
        onChange: ({ value }) => applySort(value, { fromPicker: true }),
      });
      // The block is already inside one <sp-theme>, so unwrap the factory's
      // per-component <sp-theme> and mount the bare <sp-picker> directly — it
      // inherits theme context from the block-level ancestor. Falls back to the
      // wrapped element if the inner picker can't be found.
      const pickerEl = desktopPicker.element.querySelector('sp-picker');
      pickerSlot.appendChild(pickerEl || desktopPicker.element);
      if (pickerEl) {
        // The sp-field-label[for] below supplies the picker's accessible name,
        // so drop the factory's generic aria-label to avoid a competing label.
        pickerEl.removeAttribute('aria-label');
        decorateAnalyticsAttributes(pickerEl, { linkLabel: strings.librariesSortAria });
      }
      await desktopPicker.waitForReady?.();
      desktopPicker.setValue(currentSort);
      // Persistent visible label via Spectrum's sp-field-label[for] pattern. The
      // label sits in the sort-picker slot as a flex sibling of the picker and
      // resolves it by id via the shared document root.
      if (pickerEl && !pickerSlot.querySelector('sp-field-label')) {
        await loadFieldLabel();
        pickerSlot.insertBefore(
          createTag('sp-field-label', { for: pickerEl.id, size: 'm' }, strings.librariesSortBy),
          pickerEl,
        );
      }
    } catch (error) {
      logSpectrumFailure('Failed creating libraries sort picker', error);
    }
  })();

  // ── S sp-action-button (async) ──────────────────────────────
  (async () => {
    try {
      const icon = getIconElementDeprecated('S2_Icon_Sort_20_N');
      mobileButton = await createExpressActionButton({
        label: strings.librariesSortLabel,
        size: 'm',
        icon,
        onClick: toggleMobilePopover,
      });
      // Unwrap the factory's per-component <sp-theme> (the block already provides
      // one) and mount the bare <sp-action-button> directly.
      mobileTriggerEl = mobileButton.element.querySelector('sp-action-button');
      actionSlot.appendChild(mobileTriggerEl || mobileButton.element);
      if (mobileTriggerEl) {
        mobileTriggerEl.setAttribute('aria-haspopup', 'listbox');
        mobileTriggerEl.setAttribute('aria-expanded', 'false');
        mobileTriggerEl.setAttribute('aria-label', strings.librariesSortAria);
        decorateAnalyticsAttributes(mobileTriggerEl, { linkLabel: strings.librariesSortAria });
      }
    } catch (error) {
      logSpectrumFailure('Failed creating libraries sort action button', error);
    }
  })();

  // ── Scroll (sticky compact on S) ────────────────────────────
  resizeHandler = () => syncStickyTop();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resizeHandler, { passive: true });
  syncStickyTop();
  onScroll();

  return {
    element: header,
    setCount(total) {
      count.textContent = formatSavedCount(total, strings);
    },
    setSort(key) {
      if (key && key !== currentSort && optionItems.has(key)) {
        applySort(key, { silent: true });
      }
    },
    getSort() {
      return currentSort;
    },
    destroy() {
      closePopover();
      menu.removeEventListener('click', onMenuClick);
      menu.removeEventListener('change', onMenuChange);
      window.removeEventListener('scroll', onScroll);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      desktopPicker?.destroy?.();
      mobileButton?.destroy?.();
      header.remove();
    },
  };
}
