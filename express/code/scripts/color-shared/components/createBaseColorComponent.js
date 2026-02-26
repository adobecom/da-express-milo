import { createTag } from '../../../scripts/utils.js';

export function createBaseColorComponent(options = {}) {
  const {
    color = '#FF0000',
    colorMode = 'HEX',
    showHeader = true,
    mobile = false,
    onColorChange,
    onModeChange,
    onClose,
  } = options;

  const container = createTag('div', { class: 'base-color-wrapper' });

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

    show() {
      baseColor.show();
    },

    hide() {
      baseColor.hide();
    },

    setColor(newColor) {
      baseColor.color = newColor;
    },

    setColorMode(mode) {
      baseColor.colorMode = mode;
    },

    setShowHeader(show) {
      baseColor.showHeader = show;
    },

    getElement() {
      return baseColor;
    },

    destroy() {
      container.remove();
    },
  };
}
