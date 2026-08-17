import { getLibs } from '../utils.js';
import { announceToScreenReader } from '../color-shared/spectrum/utils/a11y.js';

let createTag;
let loadStyle;
let container;

/**
 * Lightweight, dependency-free bottom-of-screen toast for copy-to-clipboard
 * feedback, per Figma node 0-19315: a pill with a checkmark icon that
 * auto-dismisses after 5s. Deliberately not the Spectrum `showExpressToast`
 * (express-toast.js) — that pulls in the full Spectrum Web Components
 * machinery, which is disproportionate for a single plain-text toast shared
 * across unrelated blocks (mini-editor, collapsible-rows).
 *
 * The message is announced via announceToScreenReader (see a11y.js), not
 * via aria-live/role="status" on this container — that was tried first but
 * confirmed silent in real screen-reader testing: the container is created
 * AND its first toast (already carrying the message) appended in the same
 * synchronous call, on every invocation, so an AT never observes a prior
 * "registered, empty" state to diff the new text against. announceToScreenReader
 * avoids exactly this by pre-registering its own empty live region up front
 * and only setting its text on a later tick.
 */
export default async function showCopyToast(message) {
  if (!createTag) {
    let getConfig;
    ({ createTag, loadStyle, getConfig } = await import(`${getLibs()}/utils/utils.js`));
    loadStyle(`${getConfig().codeRoot}/scripts/utils/copy-toast.css`);
    // sp-icon-checkmark-circle-outline / sp-icon-close are real Spectrum
    // Web Components custom elements (same pattern as
    // mini-editor-widget.js's topActions) — load their definitions once,
    // before first use.
    await import(`${getConfig().codeRoot}/scripts/widgets/spectrum/dist/icons-workflow.js`);
  }
  if (!container) {
    container = createTag('div', { class: 'copy-toast-container' });
    document.body.append(container);
  }

  announceToScreenReader(message);
  container.querySelectorAll('.copy-toast').forEach((t) => t.remove());

  const toast = createTag('div', { class: 'copy-toast' }, [
    createTag('sp-icon-checkmark-circle-outline', { class: 'copy-toast-icon', 'aria-hidden': 'true' }),
    createTag('span', { class: 'copy-toast-message' }, [message]),
  ]);
  container.append(toast);

  const remove = () => {
    toast.classList.remove('is-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  const closeBtn = createTag('button', {
    type: 'button',
    class: 'copy-toast-close',
    'aria-label': 'Close',
  }, [createTag('sp-icon-close', { class: 'copy-toast-close-icon', 'aria-hidden': 'true' })]);
  closeBtn.addEventListener('click', remove);
  toast.append(closeBtn);

  requestAnimationFrame(() => toast.classList.add('is-visible'));

  setTimeout(remove, 5000);
}
