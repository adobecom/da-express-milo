/**
 * Strip-container variant: uses <color-swatch-rail> (from color-poc), not <color-palette>.
 * Vertical rail with lock, hex label, copy — independent branch.
 * When config.colorBlindness === true: adds 3 rows per strip (Deuteranopia, Protanopia, Tritanopia).
 */
/* eslint-disable import/prefer-default-export */
import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import { createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';
import {
  TYPE_ORDER,
  TYPE_LABELS,
  getConflictPairs,
  getConflictingIndices,
  simulateHex,
} from '../services/createColorBlindnessService.js';

const COLORS_PER_ROW_TWO_ROWS = 6;
/** Rail contract: max 10 swatches (Figma 5806-89102). CB rows match rail column count. */
const MAX_CB_COLUMNS = 10;
const FOUR_ROWS_CB_COLS = 5;

const DEFAULT_ORIENTATIONS = ['horizontal', 'stacked', 'vertical'];

/** Inline SVG triangle for conflict (Figma 7500-496585). Replace with sp-icon-alert-triangle when icon is loaded in strip context. */
function createConflictIcon() {
  const el = createTag('span', {
    class: 'strip-color-blindness-swatch__conflict-icon',
    'aria-hidden': 'true',
    role: 'img',
    'aria-label': 'Conflict',
  });
  el.innerHTML = '<svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0L12 10H0L6 0Z" fill="var(--Alias-content-neutral-default, #292929)"/></svg>';
  return el;
}

/**
 * Simple 4 rows: title column outside rail width, then rail + 3 CB swatch rows in second column.
 * Grid: col 1 = titles (100px), col 2 = rail width (1fr). Row 1 = rail; rows 2–4 = label in col 1, swatches in col 2.
 */
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
    containerEl.style.gap = 'var(--Spacing-Spacing-50, 2px)';
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
          style: `background-color: ${sim};`,
        });
        if (conflicting.has(i)) swatch.appendChild(createConflictIcon());
        swatchesWrap.appendChild(swatch);
      });
      containerEl.appendChild(swatchesWrap);
    });
  });
  return () => unsub?.();
}

/**
 * Four-rows variant: layout = titles column + rail only.
 * Rail owns the 4 rows (row 1 = real, rows 2–4 = simulated in rail).
 * Only adds the grid and three title cells; no extra swatch rows.
 */
function createFourRowsColorBlindnessTitlesOnly(controller, containerEl, railWrapEl) {
  containerEl.style.display = 'grid';
  containerEl.style.gridTemplateColumns = '100px 1fr';
  containerEl.style.gridTemplateRows = '1fr 90px 90px 90px';
  containerEl.style.gap = 'var(--Spacing-Spacing-50, 2px)';
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

/**
 * Single 4-row Color Blindness layout: one grid, rail spans all 4 rows.
 * Row 1 = real colors, rows 2–4 = simulated in rail. Only three title cells; no extra DOM rows.
 * @param {Object} adapter - Swatch rail adapter (must have .controller and .element)
 * @returns {HTMLElement} The full 4-row grid container
 */
export function createFourRowsColorBlindnessLayout(adapter) {
  const rootClass = 'strip-with-color-blindness strip-with-color-blindness--matrix strip-with-color-blindness--four-rows';
  const gridContainer = createTag('div', { class: rootClass });
  const railContainer = createTag('div', { class: 'strip-variant--four-rows__rail-container' });
  railContainer.appendChild(adapter.element);
  gridContainer.appendChild(railContainer);
  const { controller } = adapter;
  if (controller) {
    createFourRowsColorBlindnessTitlesOnly(controller, gridContainer, railContainer);
    gridContainer._unsub = () => gridContainer.unsubFourRowsTitles?.();
  }
  return gridContainer;
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
          style: `background-color: ${sim};`,
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

/**
 * Count total conflict pairs across all three CB types for given colors.
 * @param {string[]} colors
 * @returns {{ total: number, hasAny: boolean }}
 */
function getTotalConflictCount(colors) {
  const limited = colors.slice(0, MAX_CB_COLUMNS);
  let total = 0;
  TYPE_ORDER.forEach((type) => {
    total += getConflictPairs(limited, type).length;
  });
  return { total, hasAny: total > 0 };
}

/** Checkmark circle inline SVG for "None" badge (Figma 3854-442327, S2 checkmark). */
function createCheckmarkIcon() {
  const span = createTag('span', {
    class: 'strip-conflict-summary__badge-icon',
    'aria-hidden': 'true',
  });
  span.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="currentColor"/><path d="M6 10l2.5 2.5L14 7" stroke="var(--Palette-white, #ffffff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
  return span;
}

/**
 * Conflict summary bar below the matrix (Figma 3854-442327).
 * Shows "Potential color blind conflicts" + badge: "None" (green) or "X conflicts" (warning).
 * Subscribes to controller and updates on any rail color change.
 */
function createConflictSummaryBlock(controller) {
  const wrap = createTag('div', { class: 'strip-conflict-summary' });
  const label = createTag('span', { class: 'strip-conflict-summary__label' });
  label.textContent = 'Potential color blind conflicts';
  const badge = createTag('span', { class: 'strip-conflict-summary__badge' });
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
    const { total, hasAny } = getTotalConflictCount(colors);
    if (hasAny) {
      badge.classList.remove('none');
      badge.classList.add('has-conflicts');
      badge.innerHTML = '';
      const icon = createTag('span', {
        class: 'strip-conflict-summary__badge-icon strip-conflict-summary__badge-icon--warning',
        'aria-hidden': 'true',
      });
      icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0L12 10H0L6 0Z" fill="currentColor"/></svg>';
      badge.appendChild(icon);
      badge.appendChild(document.createTextNode(total === 1 ? '1 conflict' : `${total} conflicts`));
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

  wrap._unsub = () => unsub?.();
  updateBadge([]);
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

  const controller = adapter.controller;
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
    conflictSummary._unsub = conflictSummary._unsub || (() => {});
    const origDestroy = adapter.destroy;
    adapter.destroy = () => {
      unsub?.();
      conflictSummary._unsub?.();
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
  /** When set (e.g. demo), use only these rails; else default horizontal + stacked + vertical. */
  const orientations = config?.stripContainerOrientations ?? DEFAULT_ORIENTATIONS;
  /** Which icons to show: ['copy','colorPicker'] or { copy, colorPicker, lock, hexCode }. Default: copy + colorPicker. */
  const swatchFeatures = config?.swatchFeatures;
  /** When true, add 3 rows per strip: Deuteranopia, Protanopia, Tritanopia. */
  const colorBlindness = config?.colorBlindness === true;

  let listElement = null;

  function railOptions(orientation) {
    const opts = { orientation };
    if (swatchFeatures != null) opts.swatchFeatures = swatchFeatures;
    return opts;
  }

  function appendStrip(adapter, orientation) {
    const el = colorBlindness ? createStripWithColorBlindness(adapter, orientation) : adapter.element;
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
