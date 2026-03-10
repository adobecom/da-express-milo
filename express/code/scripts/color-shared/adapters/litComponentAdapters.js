import { createGradientEditor } from '../components/gradients/gradient-editor.js';
import { wrapInTheme } from '../spectrum/utils/theme.js';

const VERTICAL_STACKED_BREAKPOINT_PX = 1200;

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

function resolveVerticalResponsive() {
  if (typeof window === 'undefined') return 'stacked';
  return window.matchMedia(`(min-width: ${VERTICAL_STACKED_BREAKPOINT_PX}px)`).matches ? 'vertical' : 'stacked';
}

export function createSwatchRailAdapter(paletteOrController, options = {}) {
  import('../../../libs/color-components/components/color-swatch-rail/index.js');

  const isController = typeof paletteOrController?.subscribe === 'function';
  const controller = isController ? paletteOrController : createSwatchRailController(paletteOrController);

  const element = document.createElement('color-swatch-rail');
  if (!isController) element.className = 'rail-palette';
  let responsiveUnsubscribe = null;
  const byOrientation = options.swatchFeaturesByOrientation;

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

  if (options.orientation === 'vertical-responsive') {
    setResolvedOrientation('vertical-responsive');
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia(`(min-width: ${VERTICAL_STACKED_BREAKPOINT_PX}px)`);
      const onChange = () => setResolvedOrientation('vertical-responsive');
      mq.addEventListener('change', onChange);
      responsiveUnsubscribe = () => mq.removeEventListener('change', onChange);
    }
  } else if (options.orientation) {
    setResolvedOrientation(options.orientation);
  }

  if (options.variant) {
    element.setAttribute('data-variant', options.variant);
  }
  if (options.hexCopyFirstRowOnly === true) {
    element.hexCopyFirstRowOnly = true;
    element.setAttribute('hex-copy-first-row-only', '');
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
  element.setAttribute('show-name-tooltip', 'true');
  element.setAttribute('palette-aria-label', 'Palette {hex}, color {index}');

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

export function createGradientEditorAdapter(initialGradient, callbacks = {}) {
  const editor = createGradientEditor(initialGradient, {
    height: 80,
    size: 'l',
    ariaLabel: 'Gradient editor',
  });

  editor.element.addEventListener('gradient-editor:change', (e) => {
    callbacks.onChange?.(e.detail);
  });

  editor.element.addEventListener('gradient-editor:color-click', (e) => {
    callbacks.onColorClick?.(e.detail.stop, e.detail.index);
  });

  return {
    element: editor.element,
    getGradient: () => editor.getGradient(),
    setGradient: (gradient) => editor.setGradient(gradient),
    updateColorStop: (index, color) => editor.updateColorStop(index, color),
    destroy: () => editor.destroy(),
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

export function createColorEditAdapter(options = {}, callbacks = {}) {
  import('../components/color-edit/index.js');

  const element = document.createElement('color-edit');
  const {
    palette = [],
    selectedIndex = 0,
    colorMode = 'RGB',
    showPalette = true,
    mobile = false,
  } = options;

  element.palette = palette.slice(0, 10);
  element.selectedIndex = selectedIndex;
  element.colorMode = colorMode;
  element.showPalette = showPalette;
  element.mobile = mobile;

  element.addEventListener('color-change', (e) => {
    callbacks.onColorChange?.(e.detail);
  });
  element.addEventListener('swatch-select', (e) => {
    callbacks.onSwatchSelect?.(e.detail);
  });
  element.addEventListener('mode-change', (e) => {
    callbacks.onModeChange?.(e.detail);
  });
  element.addEventListener('panel-close', () => {
    callbacks.onClose?.();
  });

  return {
    element,
    show: () => element.show?.(),
    hide: () => element.hide?.(),
    setPalette: (colors) => {
      element.palette = Array.isArray(colors) ? colors.slice(0, 10) : [];
    },
    setSelectedIndex: (index) => {
      element.selectedIndex = index;
    },
    setColorMode: (mode) => {
      element.colorMode = mode;
    },
    getElement: () => element,
    destroy: () => element.remove(),
  };
}

export function createBaseColorAdapter(options = {}, callbacks = {}) {
  import('../components/base-color/index.js');

  const element = document.createElement('base-color');
  const {
    color = '#FF0000',
    colorMode = 'HEX',
    showHeader = true,
    showBrightnessControl = true,
  } = options;

  element.color = color;
  element.colorMode = colorMode;
  element.showHeader = showHeader;
  element.showBrightnessControl = showBrightnessControl;

  element.addEventListener('color-change', (e) => {
    callbacks.onColorChange?.(e.detail);
  });
  element.addEventListener('mode-change', (e) => {
    callbacks.onModeChange?.(e.detail);
  });
  element.addEventListener('lock-change', (e) => {
    callbacks.onLockChange?.(e.detail);
  });

  return {
    element,
    setColor: (hex) => {
      element.color = hex;
    },
    setColorMode: (mode) => {
      element.colorMode = mode;
    },
    getElement: () => element,
    destroy: () => element.remove(),
  };
}
