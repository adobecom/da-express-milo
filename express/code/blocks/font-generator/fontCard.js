// @import { FontDef } from './types.js'
import { transformText } from './unicodeEngine.js';
import { DEFAULT_PLACEHOLDERS } from './placeholders.js';

const BASE_PATH = '/express/code/blocks/font-generator';
const STYLESHEET_HREF = `${BASE_PATH}/fontCard.css`;
const COPY_RESET_MS = 1500;

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

  const icon = document.createElement('img');
  icon.src = '/express/code/icons/font-generator-copy.svg';
  icon.width = 20;
  icon.height = 20;
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  btn.append(icon);

  return btn;
}

// Green success badge (56px per Figma). The tick is drawn on via CSS
// (stroke-dashoffset), so the check path carries its own class.
function makeCheckmarkSvg() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '56');
  svg.setAttribute('height', '56');
  svg.setAttribute('viewBox', '0 0 80 80');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('font-card-check-icon');

  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('cx', '40');
  circle.setAttribute('cy', '40');
  circle.setAttribute('r', '40');
  circle.setAttribute('fill', 'var(--color-green-700, #0BA45D)');

  const path = document.createElementNS(ns, 'path');
  path.setAttribute('class', 'font-card-check-path');
  path.setAttribute('d', 'M20 40L34 54L60 26');
  path.setAttribute('stroke', 'var(--color-white)');
  path.setAttribute('stroke-width', '4');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');

  svg.append(circle, path);
  return svg;
}

function makeCopyPromptIcon() {
  const icon = document.createElement('img');
  icon.src = '/express/code/icons/font-generator-copy.svg';
  icon.width = 36;
  icon.height = 36;
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');
  icon.className = 'font-card-copy-prompt-icon';
  return icon;
}

// A single persistent overlay with two states swapped via `.is-copied`:
// the hover "Copy text" prompt and the "Text copied!" confirmation.
function makeCopyOverlay(copyLabel, copiedMessage) {
  const overlay = document.createElement('div');
  overlay.className = 'font-card-copy-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const prompt = document.createElement('div');
  prompt.className = 'font-card-copy-prompt';
  const promptLabel = document.createElement('span');
  promptLabel.className = 'font-card-copy-prompt-label';
  promptLabel.textContent = copyLabel;
  prompt.append(makeCopyPromptIcon(), promptLabel);

  const success = document.createElement('div');
  success.className = 'font-card-copy-success';
  const successLabel = document.createElement('span');
  successLabel.className = 'font-card-copy-message';
  successLabel.textContent = copiedMessage;
  success.append(makeCheckmarkSvg(), successLabel);

  overlay.append(prompt, success);
  return overlay;
}

function makeCtaLink(cardCta) {
  const a = document.createElement('a');
  a.className = 'font-card-cta';
  a.href = cardCta.href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';

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

  // Body wraps preview + copy btn so the overlay is bounded above the footer.
  const body = document.createElement('div');
  body.className = 'font-card-body';

  const copyBtn = makeCopyBtn(copyLabel);
  const overlay = makeCopyOverlay(copyLabel, copiedMessage);

  const preview = document.createElement('div');
  preview.className = 'font-card-preview';
  preview.style.fontSize = `${fontSize}px`;
  preview.textContent = transformText(text, fontDef);

  // Copy is triggered by the accessible top-right button and by clicking the
  // hover overlay (the whole preview acts as the copy zone, per Figma).
  let resetTimer = null;
  const doCopy = () => {
    const previewEl = card.querySelector('.font-card-preview');
    if (!previewEl) return;
    navigator.clipboard.writeText(previewEl.textContent).then(() => {
      clearTimeout(resetTimer);
      // Re-trigger the checkmark animation on repeat copies.
      card.classList.remove('is-copied');
      overlay.getBoundingClientRect(); // force reflow so the animation replays
      card.classList.add('is-copied');
      copyBtn.dataset.tooltip = copiedLabel;
      copyBtn.setAttribute('aria-label', copiedLabel);
      announce(copiedMessage);
      resetTimer = setTimeout(() => {
        card.classList.remove('is-copied');
        copyBtn.dataset.tooltip = copyLabel;
        copyBtn.setAttribute('aria-label', copyLabel);
      }, COPY_RESET_MS);
    }).catch((e) => {
      window.lana?.log(`font-generator: clipboard write failed: ${e?.message || e}`, { tags: 'font-generator', severity: 'info' });
    });
  };
  copyBtn.addEventListener('click', doCopy);
  overlay.addEventListener('click', doCopy);

  body.append(copyBtn, preview, overlay);

  const footer = document.createElement('div');
  footer.className = 'font-card-footer';

  const name = document.createElement('span');
  name.className = 'font-card-name';
  name.textContent = fontDef.styleName;

  footer.append(name);
  if (cardCta) footer.append(makeCtaLink(cardCta));

  card.append(body, footer);

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
