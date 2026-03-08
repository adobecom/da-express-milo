/**
 * Express Tooltip — Wrapper for Spectrum Web Components <sp-tooltip>
 * Follows Figma Tooltip spec: Final-Color-Expansion-CCEX-221263 node 5598-406572
 * Placement: bottom (default), top, left, right. Semantic: neutral, informative, negative.
 *
 * Usage:
 *   import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';
 *
 *   const tip = await createExpressTooltip({
 *     targetEl: myButton,
 *     content: 'Helpful description',
 *     placement: 'top',
 *     semantic: 'neutral',
 *   });
 *   // tooltip is automatically attached — call tip.destroy() to remove
 */

import { loadTooltip } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { ariaDescribedBy } from '../utils/a11y.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/tooltip.css';

/** @type {Record<string, string>} Map Figma semantic to sp-tooltip variant. */
const SEMANTIC_VARIANT = {
  neutral: '',
  informative: 'info',
  negative: 'negative',
};

/**
 * Create an Express tooltip attached to a target element.
 * Tooltip content must be the action label (e.g. "Edit color", "Copy Hex"), never
 * the modal or palette title. Prefer config.content; fallback to target aria-label only.
 *
 * @param {Object}      config
 * @param {HTMLElement}  config.targetEl   — element the tooltip describes
 * @param {string}       config.content    — tooltip text (action label; do not use title)
 * @param {'top'|'bottom'|'left'|'right'} [config.placement='bottom'] — Figma default Bottom
 * @param {'neutral'|'informative'|'negative'} [config.semantic='neutral'] — Figma Semantic
 * @param {number}       [config.delay=300] — show delay in ms
 * @returns {Promise<{element: HTMLElement, setContent: (s:string)=>void, destroy: ()=>void}>}
 */
/* eslint-disable-next-line import/prefer-default-export */
export async function createExpressTooltip(config) {
  const {
    targetEl,
    content: configContent,
    placement = 'bottom',
    semantic = 'neutral',
    delay = 300,
  } = config;

  /* Use only action label: config content or target aria-label. Never use title (modal/palette name). */
  const content = (typeof configContent === 'string' && configContent.trim())
    ? configContent.trim()
    : (targetEl.getAttribute('aria-label') || '').trim();

  await loadTooltip();
  await loadOverrideStyles('tooltip', STYLES_PATH);
  await customElements.whenDefined('sp-tooltip');

  const theme = createThemeWrapper();
  const tooltip = document.createElement('sp-tooltip');
  tooltip.setAttribute('placement', placement);
  const spVariant = SEMANTIC_VARIANT[semantic];
  if (spVariant) tooltip.setAttribute('variant', spVariant);
  tooltip.setAttribute('self-managed', '');
  tooltip.textContent = content;

  /* Avoid duplicate tooltips: hide native title while Spectrum tooltip is attached. */
  const savedTitle = targetEl.getAttribute('title') || null;
  if (savedTitle !== null) targetEl.removeAttribute('title');

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

  // Insert tooltip *inside* the trigger so sp-tooltip's self-managed overlay finds
  // the correct triggerElement (focusable ancestor). Otherwise the overlay never shows.
  theme.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none;';
  theme.setAttribute('tabindex', '-1');
  targetEl.style.position = targetEl.style.position || 'relative';
  targetEl.appendChild(theme);

  return {
    element: theme,

    setContent(text) {
      tooltip.textContent = text;
    },

    destroy() {
      controller.abort();
      clearTimeout(showTimer);
      ariaLink.release();
      if (savedTitle !== null) targetEl.setAttribute('title', savedTitle);
      theme.remove();
    },
  };
}
