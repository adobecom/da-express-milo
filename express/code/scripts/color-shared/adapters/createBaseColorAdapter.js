import {
  getPreferredColorMode,
  setPreferredColorMode,
  subscribeColorMode,
} from '../utils/colorModePreference.js';

export default function createBaseColorAdapter(
  initialColor,
  colorMode,
  callbacks = {},
  options = {},
) {
  import('../components/base-color/index.js');

  const element = document.createElement('base-color');
  element.color = initialColor;
  element.setAttribute('color-mode', getPreferredColorMode(colorMode));

  if (callbacks.strings) {
    element.strings = callbacks.strings;
  }

  if (options.controller && typeof options.controller.subscribe === 'function') {
    element.controller = options.controller;
  }

  let rafId = null;
  let pendingDetail = null;
  element.addEventListener('color-change', (e) => {
    if (!callbacks.onColorChange) return;
    pendingDetail = e.detail;
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      callbacks.onColorChange(pendingDetail);
      pendingDetail = null;
    });
  });

  element.addEventListener('mode-change', (e) => {
    setPreferredColorMode(e.detail?.mode);
    callbacks.onModeChange?.(e.detail);
  });

  element.addEventListener('lock-change', (e) => {
    callbacks.onLockChange?.(e.detail);
  });

  element.addEventListener('color-change-end', (e) => {
    callbacks.onColorChangeEnd?.(e.detail);
  });

  const unsubscribe = subscribeColorMode((mode) => {
    if (element.colorMode !== mode) element.colorMode = mode;
  });

  return {
    element,
    setColor: (color) => {
      element.color = color;
    },
    setColorMode: (mode) => {
      element.colorMode = mode;
    },
    getController: () => options.controller,
    destroy: () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      unsubscribe();
      element.remove();
    },
  };
}
