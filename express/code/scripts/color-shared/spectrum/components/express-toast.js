/**
 * Express Toast — Wrapper for Spectrum Web Components <sp-toast>
 *
 * Provides an imperative API for showing brief, non-blocking notifications
 * from anywhere in Color Explorer.
 *
 * Usage:
 *   import { showExpressToast } from '../spectrum/components/express-toast.js';
 *
 *   showExpressToast({
 *     message: 'Color copied!',
 *     variant: 'positive',
 *     timeout: 3000,
 *   });
 */

import { loadToast, loadButton } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import { announceToScreenReader } from '../utils/a11y.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/toast.css';

// ── Toast Stack Management ──────────────────────────────────────────
let toastContainer = null;
const activeToasts = [];
const MAX_VISIBLE = 3;

function ensureContainer() {
  if (toastContainer && document.body.contains(toastContainer)) return toastContainer;

  toastContainer = document.createElement('div');
  toastContainer.classList.add('express-toast-container');
  toastContainer.setAttribute('aria-live', 'polite');
  toastContainer.setAttribute('aria-relevant', 'additions');
  document.body.appendChild(toastContainer);
  return toastContainer;
}

function updateStack() {
  activeToasts.forEach((t, i) => {
    t.root.style.display = i < MAX_VISIBLE ? '' : 'none';
  });
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Show a toast notification.
 *
 * @param {Object} config
 * @param {string} config.message
 * @param {'positive'|'negative'|'info'|'neutral'} [config.variant='info']
 * @param {number} [config.timeout=4000] — auto-dismiss in ms (0 = manual close)
 * @param {Function} [config.onClose]    — called when the toast is dismissed
 * @param {{label: string, href?: string, sameTab?: boolean, onClick?: Function}} [config.action]
 *        — optional inline action button (href opens a new tab unless sameTab is set)
 * @returns {Promise<{close: ()=>void}>}
 */
export async function showExpressToast(config) {
  const {
    message,
    variant = 'info',
    timeout = 4000,
    onClose,
    action,
  } = config;

  await loadToast();
  await loadOverrideStyles('toast', STYLES_PATH);
  await customElements.whenDefined('sp-toast');

  if (action?.label && (action.href || action.onClick)) {
    await loadButton();
    await customElements.whenDefined('sp-button');
  }

  const container = ensureContainer();
  const theme = createThemeWrapper();
  const toast = document.createElement('sp-toast');

  // Spectrum toast variants
  const variantMap = {
    positive: 'positive',
    negative: 'negative',
    info: 'info',
    neutral: '',
  };
  const spVariant = variantMap[variant];
  if (spVariant) toast.setAttribute('variant', spVariant);
  toast.setAttribute('open', '');
  toast.textContent = message;

  if (action?.label && (action.href || action.onClick)) {
    const button = document.createElement('sp-button');
    button.slot = 'action';
    button.setAttribute('variant', 'secondary');
    button.setAttribute('treatment', 'outline');
    button.setAttribute('static-color', 'white');
    button.setAttribute('size', 'm');
    button.textContent = action.label;
    if (action.href) {
      if (action.sameTab) {
        // Same-tab is fine as a plain href anchor: sp-button double-fires the click
        // (internal anchor + proxied anchor.click()) but both navigate the same tab,
        // so the redundant second navigation is invisible.
        button.setAttribute('href', action.href);
      } else {
        // New tab by default. A real <a target="_blank"> on sp-button double-fires and
        // opens two tabs, so navigate via window.open on click for a single new tab.
        button.addEventListener('click', () => {
          window.open(action.href, '_blank', 'noopener,noreferrer');
        });
      }
    }
    if (action.onClick) {
      button.addEventListener('click', action.onClick);
    }
    toast.appendChild(button);
  }

  theme.appendChild(toast);
  container.appendChild(theme);

  // Screen-reader announcement
  announceToScreenReader(message, variant === 'negative' ? 'assertive' : 'polite');

  // Track
  const entry = { root: theme, toast };
  activeToasts.unshift(entry);
  updateStack();

  // Close logic
  let timer = null;

  function close() {
    clearTimeout(timer);
    const idx = activeToasts.indexOf(entry);
    if (idx > -1) activeToasts.splice(idx, 1);
    theme.remove();
    updateStack();
    onClose?.();
  }

  // Auto-dismiss
  if (timeout > 0) {
    timer = setTimeout(close, timeout);
  }

  // Listen for Spectrum's native close event
  toast.addEventListener('close', close, { once: true });

  return { close };
}
