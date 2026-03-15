/**
 * Filters Component (Shared) - Spectrum Web Components V2
 *
 * Used By: Strips (Palettes), Gradients
 * Not Used By: Extract (no filters needed)
 *
 * Architecture Decision:
 * - Shared component used by multiple renderers
 * - Uses Express Picker wrapper (spectrum/components/express-picker.js)
 * - Vanilla JS wrapper (no Lit dependency)
 * - Each renderer includes this in their layout
 * - Emits filter-change events back to renderer
 *
 * Filters:
 * - Type: All, Linear, Radial, Conic (for gradients)
 * - Category: All, Nature, Abstract, Vibrant, etc.
 * - Time: All, Recent, Popular, Trending
 */

import { createTag } from '../../utils.js';
import { createExpressPicker } from '../spectrum/components/express-picker.js';
import { loadIconsRail } from '../spectrum/load-spectrum.js';
import { createThemeWrapper } from '../spectrum/utils/theme.js';

export const FILTER_IDS = {
  CONTENT_TYPE: 'contentType',
  SORT: 'sort',
  TIME_RANGE: 'timeRange',
};

/**
 * Create filters component
 * @param {Object} options - Configuration
 * @param {Array} options.filters - Array of filter configs
 * @param {Function} options.onFilterChange - Filter change callback
 * @param {string} options.variant - Variant type (strips, gradients)
 * @returns {Object} Filters component with { element, getValues, reset }
 */
export async function createFiltersComponent(options = {}) {
  const {
    filters = [],
    onFilterChange,
    variant = 'strips',
  } = options;

  const filterValues = {};
  const pickersById = new Map();
  const pickers = [];
  const cleanupFns = [];
  let sortMenuController = null;
  let timeMenuController = null;
  let contentTypeMenuController = null;

  /**
   * Get default filters based on variant
   */
  function getDefaultFilters() {
    const defaultContentType = variant === 'gradients' ? 'color-gradients' : 'color-palettes';
    return [
      {
        id: FILTER_IDS.CONTENT_TYPE,
        label: variant === 'gradients' ? 'Color gradients' : 'Color palettes',
        defaultValue: defaultContentType,
        options: [
          { label: 'Color palettes', value: 'color-palettes' },
          { label: 'Color gradients', value: 'color-gradients' },
        ],
      },
      {
        id: FILTER_IDS.SORT,
        label: 'All',
        defaultValue: 'all',
        options: [
          { label: 'Most popular', value: 'most-popular' },
          { label: 'All', value: 'all' },
          { label: 'Most used', value: 'most-used' },
          { label: 'Random', value: 'random' },
        ],
      },
      {
        id: FILTER_IDS.TIME_RANGE,
        label: 'All time',
        defaultValue: 'all-time',
        options: [
          { label: 'All time', value: 'all-time' },
          { label: 'This month', value: 'this-month' },
          { label: 'This week', value: 'this-week' },
        ],
      },
    ];
  }

  function emitFilterChange() {
    onFilterChange?.({ ...filterValues });
  }

  function setFilterValue(id, value, shouldEmit = true) {
    filterValues[id] = value;
    if (shouldEmit) emitFilterChange();
  }

  function findFilter(id, filterList) {
    return filterList.find((filter) => filter.id === id);
  }

  function getDefaultValue(filter) {
    if (!filter) return 'all';
    if (filter.defaultValue) return filter.defaultValue;
    return filter.options?.[0]?.value ?? 'all';
  }

  function syncPickerValue(id, value) {
    const picker = pickersById.get(id);
    if (picker && typeof picker.setValue === 'function') {
      picker.setValue(value);
    }
  }

  function handleDesktopPickerChange(id, value) {
    setFilterValue(id, value);

    if (id === FILTER_IDS.SORT) {
      sortMenuController?.setValue(value);
    }
    if (id === FILTER_IDS.TIME_RANGE) {
      timeMenuController?.setValue(value);
    }
    if (id === FILTER_IDS.CONTENT_TYPE) {
      contentTypeMenuController?.setValue(value);
    }
  }

  function createSpectrumMenu(optionsList, selectedValue) {
    const menu = document.createElement('sp-menu');
    menu.className = 'filters-mobile__menu';
    menu.setAttribute('selects', 'single');
    menu.setAttribute('size', 'm');
    menu.setAttribute('role', 'listbox');

    function setValue(value) {
      const items = Array.from(menu.querySelectorAll('sp-menu-item'));
      items.forEach((item) => {
        if (item.getAttribute('value') === value) {
          item.setAttribute('selected', '');
          item.setAttribute('aria-selected', 'true');
        } else {
          item.removeAttribute('selected');
          item.setAttribute('aria-selected', 'false');
        }
      });
    }

    function getValue() {
      const selected = menu.querySelector('sp-menu-item[selected]');
      return selected?.getAttribute('value') || '';
    }

    optionsList.forEach((option) => {
      const item = document.createElement('sp-menu-item');
      item.setAttribute('value', option.value);
      item.textContent = option.label;
      menu.appendChild(item);
    });

    setValue(selectedValue);

    const onMenuClick = (event) => {
      const item = event.target?.closest?.('sp-menu-item');
      if (!item) return;
      const value = item.getAttribute('value');
      if (value) setValue(value);
    };

    menu.addEventListener('click', onMenuClick);
    cleanupFns.push(() => menu.removeEventListener('click', onMenuClick));

    return {
      element: menu,
      getValue,
      setValue,
    };
  }

  function focusSelectedMenuItem(controller) {
    const menu = controller?.element;
    if (!menu) return;

    const selectedItem = menu.querySelector('sp-menu-item[selected]');
    const fallbackItem = menu.querySelector('sp-menu-item');
    const target = selectedItem || fallbackItem;
    if (!target) return;

    // Defer until panel is visible so focus lands reliably.
    requestAnimationFrame(() => {
      target.focus?.();
    });
  }

  function createPanelTitle(title) {
    const heading = createTag('div', { class: 'filters-mobile__panel-title' });
    heading.textContent = title;
    return heading;
  }

  function createApplyButton() {
    const applyBtn = createTag('button', { type: 'button', class: 'filters-mobile__apply' });
    applyBtn.textContent = 'Apply';
    return applyBtn;
  }

  function createPanelHandle() {
    return createTag('div', { class: 'filters-mobile__handle', 'aria-hidden': 'true' });
  }

  function createMobileIconButton(buttonClass, iconTag, ariaLabel) {
    const button = createTag('button', {
      type: 'button',
      class: `filters-mobile__btn ${buttonClass}`,
      'aria-label': ariaLabel,
      'aria-expanded': 'false',
    });
    const icon = document.createElement(iconTag);
    icon.setAttribute('size', 'm');
    icon.setAttribute('aria-hidden', 'true');
    const text = createTag('span', { class: 'filters-mobile__btn-label' });
    text.textContent = ariaLabel;
    button.append(icon, text);
    return button;
  }

  const container = createTag('div', { class: 'filters-container' });
  const desktopContainer = createTag('div', { class: 'filters-desktop' });
  const mobileContainer = createTag('div', { class: 'filters-mobile' });
  const mobileThemeWrapper = createThemeWrapper();
  const mobileCurtain = createTag('div', {
    class: 'filters-mobile__curtain',
    hidden: '',
    'aria-hidden': 'true',
  });
  mobileThemeWrapper.classList.add('filters-mobile-theme');

  const filtersToUse = filters.length > 0 ? filters : getDefaultFilters();
  filtersToUse.forEach((filter) => {
    filterValues[filter.id] = getDefaultValue(filter);
  });

  // Desktop: dropdowns
  try {
    await Promise.all(filtersToUse.map(async (filter) => {
      try {
        const filterId = filter.id;
        const picker = await createExpressPicker({
          label: filter.label,
          value: filterValues[filterId],
          options: filter.options,
          id: filterId,
          onChange: ({ value }) => handleDesktopPickerChange(filterId, value),
        });

        const dropdown = createTag('div', { class: 'filter-dropdown' });
        dropdown.appendChild(picker.element);
        desktopContainer.appendChild(dropdown);
        pickers.push(picker);
        pickersById.set(filterId, picker);
      } catch (pickerError) {
        window.lana?.log(`Failed to create picker for filter ${filter.id}: ${pickerError.message}`, {
          tags: 'color-explorer,filters',
          severity: 'error',
        });
      }
    }));
  } catch (error) {
    window.lana?.log(`Failed to create filters component: ${error.message}`, {
      tags: 'color-explorer,filters',
      severity: 'error',
    });
  }

  // Mobile/Tablet: icon-based controls
  try {
    await loadIconsRail();
  } catch (error) {
    // Non-fatal: icon custom elements can upgrade later if script arrives after render.
    if (window.lana) {
      window.lana.log(`Failed loading filter icons: ${error?.message}`, {
        tags: 'color-explorer,filters',
        severity: 'warning',
      });
    }
  }

  const contentTypeFilter = findFilter(FILTER_IDS.CONTENT_TYPE, filtersToUse);
  const sortFilter = findFilter(FILTER_IDS.SORT, filtersToUse);
  const timeFilter = findFilter(FILTER_IDS.TIME_RANGE, filtersToUse);

  const sortButton = createMobileIconButton('filters-mobile__btn--sort', 'sp-icon-switch-vertical', 'Sort');
  const filterButton = createMobileIconButton('filters-mobile__btn--filter', 'sp-icon-filter', 'Filter');

  const sortPanel = createTag('div', { class: 'filters-mobile__panel filters-mobile__panel--sort', hidden: '' });
  const filterPanel = createTag('div', { class: 'filters-mobile__panel filters-mobile__panel--filter', hidden: '' });

  sortMenuController = createSpectrumMenu(
    sortFilter?.options ?? [],
    filterValues[FILTER_IDS.SORT],
  );

  timeMenuController = createSpectrumMenu(
    timeFilter?.options ?? [],
    filterValues[FILTER_IDS.TIME_RANGE],
  );

  contentTypeMenuController = createSpectrumMenu(
    contentTypeFilter?.options ?? [],
    filterValues[FILTER_IDS.CONTENT_TYPE],
  );

  const sortApplyButton = createApplyButton();
  const filterApplyButton = createApplyButton();

  sortPanel.append(
    createPanelHandle(),
    createPanelTitle('Sort by'),
    sortMenuController.element,
    createTag('div', { class: 'filters-mobile__divider', 'aria-hidden': 'true' }),
    timeMenuController.element,
    sortApplyButton,
  );

  filterPanel.append(
    createPanelHandle(),
    createPanelTitle('Filter by'),
    contentTypeMenuController.element,
    filterApplyButton,
  );

  mobileContainer.append(filterButton, sortButton, sortPanel, filterPanel);

  function setPanelState(panel, button, isOpen) {
    if (isOpen) {
      panel.removeAttribute('hidden');
      button.setAttribute('aria-expanded', 'true');
    } else {
      panel.setAttribute('hidden', '');
      button.setAttribute('aria-expanded', 'false');
    }
  }

  function getOpenPanelState() {
    if (!sortPanel.hasAttribute('hidden')) return { panel: sortPanel, button: sortButton };
    if (!filterPanel.hasAttribute('hidden')) return { panel: filterPanel, button: filterButton };
    return null;
  }

  function getPanelFocusableElements(panel) {
    if (!panel) return [];
    return Array.from(panel.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true');
  }

  function setCurtainState(isVisible) {
    if (isVisible) {
      mobileCurtain.removeAttribute('hidden');
      document.body.classList.add('color-explore-filters-open');
    } else {
      mobileCurtain.setAttribute('hidden', '');
      document.body.classList.remove('color-explore-filters-open');
    }
  }

  function closePanels() {
    setPanelState(sortPanel, sortButton, false);
    setPanelState(filterPanel, filterButton, false);
    setCurtainState(false);
  }

  function togglePanel(targetPanel, targetButton, onOpen) {
    const isOpen = !targetPanel.hasAttribute('hidden');
    closePanels();
    const shouldOpen = !isOpen;
    setPanelState(targetPanel, targetButton, shouldOpen);
    if (shouldOpen) {
      setCurtainState(true);
      onOpen?.();
    }
  }

  const onSortButtonClick = () => {
    togglePanel(sortPanel, sortButton, () => focusSelectedMenuItem(sortMenuController));
  };

  const onFilterButtonClick = () => {
    togglePanel(filterPanel, filterButton, () => focusSelectedMenuItem(contentTypeMenuController));
  };

  const onSortApply = () => {
    const selectedSort = sortMenuController?.getValue?.() || filterValues[FILTER_IDS.SORT];
    const selectedTime = timeMenuController?.getValue?.() || filterValues[FILTER_IDS.TIME_RANGE];
    setFilterValue(FILTER_IDS.SORT, selectedSort, false);
    setFilterValue(FILTER_IDS.TIME_RANGE, selectedTime, false);
    syncPickerValue(FILTER_IDS.SORT, selectedSort);
    syncPickerValue(FILTER_IDS.TIME_RANGE, selectedTime);
    emitFilterChange();
    closePanels();
  };

  const onFilterApply = () => {
    const selectedType = contentTypeMenuController?.getValue?.()
      || filterValues[FILTER_IDS.CONTENT_TYPE];
    setFilterValue(FILTER_IDS.CONTENT_TYPE, selectedType, false);
    syncPickerValue(FILTER_IDS.CONTENT_TYPE, selectedType);
    emitFilterChange();
    closePanels();
  };

  const onDocumentPointerDown = (event) => {
    if (!container.contains(event.target)) {
      closePanels();
    }
  };

  const onCurtainClick = () => {
    const openState = getOpenPanelState();
    closePanels();
    openState?.button?.focus?.();
  };

  const onDocumentKeyDown = (event) => {
    const openState = getOpenPanelState();
    if (!openState) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closePanels();
      openState.button.focus?.();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = getPanelFocusableElements(openState.panel);
    if (!focusableElements.length) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const { activeElement } = document;
    const focusInsidePanel = openState.panel.contains(activeElement);

    if (event.shiftKey) {
      if (!focusInsidePanel || activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus?.();
      }
      return;
    }

    if (!focusInsidePanel || activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus?.();
    }
  };

  sortButton.addEventListener('click', onSortButtonClick);
  filterButton.addEventListener('click', onFilterButtonClick);
  sortApplyButton.addEventListener('click', onSortApply);
  filterApplyButton.addEventListener('click', onFilterApply);
  document.addEventListener('pointerdown', onDocumentPointerDown);
  document.addEventListener('keydown', onDocumentKeyDown);
  mobileCurtain.addEventListener('click', onCurtainClick);

  cleanupFns.push(() => sortButton.removeEventListener('click', onSortButtonClick));
  cleanupFns.push(() => filterButton.removeEventListener('click', onFilterButtonClick));
  cleanupFns.push(() => sortApplyButton.removeEventListener('click', onSortApply));
  cleanupFns.push(() => filterApplyButton.removeEventListener('click', onFilterApply));
  cleanupFns.push(() => document.removeEventListener('pointerdown', onDocumentPointerDown));
  cleanupFns.push(() => document.removeEventListener('keydown', onDocumentKeyDown));
  cleanupFns.push(() => mobileCurtain.removeEventListener('click', onCurtainClick));
  cleanupFns.push(() => document.body.classList.remove('color-explore-filters-open'));

  mobileThemeWrapper.append(mobileCurtain, mobileContainer);
  container.append(desktopContainer, mobileThemeWrapper);

  return {
    element: container,
    getValues: () => ({ ...filterValues }),
    reset: () => {
      Object.keys(filterValues).forEach((key) => {
        delete filterValues[key];
      });
      cleanupFns.forEach((fn) => fn());
      pickers.forEach((p) => p.destroy());
      pickersById.clear();
    },
  };
}
