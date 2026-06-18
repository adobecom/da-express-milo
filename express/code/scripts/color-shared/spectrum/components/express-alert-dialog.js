/**
 * Express Alert Dialog — Wrapper for Spectrum Web Components <sp-alert-dialog>
 *
 * Presents a centered modal confirmation with backdrop + sp-alert-dialog.
 *
 * Usage:
 *   import { showExpressAlertDialog } from '../spectrum/components/express-alert-dialog.js';
 *
 *   const confirmed = await showExpressAlertDialog({
 *     title: 'Delete theme',
 *     body: 'Are you sure you want to delete ...?',
 *     variant: 'destructive',
 *     cancelLabel: 'Cancel',
 *     confirmLabel: 'Delete',
 *     confirmVariant: 'negative',
 *     confirmIcon: 'sp-icon-delete',
 *   });
 */

import { loadAlertDialog } from '../load-spectrum.js';
import { createThemeWrapper } from '../utils/theme.js';
import {
  trapFocus,
  handleEscapeClose,
  disableBackgroundScroll,
  restoreBackgroundScroll,
} from '../utils/a11y.js';
import { loadOverrideStyles } from './style-loader.js';

const STYLES_PATH = '/express/code/scripts/color-shared/spectrum/styles/alert-dialog.css';

let dialogIdCounter = 0;

/**
 * @param {Object} config
 * @param {string} config.title
 * @param {string} config.body
 * @param {'confirmation'|'information'|'warning'|'error'|'destructive'} [config.variant='confirmation']
 * @param {string} config.cancelLabel
 * @param {string} config.confirmLabel
 * @param {'accent'|'negative'|'primary'|'secondary'} [config.confirmVariant='accent']
 * @param {string} [config.confirmIcon] — e.g. 'sp-icon-delete'
 * @returns {Promise<boolean>} true when confirmed, false when cancelled/dismissed
 */
export async function showExpressAlertDialog(config) {
  const {
    title,
    body,
    variant = 'confirmation',
    cancelLabel,
    confirmLabel,
    confirmVariant = 'accent',
    confirmIcon,
  } = config;

  await loadAlertDialog();
  await loadOverrideStyles('alert-dialog', STYLES_PATH);
  await customElements.whenDefined('sp-alert-dialog');

  const dialogId = `express-alert-dialog-${dialogIdCounter += 1}`;
  const headingId = `${dialogId}-heading`;
  const messageId = `${dialogId}-message`;

  const theme = createThemeWrapper();
  const backdrop = document.createElement('div');
  backdrop.classList.add('express-alert-dialog-overlay');
  backdrop.setAttribute('aria-hidden', 'true');

  const wrapper = document.createElement('div');
  wrapper.classList.add('express-alert-dialog-wrapper');
  wrapper.setAttribute('role', 'presentation');
  wrapper.style.display = 'none';

  const alertDialog = document.createElement('sp-alert-dialog');
  alertDialog.setAttribute('role', 'alertdialog');
  alertDialog.setAttribute('variant', variant);
  alertDialog.setAttribute('aria-labelledby', headingId);
  alertDialog.setAttribute('aria-describedby', messageId);
  alertDialog.classList.add('express-alert-dialog');

  const heading = document.createElement('h2');
  heading.id = headingId;
  heading.setAttribute('slot', 'heading');
  heading.textContent = title;

  const message = document.createElement('p');
  message.id = messageId;
  message.textContent = body;

  const cancelBtn = document.createElement('sp-button');
  cancelBtn.setAttribute('slot', 'button');
  cancelBtn.setAttribute('variant', 'secondary');
  cancelBtn.setAttribute('treatment', 'outline');
  cancelBtn.textContent = cancelLabel;

  const confirmBtn = document.createElement('sp-button');
  confirmBtn.setAttribute('slot', 'button');
  confirmBtn.setAttribute('variant', confirmVariant);
  confirmBtn.setAttribute('treatment', 'fill');
  if (confirmIcon) {
    const icon = document.createElement(confirmIcon);
    icon.setAttribute('slot', 'icon');
    icon.setAttribute('size', 's');
    confirmBtn.appendChild(icon);
  }
  confirmBtn.append(document.createTextNode(confirmLabel));

  alertDialog.append(heading, message, cancelBtn, confirmBtn);
  wrapper.append(backdrop, alertDialog);
  theme.appendChild(wrapper);
  document.body.appendChild(theme);

  const previousFocus = document.activeElement;
  let focusTrap = null;
  let escHandler = null;

  return new Promise((resolve) => {
    function cleanup(confirmed) {
      wrapper.style.display = 'none';
      focusTrap?.release();
      escHandler?.release();
      focusTrap = null;
      escHandler = null;
      restoreBackgroundScroll();
      theme.remove();
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
      resolve(confirmed);
    }

    function close(confirmed) {
      cleanup(confirmed);
    }

    cancelBtn.addEventListener('click', () => close(false));
    confirmBtn.addEventListener('click', () => close(true));

    escHandler = handleEscapeClose(wrapper, () => close(false));

    disableBackgroundScroll();
    wrapper.style.display = '';
    focusTrap = trapFocus(wrapper);

    requestAnimationFrame(() => {
      cancelBtn.focus();
    });
  });
}
