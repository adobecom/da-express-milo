import { createBaseRenderer } from './createBaseRenderer.js';
import { wrapInTheme } from '../spectrum/utils/theme.js';
import { loadIconsRail } from '../spectrum/load-spectrum.js';

const DEFAULT_SWATCH_ORIENTATION = 'stacked';

function normalizeHex(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function normalizePalette(entry, index) {
  const swatches = Array.isArray(entry?.swatches) ? entry.swatches : null;
  const colorsFromSwatches = swatches
    ? swatches
      .map((swatch) => {
        if (typeof swatch === 'string') return normalizeHex(swatch);
        return normalizeHex(swatch?.hex || swatch?.value || '');
      })
      .filter(Boolean)
    : [];
  const colorsFromPalette = Array.isArray(entry?.colors)
    ? entry.colors.map((color) => normalizeHex(color)).filter(Boolean)
    : [];
  const colors = colorsFromSwatches.length ? colorsFromSwatches : colorsFromPalette;
  return {
    ...entry,
    id: entry?.id || `swatch-${index + 1}`,
    name: entry?.name || `Swatches ${index + 1}`,
    colors,
  };
}

function normalizeData(data) {
  return (Array.isArray(data) ? data : [])
    .map(normalizePalette)
    .filter((entry) => entry.colors.length > 0);
}

function createSwatchRailController(paletteData) {
  const colors = paletteData?.colors || [];
  const swatches = colors.map((c) => ({ hex: c.startsWith('#') ? c : `#${c}` }));
  let state = { swatches, baseColorIndex: 0 };
  const listeners = new Set();
  return {
    subscribe(fn) {
      listeners.add(fn);
      fn(state);
      return () => { listeners.delete(fn); };
    },
    getState: () => state,
    setState(next) {
      state = { ...state, ...next };
      listeners.forEach((fn) => fn(state));
    },
  };
}

function createSwatchRailAdapter(paletteData, options = {}) {
  import('../../../libs/color-components/components/color-swatch-rail/index.js');

  const controller = createSwatchRailController(paletteData);
  const element = document.createElement('color-swatch-rail');
  if (options.orientation) {
    element.orientation = options.orientation;
    element.setAttribute('orientation', options.orientation);
  }
  if (Number.isFinite(options.verticalMaxPerRow)) {
    const verticalMaxPerRow = Math.max(1, Math.min(10, Math.floor(options.verticalMaxPerRow)));
    element.verticalMaxPerRow = verticalMaxPerRow;
    element.setAttribute('vertical-max-per-row', String(verticalMaxPerRow));
  }
  if (options.hexCopyFirstRowOnly === true) {
    element.hexCopyFirstRowOnly = true;
    element.setAttribute('hex-copy-first-row-only', '');
  }
  if (options.swatchFeatures != null) {
    element.swatchFeatures = options.swatchFeatures;
  }
  element.controller = controller;
  loadIconsRail()
    .then(() => {
      if (typeof element.requestUpdate === 'function') element.requestUpdate();
    })
    .catch(() => {});

  const wrapped = wrapInTheme(element, { system: 'spectrum-two' });

  return {
    element: wrapped,
    rail: element,
    destroy: () => wrapped.remove(),
  };
}

export function createSwatchesRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData, config } = base;
  const mounts = [];

  const orientation = config?.swatchOrientation
    || config?.stripOptions?.orientation
    || DEFAULT_SWATCH_ORIENTATION;

  const swatchFeatures = config?.swatchFeatures;
  const hexCopyFirstRowOnly = config?.hexCopyFirstRowOnly === true;
  const verticalMaxPerRow = Number.isFinite(config?.swatchVerticalMaxPerRow)
    ? Math.max(1, Math.min(10, Math.floor(config.swatchVerticalMaxPerRow)))
    : null;

  function clearMounts() {
    while (mounts.length) {
      const mount = mounts.pop();
      mount?.adapter?.destroy?.();
    }
  }

  function renderSwatches(container, data) {
    clearMounts();
    container.innerHTML = '';

    const palettes = normalizeData(data);
    if (!palettes.length) return;

    palettes.forEach((palette) => {
      const opts = { orientation };
      if (swatchFeatures != null) opts.swatchFeatures = swatchFeatures;
      if (hexCopyFirstRowOnly) opts.hexCopyFirstRowOnly = true;
      if (verticalMaxPerRow != null) opts.verticalMaxPerRow = verticalMaxPerRow;
      const adapter = createSwatchRailAdapter(palette, opts);
      mounts.push({ adapter });
      container.appendChild(adapter.element);
    });
  }

  function render(container) {
    renderSwatches(container, getData());
  }

  function update(newData) {
    const mountPoint = options?.container;
    if (!mountPoint) return;
    renderSwatches(mountPoint, newData ?? getData());
  }

  function destroy() {
    clearMounts();
  }

  return {
    ...base,
    render,
    update,
    destroy,
  };
}

export default createSwatchesRenderer;
