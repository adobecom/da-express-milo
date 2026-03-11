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

const BLOCKED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta']);
const URL_ATTRS = new Set(['href', 'src', 'xlink:href', 'formaction']);

function sanitizeNodeTree(root) {
  const all = [root, ...root.querySelectorAll('*')];
  all.forEach((node) => {
    if (BLOCKED_TAGS.has(node.tagName?.toLowerCase())) {
      node.remove();
      return;
    }
    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = `${attr.value || ''}`.trim().toLowerCase();
      if (name.startsWith('on')) {
        node.removeAttribute(attr.name);
        return;
      }
      if (URL_ATTRS.has(name) && (value.startsWith('javascript:') || value.startsWith('data:text/html'))) {
        node.removeAttribute(attr.name);
      }
    });
  });
}

function createSanitizedIconSlot(iconSlotHtml) {
  const iconWrapper = document.createElement('span');
  iconWrapper.setAttribute('slot', 'icon');
  const template = document.createElement('template');
  template.innerHTML = iconSlotHtml;
  sanitizeNodeTree(template.content);
  iconWrapper.appendChild(template.content);
  return iconWrapper;
}

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
 * @returns {Promise<{element: HTMLElement, setLabel: (s:string)=>void, setDisabled: (b:boolean)=>void, destroy: ()=>void}>}
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
    const iconWrapper = createSanitizedIconSlot(iconSlotHtml);
    button.prepend(iconWrapper);
  }

  theme.appendChild(button);

  // Event
  if (onClick) {
    button.addEventListener('click', onClick);
  }

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
