import { createTag } from '../../scripts/utils.js';
import { createColorStrip } from '../../scripts/color-shared/toolbar/colorStrip.js';

const STRIP_DEFAULTS = {
  swatchLabel: 'Color {index}: {hex}',
  swatchStripLabel: '{count} colors in {type}',
};

const NAVIGATION_KEYS = new Set(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']);

function createPaletteSummary(colors = []) {
  const palette = createTag('span', {
    class: 'color-harmony-card-palette',
    'aria-hidden': 'true',
  });
  colors.forEach((color) => {
    const swatch = createTag('span', { class: 'color-harmony-card-palette-swatch' });
    swatch.style.backgroundColor = color;
    palette.appendChild(swatch);
  });
  return palette;
}

function createHarmonyModalContent({
  rules = [],
  selectedValue,
  paletteColors = [],
  strings = {},
  onSelect = () => null,
  onConfirm = () => {},
} = {}) {
  const title = strings.title || 'Learn about color harmonies';
  const confirmLabel = strings.confirm || 'Confirm';
  const uid = `color-harmony-modal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const titleId = `${uid}-title`;
  const element = createTag('div', { class: 'color-harmony-modal' });
  const header = createTag('header', { class: 'color-harmony-modal-header' });
  const heading = createTag('h2', { id: titleId, class: 'color-harmony-modal-title' });
  heading.textContent = title;
  header.appendChild(heading);

  const cardsGrid = createTag('div', {
    class: 'color-harmony-modal-cards',
    role: 'radiogroup',
    'aria-labelledby': titleId,
  });
  const cards = [];
  let pendingValue = rules.some((rule) => rule.value === selectedValue)
    ? selectedValue
    : rules[0]?.value;

  const summary = createTag('div', {
    class: 'color-harmony-modal-summary',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  });
  const summaryImage = createTag('img', {
    class: 'color-harmony-modal-summary-image',
    alt: '',
    width: '32',
    height: '32',
  });
  const summaryName = createTag('strong', { class: 'color-harmony-modal-summary-name' });
  const summaryPalette = createTag('span', { class: 'color-harmony-modal-summary-palette' });
  summaryPalette.appendChild(createColorStrip(
    paletteColors,
    'palette',
    null,
    STRIP_DEFAULTS,
  ));
  summary.append(summaryImage, summaryName, summaryPalette);

  function updateSummary(rule) {
    if (!rule) return;
    summaryImage.src = rule.imageSrc;
    summaryName.textContent = rule.label;
  }

  function updateConfiguredPalette(colors) {
    if (!Array.isArray(colors) || !colors.length) return;
    summaryPalette.replaceChildren(createColorStrip(
      colors,
      'palette',
      null,
      STRIP_DEFAULTS,
    ));
  }

  function selectRule(value, { focus = false, notify = false } = {}) {
    const selectedRule = rules.find((rule) => rule.value === value);
    if (!selectedRule) return;
    pendingValue = value;
    cards.forEach((card) => {
      const selected = card.dataset.harmonyValue === value;
      card.setAttribute('aria-checked', String(selected));
    });
    updateSummary(selectedRule);
    if (notify) updateConfiguredPalette(onSelect(value));
    if (focus) cards.find((card) => card.dataset.harmonyValue === value)?.focus();
  }

  rules.forEach((rule) => {
    const card = createTag('button', {
      type: 'button',
      class: 'color-harmony-card',
      role: 'radio',
      'aria-checked': 'false',
      'data-harmony-value': rule.value,
      tabindex: '0',
    });
    const image = createTag('img', {
      class: 'color-harmony-card-image',
      src: rule.imageSrc,
      alt: '',
      width: '120',
      height: '120',
      loading: 'lazy',
      decoding: 'async',
    });
    const content = createTag('span', { class: 'color-harmony-card-content' });
    const text = createTag('span', { class: 'color-harmony-card-text' });
    const name = createTag('strong', { class: 'color-harmony-card-title' });
    const description = createTag('span', { class: 'color-harmony-card-description' });
    name.textContent = rule.label;
    description.textContent = rule.description;
    text.append(name, description);
    content.append(text, createPaletteSummary(rule.previewColors));
    card.append(image, content);

    card.addEventListener('click', () => selectRule(rule.value, { notify: true }));
    card.addEventListener('keydown', (event) => {
      if (!NAVIGATION_KEYS.has(event.key)) return;
      event.preventDefault();
      const index = cards.indexOf(card);
      let nextIndex = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (index + 1) % cards.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (index - 1 + cards.length) % cards.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = cards.length - 1;
      }
      selectRule(cards[nextIndex].dataset.harmonyValue, { focus: true, notify: true });
    });

    cards.push(card);
    cardsGrid.appendChild(card);
  });

  const footer = createTag('footer', { class: 'color-harmony-modal-footer' });
  const confirmButton = createTag('button', {
    type: 'button',
    class: 'color-harmony-modal-confirm',
  });
  confirmButton.textContent = confirmLabel;
  confirmButton.addEventListener('click', () => {
    if (pendingValue) onConfirm(pendingValue);
  });
  footer.append(summary, confirmButton);
  element.append(header, cardsGrid, footer);
  selectRule(pendingValue);

  return {
    element,
    getSelectedValue: () => pendingValue,
  };
}

export default createHarmonyModalContent;
