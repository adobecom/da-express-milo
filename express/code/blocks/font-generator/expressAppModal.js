import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';

const STYLESHEET_HREF = '/express/code/blocks/font-generator/expressAppModal.css';

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || document.querySelector(`link[href="${STYLESHEET_HREF}"]`)) return;
  stylesInjected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLESHEET_HREF;
  document.head.appendChild(link);
}

// Session-only: once the user closes the modal, don't re-show it for the rest of this page session
// (resets on the next load). Never persisted — the modal shows again on the next visit.
let dismissedThisSession = false;
export function isAppModalDismissed() {
  return dismissedThisSession;
}

/**
 * Opens the "continue in the app" modal (Milo modal block) with code-built, placeholder-driven
 * content. The CTA is a Branch link that opens the Express app if installed, else the App Store.
 *
 * @param {{ title: string, body: string, ctaLabel: string, appUrl: string }} opts
 * @returns {Promise<HTMLElement | undefined>}
 */
export async function showAppModal({ title, body, ctaLabel, appUrl }) {
  injectStyles();

  const [{ getModal }, { createTag }] = await Promise.all([
    import(`${getLibs()}/blocks/modal/modal.js`),
    import(`${getLibs()}/utils/utils.js`),
  ]);

  const wrapper = createTag('div', { class: 'fg-app-modal' });
  wrapper.append(getIconElementDeprecated('adobe-express-logo'));

  const titleEl = createTag('h2', { class: 'fg-app-modal-title' });
  titleEl.textContent = title;

  const bodyEl = createTag('p', { class: 'fg-app-modal-body' });
  bodyEl.textContent = body;

  // A real anchor so tapping is a top-level navigation to the Branch link — the reliable way for
  // Branch to hand off to the app / App Store on iOS.
  const cta = createTag('a', {
    class: 'fg-app-modal-cta button',
    href: appUrl,
    target: '_blank',
    rel: 'noopener',
  });
  cta.textContent = ctaLabel;

  wrapper.append(titleEl, bodyEl, cta);

  const modal = await getModal(null, {
    id: 'fg-app-modal',
    class: 'fg-app-modal-dialog',
    content: wrapper,
    closeEvent: 'closeModal',
  });

  // "hide it for the session if the user hides it": flag once the modal leaves the DOM (close
  // button, overlay click, or Esc all remove it), so further taps this session skip the modal.
  if (modal) {
    const observer = new MutationObserver(() => {
      if (!modal.isConnected) {
        dismissedThisSession = true;
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  return modal;
}
