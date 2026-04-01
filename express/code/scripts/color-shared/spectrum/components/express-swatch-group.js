/**
 * Express Swatch Group — Wrapper for Spectrum Web Components <sp-swatch-group>
 *
 * Creates accessible swatch-group elements for color palette selection.
 *
 * Usage:
 *   import { createExpressSwatchGroup } from '../spectrum/components/express-swatch-group.js';
 *
 *   const group = await createExpressSwatchGroup({
 *     colors: ['#FF0000', '#00FF00', '#0000FF'],
 *     selects: 'single',
 *     size: 's',
 *     onChange: ({ selected, index }) => console.log(selected, index),
 *   });
 *   container.appendChild(group.element);
 */

import { loadSwatch } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/swatch.css';

/**
 * Create an Express swatch group.
 *
 * @param {Object}   config
 * @param {string[]} config.colors           — array of CSS color strings (e.g. '#FF0000')
 * @param {'single'|'multiple'} [config.selects='single'] — selection mode
 * @param {'xs'|'s'|'m'|'l'}   [config.size='m']
 * @param {string[]} [config.selected=[]]    — initially selected values
 * @param {string[]} [config.labels]         — optional per-swatch aria labels
 * @param {boolean}  [config.disabled=false]
 * @param {Function} [config.onChange]       — ({ selected, index }) when selection changes
 * @returns {Promise<{element: HTMLElement, getSelected: ()=>string[], setSelected: (v:string[])=>void, setColors: (c:string[])=>void, destroy: ()=>void}>}
 */
export async function createExpressSwatchGroup(config) {
  const {
    colors = [],
    selects = 'single',
    size = 'm',
    selected: initialSelected = [],
    labels,
    disabled = false,
    onChange,
  } = config;

  await loadSwatch();
  await loadOverrideStyles('swatch', STYLES_PATH);

  const theme = createThemeWrapper();
  const group = document.createElement('sp-swatch-group');

  group.setAttribute('selects', selects);
  if (size) group.setAttribute('size', size);

  function buildSwatches(colorList, selectedValues = []) {
    group.innerHTML = '';
    const selectedSet = new Set(selectedValues);

    colorList.forEach((color, i) => {
      const swatch = document.createElement('sp-swatch');
      const validColor = color.startsWith('#') ? color : `#${color}`;
      swatch.setAttribute('color', validColor);
      swatch.setAttribute('value', String(i));
      if (selectedSet.has(String(i))) swatch.setAttribute('selected', '');
      if (disabled) swatch.setAttribute('disabled', '');

      const label = labels?.[i] || `Color ${validColor}`;
      swatch.setAttribute('aria-label', label);

      group.appendChild(swatch);
    });
  }

  buildSwatches(colors, initialSelected);
  theme.appendChild(group);

  const controller = new AbortController();
  const { signal } = controller;

  group.addEventListener('change', (e) => {
    const selectedValue = group.selected?.[0];
    const index = selectedValue != null ? Number(selectedValue) : -1;
    onChange?.({ selected: [...(group.selected || [])], index });
  }, { signal });

  return {
    element: theme,

    getSelected() {
      return [...(group.selected || [])];
    },

    setSelected(values) {
      group.selected = values;
    },

    setColors(newColors, selectedValues) {
      buildSwatches(newColors, selectedValues || []);
    },

    destroy() {
      controller.abort();
      theme.remove();
    },
  };
}
