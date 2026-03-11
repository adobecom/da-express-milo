import { createTag } from '../../../../scripts/utils.js';
import { createThemeWrapper } from '../../../../scripts/color-shared/spectrum/utils/theme.js';

function isValidHex(hex) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

function ensureHash(value) {
  const trimmed = value.trim();
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
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

  const theme = createThemeWrapper();
  const wrapper = createTag('div', { class: 'ax-color-input' });

  if (label) {
    const labelEl = createTag('label', { class: 'ax-color-input__label' }, label);
    wrapper.appendChild(labelEl);
  }

  const field = createTag('div', { class: 'ax-color-input__field' });

  const swatch = createTag('div', {
    class: 'ax-color-input__swatch',
    style: `background: ${value}`,
  });

  const input = createTag('input', {
    type: 'text',
    class: 'ax-color-input__input',
    value,
    maxlength: '7',
    'aria-label': label || 'Color value',
  });

  field.appendChild(swatch);
  field.appendChild(input);
  wrapper.appendChild(field);
  theme.appendChild(wrapper);

  const controller = new AbortController();
  const { signal } = controller;

  input.addEventListener('input', () => {
    const hex = ensureHash(input.value);
    if (isValidHex(hex)) {
      lastValidHex = hex;
      swatch.style.background = hex;
      onInput?.({ value: hex });
    }
  }, { signal });

  input.addEventListener('change', () => {
    const hex = ensureHash(input.value);
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
    },

    destroy() {
      controller.abort();
      theme.remove();
    },
  };
}
