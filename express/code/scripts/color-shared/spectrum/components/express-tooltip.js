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
import { ariaDescribedBy } from '../utils/a11y.js';
import { createThemeWrapper } from '../utils/theme.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/tooltip.css';

const SEMANTIC_VARIANT = {
  neutral: '',
  informative: 'info',
  negative: 'negative',
};
/* eslint-disable-next-line import/prefer-default-export */
export async function createExpressTooltip(config) {
  const {
    targetEl,
    content: configContent,
    placement = 'bottom',
    semantic = 'neutral',
    delay = 300,
    preserveLineBreaks = false,
  } = config;

  /* Use only action label: config content or target aria-label. Never use title (modal/palette name). */
  const content = (typeof configContent === 'string' && configContent.trim())
    ? configContent.trim()
    : (targetEl.getAttribute('aria-label') || '').trim();

  await loadTooltip();
  await loadOverrideStyles('tooltip', STYLES_PATH);
  await customElements.whenDefined('sp-tooltip');

  const theme = createThemeWrapper({ system: 'spectrum-two' });
  theme.style.position = 'absolute';
  theme.style.left = '0';
  theme.style.top = '0';
  theme.style.width = '0';
  theme.style.height = '0';
  theme.style.overflow = 'visible';
  theme.style.pointerEvents = 'none';
  const tooltip = document.createElement('sp-tooltip');
  tooltip.setAttribute('placement', placement);
  const spVariant = SEMANTIC_VARIANT[semantic];
  if (spVariant) tooltip.setAttribute('variant', spVariant);
  tooltip.setAttribute('self-managed', '');
  if (delay > 0) tooltip.setAttribute('delayed', '');
  const applyContent = (text) => {
    const value = `${text ?? ''}`;
    if (!preserveLineBreaks) {
      tooltip.textContent = value;
      return;
    }
    tooltip.replaceChildren();
    value.split('\n').forEach((line, index) => {
      if (index > 0) tooltip.appendChild(document.createElement('br'));
      tooltip.appendChild(document.createTextNode(line));
    });
  };
  applyContent(content);

  /* Avoid duplicate tooltips: hide native title while Spectrum tooltip is attached. */
  const savedTitle = targetEl.getAttribute('title') || null;
  if (savedTitle !== null) targetEl.removeAttribute('title');

  // ARIA: link tooltip to target
  const ariaLink = ariaDescribedBy(targetEl, tooltip);

  const controller = new AbortController();
  const { signal } = controller;
  let showTimer = null;
  let visible = false;
  const bindTrigger = () => {
    const overlay = tooltip.overlayElement;
    if (!overlay) return false;
    overlay.triggerElement = targetEl;
    return true;
  };

  function show() {
    clearTimeout(showTimer);
    if (!bindTrigger()) requestAnimationFrame(bindTrigger);
    if (delay > 0) {
      showTimer = setTimeout(() => {
        bindTrigger();
        tooltip.setAttribute('open', '');
        visible = true;
      }, delay);
      return;
    }
    bindTrigger();
    tooltip.setAttribute('open', '');
    visible = true;
  }

  function hide() {
    clearTimeout(showTimer);
    tooltip.removeAttribute('open');
    visible = false;
  }

  targetEl.addEventListener('pointerenter', show, { signal });
  targetEl.addEventListener('pointerleave', hide, { signal });
  targetEl.addEventListener('focusin', () => {
    if (targetEl.matches(':focus-visible')) show();
  }, { signal });
  targetEl.addEventListener('focusout', hide, { signal });
  targetEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && visible) hide();
  }, { signal });

  theme.appendChild(tooltip);
  const rootNode = targetEl.getRootNode?.();
  const mountNode = rootNode instanceof ShadowRoot ? rootNode : document.body;
  mountNode.appendChild(theme);
  tooltip.updateComplete?.then(() => {
    bindTrigger();
  }).catch(() => {});

  return {
    element: theme,

    setContent(text) {
      applyContent(text);
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
