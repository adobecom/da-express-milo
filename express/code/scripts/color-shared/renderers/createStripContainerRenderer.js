import { createTag } from '../../utils.js';
import createBaseRenderer from './createBaseRenderer.js';
import { createSwatchRailAdapter, createColorEditAdapter } from '../adapters/litComponentAdapters.js';
import { getContrastTextColor, isSuperLight } from '../../../libs/color-components/utils/ColorConversions.js';
import {
  TYPE_ORDER,
  getConflictPairs,
  getConflictingIndices,
  simulateHex,
} from '../services/createColorBlindnessService.js';
import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';
import { announceToScreenReader } from '../spectrum/utils/a11y.js';
import { DEFAULT_SHARED_PLACEHOLDERS as CB_DEFAULTS } from '../i18n/loadColorBlindnessPlaceholders.js';

function resolveCBLabels(cbStrings) {
  const s = cbStrings || CB_DEFAULTS;
  return {
    labels: { deutan: s.typeDeutan, protan: s.typeProtan, tritan: s.typeTritan },
    defs: { deutan: s.typeDescDeutan, protan: s.typeDescProtan, tritan: s.typeDescTritan },
    summary: s.summary,
    statusNone: s.statusNone,
    statusConflictsFound: s.statusConflictsFound,
    conflictIconAria: s.conflictIconAria,
    mobilePaletteHeader: s.mobilePaletteHeader,
  };
}

const COLORS_PER_ROW_TWO_ROWS = 5;

const MAX_CB_COLUMNS = 10;

const DEFAULT_ORIENTATIONS = ['horizontal', 'stacked', 'vertical'];
const MOBILE_BREAKPOINT_QUERY = '(max-width: 599px)';
const cbTooltipDestroysByElement = new WeakMap();
const ignoreError = () => {};

function getColorBlindnessCoreFeatures(features = {}) {
  return {
    colorBlindness: true,
    baseColor: true,
    copy: true,
    hexCode: true,
    ...features,
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

function createConflictIcon(ariaLabel = CB_DEFAULTS.conflictIconAria) {
  return createTag(
    'span',
    {
      class: 'strip-color-blindness-swatch__conflict-icon',
      'aria-hidden': 'true',
      role: 'img',
      'aria-label': ariaLabel,
    },
    '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3.1L17.1 16H2.9L10 3.1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M10 8.1V11.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><circle cx="10" cy="14.2" r="0.9" fill="currentColor"></circle></svg>',
  );
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

function createColorBlindnessRowsInMatrix(
  controller,
  orientation,
  containerEl,
  railWrapEl,
  cbStrings,
) {
  const cb = resolveCBLabels(cbStrings);
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
      const label = createTag('span', { class: 'strip-color-blindness-row__label', tabindex: '0' });
      label.textContent = cb.labels[type];
      label.setAttribute('data-tooltip-content', cb.defs[type]);
      label.setAttribute('aria-label', `${cb.labels[type]}: ${cb.defs[type]}`);
      label.addEventListener('focus', () => {
        announceToScreenReader(`${cb.labels[type]}: ${cb.defs[type]}`);
      });
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
          role: 'img',
          'aria-label': `${sim.toUpperCase()} ${cb.labels[type]}`,
        });
        if (conflicting.has(i)) swatch.appendChild(createConflictIcon(cb.conflictIconAria));
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

function createFourRowsColorBlindnessTitlesOnly(controller, containerEl, railWrapEl, cbStrings) {
  const cb = resolveCBLabels(cbStrings);
  containerEl.style.display = 'grid';
  containerEl.style.gridTemplateColumns = '100px 1fr';
  containerEl.style.gridTemplateRows = '1fr 90px 90px 90px';
  containerEl.style.gap = 'var(--spacing-50)';
  railWrapEl.style.gridColumn = '2';
  railWrapEl.style.gridRow = '1 / -1';

  const titleUnsubs = [];
  const getCurrentHexes = () => {
    const state = controller?.getState?.();
    return (state?.swatches || []).map((s) => s?.hex).filter(Boolean);
  };

  TYPE_ORDER.forEach((type, rowIndex) => {
    const gridRow = rowIndex + 2;
    const titleCell = createTag('div', {
      class: `strip-four-rows-cb-title strip-four-rows-cb-title--${type}`,
    });
    const label = createTag('span', { class: 'strip-four-rows-cb-title__label', tabindex: '0' });
    label.textContent = cb.labels[type];
    label.setAttribute('data-tooltip-content', cb.defs[type]);
    label.setAttribute('aria-label', `${cb.labels[type]}: ${cb.defs[type]}`);
    label.addEventListener('focus', () => {
      announceToScreenReader(`${cb.labels[type]}: ${cb.defs[type]}`);
    });
    titleCell.style.gridColumn = '1';
    titleCell.style.gridRow = String(gridRow);
    titleCell.appendChild(label);
    containerEl.appendChild(titleCell);

    const updatePassFail = () => {
      const hexes = getCurrentHexes();
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

function createMobileCBLayout(controller, cbStrings, maxColumns = MAX_CB_COLUMNS) {
  const cb = resolveCBLabels(cbStrings);
  const container = createTag('div', { class: 'strip-cb-mobile-layout' });

  const header = createTag('div', { class: 'strip-cb-mobile-header' });
  const paletteLabel = createTag('span', {
    class: 'strip-cb-mobile-header__label--palette',
  });
  paletteLabel.textContent = cb.mobilePaletteHeader;
  header.appendChild(paletteLabel);

  TYPE_ORDER.forEach((type) => {
    const wrap = createTag('div', { class: 'strip-cb-mobile-header__label-wrap' });
    const label = createTag('span', { class: 'strip-cb-mobile-header__label', tabindex: '0' });
    label.textContent = cb.labels[type];
    label.setAttribute('data-tooltip-content', cb.defs[type]);
    label.setAttribute('aria-label', `${cb.labels[type]}: ${cb.defs[type]}`);
    label.addEventListener('focus', () => {
      announceToScreenReader(`${cb.labels[type]}: ${cb.defs[type]}`);
    });
    wrap.appendChild(label);
    header.appendChild(wrap);
  });
  container.appendChild(header);

  const rowsWrap = createTag('div', { class: 'strip-cb-mobile-rows' });
  container.appendChild(rowsWrap);

  const unsub = controller?.subscribe?.((state) => {
    const allColors = (state?.swatches || []).map((s) => s?.hex).filter(Boolean);
    if (!allColors.length) return;
    const colors = allColors.slice(0, maxColumns);
    rowsWrap.innerHTML = '';

    const conflictsByType = {};
    TYPE_ORDER.forEach((type) => {
      conflictsByType[type] = getConflictingIndices(getConflictPairs(colors, type));
    });

    colors.forEach((hex, colorIndex) => {
      const row = createTag('div', { class: 'strip-cb-mobile-row' });

      const textColor = getContrastTextColor(hex);
      const paletteCell = createTag('div', {
        class: `strip-cb-mobile-row__palette${isSuperLight(hex) ? ' super-light' : ''}`,
        style: `background-color: ${hex};`,
        role: 'button',
        tabindex: '0',
        'aria-label': `Edit color ${hex.toUpperCase()}`,
      });
      const hexLabel = createTag('span', {
        class: 'strip-cb-mobile-row__hex',
        style: `color: ${textColor};`,
      });
      hexLabel.textContent = hex.toUpperCase();
      paletteCell.appendChild(hexLabel);
      const editSwatch = (e) => {
        e.preventDefault();
        paletteCell.dispatchEvent(new CustomEvent('mobile-cb-swatch-edit', {
          bubbles: true,
          detail: {
            index: colorIndex,
            anchorEl: paletteCell,
            anchorRect: hexLabel.getBoundingClientRect(),
          },
        }));
      };
      paletteCell.addEventListener('click', editSwatch);
      paletteCell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') editSwatch(e);
      });
      row.appendChild(paletteCell);

      TYPE_ORDER.forEach((type) => {
        const sim = simulateHex(hex, type);
        const conflicting = conflictsByType[type];
        const simCell = createTag('div', {
          class: `strip-cb-mobile-row__sim${conflicting.has(colorIndex) ? ' conflict' : ''}${isSuperLight(sim) ? ' super-light' : ''}`,
          style: `background-color: ${sim}; --cb-conflict-icon-color: ${getContrastTextColor(sim)};`,
          role: 'img',
          'aria-label': `${sim.toUpperCase()} ${cb.labels[type]}`,
        });
        if (conflicting.has(colorIndex)) {
          simCell.appendChild(createConflictIcon(cb.conflictIconAria));
        }
        row.appendChild(simCell);
      });

      rowsWrap.appendChild(row);
    });

    refreshColorBlindnessLabelTooltips(container);
  });

  container.cleanup = () => {
    clearTooltipDestroys(container);
    unsub?.();
  };

  return container;
}

export function createFourRowsColorBlindnessLayout(adapter, cbStrings) {
  const controller = getAdapterController(adapter);
  // eslint-disable-next-line no-use-before-define
  const summary = createConflictSummaryBlock(controller, cbStrings);
  const outer = createTag('div', { class: 'strip-with-color-blindness strip-with-color-blindness--four-rows' });

  const desktopLayout = createTag('div', { class: 'strip-cb-desktop-layout' });
  const rootClass = 'strip-with-color-blindness strip-with-color-blindness--matrix strip-with-color-blindness--four-rows';
  const gridContainer = createTag('div', { class: rootClass });
  const railContainer = createTag('div', { class: 'strip-variant--four-rows__rail-container' });
  railContainer.appendChild(adapter.element);
  gridContainer.appendChild(railContainer);
  desktopLayout.appendChild(gridContainer);
  outer.appendChild(desktopLayout);

  let mobileLayout = null;
  if (controller) {
    mobileLayout = createMobileCBLayout(controller, cbStrings);
    outer.appendChild(mobileLayout);

    createFourRowsColorBlindnessTitlesOnly(controller, gridContainer, railContainer, cbStrings);
    outer.cleanup = () => {
      gridContainer.unsubFourRowsTitles?.();
      mobileLayout.cleanup?.();
      summary.cleanup?.();
    };
  }

  outer.appendChild(summary);
  return outer;
}

function createColorBlindnessRows(controller, orientation, cbStrings) {
  const cb = resolveCBLabels(cbStrings);
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
      const label = createTag('span', { class: 'strip-color-blindness-row__label', tabindex: '0' });
      label.textContent = cb.labels[type];
      label.setAttribute('data-tooltip-content', cb.defs[type]);
      label.setAttribute('aria-label', `${cb.labels[type]}: ${cb.defs[type]}`);
      label.addEventListener('focus', () => {
        announceToScreenReader(`${cb.labels[type]}: ${cb.defs[type]}`);
      });
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
          role: 'img',
          'aria-label': `${sim.toUpperCase()} ${cb.labels[type]}`,
        });
        if (conflicting.has(colIndex)) swatch.appendChild(createConflictIcon(cb.conflictIconAria));
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

function createConflictSummaryBlock(controller, cbStrings, maxColumns = MAX_CB_COLUMNS) {
  const cb = resolveCBLabels(cbStrings);
  const wrap = createTag('div', { class: 'strip-conflict-summary' });
  const label = createTag('span', { class: 'strip-conflict-summary__label' });
  label.textContent = cb.summary;
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
      badge.appendChild(document.createTextNode(cb.statusNone));
      return;
    }
    const { hasAny } = getTotalConflictCount(colors, maxColumns);
    if (hasAny) {
      badge.classList.remove('none');
      badge.classList.add('has-conflicts');
      badge.innerHTML = '';
      badge.appendChild(createWarningIcon());
      badge.appendChild(document.createTextNode(cb.statusConflictsFound));
    } else {
      badge.classList.remove('has-conflicts');
      badge.classList.add('none');
      badge.innerHTML = '';
      badge.appendChild(createCheckmarkIcon());
      badge.appendChild(document.createTextNode(cb.statusNone));
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

export function createStripWithColorBlindness(adapter, orientation, cbStrings) {
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
      const { wrap, unsub: u } = createColorBlindnessRows(controller, orientation, cbStrings);
      matrixOrRows.appendChild(wrap);
      unsub = u;
    } else {
      unsub = createColorBlindnessRowsInMatrix(
        controller,
        orientation,
        matrixOrRows,
        railWrap,
        cbStrings,
      );
    }
    const conflictSummary = createConflictSummaryBlock(controller, cbStrings);
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
  const cbStrings = config?.colorBlindnessStrings || null;
  const colorEditStrings = config?.colorEditStrings || null;
  const baseColorStrings = config?.baseColorStrings || null;
  const { onColorChangeEnd, onEditOpen } = options;
  const mobileQuery = typeof options.mobileBreakpointQuery === 'string'
    ? options.mobileBreakpointQuery
    : MOBILE_BREAKPOINT_QUERY;

  let listElement = null;
  let activeColorEditor = null;
  let isEditorOpening = false;
  const cleanupHandlers = [];

  function resolveAnchorRect(anchorElement, anchorRectFromDetail) {
    if (anchorRectFromDetail && Number.isFinite(anchorRectFromDetail.left)) {
      return anchorRectFromDetail;
    }
    return anchorElement.getBoundingClientRect();
  }

  function positionPopover(popover, anchorRect, container) {
    const gap = 4;
    const popRect = popover.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    let viewportTop = anchorRect.bottom + gap;
    if (viewportTop + popRect.height > window.innerHeight) {
      viewportTop = anchorRect.top - popRect.height - gap;
    }

    let viewportLeft = anchorRect.left;
    if (viewportLeft + popRect.width > window.innerWidth - gap) {
      viewportLeft = anchorRect.right - popRect.width;
    }
    viewportLeft = Math.max(gap, Math.min(viewportLeft, window.innerWidth - popRect.width - gap));

    popover.style.top = `${viewportTop - containerRect.top + container.scrollTop}px`;
    popover.style.left = `${viewportLeft - containerRect.left + container.scrollLeft}px`;
  }

  function closeActiveColorEditor() {
    if (!activeColorEditor) return;
    const {
      adapter,
      popover,
      resizeObserver,
      outsideHandler,
      escapeHandler,
      railElement: activeRailElement,
      selectedIndex: editedIndex,
    } = activeColorEditor;
    activeColorEditor = null;
    if (outsideHandler) document.removeEventListener('click', outsideHandler, true);
    if (escapeHandler) document.removeEventListener('keydown', escapeHandler, true);
    resizeObserver?.disconnect?.();
    try {
      adapter.hide?.();
    } catch (_err) {
      // no-op
    }
    adapter.destroy?.();
    popover?.remove();
    activeRailElement?.setActiveEditIndex?.(null);
    requestAnimationFrame(() => {
      const column = activeRailElement?.shadowRoot?.querySelector(
        `.swatch-column[data-swatch-index="${editedIndex}"]`,
      );
      if (column) {
        column.setAttribute('tabindex', '0');
        column.focus();
      }
    });
  }

  function openColorEditorForRail(
    railElement,
    controller,
    selectedIndex,
    anchorElement,
    anchorRectFromDetail = null,
  ) {
    closeActiveColorEditor();
    isEditorOpening = true;
    onEditOpen?.(selectedIndex);
    isEditorOpening = false;

    const state = controller?.getState?.() || {};
    const palette = (state.swatches || []).map((swatch) => swatch?.hex).filter(Boolean);
    const mobile = window.matchMedia?.(mobileQuery)?.matches === true;

    const ceOpts = {
      palette,
      selectedIndex,
      colorMode: 'HEX',
      showPalette: mobile,
      mobile,
    };
    if (colorEditStrings) ceOpts.strings = colorEditStrings;
    if (baseColorStrings) ceOpts.baseColorStrings = baseColorStrings;
    const adapter = createColorEditAdapter(ceOpts, {
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
      onColorChangeEnd: () => {
        onColorChangeEnd?.();
      },
      onClose: () => {
        closeActiveColorEditor();
      },
    });

    railElement.setActiveEditIndex?.(selectedIndex);

    const editorElement = adapter.getElement?.() || adapter.element;
    if (mobile) {
      document.body.appendChild(editorElement);
      activeColorEditor = { adapter, mobile: true, railElement, selectedIndex };
      requestAnimationFrame(async () => {
        try {
          await customElements.whenDefined('color-edit');
          await editorElement.updateComplete;
          adapter.show?.();
        } catch (e) {
          window.lana?.log(`[color-editor] mobile show failed: ${e.message}`, { tags: 'color-edit' });
        }
      });
      return;
    }

    const container = railElement.closest('.ax-shell-slot--canvas') || document.body;

    const popover = document.createElement('div');
    popover.className = 'swatches-color-edit-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Edit color');
    popover.style.position = 'absolute';
    popover.style.top = '0';
    popover.style.left = '0';
    popover.style.opacity = '0';
    popover.style.pointerEvents = 'none';
    popover.style.zIndex = '2';
    popover.appendChild(editorElement);
    container.appendChild(popover);
    const anchorRect = resolveAnchorRect(anchorElement, anchorRectFromDetail);
    const observer = new ResizeObserver((entries) => {
      const { height } = entries[0].contentRect;
      if (height > 0) {
        positionPopover(popover, anchorRect, container);
        popover.style.opacity = '1';
        popover.style.pointerEvents = '';
      }
    });
    observer.observe(popover);

    const outsideHandler = (evt) => {
      const path = evt.composedPath?.() || [];
      if (!path.includes(popover)) {
        closeActiveColorEditor();
      }
    };
    const escapeHandler = (evt) => {
      if (evt.key === 'Escape') {
        evt.stopPropagation();
        closeActiveColorEditor();
      }
    };

    document.addEventListener('click', outsideHandler, true);
    document.addEventListener('keydown', escapeHandler, true);

    activeColorEditor = {
      adapter,
      popover,
      mobile: false,
      resizeObserver: observer,
      outsideHandler,
      escapeHandler,
      railElement,
      selectedIndex,
    };

    requestAnimationFrame(async () => {
      try {
        await customElements.whenDefined('color-edit');
        await editorElement.updateComplete;
        if (activeColorEditor?.adapter !== adapter) return;
        await adapter.show?.();
      } catch (e) {
        window.lana?.log(`[color-editor] desktop show failed: ${e.message}`, { tags: 'color-edit' });
      }
    });
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
        ? createFourRowsColorBlindnessLayout(adapter, cbStrings)
        : createStripWithColorBlindness(adapter, orientation, cbStrings);

      const controller = getAdapterController(adapter);
      if (controller) {
        const onMobileCBEdit = (event) => {
          const { index, anchorEl, anchorRect } = event.detail;
          openColorEditorForRail(el, controller, index, anchorEl, anchorRect);
        };
        el.addEventListener('mobile-cb-swatch-edit', onMobileCBEdit);
        cleanupHandlers.push(() => el.removeEventListener('mobile-cb-swatch-edit', onMobileCBEdit));
      }
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
    if (!listElement || isEditorOpening) return;
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
