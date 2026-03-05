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

export function createBaseColorAdapter(options = {}) {
  import('../../../libs/color-components/components/base-color/index.js');

  const {
    color = '#FF0000',
    colorMode = 'HEX',
    showHeader = true,
    mobile = false,
    onColorChange,
    onModeChange,
    onClose,
  } = options;

  const container = document.createElement('div');
  container.className = 'base-color-wrapper';

  const baseColor = document.createElement('base-color');
  baseColor.color = color;
  baseColor.colorMode = colorMode;
  baseColor.showHeader = showHeader;
  baseColor.mobile = mobile;

  baseColor.addEventListener('color-change', (e) => {
    onColorChange?.(e.detail);
  });

  baseColor.addEventListener('mode-change', (e) => {
    onModeChange?.(e.detail);
  });

  baseColor.addEventListener('panel-close', () => {
    onClose?.();
  });

  container.appendChild(baseColor);

  return {
    element: container,
    show: () => baseColor.show(),
    hide: () => baseColor.hide(),
    setColor: (newColor) => { baseColor.color = newColor; },
    setColorMode: (mode) => { baseColor.colorMode = mode; },
    setShowHeader: (show) => { baseColor.showHeader = show; },
    getElement: () => baseColor,
    destroy: () => { container.remove(); },
  };
}

export function createColorEditAdapter(options = {}) {
  import('../../../libs/color-components/components/color-edit/index.js');

  const {
    palette = [],
    selectedIndex = 0,
    colorMode = 'RGB',
    mobile = false,
    onColorChange,
    onSwatchSelect,
    onModeChange,
    onClose,
  } = options;

  const container = document.createElement('div');
  container.className = 'color-edit-wrapper';

  const colorEdit = document.createElement('color-edit');
  colorEdit.palette = palette;
  colorEdit.selectedIndex = selectedIndex;
  colorEdit.colorMode = colorMode;
  colorEdit.mobile = mobile;

  colorEdit.addEventListener('color-change', (e) => {
    onColorChange?.(e.detail);
  });

  colorEdit.addEventListener('swatch-select', (e) => {
    onSwatchSelect?.(e.detail);
  });

  colorEdit.addEventListener('mode-change', (e) => {
    onModeChange?.(e.detail);
  });

  colorEdit.addEventListener('panel-close', () => {
    onClose?.();
  });

  container.appendChild(colorEdit);

  return {
    element: container,
    show: () => colorEdit.show(),
    hide: () => colorEdit.hide(),
    setPalette: (colors) => { colorEdit.palette = [...colors]; },
    setSelectedIndex: (index) => { colorEdit.selectedIndex = index; },
    setColorMode: (mode) => { colorEdit.colorMode = mode; },
    getElement: () => colorEdit,
    destroy: () => { container.remove(); },
  };
}

export function createColorSwatchAdapter(color, callbacks = {}) {
  import('../../../libs/color-components/components/ac-color-swatch/index.js');

  const element = document.createElement('ac-color-swatch');
  element.color = color;

  element.addEventListener('click', () => {
    callbacks.onClick?.(color);
  });

  return {
    element,
    setColor: (newColor) => {
      element.color = newColor;
    },
    destroy: () => {
      element.remove();
    },
  };
}
