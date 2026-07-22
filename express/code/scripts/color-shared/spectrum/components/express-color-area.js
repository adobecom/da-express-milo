/**
 * Express Color Area — Wrapper for Spectrum Web Components <sp-color-area>
 *
 * Creates an accessible 2D color-area element for saturation/lightness selection.
 *
 * Usage:
 *   import { createExpressColorArea } from '../spectrum/components/express-color-area.js';
 *
 *   const area = await createExpressColorArea({
 *     color: 'hsl(120, 100%, 50%)',
 *     onChange: ({ color }) => console.log(color),
 *   });
 *   container.appendChild(area.element);
 */

import { loadColorArea } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/color-area.css';

/**
 * Create an Express color area.
 *
 * @param {Object}   config
 * @param {string}   [config.color]          — initial color (any CSS color string)
 * @param {string}   [config.label]          — aria label
 * @param {boolean}  [config.disabled=false]
 * @param {Function} [config.onChange]        — ({ color }) when color changes
 * @param {Function} [config.onInput]        — ({ color }) on live input (drag)
 * @returns {Promise<{element: HTMLElement, getColor: ()=>string, setColor: (c:string)=>void, destroy: ()=>void}>}
 */
export async function createExpressColorArea(config = {}) {
  const {
    color,
    label,
    disabled = false,
    onChange,
    onInput,
  } = config;

  await loadColorArea();
  await loadOverrideStyles('color-area', STYLES_PATH);

  const theme = createThemeWrapper();
  const area = document.createElement('sp-color-area');

  if (color) area.color = color;
  if (label) area.setAttribute('label', label);
  if (disabled) area.setAttribute('disabled', '');

  theme.appendChild(area);

  const controller = new AbortController();
  const { signal } = controller;

  if (onChange) {
    area.addEventListener('change', () => {
      onChange({ color: area.color });
    }, { signal });
  }

  if (onInput) {
    area.addEventListener('input', () => {
      onInput({ color: area.color });
    }, { signal });
  }

  return {
    element: theme,

    getColor() {
      return area.color;
    },

    setColor(value) {
      area.color = value;
    },

    destroy() {
      controller.abort();
      theme.remove();
    },
  };
}
