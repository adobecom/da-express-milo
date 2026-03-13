import { createTag } from '../../../../scripts/utils.js';
import { createThemeWrapper } from '../../../../scripts/color-shared/spectrum/utils/theme.js';
import { trapFocus } from '../../../../scripts/color-shared/spectrum/utils/a11y.js';
import { loadPicker } from '../../../../scripts/color-shared/spectrum/load-spectrum.js';
import { isMobileViewport, ensureHash, isValidHex } from '../../../../scripts/color-shared/utils/utilities.js';

function labelToId(labelText) {
  return `color-input-${labelText.toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z0-9-]/g, '')}`;
}

/**
 * @param {Object}   config
 * @param {string}   [config.label]
 * @param {string}   [config.value='#FFFFFF']
 * @param {Function} [config.onInput]
 * @param {Function} [config.onChange]
 * @returns {{element: HTMLElement, getValue: Function, setValue: Function, destroy: Function}}
 */
// eslint-disable-next-line import/prefer-default-export
export function createColorInput(config) {
  const {
    label = '',
    value = '#FFFFFF',
    onInput,
    onChange,
  } = config;

  let lastValidHex = value;
  let activePopover = null;
  let activeEditor = null;
  let focusTrap = null;
  const dismissHandlers = [];

  const theme = createThemeWrapper();
  const wrapper = createTag('div', { class: 'ax-color-input' });

  const inputId = label ? labelToId(label) : `color-input-${Date.now()}`;

  if (label) {
    const labelEl = createTag('label', {
      class: 'ax-color-input__label',
      for: inputId,
    }, label);
    wrapper.appendChild(labelEl);
  }

  const field = createTag('div', { class: 'ax-color-input__field' });

  const swatch = createTag('button', {
    type: 'button',
    class: 'ax-color-input__swatch',
    style: `background: ${value}`,
    'aria-label': 'Edit color',
    'aria-haspopup': 'dialog',
  });

  const input = createTag('input', {
    type: 'text',
    id: inputId,
    name: inputId,
    class: 'ax-color-input__input',
    value,
    maxlength: '7',
    ...(label ? {} : { 'aria-label': 'Color value' }),
  });

  field.appendChild(swatch);
  field.appendChild(input);
  wrapper.appendChild(field);
  theme.appendChild(wrapper);

  const controller = new AbortController();
  const { signal } = controller;

  function addDismissListener(evt, fn, opts) {
    const target = opts?.target || document;
    target.addEventListener(evt, fn, opts?.capture);
    dismissHandlers.push([evt, fn, opts]);
  }

  function closeEditor() {
    if (focusTrap) {
      focusTrap.release();
      focusTrap = null;
    }
    dismissHandlers.forEach(([evt, fn, opts]) => {
      (opts?.target || document).removeEventListener(evt, fn, opts?.capture);
    });
    dismissHandlers.length = 0;
    if (activePopover) {
      activePopover.remove();
      activePopover = null;
    }
    if (activeEditor) {
      activeEditor.remove();
      activeEditor = null;
    }
    swatch.focus();
  }

  async function openColorEdit() {
    if (activePopover || activeEditor) {
      closeEditor();
      return;
    }
    await import('../../../../scripts/color-shared/components/color-edit/index.js');

    const colorEdit = createTag('color-edit');
    colorEdit.palette = [lastValidHex];
    colorEdit.selectedIndex = 0;
    colorEdit.showPalette = false;
    colorEdit.colorMode = 'HEX';

    const isMobile = isMobileViewport();
    colorEdit.mobile = isMobile;

    colorEdit.addEventListener('color-change', (e) => {
      const { hex } = e.detail;
      if (isValidHex(hex)) {
        lastValidHex = hex;
        input.value = hex;
        swatch.style.background = hex;
        onInput?.({ value: hex });
        onChange?.({ value: hex });
      }
    });

    colorEdit.addEventListener('panel-close', closeEditor);

    if (isMobile) {
      document.body.appendChild(colorEdit);
      activeEditor = colorEdit;
      requestAnimationFrame(() => colorEdit.show());
    } else {
      await loadPicker();

      const fieldHeight = field.offsetHeight;
      const overlay = createTag('sp-overlay', {
        type: 'auto',
        placement: 'bottom-start',
        offset: String(-fieldHeight),
      });
      overlay.appendChild(colorEdit);

      activePopover = overlay;
      activeEditor = colorEdit;

      field.after(overlay);
      overlay.triggerElement = field;
      overlay.open = true;

      overlay.addEventListener('sp-closed', closeEditor, { once: true });

      requestAnimationFrame(async () => {
        await colorEdit.updateComplete;
        focusTrap = trapFocus(overlay);

        addDismissListener('keydown', (e) => {
          if (e.key === 'Escape') closeEditor();
        });
      });
    }
  }

  swatch.addEventListener('click', openColorEdit, { signal });

  input.addEventListener('input', () => {
    const hex = ensureHash(input.value.trim());
    if (isValidHex(hex)) {
      lastValidHex = hex;
      swatch.style.background = hex;
      onInput?.({ value: hex });
    }
  }, { signal });

  input.addEventListener('change', () => {
    const hex = ensureHash(input.value.trim());
    if (isValidHex(hex)) {
      lastValidHex = hex;
      swatch.style.background = hex;
      onChange?.({ value: hex });
    } else {
      input.value = lastValidHex;
      swatch.style.background = lastValidHex;
    }
  }, { signal });

  return {
    element: theme,

    getValue() {
      return input.value;
    },

    setValue(hex) {
      lastValidHex = hex;
      input.value = hex;
      swatch.style.background = hex;
      if (activeEditor) {
        activeEditor.palette = [hex];
      }
    },

    destroy() {
      closeEditor();
      controller.abort();
      theme.remove();
    },
  };
}
