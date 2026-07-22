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
    disableAria = false,
    preserveLineBreaks = false,
  } = config;

  await loadTooltip();
  await loadOverrideStyles('tooltip', STYLES_PATH);
  await customElements.whenDefined('sp-tooltip');

  const isTouchDevice = window.matchMedia?.('(hover: none)')?.matches ?? false;

  const theme = createThemeWrapper();
  const tooltip = document.createElement('sp-tooltip');
  tooltip.setAttribute('placement', placement);
  tooltip.setAttribute('self-managed', '');
  let preserveLineBreaksNode = null;
  if (preserveLineBreaks) {
    preserveLineBreaksNode = document.createElement('span');
    preserveLineBreaksNode.style.whiteSpace = 'pre-line';
    preserveLineBreaksNode.textContent = content;
    tooltip.replaceChildren(preserveLineBreaksNode);
  } else {
    tooltip.textContent = content;
  }
  if (preserveLineBreaks) {
    tooltip.setAttribute('data-preserve-line-breaks', 'true');
  }

  theme.appendChild(tooltip);

  Object.assign(theme.style, {
    position: 'absolute',
    width: '0',
    height: '0',
    overflow: 'hidden',
  });

  const ariaLink = disableAria ? null : ariaDescribedBy(targetEl, tooltip);

  const controller = new AbortController();
  const { signal } = controller;
  let showTimer = null;
  let visible = false;
  let removeOutsideClickHandler = null;
  let guardObserver = null;

  function clearGuard() {
    if (guardObserver) {
      guardObserver.disconnect();
      guardObserver = null;
    }
  }

  function hide() {
    clearTimeout(showTimer);
    clearGuard();
    tooltip.removeAttribute('open');
    visible = false;
    removeOutsideClickHandler?.();
    removeOutsideClickHandler = null;
  }

  function show() {
    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      tooltip.setAttribute('open', '');
      visible = true;
    }, delay);
  }

  if (isTouchDevice) {
    const blockTouchPointer = (e) => {
      if (e.pointerType === 'touch') e.stopImmediatePropagation();
    };
    targetEl.addEventListener('pointerenter', blockTouchPointer, { capture: true, signal });
    targetEl.addEventListener('pointerleave', blockTouchPointer, { capture: true, signal });

    const toggleTouch = () => {
      if (visible) {
        hide();
        return;
      }
      clearGuard();
      tooltip.setAttribute('open', '');
      visible = true;

      // Spectrum's self-managed sp-overlay responds to the iOS-synthesized
      // pointerleave/focus events that trail a tap and removes `open` before
      // the user can read the tooltip. Guard against this for a short window:
      // any external removal of `open` within GUARD_MS is immediately reversed.
      // The guard is cleared by hide() so intentional closes are unaffected.
      const GUARD_MS = 400;
      const guardedAt = Date.now();
      guardObserver = new MutationObserver(() => {
        if (!visible || Date.now() - guardedAt >= GUARD_MS) {
          clearGuard();
          return;
        }
        tooltip.setAttribute('open', '');
      });
      guardObserver.observe(tooltip, { attributes: true, attributeFilter: ['open'] });
      setTimeout(clearGuard, GUARD_MS);

      setTimeout(() => {
        const outsideHandler = (evt) => {
          const path = evt.composedPath?.() || [];
          if (!path.includes(targetEl) && !path.includes(theme)) {
            hide();
          }
        };
        document.addEventListener('click', outsideHandler, true);
        removeOutsideClickHandler = () => document.removeEventListener('click', outsideHandler, true);
      }, 0);
    };
    targetEl.addEventListener('click', toggleTouch, { signal });
  } else {
    targetEl.addEventListener('pointerenter', show, { signal });
    targetEl.addEventListener('pointerleave', hide, { signal });
  }

  if (!isTouchDevice) {
    targetEl.addEventListener('focusin', () => {
      if (targetEl.matches(':focus-visible')) show();
    }, { signal });
    targetEl.addEventListener('focusout', hide, { signal });
  }

  targetEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && visible) hide();
  }, { signal });

  document.body.appendChild(theme);
  await (tooltip.updateComplete ?? Promise.resolve());
  const overlay = tooltip.shadowRoot?.querySelector?.('sp-overlay');
  if (overlay && typeof overlay.triggerElement !== 'undefined') {
    overlay.triggerElement = targetEl;
  }

  return {
    element: theme,

    setContent(text) {
      if (preserveLineBreaksNode) {
        preserveLineBreaksNode.textContent = text;
      } else {
        tooltip.textContent = text;
      }
    },

    destroy() {
      controller.abort();
      clearTimeout(showTimer);
      clearGuard();
      removeOutsideClickHandler?.();
      ariaLink?.release();
      theme.remove();
    },
  };
}
