/**
 * Express Tooltip — Wrapper for Spectrum Web Components <sp-tooltip>
 *
 * Attaches an accessible tooltip to a target element using hover + focus
 * triggers, with Express styling and proper ARIA linking.
 *
 * Usage:
 *   import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';
 *
 *   const tip = await createExpressTooltip({
 *     targetEl: myButton,
 *     content: 'Helpful description',
 *     placement: 'top',
 *   });
 *   // tooltip is automatically attached — call tip.destroy() to remove
 */

import { loadTooltip } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { ariaDescribedBy } from '../utils/a11y.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/tooltip.css';

/**
 * Create an Express tooltip attached to a target element.
 *
 * @param {Object}      config
 * @param {HTMLElement}  config.targetEl   — element the tooltip describes
 * @param {string}       config.content    — tooltip text
 * @param {'top'|'bottom'|'left'|'right'} [config.placement='top']
 * @param {number}       [config.delay=300] — show delay in ms
 * @returns {Promise<{element: HTMLElement, setContent: (s:string)=>void, destroy: ()=>void}>}
 */
export async function createExpressTooltip(config) {
  const {
    targetEl,
    content,
    placement = 'top',
    delay = 300,
  } = config;

  await loadTooltip();
  await loadOverrideStyles('tooltip', STYLES_PATH);
  await customElements.whenDefined('sp-tooltip');

  const theme = createThemeWrapper();
  const tooltip = document.createElement('sp-tooltip');
  tooltip.setAttribute('placement', placement);
  tooltip.setAttribute('self-managed', '');
  tooltip.textContent = content;

  theme.appendChild(tooltip);

  // ARIA: link tooltip to target
  const ariaLink = ariaDescribedBy(targetEl, tooltip);

  // Controller
  const controller = new AbortController();
  const { signal } = controller;
  let showTimer = null;
  let visible = false;

  function show() {
    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      tooltip.setAttribute('open', '');
      visible = true;
    }, delay);
  }

  function hide() {
    clearTimeout(showTimer);
    tooltip.removeAttribute('open');
    visible = false;
  }

  // Hover triggers
  targetEl.addEventListener('pointerenter', show, { signal });
  targetEl.addEventListener('pointerleave', hide, { signal });

  // Focus triggers
  targetEl.addEventListener('focusin', () => {
    if (targetEl.matches(':focus-visible')) show();
  }, { signal });
  targetEl.addEventListener('focusout', hide, { signal });

  // ESC to close when focused
  targetEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && visible) hide();
  }, { signal });

  // Insert tooltip near target
  targetEl.insertAdjacentElement('afterend', theme);

  return {
    element: theme,

    setContent(text) {
      tooltip.textContent = text;
    },

    destroy() {
      controller.abort();
      clearTimeout(showTimer);
      ariaLink.release();
      theme.remove();
    },
  };
}
