import { hexToRGB } from '../../libs/color-components/utils/ColorConversions.js';

const DEFAULT_TEXT_COLOR = '#000000';
const DEFAULT_BG_COLOR = '#FFFFFF';

const WCAG_THRESHOLDS = {
  aaNormal: 4.5,
  aaLarge: 3,
  aaaNormal: 7,
  aaaLarge: 4.5,
};

function sRGBtoLinear(value) {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance({ red, green, blue }) {
  return 0.2126 * sRGBtoLinear(red) + 0.7152 * sRGBtoLinear(green) + 0.0722 * sRGBtoLinear(blue);
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function wcagResults(ratio) {
  return {
    aaNormal: ratio >= WCAG_THRESHOLDS.aaNormal,
    aaLarge: ratio >= WCAG_THRESHOLDS.aaLarge,
    aaaNormal: ratio >= WCAG_THRESHOLDS.aaaNormal,
    aaaLarge: ratio >= WCAG_THRESHOLDS.aaaLarge,
  };
}

function createResultBadge(label, pass) {
  const badge = document.createElement('div');
  badge.className = `cc-badge ${pass ? 'cc-pass' : 'cc-fail'}`;
  badge.innerHTML = `<span class="cc-badge-icon">${pass ? '✓' : '✗'}</span><span>${label}</span>`;
  return badge;
}

function updateResults(container, textHex, bgHex) {
  const textRgb = hexToRGB(textHex);
  const bgRgb = hexToRGB(bgHex);
  if (!textRgb || !bgRgb) return;

  const ratio = contrastRatio(textRgb, bgRgb);
  const results = wcagResults(ratio);

  const ratioEl = container.querySelector('.cc-ratio-value');
  if (ratioEl) ratioEl.textContent = `${ratio.toFixed(2)}:1`;

  const badgeGrid = container.querySelector('.cc-badge-grid');
  if (badgeGrid) {
    badgeGrid.innerHTML = '';
    badgeGrid.appendChild(createResultBadge('AA Normal Text (≥4.5:1)', results.aaNormal));
    badgeGrid.appendChild(createResultBadge('AA Large Text (≥3:1)', results.aaLarge));
    badgeGrid.appendChild(createResultBadge('AAA Normal Text (≥7:1)', results.aaaNormal));
    badgeGrid.appendChild(createResultBadge('AAA Large Text (≥4.5:1)', results.aaaLarge));
  }

  const previewNormal = container.querySelector('.cc-preview-normal');
  const previewLarge = container.querySelector('.cc-preview-large');
  if (previewNormal) {
    previewNormal.style.color = textHex;
    previewNormal.style.backgroundColor = bgHex;
  }
  if (previewLarge) {
    previewLarge.style.color = textHex;
    previewLarge.style.backgroundColor = bgHex;
  }
}

export default async function decorate(block) {
  await import('../../libs/color-components/components/color-edit/index.js');

  let textColor = DEFAULT_TEXT_COLOR;
  let bgColor = DEFAULT_BG_COLOR;

  block.innerHTML = '';
  block.className = 'contrast-checker';

  const container = document.createElement('div');
  container.className = 'cc-container';

  // --- Color pickers section ---
  const pickersSection = document.createElement('div');
  pickersSection.className = 'cc-pickers';

  const textPanel = document.createElement('div');
  textPanel.className = 'cc-panel';
  textPanel.innerHTML = '<h3 class="cc-panel-title">Text Color</h3>';
  const textColorEdit = document.createElement('color-edit');
  textColorEdit.palette = [DEFAULT_TEXT_COLOR];
  textColorEdit.selectedIndex = 0;
  textColorEdit.colorMode = 'HEX';
  textPanel.appendChild(textColorEdit);

  const bgPanel = document.createElement('div');
  bgPanel.className = 'cc-panel';
  bgPanel.innerHTML = '<h3 class="cc-panel-title">Background Color</h3>';
  const bgColorEdit = document.createElement('color-edit');
  bgColorEdit.palette = [DEFAULT_BG_COLOR];
  bgColorEdit.selectedIndex = 0;
  bgColorEdit.colorMode = 'HEX';
  bgPanel.appendChild(bgColorEdit);

  pickersSection.appendChild(textPanel);
  pickersSection.appendChild(bgPanel);

  // --- Results section ---
  const resultsSection = document.createElement('div');
  resultsSection.className = 'cc-results';
  resultsSection.innerHTML = `
    <div class="cc-ratio">
      <span class="cc-ratio-label">Contrast Ratio</span>
      <span class="cc-ratio-value">21.00:1</span>
    </div>
    <div class="cc-badge-grid"></div>
    <div class="cc-preview-section">
      <h3 class="cc-preview-title">Preview</h3>
      <div class="cc-preview-normal">
        Normal text (16px) — The quick brown fox jumps over the lazy dog.
      </div>
      <div class="cc-preview-large">
        Large text (24px) — The quick brown fox jumps.
      </div>
    </div>
  `;

  container.appendChild(pickersSection);
  container.appendChild(resultsSection);
  block.appendChild(container);

  textColorEdit.addEventListener('color-change', (e) => {
    textColor = e.detail.hex;
    updateResults(container, textColor, bgColor);
  });

  bgColorEdit.addEventListener('color-change', (e) => {
    bgColor = e.detail.hex;
    updateResults(container, textColor, bgColor);
  });

  updateResults(container, textColor, bgColor);
}
