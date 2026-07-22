/**
 * Express Slider — Wrapper for Spectrum Web Components <sp-slider>
 *
 * Creates an accessible slider element for value selection within a range.
 *
 * Usage:
 *   import { createExpressSlider } from '../spectrum/components/express-slider.js';
 *
 *   const slider = await createExpressSlider({
 *     value: 50,
 *     min: 0,
 *     max: 100,
 *     onChange: ({ value }) => console.log(value),
 *   });
 *   container.appendChild(slider.element);
 */

import { loadSlider } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/slider.css';

/**
 * Create an Express slider.
 *
 * @param {Object}   config
 * @param {number}   [config.value=0]        — initial value
 * @param {number}   [config.min=0]          — minimum value
 * @param {number}   [config.max=100]        — maximum value
 * @param {number}   [config.step=1]         — step increment
 * @param {string}   [config.label]          — aria label
 * @param {boolean}  [config.disabled=false]
 * @param {Function} [config.onChange]        — ({ value }) when value changes
 * @param {Function} [config.onInput]        — ({ value }) on live input (drag)
 * @returns {Promise<{element: HTMLElement, getValue: ()=>number, setValue: (v:number)=>void, destroy: ()=>void}>}
 */
export async function createExpressSlider(config = {}) {
  const {
    value = 0,
    min = 0,
    max = 100,
    step = 1,
    label,
    disabled = false,
    onChange,
    onInput,
  } = config;

  await loadSlider();
  await loadOverrideStyles('slider', STYLES_PATH);

  const theme = createThemeWrapper();
  const slider = document.createElement('sp-slider');

  slider.value = value;
  slider.min = min;
  slider.max = max;
  slider.step = step;
  if (label) slider.setAttribute('label', label);
  if (disabled) slider.setAttribute('disabled', '');

  theme.appendChild(slider);

  const controller = new AbortController();
  const { signal } = controller;

  if (onChange) {
    slider.addEventListener('change', () => {
      onChange({ value: slider.value });
    }, { signal });
  }

  if (onInput) {
    slider.addEventListener('input', () => {
      onInput({ value: slider.value });
    }, { signal });
  }

  return {
    element: theme,

    getValue() {
      return slider.value;
    },

    setValue(v) {
      slider.value = v;
    },

    destroy() {
      controller.abort();
      theme.remove();
    },
  };
}
