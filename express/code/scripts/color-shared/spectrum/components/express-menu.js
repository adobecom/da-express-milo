/**
 * Express Menu — Wrapper for Spectrum Web Components <sp-menu>
 *
 * Creates a themed, accessible standalone menu with Express styling overrides.
 * This is for static/visible menus (e.g. action lists, settings panels).
 * For dropdown menus, use the picker wrapper instead.
 *
 * Usage:
 *   import { createExpressMenu } from '../spectrum/components/express-menu.js';
 *
 *   const menu = await createExpressMenu({
 *     label: 'Actions',
 *     items: [
 *       { value: 'copy', label: 'Copy to clipboard' },
 *       { value: 'export', label: 'Export as PNG' },
 *       { divider: true },
 *       { value: 'delete', label: 'Delete', disabled: true },
 *     ],
 *     selects: 'single',
 *     onSelect: ({ value }) => console.log('selected', value),
 *   });
 *   container.appendChild(menu.element);
 */

import { loadMenu } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/menu.css';

/**
 * @typedef  {Object} MenuItem
 * @property {string}  [value]     — programmatic value
 * @property {string}  [label]     — visible text
 * @property {boolean} [disabled]  — greyed out
 * @property {boolean} [selected]  — initially selected
 * @property {boolean} [divider]   — renders a divider instead of an item
 */

/**
 * Create an Express standalone menu.
 *
 * @param {Object}   config
 * @param {string}   [config.label='Menu']  — accessible label
 * @param {MenuItem[]} config.items          — menu entries
 * @param {'single'|'multiple'|undefined} [config.selects]  — selection mode
 * @param {Function} [config.onSelect]  — ({ value }) when an item is chosen
 * @returns {Promise<{element: HTMLElement, getSelected: ()=>string|string[], setItems: (items:MenuItem[])=>void, destroy: ()=>void}>}
 */
export async function createExpressMenu(config) {
  const {
    label = 'Menu',
    items = [],
    selects,
    onSelect,
  } = config;

  await loadMenu();
  await loadOverrideStyles('menu', STYLES_PATH);
  await customElements.whenDefined('sp-menu');

  const theme = createThemeWrapper();
  const menu = document.createElement('sp-menu');

  menu.setAttribute('label', label);
  if (selects) menu.setAttribute('selects', selects);

  function renderItems(itemList) {
    menu.innerHTML = '';
    for (const item of itemList) {
      if (item.divider) {
        const divider = document.createElement('sp-menu-divider');
        menu.appendChild(divider);
      } else {
        const mi = document.createElement('sp-menu-item');
        if (item.value) mi.setAttribute('value', item.value);
        if (item.disabled) mi.setAttribute('disabled', '');
        if (item.selected) mi.setAttribute('selected', '');
        mi.textContent = item.label || item.value || '';
        menu.appendChild(mi);
      }
    }
  }

  renderItems(items);
  theme.appendChild(menu);

  const controller = new AbortController();
  const { signal } = controller;

  if (onSelect) {
    menu.addEventListener('change', (e) => {
      const val = e.target?.value;
      onSelect({ value: val });
    }, { signal });
  }

  return {
    element: theme,

    getSelected() {
      if (selects === 'multiple') {
        return [...menu.querySelectorAll('sp-menu-item[selected]')]
          .map((el) => el.getAttribute('value'));
      }
      return menu.value || '';
    },

    setItems(newItems) {
      renderItems(newItems);
    },

    destroy() {
      controller.abort();
      theme.remove();
    },
  };
}
