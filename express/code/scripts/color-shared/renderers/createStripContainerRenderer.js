import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import { createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';
import { getContrastTextColor } from '../../../libs/color-components/utils/ColorConversions.js';
import {
  TYPE_ORDER,
  TYPE_LABELS,
  getConflictPairs,
  getConflictingIndices,
  simulateHex,
} from '../services/createColorBlindnessService.js';

const COLORS_PER_ROW_TWO_ROWS = 6;

const MAX_CB_COLUMNS = 10;
const FOUR_ROWS_CB_COLS = 5;

const DEFAULT_ORIENTATIONS = ['horizontal', 'stacked', 'vertical'];

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
  el.innerHTML = '<svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0L12 10H0L6 0Z" fill="currentColor"/></svg>';
  return el;
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
  });
  return () => unsub?.();
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
  containerEl.unsubFourRowsTitles = () => titleUnsubs.forEach((fn) => fn?.());
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
  });
  return { wrap, unsub: () => unsub?.() };
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
  const badge = createTag('sp-badge', {
    class: 'strip-conflict-summary__badge',
    size: 's',
    variant: 'green',
  });
  wrap.appendChild(label);
  wrap.appendChild(badge);

  function updateBadge(colors) {
    if (!colors.length) {
      badge.classList.remove('has-conflicts');
      badge.classList.add('none');
      badge.setAttribute('variant', 'green');
      badge.innerHTML = '';
      badge.appendChild(createCheckmarkIcon());
      badge.appendChild(document.createTextNode('None'));
      return;
    }
    const { hasAny } = getTotalConflictCount(colors, maxColumns);
    if (hasAny) {
      badge.classList.remove('none');
      badge.classList.add('has-conflicts');
      badge.setAttribute('variant', 'red');
      badge.innerHTML = '';
      badge.appendChild(createWarningIcon());
      badge.appendChild(document.createTextNode('Conflicts found'));
    } else {
      badge.classList.remove('has-conflicts');
      badge.classList.add('none');
      badge.setAttribute('variant', 'green');
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

  const colorBlindness = config?.colorBlindness === true;

  let listElement = null;

  function railOptions(orientation) {
    const opts = { orientation };
    if (swatchFeatures != null) opts.swatchFeatures = swatchFeatures;
    return opts;
  }

  function appendStrip(adapter, orientation) {
    const el = colorBlindness
      ? createStripWithColorBlindness(adapter, orientation)
      : adapter.element;
    listElement.appendChild(el);
  }

  function render(container) {
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
    listElement.innerHTML = '';
    const data = (Array.isArray(newData) ? newData : getData()).slice(0, orientations.length);
    data.forEach((palette, index) => {
      const adapter = createSwatchRailAdapter(palette, railOptions(orientations[index]));
      appendStrip(adapter, orientations[index]);
    });
  }

  function destroy() {
    listElement = null;
  }

  return {
    ...base,
    render,
    update,
    destroy,
  };
}
