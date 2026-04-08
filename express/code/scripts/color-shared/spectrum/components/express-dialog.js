/**
 * Express Dialog — Wrapper for Spectrum Web Components <sp-dialog>
 *
 * Provides a modal dialog with focus trapping, ESC-to-close, scroll lock,
 * and a consistent event model for Color Explorer pages.
 *
 * Usage:
 *   import { createExpressDialog } from '../spectrum/components/express-dialog.js';
 *
 *   const dialog = await createExpressDialog({
 *     title: 'Delete color?',
 *     body: 'This cannot be undone.',
 *     actions: [
 *       { label: 'Cancel', variant: 'secondary', action: 'cancel' },
 *       { label: 'Delete', variant: 'danger',    action: 'confirm' },
 *     ],
 *   });
 *
 *   dialog.on('confirm', () => handleDelete());
 *   dialog.on('cancel', () => {});
 *   dialog.open();
 */

import { loadDialog } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import {
  trapFocus,
  handleEscapeClose,
  disableBackgroundScroll,
  restoreBackgroundScroll,
} from '../utils/a11y.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/dialog.css';

/**
 * @typedef {Object} DialogAction
 * @property {string} label
 * @property {'primary'|'secondary'|'quiet'|'danger'} [variant='secondary']
 * @property {string} action — event name emitted when clicked
 */

/**
 * Create an Express dialog.
 *
 * @param {Object}         config
 * @param {string}         config.title
 * @param {string|HTMLElement} config.body — text or DOM node
 * @param {DialogAction[]} [config.actions=[]]
 * @param {boolean}        [config.dismissable=true] — show X button / ESC to close
 * @returns {Promise<{element: HTMLElement, open: ()=>void, close: ()=>void, on: (action:string, cb:Function)=>void, destroy: ()=>void}>}
 */
export async function createExpressDialog(config) {
  const {
    title,
    body,
    actions = [],
    dismissable = true,
  } = config;

  await loadDialog();
  await loadOverrideStyles('dialog', STYLES_PATH);
  await customElements.whenDefined('sp-dialog');

  const theme = createThemeWrapper();
  const listeners = {};
  let focusTrap = null;
  let escHandler = null;
  let previousFocus = null;

  // ── Build dialog DOM ───────────────────────────────────────────
  const dialog = document.createElement('sp-dialog');
  dialog.setAttribute('size', 'm');
  if (dismissable) dialog.setAttribute('dismissable', '');

  // Title
  const heading = document.createElement('h2');
  heading.setAttribute('slot', 'heading');
  heading.textContent = title;
  dialog.appendChild(heading);

  // Body
  if (typeof body === 'string') {
    const p = document.createElement('p');
    p.textContent = body;
    dialog.appendChild(p);
  } else if (body instanceof HTMLElement) {
    dialog.appendChild(body);
  }

  // Action buttons
  if (actions.length) {
    const footer = document.createElement('div');
    footer.setAttribute('slot', 'button');
    footer.classList.add('express-dialog-actions');

    actions.forEach(({ label, variant = 'secondary', action }) => {
      const btn = document.createElement('sp-button');
      const variantMap = {
        primary: 'accent',
        secondary: 'secondary',
        quiet: 'secondary',
        danger: 'negative',
      };
      btn.setAttribute('variant', variantMap[variant] || 'secondary');
      if (variant === 'quiet') btn.setAttribute('treatment', 'outline');
      btn.textContent = label;
      btn.addEventListener('click', () => {
        emit(action);
        close();
      });
      footer.appendChild(btn);
    });

    dialog.appendChild(footer);
  }

  // Overlay backdrop
  const overlay = document.createElement('div');
  overlay.classList.add('express-dialog-overlay');
  overlay.setAttribute('aria-hidden', 'true');
  if (dismissable) {
    overlay.addEventListener('click', () => {
      emit('dismiss');
      close();
    });
  }

  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.classList.add('express-dialog-wrapper');
  wrapper.setAttribute('role', 'dialog');
  wrapper.setAttribute('aria-modal', 'true');
  wrapper.setAttribute('aria-label', title);
  wrapper.style.display = 'none';
  wrapper.appendChild(overlay);
  wrapper.appendChild(dialog);
  theme.appendChild(wrapper);

  // Dismiss X button event
  if (dismissable) {
    dialog.addEventListener('close', () => {
      emit('dismiss');
      close();
    });
  }

  // ── Event system ───────────────────────────────────────────────
  function emit(action) {
    (listeners[action] || []).forEach((cb) => {
      try { cb(); } catch (e) { console.error('[ExpressDialog]', e); }
    });
  }

  // ── Open / Close ───────────────────────────────────────────────
  function open() {
    previousFocus = document.activeElement;
    if (!document.body.contains(theme)) document.body.appendChild(theme);
    wrapper.style.display = '';
    disableBackgroundScroll();
    focusTrap = trapFocus(wrapper);
    if (dismissable) {
      escHandler = handleEscapeClose(wrapper, () => {
        emit('dismiss');
        close();
      });
    }
  }

  function close() {
    wrapper.style.display = 'none';
    restoreBackgroundScroll();
    focusTrap?.release();
    escHandler?.release();
    focusTrap = null;
    escHandler = null;
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
      previousFocus = null;
    }
  }

  return {
    element: theme,

    open,
    close,

    /**
     * Register a callback for an action.
     * @param {string}   action — matches action strings in config.actions
     * @param {Function} cb
     */
    on(action, cb) {
      if (!listeners[action]) listeners[action] = [];
      listeners[action].push(cb);
    },

    destroy() {
      close();
      theme.remove();
    },
  };
}
