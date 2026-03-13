import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import { createSwatchRailAdapter, createColorEditAdapter } from '../adapters/litComponentAdapters.js';
import { getContrastTextColor } from '../../../libs/color-components/utils/ColorConversions.js';
import {
  TYPE_ORDER,
  TYPE_LABELS,
  DEFECT_DEFINITIONS,
  DEFECT_TOOLTIP_DEFINITIONS,
  getConflictPairs,
  getConflictingIndices,
  simulateHex,
} from '../services/createColorBlindnessService.js';
import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';

const COLORS_PER_ROW_TWO_ROWS = 5;

const MAX_CB_COLUMNS = 10;
const FOUR_ROWS_CB_COLS = 5;

const DEFAULT_ORIENTATIONS = ['horizontal', 'stacked', 'vertical'];
const MOBILE_BREAKPOINT_QUERY = '(max-width: 599px)';
const cbTooltipDestroysByElement = new WeakMap();
const ignoreError = () => {};

function getColorBlindnessCoreFeatures(features = {}) {
  return {
    ...features,
    // Core metadata behaviors for color-blindness variant; not consumer-optional.
    colorBlindness: true,
    baseColor: true,
    copy: true,
    hexCode: true,
  };
}

function clearTooltipDestroys(host) {
  const destroys = cbTooltipDestroysByElement.get(host) || [];
  destroys.forEach((destroy) => destroy?.());
  cbTooltipDestroysByElement.set(host, []);
}

function pushTooltipDestroy(host, destroy) {
  const destroys = cbTooltipDestroysByElement.get(host) || [];
  destroys.push(destroy);
  cbTooltipDestroysByElement.set(host, destroys);
}

function getAdapterController(adapter) {
  return adapter?.controller || adapter?.rail?.controller || null;
}

function createConflictIcon() {
  const el = createTag('span', {
    class: 'strip-color-blindness-swatch__conflict-icon',
    'aria-hidden': 'true',
    role: 'img',
    'aria-label': 'Conflict',
  });
  el.innerHTML = '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3.1L17.1 16H2.9L10 3.1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M10 8.1V11.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><circle cx="10" cy="14.2" r="0.9" fill="currentColor"></circle></svg>';
  return el;
}

function refreshColorBlindnessLabelTooltips(root) {
  clearTooltipDestroys(root);

  const labels = root.querySelectorAll?.('[data-tooltip-content]') || [];
  labels.forEach((labelEl) => {
    labelEl.removeAttribute('title');
    labelEl.querySelectorAll?.('sp-tooltip, sp-theme').forEach((el) => el.remove());
  });

  Promise.all(
    Array.from(labels).map(async (labelEl) => {
      const content = labelEl.getAttribute('data-tooltip-content') || '';
      if (!content) return;
      try {
        const tip = await createExpressTooltip({
          targetEl: labelEl,
          content,
          placement: 'top',
          preserveLineBreaks: true,
        });
        pushTooltipDestroy(root, () => tip.destroy());
      } catch (error) {
        ignoreError(error);
      }
    }),
  ).catch(() => {});
}

function createColorBlindnessRowsInMatrix(controller, orientation, containerEl, railWrapEl) {
  const unsub = controller?.subscribe?.((state) => {
    const allColors = (state?.swatches || []).map((s) => s?.hex).filter(Boolean);
    if (!allColors.length) return;
    const colors = allColors.slice(0, MAX_CB_COLUMNS);

    [...containerEl.children].forEach((c) => {
      if (c !== railWrapEl) c.remove();
    });

    containerEl.style.display = 'grid';
    containerEl.style.gridTemplateColumns = '100px 1fr';
    containerEl.style.gridTemplateRows = 'auto 90px 90px 90px';
    containerEl.style.gap = 'var(--spacing-50)';
    railWrapEl.style.gridColumn = '2';
    railWrapEl.style.gridRow = '1';
    railWrapEl.classList.add('strip-with-color-blindness__rail-column');

    TYPE_ORDER.forEach((type, rowIndex) => {
      const pairs = getConflictPairs(colors, type);
      const conflicting = getConflictingIndices(pairs);
      const gridRow = rowIndex + 2;

      const titleCell = createTag('div', {
        class: `strip-color-blindness-row__title-cell strip-color-blindness-row--${type} ${pairs.length > 0 ? 'fail' : 'pass'}`,
      });
      const label = createTag('span', { class: 'strip-color-blindness-row__label' });
      label.textContent = TYPE_LABELS[type];
      label.setAttribute('data-tooltip-content', DEFECT_TOOLTIP_DEFINITIONS[type]);
      label.setAttribute('aria-label', DEFECT_DEFINITIONS[type]);
      titleCell.appendChild(label);
      titleCell.style.gridColumn = '1';
      titleCell.style.gridRow = String(gridRow);
      containerEl.appendChild(titleCell);

      const swatchesWrap = createTag('div', {
        class: 'strip-color-blindness-row__swatches strip-with-color-blindness__rail-column',
      });
      swatchesWrap.style.gridColumn = '2';
      swatchesWrap.style.gridRow = String(gridRow);
      colors.forEach((hex, i) => {
        const sim = simulateHex(hex, type);
        const swatch = createTag('div', {
          class: `strip-color-blindness-swatch${conflicting.has(i) ? ' conflict' : ''}`,
          style: `background-color: ${sim}; --cb-conflict-icon-color: ${getContrastTextColor(sim)};`,
        });
        if (conflicting.has(i)) swatch.appendChild(createConflictIcon());
        swatchesWrap.appendChild(swatch);
      });
      containerEl.appendChild(swatchesWrap);
    });
    refreshColorBlindnessLabelTooltips(containerEl);
  });
  return () => {
    clearTooltipDestroys(containerEl);
    unsub?.();
  };
}

function createFourRowsColorBlindnessTitlesOnly(controller, containerEl, railWrapEl) {
  containerEl.style.display = 'grid';
  containerEl.style.gridTemplateColumns = '100px 1fr';
  containerEl.style.gridTemplateRows = '1fr 90px 90px 90px';
  containerEl.style.gap = 'var(--spacing-50)';
  railWrapEl.style.gridColumn = '2';
  railWrapEl.style.gridRow = '1 / -1';

  const titleUnsubs = [];
  const first5Hexes = () => {
    const state = controller?.getState?.();
    const all = (state?.swatches || []).map((s) => s?.hex).filter(Boolean);
    return all.slice(0, FOUR_ROWS_CB_COLS);
  };

  TYPE_ORDER.forEach((type, rowIndex) => {
    const gridRow = rowIndex + 2;
    const titleCell = createTag('div', {
      class: `strip-four-rows-cb-title strip-four-rows-cb-title--${type}`,
    });
    const label = createTag('span', { class: 'strip-four-rows-cb-title__label' });
    label.textContent = TYPE_LABELS[type];
    label.setAttribute('data-tooltip-content', DEFECT_TOOLTIP_DEFINITIONS[type]);
    label.setAttribute('aria-label', DEFECT_DEFINITIONS[type]);
    titleCell.style.gridColumn = '1';
    titleCell.style.gridRow = String(gridRow);
    titleCell.appendChild(label);
    containerEl.appendChild(titleCell);

    const updatePassFail = () => {
      const hexes = first5Hexes();
      const pairs = hexes.length ? getConflictPairs(hexes, type) : [];
      titleCell.classList.toggle('pass', pairs.length === 0);
      titleCell.classList.toggle('fail', pairs.length > 0);
    };
    updatePassFail();
    const unsub = controller?.subscribe?.(updatePassFail);
    if (unsub) titleUnsubs.push(unsub);
  });
  refreshColorBlindnessLabelTooltips(containerEl);
  containerEl.unsubFourRowsTitles = () => {
    titleUnsubs.forEach((fn) => fn?.());
    clearTooltipDestroys(containerEl);
  };
}

export function createFourRowsColorBlindnessLayout(adapter) {
  const rootClass = 'strip-with-color-blindness strip-with-color-blindness--matrix strip-with-color-blindness--four-rows';
  const gridContainer = createTag('div', { class: rootClass });
  const railContainer = createTag('div', { class: 'strip-variant--four-rows__rail-container' });
  railContainer.appendChild(adapter.element);
  gridContainer.appendChild(railContainer);
  const controller = getAdapterController(adapter);
  // eslint-disable-next-line no-use-before-define
  const summary = createConflictSummaryBlock(controller, FOUR_ROWS_CB_COLS);
  const outer = createTag('div', { class: 'strip-with-color-blindness strip-with-color-blindness--four-rows' });
  outer.appendChild(gridContainer);
  outer.appendChild(summary);
  if (controller) {
    createFourRowsColorBlindnessTitlesOnly(controller, gridContainer, railContainer);
    outer.cleanup = () => {
      gridContainer.unsubFourRowsTitles?.();
      summary.cleanup?.();
    };
  }
  return outer;
}

function createColorBlindnessRows(controller, orientation) {
  const isTwoRows = orientation === 'two-rows';
  const wrap = createTag('div', {
    class: `strip-color-blindness-rows${isTwoRows ? ' strip-color-blindness-rows--two-rows' : ''}`,
  });
  const unsub = controller?.subscribe?.((state) => {
    const allColors = (state?.swatches || []).map((s) => s?.hex).filter(Boolean);
    if (!allColors.length) return;
    const colors = allColors.slice(0, MAX_CB_COLUMNS);
    wrap.innerHTML = '';
    TYPE_ORDER.forEach((type) => {
      const pairs = getConflictPairs(colors, type);
      const conflicting = getConflictingIndices(pairs);
      const rowFails = pairs.length > 0;
      const row = createTag('div', {
        class: `strip-color-blindness-row strip-color-blindness-row--${type} ${rowFails ? 'fail' : 'pass'} strip-color-blindness-row--two-rows`,
      });
      const header = createTag('div', { class: 'strip-color-blindness-row__header' });
      const label = createTag('span', { class: 'strip-color-blindness-row__label' });
      label.textContent = TYPE_LABELS[type];
      label.setAttribute('data-tooltip-content', DEFECT_TOOLTIP_DEFINITIONS[type]);
      label.setAttribute('aria-label', DEFECT_DEFINITIONS[type]);
      header.appendChild(label);
      const swatchesContainer = createTag('div', { class: 'strip-color-blindness-row__grid' });
      const rowColors = colors.slice(0, COLORS_PER_ROW_TWO_ROWS);
      const padded = [...rowColors];
      while (padded.length < COLORS_PER_ROW_TWO_ROWS) {
        padded.push('#e5e5e5');
      }
      padded.slice(0, COLORS_PER_ROW_TWO_ROWS).forEach((hex, colIndex) => {
        const sim = simulateHex(hex, type);
        const isPlaceholder = colIndex >= rowColors.length;
        const swatch = createTag('div', {
          class: `strip-color-blindness-swatch${conflicting.has(colIndex) ? ' conflict' : ''}${isPlaceholder ? ' strip-color-blindness-swatch--placeholder' : ''}`,
          style: `background-color: ${sim}; --cb-conflict-icon-color: ${getContrastTextColor(sim)};`,
        });
        if (conflicting.has(colIndex)) swatch.appendChild(createConflictIcon());
        swatchesContainer.appendChild(swatch);
      });
      row.appendChild(header);
      row.appendChild(swatchesContainer);
      wrap.appendChild(row);
    });
    refreshColorBlindnessLabelTooltips(wrap);
  });
  return {
    wrap,
    unsub: () => {
      clearTooltipDestroys(wrap);
      unsub?.();
    },
  };
}

function getTotalConflictCount(colors, maxColumns = MAX_CB_COLUMNS) {
  const limited = colors.slice(0, maxColumns);
  let total = 0;
  TYPE_ORDER.forEach((type) => {
    total += getConflictPairs(limited, type).length;
  });
  return { total, hasAny: total > 0 };
}

function createCheckmarkIcon() {
  const el = createTag('span', {
    class: 'strip-conflict-summary__badge-icon',
    slot: 'icon',
    'aria-hidden': 'true',
  });
  el.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 15C4.13984 15 1 11.8602 1 8C1 4.13984 4.13984 1 8 1C11.8602 1 15 4.13984 15 8C15 11.8602 11.8602 15 8 15ZM8 2.2C4.80156 2.2 2.2 4.80156 2.2 8C2.2 11.1984 4.80156 13.8 8 13.8C11.1984 13.8 13.8 11.1984 13.8 8C13.8 4.80156 11.1984 2.2 8 2.2Z" fill="currentColor"></path><path d="M7.37828 10.8001C7.20875 10.8001 7.04625 10.7282 6.93219 10.6017L4.92359 8.36808C4.70172 8.12121 4.72203 7.7423 4.96812 7.52042C5.21421 7.29855 5.59312 7.31886 5.81578 7.56495L7.33062 9.25011L10.1205 5.44542C10.315 5.17824 10.6892 5.11808 10.9587 5.31652C11.2259 5.51183 11.2837 5.88762 11.0876 6.1548L7.86186 10.5548C7.75561 10.7009 7.58842 10.7907 7.40795 10.7993C7.39858 10.8001 7.38844 10.8001 7.37828 10.8001Z" fill="currentColor"></path></svg>';
  return el;
}

function createWarningIcon() {
  const el = createTag('span', {
    class: 'strip-conflict-summary__badge-icon strip-conflict-summary__badge-icon--warning',
    slot: 'icon',
    'aria-hidden': 'true',
  });
  el.innerHTML = '<svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m9.99936,15.12334c-.23065.00812-.45538-.07378-.62661-.22835-.33033-.36462-.33033-.91993,0-1.28455.16935-.15832.39483-.24279.62664-.23476.23635-.00947.46589.08026.63302.24745.16207.1677.24916.39386.24137.62681.01238.23469-.06959.4646-.2277.63864-.17358.16455-.40786.24959-.64671.23475Z" fill="currentColor"></path><path d="m10,11.75c-.41406,0-.75-.33594-.75-.75v-4c0-.41406.33594-.75.75-.75s.75.33594.75.75v4c0,.41406-.33594.75-.75.75Z" fill="currentColor"></path><path d="m16.7334,18H3.2666c-.80029,0-1.52295-.41016-1.93262-1.09766s-.42725-1.51855-.04639-2.22266L8.021,2.23242c.39355-.72754,1.15186-1.17969,1.979-1.17969s1.58545.45215,1.979,1.17969l6.7334,12.44727c.38086.7041.36328,1.53516-.04639,2.22266s-1.13232,1.09766-1.93262,1.09766ZM10,2.55273c-.13428,0-.46777.03809-.65967.39258L2.60693,15.39258c-.18311.33887-.05029.63184.01562.74121.06543.11035.25928.36621.64404.36621h13.4668c.38477,0,.57861-.25586.64404-.36621.06592-.10938.19873-.40234.01562-.74121L10.65967,2.94531c-.19189-.35449-.52539-.39258-.65967-.39258Z" fill="currentColor"></path></svg>';
  return el;
}

function createConflictSummaryBlock(controller, maxColumns = MAX_CB_COLUMNS) {
  const wrap = createTag('div', { class: 'strip-conflict-summary' });
  const label = createTag('span', { class: 'strip-conflict-summary__label' });
  label.textContent = 'Potential color blind conflicts';
  const badge = createTag('span', {
    class: 'strip-conflict-summary__badge',
    role: 'status',
    'aria-live': 'polite',
  });
  wrap.appendChild(label);
  wrap.appendChild(badge);

  function updateBadge(colors) {
    if (!colors.length) {
      badge.classList.remove('has-conflicts');
      badge.classList.add('none');
      badge.innerHTML = '';
      badge.appendChild(createCheckmarkIcon());
      badge.appendChild(document.createTextNode('None'));
      return;
    }
    const { hasAny } = getTotalConflictCount(colors, maxColumns);
    if (hasAny) {
      badge.classList.remove('none');
      badge.classList.add('has-conflicts');
      badge.innerHTML = '';
      badge.appendChild(createWarningIcon());
      badge.appendChild(document.createTextNode('Conflicts found'));
    } else {
      badge.classList.remove('has-conflicts');
      badge.classList.add('none');
      badge.innerHTML = '';
      badge.appendChild(createCheckmarkIcon());
      badge.appendChild(document.createTextNode('None'));
    }
  }

  const unsub = controller?.subscribe?.((state) => {
    const colors = (state?.swatches || []).map((s) => s?.hex).filter(Boolean);
    updateBadge(colors);
  });

  wrap.cleanup = () => unsub?.();
  if (!controller) {
    updateBadge([]);
  } else {
    const initial = controller?.getState?.();
    const initialColors = (initial?.swatches || []).map((s) => s?.hex).filter(Boolean);
    if (initialColors.length) updateBadge(initialColors);
  }
  return wrap;
}

export function createStripWithColorBlindness(adapter, orientation) {
  const isTwoRows = orientation === 'two-rows';
  const matrixOrRows = createTag('div', {
    class: `strip-with-color-blindness${isTwoRows ? ' strip-with-color-blindness--two-rows' : ''}`,
  });
  if (isTwoRows && adapter.rail) {
    adapter.rail.setAttribute('embedded', '');
  }

  const railWrap = createTag('div', { class: 'strip-with-color-blindness__rail-wrap' });
  railWrap.appendChild(adapter.element);
  matrixOrRows.appendChild(railWrap);

  const controller = getAdapterController(adapter);
  if (controller) {
    let unsub;
    if (isTwoRows) {
      const { wrap, unsub: u } = createColorBlindnessRows(controller, orientation);
      matrixOrRows.appendChild(wrap);
      unsub = u;
    } else {
      unsub = createColorBlindnessRowsInMatrix(controller, orientation, matrixOrRows, railWrap);
    }
    const conflictSummary = createConflictSummaryBlock(controller);
    conflictSummary.cleanup = conflictSummary.cleanup || (() => {});
    const origDestroy = adapter.destroy;
    adapter.destroy = () => {
      unsub?.();
      conflictSummary.cleanup?.();
      origDestroy?.();
    };
    const outer = createTag('div', {
      class: `strip-with-color-blindness${isTwoRows ? ' strip-with-color-blindness--two-rows' : ''}`,
    });
    outer.appendChild(matrixOrRows);
    outer.appendChild(conflictSummary);
    return outer;
  }
  return matrixOrRows;
}

export function createStripContainerRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData, config } = base;

  const orientations = config?.stripContainerOrientations ?? DEFAULT_ORIENTATIONS;

  const swatchFeatures = config?.swatchFeatures;
  const verticalMaxPerRow = Number.isFinite(config?.swatchVerticalMaxPerRow)
    ? Math.max(1, Math.min(10, Math.floor(config.swatchVerticalMaxPerRow)))
    : null;

  const colorBlindness = config?.colorBlindness === true;

  let listElement = null;
  let activeColorEditor = null;
  const cleanupHandlers = [];

  function resolveAnchorRect(anchorElement, anchorRectFromDetail) {
    if (anchorRectFromDetail && Number.isFinite(anchorRectFromDetail.left)) {
      return anchorRectFromDetail;
    }
    return anchorElement.getBoundingClientRect();
  }

  function positionPopover(popover, anchorRect) {
    const gap = 8;
    const popRect = popover.getBoundingClientRect();

    let top = anchorRect.bottom + gap;
    if (top + popRect.height > window.innerHeight) {
      top = anchorRect.top - popRect.height - gap;
    }
    top = Math.max(gap, top);

    let left = anchorRect.left + (anchorRect.width - popRect.width) / 2;
    left = Math.max(gap, Math.min(left, window.innerWidth - popRect.width - gap));

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }

  function closeActiveColorEditor() {
    if (!activeColorEditor) return;
    const {
      adapter,
      popover,
      mobile,
      outsideHandler,
      escapeHandler,
      scrollHandler,
    } = activeColorEditor;
    if (outsideHandler) document.removeEventListener('click', outsideHandler, true);
    if (escapeHandler) document.removeEventListener('keydown', escapeHandler, true);
    if (scrollHandler) window.removeEventListener('scroll', scrollHandler, true);
    if (mobile) {
      try {
        adapter.hide?.();
      } catch (_err) {
        // no-op
      }
    }
    adapter.destroy?.();
    popover?.remove();
    activeColorEditor = null;
  }

  function openColorEditorForRail(
    railElement,
    controller,
    selectedIndex,
    anchorElement,
    anchorRectFromDetail = null,
  ) {
    closeActiveColorEditor();

    const state = controller?.getState?.() || {};
    const palette = (state.swatches || []).map((swatch) => swatch?.hex).filter(Boolean);
    const mobile = window.matchMedia?.(MOBILE_BREAKPOINT_QUERY)?.matches === true;

    const adapter = createColorEditAdapter({
      palette,
      selectedIndex,
      colorMode: 'HEX',
      showPalette: true,
      mobile,
    }, {
      onColorChange: ({ hex, index }) => {
        if (!hex || !controller?.setState) return;
        const currentState = controller.getState?.() || {};
        const nextSwatches = [...(currentState.swatches || [])];
        const targetIndex = Number.isInteger(index) ? index : selectedIndex;
        if (targetIndex < 0 || targetIndex >= nextSwatches.length) return;
        nextSwatches[targetIndex] = {
          ...(nextSwatches[targetIndex] || {}),
          hex: hex.toUpperCase(),
        };
        controller.setState({ swatches: nextSwatches });
      },
      onClose: () => {
        closeActiveColorEditor();
      },
    });

    const editorElement = adapter.getElement?.() || adapter.element;
    if (mobile) {
      document.body.appendChild(editorElement);
      adapter.show?.();
      activeColorEditor = { adapter, mobile: true };
      return;
    }

    const popover = document.createElement('div');
    popover.className = 'swatches-color-edit-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Edit color');
    popover.style.position = 'fixed';
    popover.style.zIndex = '10002';
    popover.appendChild(editorElement);
    document.body.appendChild(popover);
    const anchorRect = resolveAnchorRect(anchorElement, anchorRectFromDetail);
    positionPopover(popover, anchorRect);
    requestAnimationFrame(() => positionPopover(popover, anchorRect));
    Promise.resolve(editorElement.updateComplete)
      .then(() => positionPopover(popover, anchorRect))
      .catch(() => {});

    const outsideHandler = (evt) => {
      if (!popover.contains(evt.target) && !anchorElement.contains(evt.target)) {
        closeActiveColorEditor();
      }
    };
    const escapeHandler = (evt) => {
      if (evt.key === 'Escape') closeActiveColorEditor();
    };
    const scrollHandler = () => {
      closeActiveColorEditor();
    };

    document.addEventListener('click', outsideHandler, true);
    document.addEventListener('keydown', escapeHandler, true);
    window.addEventListener('scroll', scrollHandler, true);

    activeColorEditor = {
      adapter,
      popover,
      mobile: false,
      outsideHandler,
      escapeHandler,
      scrollHandler,
    };
  }

  function attachRailEditor(railElement) {
    const onEdit = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const index = Number(event.detail?.index);
      if (!Number.isInteger(index) || index < 0) return;
      const path = event.composedPath?.() || [];
      const anchor = path.find((node) => (
        node instanceof HTMLElement
        && (node.tagName === 'BUTTON' || node.classList?.contains('hex-code'))
      )) || railElement;
      const anchorRect = event.detail?.anchorRect || null;
      openColorEditorForRail(railElement, railElement.controller, index, anchor, anchorRect);
    };
    railElement.addEventListener('color-swatch-rail-edit', onEdit);
    cleanupHandlers.push(() => railElement.removeEventListener('color-swatch-rail-edit', onEdit));
  }

  function railOptions(orientation) {
    const opts = { orientation };
    if (verticalMaxPerRow != null) opts.verticalMaxPerRow = verticalMaxPerRow;
    if (colorBlindness) {
      opts.swatchFeatures = getColorBlindnessCoreFeatures(swatchFeatures);
      if (orientation === 'four-rows') {
        // Four-rows color-blindness variant is rendered as a unified matrix in the rail.
        opts.hexCopyFirstRowOnly = true;
      }
    } else if (swatchFeatures != null) {
      opts.swatchFeatures = swatchFeatures;
    }
    return opts;
  }

  function appendStrip(adapter, orientation) {
    attachRailEditor(adapter.rail);
    let el = adapter.element;
    if (colorBlindness) {
      el = orientation === 'four-rows'
        ? createFourRowsColorBlindnessLayout(adapter)
        : createStripWithColorBlindness(adapter, orientation);
    }
    listElement.appendChild(el);
  }

  function render(container) {
    closeActiveColorEditor();
    cleanupHandlers.splice(0).forEach((fn) => fn());
    container.innerHTML = '';
    container.classList.add('color-explorer-strip-container', 'strip-container');
    if (colorBlindness) container.classList.add('color-explorer-strip-container--color-blindness');
    listElement = container;

    const data = getData().slice(0, orientations.length);
    data.forEach((palette, index) => {
      const adapter = createSwatchRailAdapter(palette, railOptions(orientations[index]));
      appendStrip(adapter, orientations[index]);
    });
  }

  function update(newData) {
    if (!listElement) return;
    closeActiveColorEditor();
    cleanupHandlers.splice(0).forEach((fn) => fn());
    listElement.innerHTML = '';
    const data = (Array.isArray(newData) ? newData : getData()).slice(0, orientations.length);
    data.forEach((palette, index) => {
      const adapter = createSwatchRailAdapter(palette, railOptions(orientations[index]));
      appendStrip(adapter, orientations[index]);
    });
  }

  function destroy() {
    closeActiveColorEditor();
    cleanupHandlers.splice(0).forEach((fn) => fn());
    listElement = null;
  }

  return {
    ...base,
    render,
    update,
    destroy,
  };
}
