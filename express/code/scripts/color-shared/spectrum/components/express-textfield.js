/**
 * Express Text Field — Wrapper for Spectrum Web Components <sp-textfield>
 *
 * Creates a themed, accessible text input with Express styling overrides.
 *
 * Usage:
 *   import { createExpressTextfield } from '../spectrum/components/express-textfield.js';
 *
 *   const field = await createExpressTextfield({
 *     label: 'Color name',
 *     placeholder: 'e.g. Ocean Breeze',
 *     onInput: ({ value }) => console.log(value),
 *   });
 *   container.appendChild(field.element);
 */

import { loadTextfield } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/textfield.css';

/**
 * Create an Express text field.
 *
 * @param {Object}   config
 * @param {string}   [config.label]           — visible label above the field
 * @param {string}   [config.placeholder='']  — placeholder text
 * @param {string}   [config.value='']        — initial value
 * @param {boolean}  [config.multiline=false]  — textarea mode
 * @param {boolean}  [config.quiet=false]      — quiet (underline-only) variant
 * @param {boolean}  [config.disabled=false]
 * @param {boolean}  [config.required=false]
 * @param {boolean}  [config.readonly=false]
 * @param {'s'|'m'|'l'|'xl'} [config.size='m']
 * @param {string}   [config.pattern]         — validation regex pattern
 * @param {number}   [config.maxlength]       — max character count
 * @param {Function} [config.onInput]   — ({ value }) on every keystroke
 * @param {Function} [config.onChange]  — ({ value }) on blur / commit
 * @returns {Promise<{element: HTMLElement, getValue: ()=>string, setValue: (s:string)=>void, setDisabled: (b:boolean)=>void, destroy: ()=>void}>}
 */
export async function createExpressTextfield(config) {
  const {
    label = '',
    placeholder = '',
    value = '',
    multiline = false,
    quiet = false,
    disabled = false,
    required = false,
    readonly = false,
    size = 'm',
    pattern,
    maxlength,
    onInput,
    onChange,
  } = config;

  await loadTextfield();
  await loadOverrideStyles('textfield', STYLES_PATH);
  await customElements.whenDefined('sp-textfield');

  const theme = createThemeWrapper();
  const field = document.createElement('sp-textfield');

  if (label) field.setAttribute('label', label);
  if (placeholder) field.setAttribute('placeholder', placeholder);
  if (value) field.setAttribute('value', value);
  if (multiline) field.setAttribute('multiline', '');
  if (quiet) field.setAttribute('quiet', '');
  if (disabled) field.setAttribute('disabled', '');
  if (required) field.setAttribute('required', '');
  if (readonly) field.setAttribute('readonly', '');
  if (pattern) field.setAttribute('pattern', pattern);
  if (maxlength != null) field.setAttribute('maxlength', String(maxlength));
  field.setAttribute('size', size);

  theme.appendChild(field);

  const controller = new AbortController();
  const { signal } = controller;

  if (onInput) {
    field.addEventListener('input', () => {
      onInput({ value: field.value });
    }, { signal });
  }

  if (onChange) {
    field.addEventListener('change', () => {
      onChange({ value: field.value });
    }, { signal });
  }

  return {
    element: theme,

    getValue() {
      return field.value;
    },

    setValue(text) {
      field.value = text;
    },

    setDisabled(val) {
      if (val) field.setAttribute('disabled', '');
      else field.removeAttribute('disabled');
    },

    destroy() {
      controller.abort();
      theme.remove();
    },
  };
}
