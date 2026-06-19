// @import { FontDef } from './types.js'
import { transformText } from './unicodeEngine.js';

const BASE_PATH = '/express/code/blocks/font-generator';
const STYLESHEET_HREF = `${BASE_PATH}/fontCard.css`;
const DEFAULT_SAMPLE_TEXT = 'Hello';

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected || document.querySelector(`link[href="${STYLESHEET_HREF}"]`)) return;
  stylesInjected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLESHEET_HREF;
  document.head.appendChild(link);
}

function copyToClipboard(text, btn, fontName) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', `Copy ${fontName}`);
    }, 1500);
  });
}

/**
 * Creates a font preview card element. Purely presentational — no store subscription.
 * FontCardGrid is responsible for calling updateFontCard when state changes.
 *
 * @param {import('./types.js').FontDef} fontDef
 * @param {string} previewText
 * @param {number} fontSize
 * @returns {HTMLElement}
 */
export function createFontCard(fontDef, previewText, fontSize) {
  injectStyles();
  const text = previewText || DEFAULT_SAMPLE_TEXT;

  const card = document.createElement('div');
  card.className = 'font-card';
  card.dataset.fontId = fontDef.id;

  const preview = document.createElement('div');
  preview.className = 'font-card-preview';
  preview.style.fontSize = `${fontSize}px`;
  preview.textContent = transformText(text, fontDef);

  const footer = document.createElement('div');
  footer.className = 'font-card-footer';

  const name = document.createElement('span');
  name.className = 'font-card-name';
  name.textContent = fontDef.styleName;

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'font-card-copy';
  copyBtn.textContent = 'Copy';
  copyBtn.setAttribute('aria-label', `Copy ${fontDef.styleName}`);

  copyBtn.addEventListener('click', () => {
    copyToClipboard(preview.textContent, copyBtn, fontDef.styleName);
  });

  footer.append(name, copyBtn);
  card.append(preview, footer);

  return card;
}

/**
 * Updates the preview text and font size on an existing card without rebuilding it.
 *
 * @param {HTMLElement} card
 * @param {import('./types.js').FontDef} fontDef
 * @param {string} previewText
 * @param {number} fontSize
 */
export function updateFontCard(card, fontDef, previewText, fontSize) {
  const text = previewText || DEFAULT_SAMPLE_TEXT;
  const preview = card.querySelector('.font-card-preview');
  if (!preview) return;
  preview.textContent = transformText(text, fontDef);
  preview.style.fontSize = `${fontSize}px`;
}
