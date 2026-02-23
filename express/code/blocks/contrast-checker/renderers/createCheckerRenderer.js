import { createTag } from '../../../scripts/utils.js';
import { createBaseRenderer } from '../../../scripts/color-shared/renderers/createBaseRenderer.js';
import { announceToScreenReader } from '../../../scripts/color-shared/utils/accessibility.js';

/* ── SVG Icons ───────────────────────────────────────────────── */

/* eslint-disable max-len */
const SWAP_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13 3l4 4-4 4M17 7H7M7 17l-4-4 4-4M3 13h10"/></svg>';
const CHECK_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 10.6L2.4 7.5l1.1-1.1 2 2 4.5-4.5 1.1 1.1z"/></svg>';
const FAIL_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10.5 4.6L8.1 7l2.4 2.4-1.1 1.1L7 8.1l-2.4 2.4-1.1-1.1L5.9 7 3.5 4.6l1.1-1.1L7 5.9l2.4-2.4z"/></svg>';
/* eslint-enable max-len */

function ensureHash(hex) {
  return hex.startsWith('#') ? hex : `#${hex}`;
}

function createBadge(pass) {
  const icon = pass ? CHECK_SVG : FAIL_SVG;
  const label = pass ? 'Pass' : 'Fail';
  const cls = pass ? 'cc-badge cc-badge-pass' : 'cc-badge cc-badge-fail';
  return createTag('span', { class: cls, 'aria-label': label }, [
    createTag('span', { class: 'cc-badge-icon', 'aria-hidden': 'true' }, icon),
    createTag('span', { class: 'cc-badge-label' }, label),
  ]);
}

function createRatioDisplay() {
  const section = createTag('div', { class: 'cc-ratio-section' });
  const ratioValue = createTag('div', { class: 'cc-ratio-value' });
  const ratioLabel = createTag('div', { class: 'cc-ratio-label' }, 'Contrast Ratio');
  section.appendChild(ratioValue);
  section.appendChild(ratioLabel);
  return { element: section, ratioValue };
}

function createWCAGGrid() {
  const grid = createTag('div', { class: 'cc-wcag-grid' });

  const levels = [
    { key: 'normalAA', label: 'Normal Text', standard: 'AA', threshold: '4.5:1' },
    { key: 'largeAA', label: 'Large Text', standard: 'AA', threshold: '3:1' },
    { key: 'normalAAA', label: 'Normal Text', standard: 'AAA', threshold: '7:1' },
    { key: 'largeAAA', label: 'Large Text', standard: 'AAA', threshold: '4.5:1' },
    { key: 'uiComponents', label: 'UI Components', standard: 'AA', threshold: '3:1' },
  ];

  const cards = {};
  levels.forEach(({ key, label, standard, threshold }) => {
    const card = createTag('div', { class: 'cc-wcag-card' });
    const header = createTag('div', { class: 'cc-wcag-card-header' }, [
      createTag('span', { class: 'cc-wcag-card-label' }, label),
      createTag('span', { class: 'cc-wcag-card-standard' }, `${standard} (${threshold})`),
    ]);
    const badgeSlot = createTag('div', { class: 'cc-wcag-card-badge' });
    card.appendChild(header);
    card.appendChild(badgeSlot);
    grid.appendChild(card);
    cards[key] = badgeSlot;
  });

  return { element: grid, cards };
}

function createPreviewSection() {
  const section = createTag('div', { class: 'cc-preview-section' });

  const normalPreview = createTag('div', { class: 'cc-preview-box' });
  const normalText = createTag('p', { class: 'cc-preview-normal' }, 'The quick brown fox jumps over the lazy dog.');
  normalPreview.appendChild(normalText);

  const largePreview = createTag('div', { class: 'cc-preview-box' });
  const largeText = createTag('p', { class: 'cc-preview-large' }, 'Large text sample');
  largePreview.appendChild(largeText);

  section.appendChild(normalPreview);
  section.appendChild(largePreview);

  return {
    element: section,
    update(fg, bg) {
      [normalPreview, largePreview].forEach((box) => {
        box.style.backgroundColor = bg;
        box.style.color = fg;
      });
    },
  };
}

// eslint-disable-next-line import/prefer-default-export
export function createCheckerRenderer(options) {
  const { container, dataService } = options;
  const base = createBaseRenderer({ ...options, data: [] });
  const { emit } = base;

  let foreground = '#1B1B1B';
  let background = '#FFFFFF';
  let results = null;
  let containerElement = null;

  function recalculate() {
    results = dataService.checkWCAG(foreground, background);
    emit('contrast-change', { foreground, background, ...results });
  }

  function createColorInput(label, value, onChange) {
    const group = createTag('div', { class: 'cc-color-input-group' });

    const labelEl = createTag('label', { class: 'cc-color-label' }, label);

    const row = createTag('div', { class: 'cc-color-input-row' });

    const swatch = createTag('input', {
      type: 'color',
      class: 'cc-color-swatch-input',
      value,
      'aria-label': `${label} color picker`,
    });

    const hexInput = createTag('input', {
      type: 'text',
      class: 'cc-hex-input',
      value,
      maxlength: '7',
      'aria-label': `${label} hex value`,
      spellcheck: 'false',
    });

    swatch.addEventListener('input', (e) => {
      const hex = e.target.value;
      hexInput.value = hex;
      onChange(hex);
    });

    hexInput.addEventListener('change', (e) => {
      let hex = e.target.value.trim();
      hex = ensureHash(hex);
      if (dataService.isValidHex(hex)) {
        swatch.value = hex;
        hexInput.value = hex;
        onChange(hex);
      } else {
        hexInput.value = swatch.value;
      }
    });

    row.appendChild(swatch);
    row.appendChild(hexInput);
    group.appendChild(labelEl);
    group.appendChild(row);

    return {
      element: group,
      setValue(hex) {
        swatch.value = hex;
        hexInput.value = hex;
      },
    };
  }

  let fgInput;
  let bgInput;
  let ratioDisplay;
  let wcagGrid;
  let preview;

  function updateUI() {
    recalculate();
    if (!results) return;

    ratioDisplay.ratioValue.textContent = `${results.ratio}:1`;

    Object.entries(wcagGrid.cards).forEach(([key, badgeSlot]) => {
      badgeSlot.replaceChildren(createBadge(results[key]));
    });

    preview.update(foreground, background);
    announceToScreenReader(`Contrast ratio ${results.ratio} to 1`);
  }

  function render() {
    containerElement = container;
    container.innerHTML = '';
    container.classList.add('contrast-checker-layout');

    const inputsSection = createTag('div', { class: 'cc-inputs-section' });

    fgInput = createColorInput('Text color', foreground, (hex) => {
      foreground = hex;
      updateUI();
    });

    const swapBtn = createTag('button', {
      type: 'button',
      class: 'cc-swap-btn',
      'aria-label': 'Swap foreground and background colors',
      title: 'Swap colors',
    }, SWAP_SVG);
    swapBtn.addEventListener('click', () => {
      const tmp = foreground;
      foreground = background;
      background = tmp;
      fgInput.setValue(foreground);
      bgInput.setValue(background);
      updateUI();
    });

    bgInput = createColorInput('Background color', background, (hex) => {
      background = hex;
      updateUI();
    });

    inputsSection.appendChild(fgInput.element);
    inputsSection.appendChild(swapBtn);
    inputsSection.appendChild(bgInput.element);

    ratioDisplay = createRatioDisplay();
    wcagGrid = createWCAGGrid();
    preview = createPreviewSection();

    const resultsSection = createTag('div', { class: 'cc-results-section' });
    resultsSection.appendChild(ratioDisplay.element);
    resultsSection.appendChild(wcagGrid.element);

    container.appendChild(inputsSection);
    container.appendChild(resultsSection);
    container.appendChild(preview.element);

    updateUI();
  }

  function destroy() {
    containerElement?.replaceChildren();
  }

  return {
    ...base,
    render,
    destroy,
  };
}
