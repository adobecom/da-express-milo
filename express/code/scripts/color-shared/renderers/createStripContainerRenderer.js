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

const MAX_VARIANTS = 3;
const COLORS_PER_ROW_TWO_ROWS = 6;

const DEFAULT_ORIENTATIONS = ['horizontal', 'stacked', 'vertical'];

function createColorBlindnessRows(controller, orientation) {
  const isTwoRows = orientation === 'two-rows';
  const wrap = createTag('div', {
    class: `strip-color-blindness-rows${isTwoRows ? ' strip-color-blindness-rows--two-rows' : ''}`,
  });
  const unsub = controller?.subscribe?.((state) => {
    const colors = (state?.swatches || []).map((s) => s?.hex).filter(Boolean);
    if (!colors.length) return;
    wrap.innerHTML = '';
    TYPE_ORDER.forEach((type) => {
      const pairs = getConflictPairs(colors, type);
      const conflicting = getConflictingIndices(pairs);
      const rowFails = pairs.length > 0;
      const row = createTag('div', {
        class: `strip-color-blindness-row strip-color-blindness-row--${type} ${rowFails ? 'fail' : 'pass'}${isTwoRows ? ' strip-color-blindness-row--two-rows' : ''}`,
      });
      const label = createTag('span', { class: 'strip-color-blindness-row__label' });
      label.textContent = TYPE_LABELS[type];
      const passFail = createTag('span', {
        class: `strip-color-blindness-row__pass-fail ${rowFails ? 'fail' : 'pass'}`,
      });
      passFail.textContent = rowFails ? 'Fail' : 'Pass';
      const swatchesContainer = createTag('div', {
        class: isTwoRows ? 'strip-color-blindness-row__grid' : 'strip-color-blindness-row__swatches',
      });
      if (isTwoRows) {
        const header = createTag('div', { class: 'strip-color-blindness-row__header' });
        header.appendChild(label);
        header.appendChild(passFail);
        /* One row per condition: single row of swatches matching rail column count */
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
          swatchesContainer.appendChild(swatch);
        });
        row.appendChild(header);
      } else {
        colors.forEach((hex, i) => {
          const sim = simulateHex(hex, type);
          const swatch = createTag('div', {
            class: `strip-color-blindness-swatch${conflicting.has(i) ? ' conflict' : ''}`,
            style: `background-color: ${sim};`,
          });
          swatchesContainer.appendChild(swatch);
        });
        row.appendChild(label);
        row.appendChild(passFail);
      }
      row.appendChild(swatchesContainer);
      wrap.appendChild(row);
    });
  });
  return { wrap, unsub: () => unsub?.() };
}

export function createStripWithColorBlindness(adapter, orientation) {
  const isTwoRows = orientation === 'two-rows';
  const outer = createTag('div', {
    class: `strip-with-color-blindness${isTwoRows ? ' strip-with-color-blindness--two-rows' : ''}`,
  });
  if (isTwoRows && adapter.rail) {
    adapter.rail.setAttribute('embedded', '');
  }
  outer.appendChild(adapter.element);
  const controller = adapter.controller;
  if (controller) {
    const { wrap, unsub } = createColorBlindnessRows(controller, orientation);
    outer.appendChild(wrap);
    const origDestroy = adapter.destroy;
    adapter.destroy = () => {
      unsub?.();
      origDestroy?.();
    };
  }
  return outer;
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
