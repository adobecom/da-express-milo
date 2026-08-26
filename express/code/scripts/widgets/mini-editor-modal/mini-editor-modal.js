/**
 * Mini Editor Modal
 *
 * Wraps the mini-editor-widget's centre editor card (no decorative cards /
 * arc carousel — see `decorations: false`) in an animated modal dialog, per
 * Figma node 54:8824. Opened from collapsible-rows' "Create a design"
 * button (`mini-editor:use-quote`) — the same event the inline mini-editor
 * block previously listened for — so this replaces that scroll-to-and-swap
 * behaviour with a modal on desktop/tablet, and a bottom sheet on mobile
 * (<=767px, per Figma node 124:3660 — see mini-editor-modal.css's own
 * <=767px override for the sheet-chrome styling; the same DOM/JS drives
 * both, only the CSS presentation differs).
 *
 * Usage:
 *   import createMiniEditorModal from
 *     '../../scripts/widgets/mini-editor-modal/mini-editor-modal.js';
 *
 *   const modal = await createMiniEditorModal({
 *     fontOptions, backgrounds, a11y, deps,
 *   });
 *   document.body.append(modal.el);
 */

import createMiniEditorWidget from '../mini-editor-widget/mini-editor-widget.js';

let createTag;

const OPEN_DURATION = 250;
const CLOSE_DURATION = 150;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Matches mini-editor-widget.css's own <=767px breakpoint, where the modal
// falls back to the normal collapsible-panel + bottom-sheet behaviour
// instead of always-open-inline (see panelMode's mobile matchMedia guards
// in mini-editor-widget.js).
function isMobileSheetWidth() {
  return window.matchMedia('(width <= 767px)').matches;
}

export default async function createMiniEditorModal(config = {}) {
  const {
    fontOptions,
    backgrounds,
    topActionsFactory,
    a11y,
    deps,
  } = config;
  const {
    trapFocus, handleEscapeClose, disableBackgroundScroll, restoreBackgroundScroll,
  } = a11y;

  ({ createTag } = deps);

  // sp-icon-close is a real Spectrum Web Components custom element (same
  // pattern as topActions' sp-icon-edit/share/download in
  // mini-editor-widget.js) — load its definition before using the tag.
  await import('../spectrum/dist/icons-workflow.js');

  const overlay = createTag('div', { class: 'me-modal-overlay', 'aria-hidden': 'true', inert: '' });
  const dialog = createTag('div', {
    class: 'me-modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Create a design',
    tabindex: '-1',
  });
  const cardWrap = createTag('div', { class: 'me-modal-card' });
  // Mobile only (<=767px, see mini-editor-modal.css) — the modal becomes a
  // bottom sheet there, per Figma node 124:3660, and this handle is its only
  // affordance for dismissal (me-modal-close is hidden at that width; the
  // overlay's own outside-tap-to-close still works, same as desktop). Lives
  // inside cardWrap (not dialog) so it sits atop the card's own content
  // instead of beside it as a separate flex item.
  const dragHandle = createTag('div', { class: 'me-modal-handle', 'aria-hidden': 'true' });
  cardWrap.append(dragHandle);
  const closeBtn = createTag('button', {
    type: 'button',
    class: 'me-modal-close',
    'aria-label': 'Close',
  }, [createTag('sp-icon-close', { class: 'me-modal-close-icon', 'aria-hidden': 'true' })]);
  dialog.append(cardWrap, closeBtn);
  overlay.append(dialog);

  // The widget needs a root to set --me-* CSS vars / data-me-panel on —
  // cardWrap plays that role here (in the block, it's the block element
  // itself). me-modal-card-root (not mini-editor) opts into just the
  // shared --me-card-bg/--me-quote-font* var defaults and panel-open
  // selector in mini-editor-widget.css, without mini-editor.css's block
  // layout (padding/gap/flex-column) or arc-sizing tokens, which this
  // modal doesn't use — decorations: false skips building the desktop
  // zig-zag / tablet-mobile arc carousel entirely, per the modal's
  // "centre editor only" design. See mini-editor-widget.css.
  cardWrap.classList.add('me-modal-card-root');
  let editor;
  const topActions = typeof topActionsFactory === 'function'
    ? topActionsFactory(() => editor)
    : [];

  editor = await createMiniEditorWidget({
    root: cardWrap,
    topActions,
    fontOptions,
    backgrounds,
    a11y,
    deps,
    decorations: false,
    // One of font/colour always stays open, as an inline row, at every
    // width — never a collapsible panel or a mobile bottom sheet. See
    // mini-editor-modal.css for the accompanying CSS override that
    // suppresses the bottom sheet the widget still builds either way.
    panelMode: 'always-open-inline',
  });
  cardWrap.append(editor.stage);

  let isOpen = false;
  let openHousekeepingTimer = null;
  let closeTimer = null;
  let focusTrap = null;
  let escapeRelease = null;
  let previouslyFocused = null;

  function close() {
    if (!isOpen) return;
    isOpen = false;
    clearTimeout(openHousekeepingTimer);
    clearTimeout(closeTimer);
    restoreBackgroundScroll();
    focusTrap?.release();
    focusTrap = null;
    escapeRelease?.release();
    escapeRelease = null;
    cardWrap.style.transform = '';

    const reduceMotion = prefersReducedMotion();
    overlay.classList.remove('me-modal-overlay--open');
    overlay.classList.toggle('me-modal-overlay--closing', !reduceMotion);

    const finish = () => {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('inert', '');
      overlay.classList.remove('me-modal-overlay--closing');
      previouslyFocused?.focus();
      previouslyFocused = null;
    };
    if (reduceMotion) finish();
    else closeTimer = setTimeout(finish, CLOSE_DURATION);
  }

  function open({ quote, author } = {}) {
    if (isOpen) return;
    isOpen = true;
    clearTimeout(closeTimer);
    previouslyFocused = document.activeElement;
    if (quote) editor.useQuote({ quote, author });

    // The widget only sets its *initial* data-me-panel once, at creation —
    // re-assert the correct starting state for the *current* viewport on
    // every open, since this modal instance is built once at page load and
    // can be opened again after a resize/rotation crossed the mobile
    // breakpoint since then.
    cardWrap.setAttribute('data-me-panel', isMobileSheetWidth() ? 'none' : 'fonts');

    overlay.removeAttribute('aria-hidden');
    overlay.removeAttribute('inert');
    disableBackgroundScroll();
    dialog.focus();
    focusTrap = trapFocus(dialog);
    escapeRelease = handleEscapeClose(dialog, close);

    const reduceMotion = prefersReducedMotion();
    overlay.classList.add('me-modal-overlay--open');
    if (reduceMotion) return;

    // Housekeeping, not a visual change: once the open transition settles,
    // drop the card's transform so a later copy-quote toast (anchored via
    // this same card) positions against the card's untransformed box.
    openHousekeepingTimer = setTimeout(() => {
      cardWrap.style.transform = 'none';
    }, OPEN_DURATION);
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Dispatched by collapsible-rows' "Create a design" button (see
  // collapsible-rows.js) — the two blocks stay decoupled via this event
  // instead of importing one into the other.
  const onUseQuoteEvent = (e) => open(e.detail);
  document.addEventListener('mini-editor:use-quote', onUseQuoteEvent);

  return {
    el: overlay,
    open,
    close,
    destroy: () => {
      close();
      document.removeEventListener('mini-editor:use-quote', onUseQuoteEvent);
      editor.destroy();
      overlay.remove();
    },
  };
}
