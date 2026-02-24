export function createPaletteAdapter(paletteData, callbacks = {}) {
  import('../../../libs/color-components/components/color-palette/index.js');

  const element = document.createElement('color-palette');
  element.palette = paletteData;
  element.setAttribute('show-name-tooltip', 'true');
  element.setAttribute('palette-aria-label', `Palette {hex}, color {index}`);

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

/**
 * Wraps <color-swatch-rail> (extended: orientation = vertical | horizontal | stacked).
 * Requires controller { subscribe(fn) } returning state { swatches, baseColorIndex }.
 * @param {Object} controller - Theme controller
 * @param {Object} [options] - orientation: 'vertical' | 'horizontal' | 'stacked'
 */
export function createSwatchRailAdapter(controller, options = {}) {
  import('../../../libs/color-components/components/color-swatch-rail/index.js');

  const element = document.createElement('color-swatch-rail');
  element.controller = controller;
  if (options.orientation) element.orientation = options.orientation;

  return {
    element,
    setOrientation: (orientation) => {
      element.orientation = orientation;
    },
    destroy: () => element.remove(),
  };
}
