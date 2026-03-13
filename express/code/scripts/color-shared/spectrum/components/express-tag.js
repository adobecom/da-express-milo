/**
 * Express Tag — Wrapper for Spectrum Web Components <sp-tag>
 *
 * Creates accessible tag/chip elements for filtering workflows.
 *
 * Usage:
 *   import { createExpressTag } from '../spectrum/components/express-tag.js';
 *
 *   const tag = await createExpressTag({
 *     label: 'Warm',
 *     value: 'warm',
 *     selectable: true,
 *     onToggle: ({ value, selected }) => console.log(value, selected),
 *   });
 *   container.appendChild(tag.element);
 */

import { loadTag } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/tag.css';

function createIconSlot(icon) {
  if (!icon) return null;

  if (icon instanceof Element) {
    const iconElement = icon.cloneNode(true);
    iconElement.setAttribute('slot', 'icon');
    return iconElement;
  }

  if (typeof icon === 'string') {
    const iconWrapper = document.createElement('span');
    iconWrapper.setAttribute('slot', 'icon');
    iconWrapper.innerHTML = icon;
    return iconWrapper;
  }

  return null;
}

/**
 * Create an Express tag.
 *
 * @param {Object}   config
 * @param {string}   config.label          — visible text
 * @param {string}   [config.value]        — programmatic value
 * @param {boolean}  [config.selectable=false]
 * @param {boolean}  [config.selected=false]
 * @param {boolean}  [config.removable=false]
 * @param {boolean}  [config.disabled=false]
 * @param {HTMLElement|string} [config.icon] — optional icon element or SVG markup
 * @param {Function} [config.onToggle]  — ({ value, selected }) when toggled
 * @param {Function} [config.onRemove]  — ({ value }) when removed
 * @returns {Promise<{element: HTMLElement, getSelected: ()=>boolean, setSelected: (b:boolean)=>void, destroy: ()=>void}>}
 */
export async function createExpressTag(config) {
  const {
    label,
    value = '',
    selectable = false,
    selected: initialSelected = false,
    removable = false,
    disabled = false,
    icon,
    onToggle,
    onRemove,
  } = config;

  await loadTag();
  await loadOverrideStyles('tag', STYLES_PATH);

  const theme = createThemeWrapper();
  const tag = document.createElement('sp-tag');

  const iconSlot = createIconSlot(icon);
  if (iconSlot) tag.appendChild(iconSlot);
  tag.appendChild(document.createTextNode(label));
  if (value) tag.setAttribute('value', value);
  if (disabled) tag.setAttribute('disabled', '');
  if (removable) tag.setAttribute('deletable', '');

  let isSelected = initialSelected;
  if (isSelected) tag.setAttribute('selected', '');

  theme.appendChild(tag);

  const controller = new AbortController();
  const { signal } = controller;

  // Selection toggle
  if (selectable) {
    tag.style.cursor = disabled ? 'default' : 'pointer';
    tag.setAttribute('role', 'option');
    tag.setAttribute('aria-selected', String(isSelected));

    tag.addEventListener('click', () => {
      if (disabled) return;
      isSelected = !isSelected;
      if (isSelected) tag.setAttribute('selected', '');
      else tag.removeAttribute('selected');
      tag.setAttribute('aria-selected', String(isSelected));
      onToggle?.({ value, selected: isSelected });
    }, { signal });

    // Keyboard: Space / Enter
    tag.addEventListener('keydown', (e) => {
      if (disabled) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        tag.click();
      }
    }, { signal });
  }

  // Remove handler
  if (removable) {
    tag.addEventListener('delete', () => {
      onRemove?.({ value });
      theme.remove();
    }, { signal });
  }

  return {
    element: theme,

    getSelected() {
      return isSelected;
    },

    setSelected(val) {
      isSelected = val;
      if (val) tag.setAttribute('selected', '');
      else tag.removeAttribute('selected');
      tag.setAttribute('aria-selected', String(val));
    },

    destroy() {
      controller.abort();
      theme.remove();
    },
  };
}
