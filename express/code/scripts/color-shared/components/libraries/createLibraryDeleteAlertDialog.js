import { showExpressAlertDialog } from '../../spectrum/components/express-alert-dialog.js';

function interpolate(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? vars[key] : ''));
}

/**
 * Show the delete confirmation alert dialog for a library theme or gradient.
 * @param {Object} options
 * @param {Object} options.item - Library item (theme or gradient)
 * @param {Object} options.strings - Resolved placeholders
 * @returns {Promise<boolean>} true when the user confirms delete
 */
export async function showLibraryDeleteAlertDialog({ item, strings }) {
  const name = item?.name || strings.librariesDefaultName || '';
  const isGradient = item?.type === 'gradient';
  const title = isGradient
    ? strings.librariesDeleteGradientHeading
    : strings.librariesDeleteThemeHeading;

  return showExpressAlertDialog({
    title,
    body: interpolate(strings.librariesDeleteConfirmBody, { name }),
    variant: 'destructive',
    cancelLabel: strings.librariesDeleteCancel,
    confirmLabel: strings.librariesDeleteConfirm,
    confirmVariant: 'negative',
    confirmIcon: 'sp-icon-delete',
  });
}
