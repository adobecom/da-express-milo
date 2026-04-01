/**
 * Express Search Field — Wrapper for Spectrum Web Components <sp-search>
 *
 * Creates a themed, accessible search input with clear button and Express
 * styling overrides. Extends textfield with search-specific behavior.
 *
 * Usage:
 *   import { createExpressSearch } from '../spectrum/components/express-search.js';
 *
 *   const search = await createExpressSearch({
 *     placeholder: 'Search colors…',
 *     onSubmit: ({ value }) => runSearch(value),
 *   });
 *   container.appendChild(search.element);
 */

import { loadSearch } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/search.css';

/**
 * Create an Express search field.
 *
 * @param {Object}   config
 * @param {string}   [config.label='Search'] — accessible label
 * @param {string}   [config.placeholder='Search']
 * @param {string}   [config.value='']       — initial value
 * @param {boolean}  [config.quiet=false]     — quiet (underline-only) variant
 * @param {boolean}  [config.disabled=false]
 * @param {'s'|'m'|'l'|'xl'} [config.size='m']
 * @param {string}   [config.action]         — form action URL (optional)
 * @param {string}   [config.method]         — form method (optional)
 * @param {Function} [config.onInput]   — ({ value }) on every keystroke
 * @param {Function} [config.onSubmit]  — ({ value }) when Enter is pressed
 * @param {Function} [config.onClear]   — () when clear button is clicked
 * @returns {Promise<{element: HTMLElement, getValue: ()=>string, setValue: (s:string)=>void, clear: ()=>void, setDisabled: (b:boolean)=>void, destroy: ()=>void}>}
 */
export async function createExpressSearch(config) {
  const {
    label = 'Search',
    placeholder = 'Search',
    value = '',
    quiet = false,
    disabled = false,
    size = 'm',
    action,
    method,
    onInput,
    onSubmit,
    onClear,
  } = config;

  await loadSearch();
  await loadOverrideStyles('search', STYLES_PATH);
  await customElements.whenDefined('sp-search');

  const theme = createThemeWrapper();
  const search = document.createElement('sp-search');

  search.setAttribute('label', label);
  if (placeholder) search.setAttribute('placeholder', placeholder);
  if (value) search.setAttribute('value', value);
  if (quiet) search.setAttribute('quiet', '');
  if (disabled) search.setAttribute('disabled', '');
  if (action) search.setAttribute('action', action);
  if (method) search.setAttribute('method', method);
  search.setAttribute('size', size);

  theme.appendChild(search);

  const controller = new AbortController();
  const { signal } = controller;

  if (onInput) {
    search.addEventListener('input', () => {
      onInput({ value: search.value });
    }, { signal });
  }

  if (onSubmit) {
    search.addEventListener('submit', (e) => {
      e.preventDefault();
      onSubmit({ value: search.value });
    }, { signal });
  }

  // sp-search fires a 'search' event with empty value when cleared
  search.addEventListener('search', (e) => {
    const v = e.target?.value ?? '';
    if (!v && onClear) onClear();
  }, { signal });

  return {
    element: theme,

    getValue() {
      return search.value;
    },

    setValue(text) {
      search.value = text;
    },

    clear() {
      search.value = '';
      onClear?.();
    },

    setDisabled(val) {
      if (val) search.setAttribute('disabled', '');
      else search.removeAttribute('disabled');
    },

    destroy() {
      controller.abort();
      theme.remove();
    },
  };
}
