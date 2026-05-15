import { applyTransform } from '../helpers/unicodeTransform.js';

// Confirm exact param name with CCEverywhere/Horizon before launch (charter open item).
const DESIGN_URL_BASE = 'https://express.adobe.com/new';
const DESIGN_URL_PARAM = 'text';

const COPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
  <path d="M15 1H5a1 1 0 0 0-1 1v1H2a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm-3 15H3V5h9v11zm3-3h-2V4a1 1 0 0 0-1-1H6V2h9v11z" fill="currentColor"/>
</svg>`;

function makeDesignUrl(unicodeText) {
  return `${DESIGN_URL_BASE}?${DESIGN_URL_PARAM}=${encodeURIComponent(unicodeText)}`;
}

function createCard(style) {
  const card = document.createElement('div');
  card.className = 'font-card';
  card.dataset.category = style.category;

  const preview = document.createElement('div');
  preview.className = 'font-card-preview';

  const text = document.createElement('p');
  text.className = 'font-card-text';
  preview.appendChild(text);

  const copyBtn = document.createElement('button');
  copyBtn.className = 'font-card-copy';
  copyBtn.setAttribute('aria-label', `Copy ${style.name} text to clipboard`);
  copyBtn.innerHTML = COPY_SVG;
  preview.appendChild(copyBtn);

  const footer = document.createElement('div');
  footer.className = 'font-card-footer';

  const name = document.createElement('h3');
  name.className = 'font-card-name';
  name.textContent = style.name;

  const cta = document.createElement('a');
  cta.className = 'font-card-cta';
  cta.target = '_blank';
  cta.rel = 'noopener noreferrer';
  cta.textContent = 'Design with style';

  footer.append(name, cta);
  card.append(preview, footer);

  // Copy to clipboard — no confirmation UI in Phase 1 (charter decision)
  copyBtn.addEventListener('click', () => {
    const unicodeText = text.textContent;
    navigator.clipboard?.writeText(unicodeText).catch(() => {});
  });

  return { card, text, cta };
}

export function createPreviewGrid(styles) {
  const grid = document.createElement('div');
  grid.className = 'font-generator-grid';

  const cards = styles.map((style) => {
    const { card, text, cta } = createCard(style);
    grid.appendChild(card);
    return { card, text, cta, style };
  });

  function update(inputText, category, fontSize) {
    const displayText = inputText || 'Hello';
    const fontSizePx = `${fontSize}px`;
    cards.forEach(({ card, text, cta, style }) => {
      const visible = category === 'All' || style.category === category;
      card.classList.toggle('font-card--hidden', !visible);
      // Skip DOM updates for hidden cards — saves transform + repaint cost.
      if (!visible) return;
      const transformed = applyTransform(displayText, style.transform);
      text.textContent = transformed;
      text.style.fontSize = fontSizePx;
      cta.href = makeDesignUrl(transformed);
    });
  }

  return { element: grid, update };
}
