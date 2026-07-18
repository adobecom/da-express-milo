// @import { FontDef } from './types.js'
import { transformText } from './unicodeEngine.js';
import { DEFAULT_PLACEHOLDERS } from './placeholders.js';

const BASE_PATH = '/express/code/blocks/font-generator';
const STYLESHEET_HREF = `${BASE_PATH}/fontCard.css`;
const COPY_RESET_MS = 1500;
const OVERLAY_FADE_MS = 200;

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected || document.querySelector(`link[href="${STYLESHEET_HREF}"]`)) return;
  stylesInjected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLESHEET_HREF;
  document.head.appendChild(link);
}

// Single shared polite live region — the copy overlay itself is aria-hidden
// (decorative), so success is announced to screen readers here instead.
let liveRegion = null;
function announce(message) {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.className = 'font-card-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    document.body.append(liveRegion);
  }
  // Clear first so an identical repeat message still re-announces.
  liveRegion.textContent = '';
  requestAnimationFrame(() => { liveRegion.textContent = message; });
}

function makeCopyBtn(copyLabel) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'font-card-copy-btn';
  btn.setAttribute('aria-label', copyLabel);
  btn.dataset.tooltip = copyLabel;
  // Out of the normal tab order until the card is "entered" (see
  // initCellKeyboardNav below) — the grid is a single tab stop.
  btn.tabIndex = -1;

  const icon = document.createElement('img');
  icon.src = '/express/code/icons/font-generator-copy.svg';
  icon.width = 20;
  icon.height = 20;
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  btn.append(icon);

  return btn;
}

function makeCheckmarkIcon() {
  const icon = document.createElement('img');
  icon.src = '/express/code/icons/font-generator-checkmark.svg';
  icon.width = 56;
  icon.height = 56;
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  icon.className = 'font-card-check-icon';
  return icon;
}

function makeCopyOverlay(message) {
  const overlay = document.createElement('div');
  overlay.className = 'font-card-success-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'font-card-overlay-message';
  label.textContent = message;

  overlay.append(makeCheckmarkIcon(), label);
  return overlay;
}

// Static (not click-driven, unlike the copy overlay) — shown on hover via
// CSS so it never competes with the copy overlay's own opacity toggling.
function makeHoverOverlay(message) {
  const overlay = document.createElement('div');
  overlay.className = 'font-card-hover-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const icon = document.createElement('img');
  icon.src = '/express/code/icons/font-generator-copy.svg';
  icon.className = 'font-card-hover-icon';
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'font-card-overlay-message';
  label.textContent = message;

  overlay.append(icon, label);
  return overlay;
}

function makeCtaLink(cardCta) {
  const a = document.createElement('a');
  a.className = 'font-card-cta';
  a.href = cardCta.href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  // Same rationale as the copy button — see initCellKeyboardNav.
  a.tabIndex = -1;

  const icon = document.createElement('img');
  icon.src = '/express/code/icons/font-generator-external-link.svg';
  icon.width = 16;
  icon.height = 16;
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  icon.className = 'font-card-cta-icon';

  const label = document.createElement('span');
  label.textContent = cardCta.text;

  a.append(icon, label);
  return a;
}

function getFocusables(card) {
  return [...card.querySelectorAll('.font-card-copy-btn, .font-card-cta')];
}

/**
 * Wires the "enter cell" keyboard model for a single card. The grid (see
 * fontCardGrid.js) owns roving tabindex across cards — this only handles
 * what happens once a card has focus:
 *  - Enter on the cell wrapper moves focus into its first interactive child.
 *  - Tab past the last child (or Shift+Tab before the first) exits back to
 *    the wrapper instead of leaving the grid.
 *  - Escape exits back to the wrapper from anywhere inside.
 * A focusin listener keeps each child's tabindex in sync with whichever
 * element actually has focus, so this also self-corrects if focus lands on
 * a child directly (e.g. a mouse click) rather than via Enter.
 *
 * @param {HTMLElement} card
 */
function initCellKeyboardNav(card) {
  card.addEventListener('focusin', (event) => {
    const focusables = getFocusables(card);
    if (event.target === card) {
      // Claim the tab stop explicitly — the grid's own focusin listener
      // only demotes whichever card *lost* focus, it doesn't promote this
      // one, so this card must assert it here.
      card.tabIndex = 0;
      focusables.forEach((el) => { el.tabIndex = -1; });
    } else if (focusables.includes(event.target)) {
      card.tabIndex = -1;
      focusables.forEach((el) => { el.tabIndex = 0; });
    }
  });

  // Below, tabindex bookkeeping is done synchronously before each .focus()
  // call — not left to the focusin listener above — since these are all
  // moves *this module* initiates. (The listener above stays as the only
  // path for a focus change it didn't initiate, e.g. a direct click.)
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target === card) {
      const focusables = getFocusables(card);
      if (!focusables.length) return;
      event.preventDefault();
      card.tabIndex = -1;
      focusables.forEach((el) => { el.tabIndex = 0; });
      focusables[0].focus();
      return;
    }

    if (event.key === 'Escape' && getFocusables(card).includes(event.target)) {
      event.preventDefault();
      getFocusables(card).forEach((el) => { el.tabIndex = -1; });
      card.tabIndex = 0;
      card.focus();
      return;
    }

    if (event.key === 'Tab') {
      const focusables = getFocusables(card);
      const index = focusables.indexOf(event.target);
      if (index === -1) return;
      const exiting = (!event.shiftKey && index === focusables.length - 1)
        || (event.shiftKey && index === 0);
      if (exiting) {
        event.preventDefault();
        focusables.forEach((el) => { el.tabIndex = -1; });
        card.tabIndex = 0;
        card.focus();
      }
    }
  });
}

/**
 * Creates a font preview card element. Purely presentational — no store subscription.
 *
 * @param {import('./types.js').FontDef} fontDef
 * @param {string} previewText
 * @param {number} fontSize
 * @param {{ text: string; href: string } | null} [cardCta]
 * @param {object} [strings] resolved placeholder copy (DEFAULT_PLACEHOLDERS shape)
 * @returns {HTMLElement}
 */
export function createFontCard(fontDef, previewText, fontSize, cardCta, strings = {}) {
  injectStyles();
  const {
    copyLabel, copiedLabel, copiedMessage, sampleText,
  } = { ...DEFAULT_PLACEHOLDERS, ...strings };
  const text = previewText || sampleText;

  const card = document.createElement('div');
  card.className = 'font-card';
  card.dataset.fontId = fontDef.id;
  // Roving tabindex — the grid (fontCardGrid.js) manages which single card
  // is the tab stop. aria-label overrides name-from-content so arrow-key
  // navigation announces the style name, not the (often garbled) preview text.
  card.tabIndex = -1;
  card.setAttribute('aria-label', fontDef.styleName);

  // Body wraps preview + copy btn so the overlay is bounded above the footer.
  const body = document.createElement('div');
  body.className = 'font-card-body';

  const copyBtn = makeCopyBtn(copyLabel);
  let resetTimer = null;
  let overlayTimer = null;
  let activeOverlay = null;
  function performCopy() {
    const preview = card.querySelector('.font-card-preview');
    if (!preview) return;
    navigator.clipboard.writeText(preview.textContent).then(() => {
      clearTimeout(resetTimer);
      clearTimeout(overlayTimer);
      activeOverlay?.remove();
      activeOverlay = makeCopyOverlay(copiedMessage);
      body.append(activeOverlay);
      activeOverlay.getBoundingClientRect(); // force reflow so transition plays
      card.classList.add('is-copied');
      copyBtn.dataset.tooltip = copiedLabel;
      copyBtn.setAttribute('aria-label', copiedLabel);
      // Some mobile browsers keep the button focus-visible after a tap,
      // which would re-show the tooltip once is-copied is cleared below.
      copyBtn.blur();
      announce(copiedMessage);
      resetTimer = setTimeout(() => {
        card.classList.remove('is-copied');
        copyBtn.dataset.tooltip = copyLabel;
        copyBtn.setAttribute('aria-label', copyLabel);
        overlayTimer = setTimeout(() => {
          activeOverlay?.remove();
          activeOverlay = null;
        }, OVERLAY_FADE_MS);
      }, COPY_RESET_MS);
    }).catch((e) => {
      window.lana?.log(`font-generator: clipboard write failed: ${e?.message || e}`, { tags: 'font-generator', severity: 'info' });
    });
  }

  copyBtn.addEventListener('click', () => performCopy());

  // The copy button already handles its own click; only forward clicks that
  // land elsewhere in the body so it isn't triggered twice.
  body.addEventListener('click', (event) => {
    if (event.target.closest('.font-card-copy-btn')) return;
    performCopy();
  });

  const preview = document.createElement('div');
  preview.className = 'font-card-preview';
  preview.style.fontSize = `${fontSize}px`;
  preview.style.fontFamily = `"${fontDef.fontSupported}", var(--body-font-family), sans-serif`;
  preview.textContent = transformText(text, fontDef);

  body.append(copyBtn, preview, makeHoverOverlay(copyLabel));

  const footer = document.createElement('div');
  footer.className = 'font-card-footer';

  const name = document.createElement('span');
  name.className = 'font-card-name';
  name.textContent = fontDef.styleName;

  footer.append(name);
  if (cardCta) footer.append(makeCtaLink(cardCta));

  card.append(body, footer);
  initCellKeyboardNav(card);

  return card;
}

/**
 * Updates the preview text and font size on an existing card without rebuilding it.
 *
 * @param {HTMLElement} card
 * @param {import('./types.js').FontDef} fontDef
 * @param {string} previewText
 * @param {number} fontSize
 * @param {string} [sampleText] fallback shown when previewText is empty
 */
export function updateFontCard(card, fontDef, previewText, fontSize, sampleText) {
  const text = previewText || sampleText || DEFAULT_PLACEHOLDERS.sampleText;
  const preview = card.querySelector('.font-card-preview');
  if (!preview) return;
  preview.textContent = transformText(text, fontDef);
  preview.style.fontSize = `${fontSize}px`;
}
