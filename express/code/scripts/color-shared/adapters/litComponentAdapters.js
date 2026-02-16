/**
 * Minimal controller for <color-swatch-rail> (same shape as color-poc).
 * state: { swatches: [{ hex }, ...], baseColorIndex: number }
 */
function createSwatchRailController(paletteData) {
  const colors = paletteData?.colors || [];
  const swatches = colors.map((c) => ({ hex: c.startsWith('#') ? c : `#${c}` }));
  let state = { swatches, baseColorIndex: 0 };
  let listener = null;
  return {
    subscribe(fn) {
      listener = fn;
      fn(state);
      return () => { listener = null; };
    },
    getState: () => state,
    setState(next) {
      state = { ...state, ...next };
      if (listener) listener(state);
    },
  };
}

/**
 * Adapter for <color-swatch-rail> (strip-container variant; from color-poc).
 * Uses controller with swatches from palette.colors.
 */
export function createSwatchRailAdapter(paletteData, callbacks = {}) {
  import('../../../libs/color-components/components/color-swatch-rail/index.js');

  const element = document.createElement('color-swatch-rail');
  element.className = 'rail-palette';
  if (callbacks.orientation === 'horizontal' || callbacks.orientation === 'stacked') {
    element.setAttribute('orientation', callbacks.orientation);
    element.orientation = callbacks.orientation;
  }
  const controller = createSwatchRailController(paletteData);
  element.controller = controller;

  return {
    element,
    controller,
    update: (newData) => {
      const next = createSwatchRailController(newData);
      controller.setState(next.getState());
    },
    destroy: () => {
      element.remove();
    },
  };
}

export function createPaletteAdapter(paletteData, callbacks = {}) {
  import('../../../libs/color-components/components/color-palette/index.js');

  const element = document.createElement('color-palette');
  element.palette = paletteData;
  element.wrap = true;
  element.setAttribute('palette-aria-label', 'Palette {hex}, color {index}');
  element.setAttribute('selection-source', 'default-palette');

  const { stripOptions } = callbacks;
  if (stripOptions?.orientation === 'vertical') {
    element.setAttribute('vertical', '');
  } else {
    element.removeAttribute('vertical');
  }

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

export function createColorSwatchAdapter(color, callbacks = {}) {
  import('../../../libs/color-components/components/ac-color-swatch/index.js');

  const element = document.createElement('ac-color-swatch');
  element.swatch = color;
  if (element.setAttribute) element.setAttribute('aria-label', callbacks.ariaLabel || 'Color swatch');

  element.addEventListener('click', () => {
    callbacks.onClick?.(color);
  });

  return {
    element,
    setColor: (newColor) => {
      element.swatch = newColor;
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
