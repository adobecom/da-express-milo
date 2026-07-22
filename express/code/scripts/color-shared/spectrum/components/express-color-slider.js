/**
 * Express Color Slider — Wrapper for Spectrum Web Components <sp-color-slider>
 *
 * Creates an accessible color-slider element for hue selection.
 *
 * Usage:
 *   import { createExpressColorSlider } from '../spectrum/components/express-color-slider.js';
 *
 *   const slider = await createExpressColorSlider({
 *     color: 'hsl(120, 100%, 50%)',
 *     onChange: ({ color }) => console.log(color),
 *   });
 *   container.appendChild(slider.element);
 */

import { loadColorSlider } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/color-slider.css';

/**
 * Create an Express color slider.
 *
 * @param {Object}   config
 * @param {string}   [config.color]          — initial color (any CSS color string)
 * @param {string}   [config.label]          — aria label
 * @param {boolean}  [config.disabled=false]
 * @param {Function} [config.onChange]        — ({ color }) when color changes
 * @param {Function} [config.onInput]        — ({ color }) on live input (drag)
 * @returns {Promise<{element: HTMLElement, getColor: ()=>string, setColor: (c:string)=>void, destroy: ()=>void}>}
 */
export async function createExpressColorSlider(config = {}) {
  const {
    color,
    label,
    disabled = false,
    onChange,
    onInput,
  } = config;

  await loadColorSlider();
  await loadOverrideStyles('color-slider', STYLES_PATH);

  const theme = createThemeWrapper();
  const slider = document.createElement('sp-color-slider');

  if (color) slider.color = color;
  if (label) slider.setAttribute('label', label);
  if (disabled) slider.setAttribute('disabled', '');

  theme.appendChild(slider);

  const controller = new AbortController();
  const { signal } = controller;

  if (onChange) {
    slider.addEventListener('change', () => {
      onChange({ color: slider.color });
    }, { signal });
  }

  if (onInput) {
    slider.addEventListener('input', () => {
      onInput({ color: slider.color });
    }, { signal });
  }

  return {
    element: theme,

    getColor() {
      return slider.color;
    },

    setColor(value) {
      slider.color = value;
    },

    destroy() {
      controller.abort();
      theme.remove();
    },
  };
}
