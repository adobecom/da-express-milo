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
import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';
import { loadIconsRail, loadPicker } from '../spectrum/load-spectrum.js';
import { createThemeWrapper } from '../spectrum/utils/theme.js';

export const FILTER_IDS = {
  CONTENT_TYPE: 'contentType',
  SORT: 'sort',
  TIME_RANGE: 'timeRange',
};
const ANALYTICS_TEXT_LIMIT = 20;
const PICKER_MIN_WIDTH_FALLBACK_PX = 144;
const PICKER_MAX_WIDTH_FALLBACK_PX = 180;
const PICKER_HORIZONTAL_CHROME_PX = 40;

/**
 * Create filters component
 * @param {Object} options - Configuration
 * @param {Array} options.filters - Array of filter configs
 * @param {Function} options.onFilterChange - Filter change callback
 * @param {string} options.variant - Variant type (strips, gradients)
 * @returns {Object} Filters component with { element, getValues, waitForReady, reset }
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
  const mobileTooltipControllers = [];
  let sortMenuController = null;
  let timeMenuController = null;
  let contentTypeMenuController = null;
  let desktopInitPromise = null;
  let interactionRoot = null;
  let pickerMeasureCanvas = null;

  function waitForAnimationFrame() {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => resolve());
        return;
      }
      setTimeout(resolve, 0);
    });
  }

  async function waitUntilConnected(rootEl, maxFrames = 120) {
    let frameCount = 0;
    while (!rootEl?.isConnected && frameCount < maxFrames) {
      // Wait until caller inserts filters into live DOM.
      // Components like sp-picker can require connected lifecycle to settle.
      // eslint-disable-next-line no-await-in-loop
      await waitForAnimationFrame();
      frameCount += 1;
    }
  }

  // Preload picker/menu definitions before creating any sp-menu / sp-menu-item
  // (mobile filter panels) to avoid known menu.js upgrade races.
  try {
    await loadPicker();
  } catch (error) {
    window.lana?.log(`Failed preloading picker/menu components: ${error?.message}`, {
      tags: 'color-explorer,filters',
      severity: 'warning',
    });
  }

  /**
   * Get default filters based on variant
   */
  function getDefaultFilters() {
    const isGradients = variant === 'gradients';
    const defaultContentType = isGradients ? 'color-gradients' : 'color-palettes';
    const contentTypeOptions = isGradients
      ? [
        { label: 'Color gradients', value: 'color-gradients' },
        { label: 'Color palettes', value: 'color-palettes' },
      ]
      : [
        { label: 'Color palettes', value: 'color-palettes' },
        { label: 'Color gradients', value: 'color-gradients' },
      ];
    return [
      {
        id: FILTER_IDS.CONTENT_TYPE,
        label: isGradients ? 'Color gradients' : 'Color palettes',
        defaultValue: defaultContentType,
        options: contentTypeOptions,
      },
      {
        id: FILTER_IDS.SORT,
        label: 'Most popular',
        defaultValue: 'most-popular',
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

  function sanitizeAnalyticsText(value) {
    const raw = String(value ?? '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim();
    return raw.substring(0, ANALYTICS_TEXT_LIMIT);
  }

  function getAnalyticsHeaderText() {
    const headerText = interactionRoot
      ?.closest('.explore-header, .gradients-header')
      ?.querySelector('.results-count, .gradients-title, h1, h2, h3')
      ?.textContent
      || 'Color explore';
    return sanitizeAnalyticsText(headerText);
  }

  function applyAnalyticsAttributes(element, linkLabel, linkIndex) {
    if (!element) return;
    const daaLl = `${sanitizeAnalyticsText(linkLabel)}-${linkIndex}--${getAnalyticsHeaderText()}`;
    element.setAttribute('daa-ll', daaLl);
    element.setAttribute('data-ll', daaLl);
  }

  function setFilterValue(id, value, shouldEmit = true) {
    filterValues[id] = value;
    if (shouldEmit) emitFilterChange();
  }

  function emitFilterInteraction() {
    interactionRoot?.dispatchEvent(new CustomEvent('color-explore:filter-interaction', {
      bubbles: true,
    }));
  }

  function findFilter(id, filterList) {
    return filterList.find((filter) => filter.id === id);
  }

  function getDefaultValue(filter) {
    if (!filter) return 'all';
    if (filter.defaultValue) return filter.defaultValue;
    return filter.options?.[0]?.value ?? 'all';
  }

  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getPickerLabelFont() {
    const rootStyles = window.getComputedStyle(document.documentElement);
    const bodyStyles = window.getComputedStyle(document.body || document.documentElement);
    const fontSize = rootStyles.getPropertyValue('--body-font-size-s').trim() || '14px';
    const fontFamily = rootStyles.getPropertyValue('--body-font-family').trim()
      || bodyStyles.fontFamily
      || 'sans-serif';
    return `400 ${fontSize} ${fontFamily}`;
  }

  function getPickerWidthTokenValue(tokenName, fallback) {
    const tokenValue = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue(tokenName)
      .trim();
    const parsed = Number.parseFloat(tokenValue);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getLocalizedPickerWidth(filter) {
    const minWidth = getPickerWidthTokenValue(
      '--color-explore-filter-picker-width',
      PICKER_MIN_WIDTH_FALLBACK_PX,
    );
    const maxWidth = Math.max(
      minWidth,
      getPickerWidthTokenValue(
        '--color-explore-filter-picker-max-width',
        PICKER_MAX_WIDTH_FALLBACK_PX,
      ),
    );

    const labels = [
      filter?.label,
      ...(Array.isArray(filter?.options) ? filter.options.map((option) => option?.label) : []),
    ]
      .filter(Boolean)
      .map((label) => String(label));

    if (labels.length === 0) return minWidth;

    if (!pickerMeasureCanvas && typeof document !== 'undefined') {
      pickerMeasureCanvas = document.createElement('canvas');
    }
    const context = pickerMeasureCanvas?.getContext?.('2d');
    if (!context) return minWidth;

    context.font = getPickerLabelFont();
    const widestLabel = labels.reduce((currentMaxWidth, text) => {
      const measuredWidth = Math.ceil(context.measureText(text).width);
      return Math.max(currentMaxWidth, measuredWidth);
    }, 0);

    const computedWidth = widestLabel + PICKER_HORIZONTAL_CHROME_PX;
    return clampNumber(computedWidth, minWidth, maxWidth);
  }

  function applyDesktopPickerWidth(slot, filter) {
    if (!slot) return;
    const widthPx = getLocalizedPickerWidth(filter);
    const widthValue = `${widthPx}px`;
    slot.style.setProperty('--express-picker-width', widthValue);
    slot.style.setProperty('--express-picker-min-width', widthValue);
    slot.style.setProperty('--express-picker-max-width', widthValue);
  }

  function syncPickerValue(id, value) {
    const picker = pickersById.get(id);
    if (picker && typeof picker.setValue === 'function') {
      picker.setValue(value);
    }
  }

  function handleDesktopPickerChange(id, value) {
    emitFilterInteraction();
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

  function createDesktopSelectFallback(filter) {
    const filterId = filter?.id;
    const optionsList = Array.isArray(filter?.options) ? filter.options : [];
    const currentValue = filterValues[filterId] ?? getDefaultValue(filter);

    const select = createTag('select', {
      class: 'filter-picker-fallback',
      'aria-label': `Filter by ${filter?.label || filterId || 'value'}`,
    });

    optionsList.forEach((option) => {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      if (option.value === currentValue) optionEl.selected = true;
      select.appendChild(optionEl);
    });

    const onChange = (event) => {
      emitFilterInteraction();
      handleDesktopPickerChange(filterId, event.target.value);
    };
    select.addEventListener('change', onChange);
    cleanupFns.push(() => select.removeEventListener('change', onChange));

    return {
      element: select,
      getValue: () => select.value,
      setValue: (value) => {
        select.value = value;
      },
      destroy: () => {
        select.removeEventListener('change', onChange);
        select.remove();
      },
    };
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
      emitFilterInteraction();
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
  interactionRoot = container;

  const filtersToUse = filters.length > 0 ? filters : getDefaultFilters();
  filtersToUse.forEach((filter) => {
    filterValues[filter.id] = getDefaultValue(filter);
  });
  const desktopFilterOrder = [FILTER_IDS.CONTENT_TYPE, FILTER_IDS.SORT, FILTER_IDS.TIME_RANGE];
  const desktopOrderedFilters = [
    ...desktopFilterOrder
      .map((id) => findFilter(id, filtersToUse))
      .filter(Boolean),
    ...filtersToUse.filter((filter) => !desktopFilterOrder.includes(filter.id)),
  ];

  // Desktop: dropdowns — pre-allocate slots in declared order so DOM order is
  // always 1-contentType 2-sort 3-timeRange regardless of async resolution order.
  const dropdownSlots = desktopOrderedFilters.map(() => createTag('div', { class: 'filter-dropdown' }));
  dropdownSlots.forEach((slot) => desktopContainer.appendChild(slot));

  async function initDesktopPickers() {
    if (pickersById.size > 0) return;
    for (let i = 0; i < desktopOrderedFilters.length; i += 1) {
      const filter = desktopOrderedFilters[i];
      const filterId = filter.id;
      const desiredValue = filterValues[filterId];
      const stableInitialValue = filter.options?.[0]?.value ?? desiredValue;
      let picker = null;
      let lastError = null;

      applyDesktopPickerWidth(dropdownSlots[i], filter);

      for (let attempt = 1; attempt <= 4; attempt += 1) {
        try {
          // Retry a few times in case Spectrum custom elements are still settling.
          // eslint-disable-next-line no-await-in-loop
          picker = await createExpressPicker({
            label: filter.label,
            value: stableInitialValue,
            options: filter.options,
            id: filterId,
            forcePopover: true,
            onChange: ({ value }) => handleDesktopPickerChange(filterId, value),
          });
          break;
        } catch (pickerError) {
          lastError = pickerError;
          if (attempt < 4) {
            // eslint-disable-next-line no-await-in-loop
            await waitForAnimationFrame();
            // eslint-disable-next-line no-await-in-loop
            await waitForAnimationFrame();
          }
        }
      }

      if (picker) {
        dropdownSlots[i].appendChild(picker.element);
        if (typeof picker.waitForReady === 'function') {
          try {
            // eslint-disable-next-line no-await-in-loop
            await picker.waitForReady();
          } catch (pickerReadyError) {
            // Keep going; setValue below may still recover if picker settles.
          }
        }
        if (desiredValue && desiredValue !== stableInitialValue) {
          // Set non-first defaults only after picker is attached and connected.
          // This avoids a known SWC race that can throw during initial setup.
          // eslint-disable-next-line no-await-in-loop
          await waitForAnimationFrame();
          try {
            picker.setValue(desiredValue);
          } catch (setValueError) {
            // eslint-disable-next-line no-console
            console.warn('[ColorExplore] picker.setValue failed, preserving fallback state', setValueError);
          }
        }
        pickers.push(picker);
        pickersById.set(filterId, picker);
      } else {
        // eslint-disable-next-line no-console
        console.error('[ColorExplore] createExpressPicker failed for filter', filter.id, lastError);
        window.lana?.log(`Failed to create picker for filter ${filter.id}: ${lastError?.message}`, {
          tags: 'color-explorer,filters',
          severity: 'error',
        });

        // Last-resort fallback so controls still work if SWC fails.
        const fallbackPicker = createDesktopSelectFallback(filter);
        dropdownSlots[i].appendChild(fallbackPicker.element);
        pickers.push(fallbackPicker);
        pickersById.set(filterId, fallbackPicker);
      }
    }
  }

  async function waitForReady() {
    await waitUntilConnected(container);

    if (!desktopInitPromise) {
      desktopInitPromise = initDesktopPickers();
    }
    await desktopInitPromise;

    await waitForAnimationFrame();

    const pickerElements = Array.from(container.querySelectorAll('sp-picker'));
    await Promise.all(pickerElements.map(async (pickerEl) => {
      const maybeUpdate = pickerEl?.updateComplete;
      if (maybeUpdate && typeof maybeUpdate.then === 'function') {
        try {
          await maybeUpdate;
        } catch (error) {
          // Non-fatal: fallback UI already exists when picker setup fails.
        }
      }
    }));

    await waitForAnimationFrame();
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

  const attachMobileTooltips = async () => {
    const targets = [
      { el: filterButton, content: 'Filter' },
      { el: sortButton, content: 'Sort' },
    ];
    await Promise.all(targets.map(async ({ el, content }) => {
      try {
        const controller = await createExpressTooltip({
          targetEl: el,
          content,
          placement: 'top',
        });
        if (controller) mobileTooltipControllers.push(controller);
      } catch (error) {
        window.lana?.log(`Failed loading mobile filter tooltip (${content}): ${error?.message}`, {
          tags: 'color-explorer,filters',
          severity: 'warning',
        });
      }
    }));
  };
  await attachMobileTooltips();

  const sortPanel = createTag('div', { class: 'filters-mobile__panel filters-mobile__panel--sort', hidden: '' });
  const filterPanel = createTag('div', { class: 'filters-mobile__panel filters-mobile__panel--filter', hidden: '' });
  const desktopMq = typeof window !== 'undefined'
    ? window.matchMedia('(min-width: 600px)')
    : null;

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
      // eslint-disable-next-line no-unused-expressions
      panel.getBoundingClientRect(); // force reflow so transition runs from translateY(100%)
      panel.classList.add('filters-mobile__panel--open');
      button.setAttribute('aria-expanded', 'true');
    } else {
      panel.classList.remove('filters-mobile__panel--open');
      setTimeout(() => {
        if (!panel.classList.contains('filters-mobile__panel--open')) panel.setAttribute('hidden', '');
      }, 300);
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
      // eslint-disable-next-line no-unused-expressions
      mobileCurtain.getBoundingClientRect(); // force reflow so opacity transition runs from 0
      mobileCurtain.classList.add('filters-mobile__curtain--visible');
      document.body.classList.add('color-explore-filters-open');
    } else {
      mobileCurtain.classList.remove('filters-mobile__curtain--visible');
      setTimeout(() => {
        if (!mobileCurtain.classList.contains('filters-mobile__curtain--visible')) mobileCurtain.setAttribute('hidden', '');
      }, 300);
      document.body.classList.remove('color-explore-filters-open');
    }
  }

  function closePanels() {
    setPanelState(sortPanel, sortButton, false);
    setPanelState(filterPanel, filterButton, false);
    setCurtainState(false);
  }

  function togglePanel(targetPanel, targetButton, onOpen) {
    // In desktop/dropdown layout (600px+), mobile panels must never open.
    if (desktopMq?.matches) {
      closePanels();
      return;
    }

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
    emitFilterInteraction();
    togglePanel(sortPanel, sortButton, () => focusSelectedMenuItem(sortMenuController));
  };

  const onFilterButtonClick = () => {
    emitFilterInteraction();
    togglePanel(filterPanel, filterButton, () => focusSelectedMenuItem(contentTypeMenuController));
  };

  const onSortApply = () => {
    emitFilterInteraction();
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
    emitFilterInteraction();
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

  // Close any open mobile panel when crossing into dropdown layout (600px+).
  const onBreakpointChange = () => closePanels();
  desktopMq?.addEventListener('change', onBreakpointChange);
  if (desktopMq?.matches) closePanels();

  cleanupFns.push(() => sortButton.removeEventListener('click', onSortButtonClick));
  cleanupFns.push(() => filterButton.removeEventListener('click', onFilterButtonClick));
  cleanupFns.push(() => sortApplyButton.removeEventListener('click', onSortApply));
  cleanupFns.push(() => filterApplyButton.removeEventListener('click', onFilterApply));
  cleanupFns.push(() => document.removeEventListener('pointerdown', onDocumentPointerDown));
  cleanupFns.push(() => document.removeEventListener('keydown', onDocumentKeyDown));
  cleanupFns.push(() => mobileCurtain.removeEventListener('click', onCurtainClick));
  cleanupFns.push(() => desktopMq?.removeEventListener('change', onBreakpointChange));
  cleanupFns.push(() => document.body.classList.remove('color-explore-filters-open'));
  cleanupFns.push(() => {
    mobileTooltipControllers.splice(0).forEach((controller) => controller?.destroy?.());
  });

  applyAnalyticsAttributes(filterButton, 'Filter', 1);
  applyAnalyticsAttributes(sortButton, 'Sort', 2);
  applyAnalyticsAttributes(sortApplyButton, 'Apply', 3);
  applyAnalyticsAttributes(filterApplyButton, 'Apply', 4);

  mobileThemeWrapper.append(mobileCurtain, mobileContainer);
  container.append(desktopContainer, mobileThemeWrapper);

  return {
    element: container,
    getValues: () => ({ ...filterValues }),
    waitForReady,
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
