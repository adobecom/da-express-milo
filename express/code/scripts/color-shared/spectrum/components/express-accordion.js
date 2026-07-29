/**
 * Express Accordion — Wrapper for Spectrum Web Components <sp-accordion>
 *
 * Creates a single-item collapsible accordion for use in sidebars and panels.
 * Accordion open/closed state is transient UI — not stored in app state.
 *
 * Usage:
 *   import { createExpressAccordion } from '../spectrum/components/express-accordion.js';
 *
 *   const { element, destroy } = await createExpressAccordion({
 *     label: 'Categories',
 *     content: myContentElement,
 *     open: true,
 *     onToggle: ({ open }) => console.log(open),
 *   });
 *   container.appendChild(element);
 */

import { loadAccordion } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/accordion.css';

/**
 * Create an Express accordion with a single collapsible item.
 *
 * @param {Object}      config
 * @param {string}      config.label          — accordion item header label
 * @param {HTMLElement} config.content        — element to place inside the accordion item
 * @param {boolean}     [config.open=false]   — whether the item starts expanded
 * @param {string}      [config.size]         — Spectrum size ('s', 'm', 'l', 'xl')
 * @param {string}      [config.density]      — Spectrum density ('compact', 'spacious')
 * @param {Function}    [config.onToggle]     — ({ open: boolean }) called on toggle
 * @returns {Promise<{ element: HTMLElement, destroy: () => void }>}
 */
export async function createExpressAccordion(config = {}) {
  const {
    label,
    content,
    open = false,
    size,
    density,
    onToggle,
  } = config;

  await loadAccordion();
  await loadOverrideStyles('accordion', STYLES_PATH);

  const theme = createThemeWrapper();
  const accordion = document.createElement('sp-accordion');
  if (size) accordion.setAttribute('size', size);
  if (density) accordion.setAttribute('density', density);
  const item = document.createElement('sp-accordion-item');

  item.setAttribute('label', label);
  if (open) item.setAttribute('open', '');

  item.appendChild(content);
  accordion.appendChild(item);
  theme.appendChild(accordion);

  const controller = new AbortController();
  const { signal } = controller;

  if (onToggle) {
    item.addEventListener('toggle', () => {
      onToggle({ open: item.hasAttribute('open') });
    }, { signal });
  }

  return {
    element: theme,

    destroy() {
      controller.abort();
      theme.remove();
    },
  };
}
