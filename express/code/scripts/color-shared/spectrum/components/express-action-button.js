/**
 * Express Action Button — Wrapper for Spectrum Web Components <sp-action-button>
 *
 * Creates a themed action button with Express styling overrides.
 */

import { loadActionButton } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/action-button.css';

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
 * Create an Express action button.
 *
 * @param {Object} config
 * @param {string} [config.label=''] — visible text or aria label
 * @param {'s'|'m'|'l'} [config.size='m']
 * @param {boolean} [config.quiet=false]
 * @param {boolean} [config.selected=false]
 * @param {boolean} [config.disabled=false]
 * @param {boolean} [config.staticColor=false]
 * @param {boolean} [config.iconOnly=false]
 * @param {HTMLElement|string} [config.icon]
 * @param {Function} [config.onClick]
 * @returns {Promise<{
 *   element: HTMLElement,
 *   setLabel: (s:string)=>void,
 *   setDisabled: (b:boolean)=>void,
 *   destroy: ()=>void
 * }>}
 */
export default async function createExpressActionButton(config = {}) {
  const {
    label = '',
    size = 'm',
    quiet = false,
    selected = false,
    disabled = false,
    staticColor = false,
    iconOnly = false,
    icon,
    onClick,
  } = config;

  await loadActionButton();
  await loadOverrideStyles('action-button', STYLES_PATH);
  await customElements.whenDefined('sp-action-button');

  const theme = createThemeWrapper();
  const button = document.createElement('sp-action-button');
  const iconSlot = createIconSlot(icon);

  button.setAttribute('size', size);
  if (label) button.setAttribute('label', label);
  if (quiet) button.setAttribute('quiet', '');
  if (selected) button.setAttribute('selected', '');
  if (disabled) button.setAttribute('disabled', '');
  if (staticColor) button.setAttribute('static-color', 'white');
  if (!iconOnly && label) button.appendChild(document.createTextNode(label));
  if (iconSlot) button.prepend(iconSlot);

  theme.appendChild(button);

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  return {
    element: theme,

    setLabel(text) {
      button.setAttribute('label', text);
      if (!iconOnly) {
        button.textContent = text;
        if (iconSlot) button.prepend(iconSlot.cloneNode(true));
      }
    },

    setDisabled(disabledState) {
      button.toggleAttribute('disabled', Boolean(disabledState));
    },

    destroy() {
      if (onClick) button.removeEventListener('click', onClick);
      theme.remove();
    },
  };
}
