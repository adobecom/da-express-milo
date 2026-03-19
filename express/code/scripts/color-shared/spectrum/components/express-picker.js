/**
 * Express Picker — Wrapper for Spectrum Web Components <sp-picker>
 *
 * Creates a themed, accessible picker (dropdown/select) that matches
 * Express design tokens and loads Spectrum dependencies on demand.
 *
 * Usage:
 *   import { createExpressPicker } from '../spectrum/components/express-picker.js';
 *
 *   const picker = await createExpressPicker({
 *     label: 'Color gradients',
 *     value: 'linear',
 *     options: [
 *       { value: 'all',    label: 'All' },
 *       { value: 'linear', label: 'Linear' },
 *     ],
 *     onChange: ({ value }) => console.log(value),
 *   });
 *   container.appendChild(picker.element);
 */

import { loadPicker } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/picker.css';

/**
 * Create an Express picker (themed sp-picker with menu items).
 *
 * @param {Object}    config
 * @param {string}    config.label    — visible label / aria-label
 * @param {string}    [config.value]  — initially selected value
 * @param {Array<{value:string, label:string}>} config.options
 * @param {Function}  [config.onChange]   — called with { value }
 * @param {string}    [config.id]        — optional DOM id suffix
 * @param {boolean}   [config.disabled]  — disable the picker
 * @returns {Promise<{element: HTMLElement, getValue: () => string, setValue: (v:string) => void, destroy: () => void}>}
 */
export async function createExpressPicker(config) {
  const {
    label,
    value: initialValue,
    options = [],
    onChange,
    id,
    disabled = false,
  } = config;

  // 1. Ensure Spectrum picker components are loaded
  await loadPicker();

  // 2. Load Express override styles (once)
  await loadOverrideStyles('picker', STYLES_PATH);

  // 3. Wait for CEs to be ready
  await customElements.whenDefined('sp-theme');
  await customElements.whenDefined('sp-picker');
  await customElements.whenDefined('sp-menu-item');

  // 4. Create theme wrapper
  const theme = createThemeWrapper();

  // 5. Create picker element
  const picker = document.createElement('sp-picker');
  if (id) picker.id = `express-picker-${id}`;
  picker.setAttribute('label', label);
  picker.setAttribute('aria-label', `Filter by ${label}`);
  picker.classList.add('filter-picker');
  if (disabled) picker.setAttribute('disabled', '');

  const selected = options.find((o) => o.value === initialValue) || options[0];
  if (selected) picker.setAttribute('value', selected.value);

  // 6. Attach picker to theme (triggers connectedCallback)
  theme.appendChild(picker);

  // 7. Add menu items AFTER picker is in theme
  options.forEach((opt) => {
    const item = document.createElement('sp-menu-item');
    item.setAttribute('value', opt.value);
    if (opt.value === selected?.value) item.setAttribute('selected', '');
    item.textContent = opt.label;
    picker.appendChild(item);
  });

  // 8. Temporarily mount to DOM to initialise shadow DOM slots
  const temp = document.createElement('div');
  Object.assign(temp.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
  });
  document.body.appendChild(temp);
  temp.appendChild(theme);

  if (picker.updateComplete) await picker.updateComplete;
  else await new Promise((r) => requestAnimationFrame(r));

  temp.removeChild(theme);
  document.body.removeChild(temp);

  // 9. Event handling
  let currentValue = selected?.value ?? '';

  picker.addEventListener('change', (e) => {
    currentValue = e.target.value;
    onChange?.({ value: currentValue });
  });

  // 10. Public API
  return {
    /** The <sp-theme> root element — append this to the DOM. */
    element: theme,

    /** Get current selected value. */
    getValue() {
      return currentValue;
    },

    /** Programmatically set the selected value. */
    setValue(v) {
      currentValue = v;
      picker.value = v;
    },

    /** Clean up listeners (call when removing from DOM). */
    destroy() {
      theme.remove();
    },
  };
}
