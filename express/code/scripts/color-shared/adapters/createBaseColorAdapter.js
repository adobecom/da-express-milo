export default function createBaseColorAdapter(
  initialColor,
  colorMode,
  callbacks = {},
  options = {},
) {
  import('../components/base-color/index.js');

  const element = document.createElement('base-color');
  element.color = initialColor;
  element.setAttribute('color-mode', colorMode);

  if (options.controller && typeof options.controller.subscribe === 'function') {
    element.controller = options.controller;
  }

  element.addEventListener('color-change', (e) => {
    callbacks.onColorChange?.(e.detail);
  });

  element.addEventListener('mode-change', (e) => {
    callbacks.onModeChange?.(e.detail);
  });

  element.addEventListener('lock-change', (e) => {
    callbacks.onLockChange?.(e.detail);
  });

  element.addEventListener('color-change-end', (e) => {
    callbacks.onColorChangeEnd?.(e.detail);
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
      element.remove();
    },
  };
}
