/**
 * Express Button — Wrapper for Spectrum Web Components <sp-button>
 *
 * Creates a themed, accessible button with Express styling overrides.
 *
 * Usage:
 *   import { createExpressButton } from '../spectrum/components/express-button.js';
 *
 *   const btn = await createExpressButton({
 *     label: 'Save',
 *     variant: 'primary',
 *     onClick: () => console.log('clicked'),
 *   });
 *   container.appendChild(btn.element);
 */

/* eslint-disable import/prefer-default-export */

import { loadButton } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/button.css';

/**
 * Variant mapping — Express names to Spectrum attributes.
 * @type {Record<string, {variant:string, treatment?:string}>}
 */
const VARIANT_MAP = {
  primary: { variant: 'accent', treatment: 'fill' },
  secondary: { variant: 'secondary', treatment: 'fill' },
  quiet: { variant: 'secondary', treatment: 'outline' },
  danger: { variant: 'negative', treatment: 'fill' },
};

/**
 * Create an Express button.
 *
 * @param {Object}   config
 * @param {string}   config.label          — button text
 * @param {'primary'|'secondary'|'quiet'|'danger'} [config.variant='primary']
 * @param {'s'|'m'|'l'}  [config.size='m']
 * @param {boolean}  [config.disabled=false]
 * @param {Function} [config.onClick]
 * @param {string}   [config.iconSlotHtml] — optional icon HTML for the icon slot
 * @returns {Promise<{
 *   element: HTMLElement,
 *   setLabel: (s:string)=>void,
 *   setDisabled: (b:boolean)=>void,
 *   destroy: ()=>void
 * }>}
 */
export async function createExpressButton(config) {
  const {
    label,
    variant = 'primary',
    size = 'm',
    disabled = false,
    onClick,
    iconSlotHtml,
  } = config;

  await loadButton();
  await loadOverrideStyles('button', STYLES_PATH);
  await customElements.whenDefined('sp-button');

  const theme = createThemeWrapper();
  const button = document.createElement('sp-button');

  // Map variant
  const mapping = VARIANT_MAP[variant] || VARIANT_MAP.primary;
  button.setAttribute('variant', mapping.variant);
  if (mapping.treatment) button.setAttribute('treatment', mapping.treatment);
  button.setAttribute('size', size);
  if (disabled) button.setAttribute('disabled', '');

  // Label
  button.textContent = label;

  // Optional icon
  if (iconSlotHtml) {
    const iconWrapper = document.createElement('span');
    iconWrapper.setAttribute('slot', 'icon');
    iconWrapper.innerHTML = iconSlotHtml;
    button.prepend(iconWrapper);
  }

  theme.appendChild(button);

  // Event
  if (onClick) {
    button.addEventListener('click', onClick);
  }

  // When the theme wrapper has focus (e.g. roving tabindex), Enter/Space must activate the inner button
  theme.addEventListener('keydown', (e) => {
    if (e.target !== theme) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      button.click();
    }
  });

  return {
    element: theme,

    setLabel(text) {
      // Preserve icon slot if present
      const icon = button.querySelector('[slot="icon"]');
      button.textContent = text;
      if (icon) button.prepend(icon);
    },

    setDisabled(val) {
      if (val) button.setAttribute('disabled', '');
      else button.removeAttribute('disabled');
    },

    destroy() {
      if (onClick) button.removeEventListener('click', onClick);
      theme.remove();
    },
  };
}
