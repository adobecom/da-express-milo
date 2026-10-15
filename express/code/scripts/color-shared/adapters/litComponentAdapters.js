import { createGradientEditor } from '../components/gradients/gradient-editor.js';
import { wrapInTheme } from '../spectrum/utils/theme.js';
import { loadIconsRail } from '../spectrum/load-spectrum.js';
import {
  getPreferredColorMode,
  setPreferredColorMode,
  subscribeColorMode,
} from '../utils/colorModePreference.js';

const VERTICAL_STACKED_BREAKPOINT_PX = 1200;

function createSwatchRailController(paletteData) {
  const colors = paletteData?.colors || [];
  const swatches = colors.map((c) => ({ hex: c.startsWith('#') ? c : `#${c}` }));
  let state = { swatches, baseColorIndex: paletteData?.baseColorIndex ?? 0 };
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

// Fire-and-forget with no catch would leave `color-swatch-rail` permanently
// undefined (empty rail, no retry) if a cold/uncached first load hits a
// transient network failure — retry once before giving up silently.
// Exported so callers (createModalManager) can kick this off early — e.g. as
// soon as the page's modal manager is created — instead of only on first
// use, which is what caused the rail to visibly pop in after a modal opened.
export function loadSwatchRailElement() {
  import('../../../libs/color-components/components/color-swatch-rail/index.js').catch(() => (
    import('../../../libs/color-components/components/color-swatch-rail/index.js').catch(() => {})
  ));
}

// WebKit (Safari 27) can throw mid-construction when upgrading an
// already-defined custom element, which the spec requires catching and
// reporting internally rather than propagating — so the instance silently
// stays un-upgraded (no Lit lifecycle) instead of erroring visibly. That
// failure is permanent for that one instance, but unrelated to the class
// itself, so a fresh instance gets its own independent upgrade attempt.
// Skip retrying when the class isn't registered yet — that's the normal,
// legitimate case (see loadSwatchRailElement) and resolves on its own once
// defined, via the browser's standard auto-upgrade-on-define.
function createSwatchRailElement(maxAttempts = 3) {
  let element = document.createElement('color-swatch-rail');
  if (!customElements.get('color-swatch-rail')) return element;
  let attempt = 1;
  while (typeof element.requestUpdate !== 'function' && attempt < maxAttempts) {
    element = document.createElement('color-swatch-rail');
    attempt += 1;
  }
  if (typeof element.requestUpdate !== 'function') {
    window.lana?.log('color-swatch-rail failed to upgrade after retries', {
      tags: 'color-swatch-rail,webkit-upgrade',
      severity: 'warning',
    });
  }
  return element;
}

export function createSwatchRailAdapter(paletteOrController, options = {}) {
  loadSwatchRailElement();

  const isController = typeof paletteOrController?.subscribe === 'function';
  const controller = isController
    ? paletteOrController
    : createSwatchRailController(paletteOrController);

  const element = createSwatchRailElement();
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
  if (Number.isFinite(options.verticalMaxPerRow)) {
    const verticalMaxPerRow = Math.max(1, Math.min(10, Math.floor(options.verticalMaxPerRow)));
    element.verticalMaxPerRow = verticalMaxPerRow;
    element.setAttribute('vertical-max-per-row', String(verticalMaxPerRow));
  }
  if (options.hexCopyFirstRowOnly === true) {
    element.hexCopyFirstRowOnly = true;
    element.setAttribute('hex-copy-first-row-only', '');
  }
  if (options.swatchFeatures != null && !byOrientation) {
    element.swatchFeatures = options.swatchFeatures;
  }
  if (options.strings) {
    element.strings = options.strings;
  }
  element.controller = controller;
  loadIconsRail()
    .then(() => {
      if (typeof element.requestUpdate === 'function') element.requestUpdate();
    })
    .catch(() => {});

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
      const colors = newData?.colors || [];
      const swatches = colors.map((c) => ({ hex: c.startsWith('#') ? c : `#${c}` }));
      controller.setState({ swatches, baseColorIndex: newData?.baseColorIndex ?? 0 });
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

export function createSearchAdapter({ placeholder, ...callbacks } = {}) {
  import('../../../libs/color-components/components/color-search/index.js');

  const element = document.createElement('color-search');
  element.setAttribute('placeholder', placeholder ?? 'Search colors...');

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
    strings,
    baseColorStrings,
  } = options;

  element.palette = palette.slice(0, 10);
  element.selectedIndex = selectedIndex;
  element.colorMode = getPreferredColorMode(colorMode);
  element.showPalette = showPalette;
  element.mobile = mobile;
  if (strings) element.strings = strings;
  if (baseColorStrings) element.baseColorStrings = baseColorStrings;

  element.addEventListener('color-change', (e) => {
    callbacks.onColorChange?.(e.detail);
  });
  element.addEventListener('color-change-end', (e) => {
    callbacks.onColorChangeEnd?.(e.detail);
  });
  element.addEventListener('swatch-select', (e) => {
    callbacks.onSwatchSelect?.(e.detail);
  });
  element.addEventListener('mode-change', (e) => {
    setPreferredColorMode(e.detail?.mode);
    callbacks.onModeChange?.(e.detail);
  });
  element.addEventListener('panel-close', () => {
    callbacks.onClose?.();
  });

  const unsubscribe = subscribeColorMode((mode) => {
    if (element.colorMode !== mode) element.colorMode = mode;
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
    destroy: () => {
      unsubscribe();
      element.remove();
    },
  };
}

export function createColorChannelSliderAdapter(options = {}, callbacks = {}) {
  import('../components/color-channel-slider/index.js');

  const element = document.createElement('color-channel-slider');
  const {
    value = 0,
    min = 0,
    max = 100,
    label = '',
    valuetext = '',
    gradient = '',
    disabled = false,
  } = options;

  element.value = value;
  element.min = min;
  element.max = max;
  element.label = label;
  element.valuetext = valuetext;
  element.gradient = gradient;
  element.disabled = disabled;

  element.addEventListener('input', (e) => {
    callbacks.onInput?.(e.detail);
  });
  element.addEventListener('change', (e) => {
    callbacks.onChange?.(e.detail);
  });

  return {
    element,
    setValue: (v) => { element.value = v; },
    setGradient: (g) => { element.gradient = g; },
    setValuetext: (v) => { element.valuetext = v; },
    setDisabled: (d) => { element.disabled = d; },
    getElement: () => element,
    destroy: () => element.remove(),
  };
}

export function createColorConflictsAdapter(options = {}) {
  import('../components/color-conflicts/index.js');

  const element = document.createElement('color-conflicts');
  const {
    conflictsFound = false,
    label,
    strings,
  } = options;

  element.conflictsFound = conflictsFound;
  if (strings) element.strings = strings;
  if (label) element.label = label;

  return {
    element,
    setConflicts: (found) => {
      element.conflictsFound = found;
    },
    setLabel: (text) => {
      element.label = text;
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
    strings,
  } = options;

  element.color = color;
  element.colorMode = getPreferredColorMode(colorMode);
  element.showHeader = showHeader;
  element.showBrightnessControl = showBrightnessControl;
  if (strings) element.strings = strings;

  element.addEventListener('color-change', (e) => {
    callbacks.onColorChange?.(e.detail);
  });
  element.addEventListener('mode-change', (e) => {
    setPreferredColorMode(e.detail?.mode);
    callbacks.onModeChange?.(e.detail);
  });
  element.addEventListener('lock-change', (e) => {
    callbacks.onLockChange?.(e.detail);
  });

  const unsubscribe = subscribeColorMode((mode) => {
    if (element.colorMode !== mode) element.colorMode = mode;
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
    destroy: () => {
      unsubscribe();
      element.remove();
    },
  };
}
