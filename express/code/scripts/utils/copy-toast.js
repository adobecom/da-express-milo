import { getLibs } from '../utils.js';

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
 */
export default async function showCopyToast(message) {
  if (!createTag) {
    let getConfig;
    ({ createTag, loadStyle, getConfig } = await import(`${getLibs()}/utils/utils.js`));
    loadStyle(`${getConfig().codeRoot}/scripts/utils/copy-toast.css`);
  }
  if (!container) {
    container = createTag('div', { class: 'copy-toast-container', role: 'status', 'aria-live': 'polite' });
    document.body.append(container);
  }

  container.querySelectorAll('.copy-toast').forEach((t) => t.remove());

  const toast = createTag('div', { class: 'copy-toast' }, [
    createTag('span', { class: 'copy-toast-icon', 'aria-hidden': 'true' }),
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
  });
  closeBtn.addEventListener('click', remove);
  toast.append(closeBtn);

  requestAnimationFrame(() => toast.classList.add('is-visible'));

  setTimeout(remove, 5000);
}
