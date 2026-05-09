import createSidePanel from './components/createSidePanel.js';
import createCardContainer from './components/createCardContainer.js';
import { UNICODE_STYLES } from './unicode-styles.js';

const DEBOUNCE_MS = 120;

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Font Generator block — orchestrates side panel and card container.
 * Phase B (Spectrum Web Components): uses express-textfield + express-slider.
 * Category accordion uses native <details>/<summary> — no Spectrum accordion wrapper exists.
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  // Clear authored block content — JS builds all DOM
  block.innerHTML = '';

  const layout = document.createElement('div');
  layout.classList.add('fg-layout');

  // Track live state
  let currentText = '';
  let currentCategory = 'all';
  let currentFontSize = 24;
  let cardContainer;

  // ── Card container (right panel) ─────────────────────────────────────────
  cardContainer = createCardContainer(UNICODE_STYLES, ({ name }) => {
    // Brief visual confirmation on copy button — future Phase 2 enhancement noted in charter
    window.lana?.log(`font-generator: copied style "${name}"`, { tags: 'font-generator', severity: 'info' });
  });

  // ── Debounced update function ─────────────────────────────────────────────
  const updateCards = debounce((text, category) => {
    cardContainer.update(text, category);
  }, DEBOUNCE_MS);

  // ── Side panel (left panel) ───────────────────────────────────────────────
  const sidePanel = await createSidePanel({
    onInput: (text) => {
      currentText = text;
      updateCards(currentText, currentCategory);
    },
    onFontSize: (size) => {
      currentFontSize = size;
      cardContainer.element.style.setProperty('--fg-preview-font-size', `${size}px`);
    },
    onCategory: (categoryId) => {
      currentCategory = categoryId;
      updateCards(currentText, currentCategory);
    },
  });

  // ── Global controls (view toggle + color toggle) ──────────────────────────
  const controls = document.createElement('div');
  controls.classList.add('fg-controls');

  const viewToggle = document.createElement('div');
  viewToggle.classList.add('fg-view-toggle');
  viewToggle.setAttribute('role', 'group');
  viewToggle.setAttribute('aria-label', 'View layout');

  [
    { label: 'Grid', value: 'grid', icon: '⊞' },
    { label: 'List', value: 'list', icon: '☰' },
  ].forEach(({ label, value, icon }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('fg-view-btn');
    btn.dataset.view = value;
    btn.setAttribute('aria-label', `${label} view`);
    btn.textContent = icon;
    if (value === 'grid') btn.classList.add('is-active');
    btn.addEventListener('click', () => {
      viewToggle.querySelectorAll('.fg-view-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      cardContainer.element.classList.toggle('fg-card-container--list', value === 'list');
    });
    viewToggle.append(btn);
  });

  const colorToggle = document.createElement('div');
  colorToggle.classList.add('fg-color-toggle');
  colorToggle.setAttribute('role', 'group');
  colorToggle.setAttribute('aria-label', 'Preview color');

  [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ].forEach(({ label, value }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('fg-color-btn');
    btn.dataset.color = value;
    btn.textContent = label;
    if (value === 'light') btn.classList.add('is-active');
    btn.addEventListener('click', () => {
      colorToggle.querySelectorAll('.fg-color-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      cardContainer.element.classList.toggle('fg-card-container--dark', value === 'dark');
    });
    colorToggle.append(btn);
  });

  controls.append(viewToggle, colorToggle);

  // ── Right panel wrapper ───────────────────────────────────────────────────
  const rightPanel = document.createElement('div');
  rightPanel.classList.add('fg-right-panel');
  rightPanel.append(controls, cardContainer.element);

  layout.append(sidePanel.element, rightPanel);
  block.append(layout);
}
