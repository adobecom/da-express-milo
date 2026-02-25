import { createTag } from '../../../scripts/utils.js';

export function createColorEditComponent(options = {}) {
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

  const container = createTag('div', { class: 'color-edit-wrapper' });

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

    show() {
      colorEdit.show();
    },

    hide() {
      colorEdit.hide();
    },

    setPalette(colors) {
      colorEdit.palette = [...colors];
    },

    setSelectedIndex(index) {
      colorEdit.selectedIndex = index;
    },

    setColorMode(mode) {
      colorEdit.colorMode = mode;
    },

    getElement() {
      return colorEdit;
    },

    destroy() {
      container.remove();
    },
  };
}
