import { wrapInTheme } from '../spectrum/utils/theme.js';

/**
 * Minimal controller for <color-swatch-rail> (same shape as color-poc).
 * state: { swatches: [{ hex }, ...], baseColorIndex: number }
 * Supports multiple subscribers so Pass/Fail rows update when palette colors change.
 */
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

/** Assumed breakpoint: below this width rail is stacked; at or above, vertical. Component stays viewport-agnostic. */
const VERTICAL_STACKED_BREAKPOINT_PX = 1200;

function resolveVerticalResponsive() {
  if (typeof window === 'undefined') return 'stacked';
  return window.matchMedia(`(min-width: ${VERTICAL_STACKED_BREAKPOINT_PX}px)`).matches ? 'vertical' : 'stacked';
}

/**
 * Adapter for <color-swatch-rail>. Accepts either:
 * - (paletteData, options): builds controller from palette.colors; options.orientation, options.swatchFeatures
 * - (controller, options): uses existing controller; options.orientation, options.swatchFeatures
 *
 * orientation: 'vertical' | 'stacked' | 'horizontal' | 'two-rows' | 'vertical-responsive'.
 *   'vertical-responsive' = assume <1200px stacked, ≥1200px vertical; adapter resolves and keeps in sync (no component API).
 * swatchFeatures: Object, array, or 'all'. Object: { copy, colorPicker, lock, hexCode, trash, drag, addLeft, addRight, editTint, colorBlindness, baseColor, emptyStrip, editColorDisabled }.
 * swatchFeaturesByOrientation: { stacked: ['copy'], vertical: ['copy','colorPicker'] } — features per orientation.
 */
export function createSwatchRailAdapter(paletteOrController, options = {}) {
  import('../../../libs/color-components/components/color-swatch-rail/index.js');

  const isController = typeof paletteOrController?.subscribe === 'function';
  const controller = isController ? paletteOrController : createSwatchRailController(paletteOrController);

  const element = document.createElement('color-swatch-rail');
  if (!isController) element.className = 'rail-palette';
  let orientation = options.orientation;
  const byOrientation = options.swatchFeaturesByOrientation;
  let responsiveUnsubscribe = null;

  function applyFeaturesForOrientation(o) {
    if (byOrientation && o && byOrientation[o] != null) {
      element.swatchFeatures = byOrientation[o];
    }
  }

  function setResolvedOrientation(o) {
    const resolved = o === 'vertical-responsive' ? resolveVerticalResponsive() : o;
    if (!resolved) return;
    element.setAttribute('orientation', resolved);
    element.orientation = resolved;
    if (typeof element.requestUpdate === 'function') element.requestUpdate();
    applyFeaturesForOrientation(resolved);
  }

  if (orientation === 'vertical-responsive') {
    setResolvedOrientation('vertical-responsive');
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia(`(min-width: ${VERTICAL_STACKED_BREAKPOINT_PX}px)`);
      const onChange = () => setResolvedOrientation('vertical-responsive');
      mq.addEventListener('change', onChange);
      responsiveUnsubscribe = () => mq.removeEventListener('change', onChange);
    }
  } else if (orientation) {
    setResolvedOrientation(orientation);
  }

  if (options.variant) {
    element.setAttribute('data-variant', options.variant);
  }
  if (options.swatchFeatures != null && !byOrientation) {
    element.swatchFeatures = options.swatchFeatures;
  }
  element.controller = controller;

  const wrapped = wrapInTheme(element, { system: 'spectrum-two' });

  const result = {
    element: wrapped,
    rail: element,
    destroy: () => {
      responsiveUnsubscribe?.();
      wrapped.remove();
    },
    setOrientation: (o) => {
      if (o === 'vertical-responsive') {
        if (!responsiveUnsubscribe && typeof window !== 'undefined' && window.matchMedia) {
          const mq = window.matchMedia(`(min-width: ${VERTICAL_STACKED_BREAKPOINT_PX}px)`);
          const onChange = () => setResolvedOrientation('vertical-responsive');
          mq.addEventListener('change', onChange);
          responsiveUnsubscribe = () => mq.removeEventListener('change', onChange);
        }
        setResolvedOrientation('vertical-responsive');
      } else {
        setResolvedOrientation(o);
      }
    },
    setSwatchFeatures: (features) => {
      element.swatchFeatures = features;
    },
  };
  if (!isController) {
    result.controller = controller;
    result.update = (newData) => {
      const next = createSwatchRailController(newData);
      controller.setState(next.getState());
    };
  }
  return result;
}

export function createPaletteAdapter(paletteData, callbacks = {}) {
  import('../../../libs/color-components/components/color-palette/index.js');

  const element = document.createElement('color-palette');
  element.palette = paletteData;
  element.wrap = true;
  element.setAttribute('palette-aria-label', 'Palette {hex}, color {index}');
  element.setAttribute('selection-source', 'default-palette');
  element.setAttribute('focusable', 'false');
  element.focusable = false;
  element.removeAttribute('vertical');

  element.addEventListener('ac-palette-select', (e) => {
    callbacks.onSelect?.(e.detail.palette);
  });

  return {
    element,
    update: (newData) => {
      element.palette = newData;
    },
    destroy: () => {
      element.remove();
    },
  };
}

export function createSearchAdapter(callbacks = {}) {
  import('../../../libs/color-components/components/color-search/index.js');

  const element = document.createElement('color-search');
  element.setAttribute('placeholder', 'Search colors...');

  element.addEventListener('color-search', (e) => {
    callbacks.onSearch?.(e.detail.query);
  });

  return {
    element,
    setQuery: (query) => {
      element.value = query;
    },
    clear: () => {
      element.value = '';
    },
    destroy: () => {
      element.remove();
    },
  };
}

export function createColorWheelAdapter(initialColor, callbacks = {}) {
  import('../../../libs/color-components/components/color-wheel/index.js');

  const element = document.createElement('color-wheel');
  element.color = initialColor;
  element.setAttribute('aria-label', 'Color Wheel');
  element.setAttribute('wheel-marker-size', '21');

  element.addEventListener('change', (e) => {
    callbacks.onChange?.(e.detail);
  });

  element.addEventListener('change-end', (e) => {
    callbacks.onChangeEnd?.(e.detail);
  });

  return {
    element,
    setColor: (color) => {
      element.color = color;
    },
    destroy: () => {
      element.remove();
    },
  };
}

/**
 * Wraps <ac-color-swatch> from libs/color-components. WC uses property `swatch` (hex string).
 * Used in gradient modal for each color stop.
 */
export function createColorSwatchAdapter(color, callbacks = {}) {
  import('../../../libs/color-components/components/ac-color-swatch/index.js');

  const element = document.createElement('ac-color-swatch');
  const hex = color?.startsWith('#') ? color : `#${color || '000000'}`;
  element.swatch = hex;
  if (element.setAttribute) element.setAttribute('aria-label', callbacks.ariaLabel || 'Color swatch');

  element.addEventListener('ac-color-swatch-selected', (e) => {
    callbacks.onClick?.(e.detail?.color ?? hex);
  });

  return {
    element,
    setColor: (newColor) => {
      const next = newColor?.startsWith('#') ? newColor : `#${newColor || '000000'}`;
      element.swatch = next;
    },
    destroy: () => {
      element.remove();
    },
  };
}

/**
 * Adapter for <color-palette-list>.
 * Props: palettelist { name, palettes[] }, minVisiblePalettes, showAll, hide-list-header.
 * Awaits component load so Lit receives initial props.
 */
export async function createPaletteListAdapter(palettelistData, callbacks = {}) {
  await import('../../../libs/color-components/components/color-palette-list/index.js');

  const element = document.createElement('color-palette-list');
  element.palettelist = palettelistData;
  if (callbacks.minVisiblePalettes != null) {
    element.minVisiblePalettes = callbacks.minVisiblePalettes;
  }
  if (callbacks.showAll != null) element.showAll = callbacks.showAll;
  if (callbacks.hideListHeader === true) {
    element.setAttribute('hide-list-header', '');
  }

  element.addEventListener('ac-palette-view-all', () => callbacks.onViewAll?.());
  element.addEventListener('ac-palette-select', (e) => callbacks.onSelect?.(e.detail));

  return {
    element,
    update: (newData) => {
      element.palettelist = newData;
    },
    destroy: () => {
      element.remove();
    },
  };
}

/**
 * Adapter for <ac-color-swatch-list>.
 * Props: swatchList [{ id, color }], headerText, showAddIcon, relationship.
 * Awaits component load so Lit receives initial props.
 */
export async function createColorSwatchListAdapter(options = {}, callbacks = {}) {
  await import('../../../libs/color-components/components/ac-color-swatch-list/index.js');

  const element = document.createElement('ac-color-swatch-list');
  element.swatchList = options.swatchList || [];
  if (options.headerText != null) element.headerText = options.headerText;
  if (options.showAddIcon != null) element.showAddIcon = options.showAddIcon;
  if (options.relationship != null) element.relationship = options.relationship;
  if (options.addButtonEnabled != null) {
    element.setAttribute('enable-add-button', options.addButtonEnabled ? '' : null);
  }

  element.addEventListener('ac-swatch-list-add', () => callbacks.onAdd?.());
  element.addEventListener('ac-swatch-select', (e) => callbacks.onSelect?.(e.detail));

  return {
    element,
    update: (opts) => {
      if (opts?.swatchList) element.swatchList = opts.swatchList;
      if (opts?.headerText != null) element.headerText = opts.headerText;
    },
    destroy: () => {
      element.remove();
    },
  };
}

/**
 * Adapter for <color-palette-icon-button>. Props: active, aria-label. Fires ac-palette-icon-select.
 * Awaits component load so the element is defined before use.
 */
export async function createPaletteIconButtonAdapter(options = {}, callbacks = {}) {
  await import('../../../libs/color-components/components/color-palette-icon-button/index.js');

  const element = document.createElement('color-palette-icon-button');
  if (options.active != null) element.setAttribute('active', options.active ? '' : null);
  if (options.ariaLabel != null) element.setAttribute('aria-label', options.ariaLabel);

  element.addEventListener('ac-palette-icon-select', () => callbacks.onSelect?.());

  return {
    element,
    setActive: (active) => {
      element.isActive = active;
      element.toggleAttribute('active', active);
    },
    destroy: () => {
      element.remove();
    },
  };
}

/**
 * Wraps <ac-color-swatch-list>. Props: swatchList [{ id, color }], headerText, showAddIcon, etc.
 * Events: ac-color-swatch-selected, ac-color-swatch-added.
 */
export function createSwatchListAdapter(swatchList = [], options = {}) {
  import('../../../libs/color-components/components/ac-color-swatch-list/index.js');

  const element = document.createElement('ac-color-swatch-list');
  element.swatchList = swatchList;
  if (options.headerText != null) element.headerText = options.headerText;
  if (options.showAddIcon != null) element.showAddIcon = options.showAddIcon;
  if (options.addButtonEnabled != null) element.addButtonEnabled = options.addButtonEnabled;

  element.addEventListener('ac-color-swatch-selected', (e) => {
    options.onSwatchSelected?.(e.detail);
  });
  element.addEventListener('ac-color-swatch-added', () => {
    options.onAdd?.();
  });

  return {
    element,
    update: (list) => {
      element.swatchList = list;
    },
    destroy: () => element.remove(),
  };
}

/**
 * Wraps <color-harmony-toolbar>. Requires controller { subscribe(fn), setHarmonyRule(rule) }.
 */
export function createHarmonyToolbarAdapter(controller, callbacks = {}) {
  import('../../../libs/color-components/components/color-harmony-toolbar/index.js');

  const element = document.createElement('color-harmony-toolbar');
  element.controller = controller;

  return {
    element,
    destroy: () => element.remove(),
  };
}

