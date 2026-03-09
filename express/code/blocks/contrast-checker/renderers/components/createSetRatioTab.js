import { createTag } from '../../../../scripts/utils.js';

function rgbToHex(r, g, b) {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

export default function createSetRatioTab({ dataService, recommendationService, onApply }) {
  const element = createTag('div', { class: 'cc-set-ratio-container' });

  let currentFg = '';
  let currentBg = '';

  const inputRow = createTag('div', { class: 'cc-set-ratio-input-row' });
  const label = createTag('label', { class: 'cc-set-ratio-label' }, 'Target ratio');

  const field = createTag('div', { class: 'cc-set-ratio-field' });
  const ratioInput = createTag('input', {
    type: 'number',
    class: 'cc-set-ratio-input',
    min: '1',
    max: '21',
    step: '0.1',
    value: '4.5',
  });
  const suffix = createTag('span', { class: 'cc-set-ratio-suffix' }, ': 1');
  field.appendChild(ratioInput);
  field.appendChild(suffix);

  const computeBtn = createTag('button', {
    class: 'cc-set-ratio-compute-btn',
    type: 'button',
  }, 'Compute');

  inputRow.appendChild(label);
  inputRow.appendChild(field);
  inputRow.appendChild(computeBtn);

  const resultsContainer = createTag('div', { class: 'cc-set-ratio-results' });

  element.appendChild(inputRow);
  element.appendChild(resultsContainer);

  function renderCard(suggestion) {
    const card = createTag('div', { class: 'cc-suggestion-card' });

    const preview = createTag('div', { class: 'cc-suggestion-preview' });
    preview.appendChild(
      createTag('div', { class: 'cc-suggestion-swatch cc-suggestion-swatch--fg', style: `background: ${suggestion.fg}` }),
    );
    preview.appendChild(
      createTag('div', { class: 'cc-suggestion-swatch cc-suggestion-swatch--bg', style: `background: ${suggestion.bg}` }),
    );

    const info = createTag('div', { class: 'cc-suggestion-info' });
    const ratio = Math.round(suggestion.ratio * 100) / 100;
    info.appendChild(createTag('span', { class: 'cc-suggestion-ratio' }, `${ratio} :1`));

    const wcagResults = dataService.checkWCAG(suggestion.fg, suggestion.bg);
    const level = dataService.getWCAGLevel(wcagResults);
    info.appendChild(createTag('span', { class: 'cc-suggestion-level' }, level));

    const applyBtn = createTag('button', {
      class: 'cc-suggestion-apply-btn',
      type: 'button',
    }, 'Apply');
    applyBtn.addEventListener('click', () => onApply({ fg: suggestion.fg, bg: suggestion.bg }));

    card.appendChild(preview);
    card.appendChild(info);
    card.appendChild(applyBtn);

    return card;
  }

  function handleCompute() {
    resultsContainer.replaceChildren();

    const targetRatio = Number.parseFloat(ratioInput.value);
    if (Number.isNaN(targetRatio) || targetRatio < 1 || targetRatio > 21) return;

    const suggestions = [];

    const fgResult = recommendationService.findContrastingColor(currentFg, currentBg, targetRatio);
    if (fgResult.valid) {
      const { r, g, b } = fgResult.outsRGB;
      const newFg = rgbToHex(r, g, b);
      const ratio = dataService.calculateRatio(newFg, currentBg);
      suggestions.push({ fg: newFg, bg: currentBg, ratio });
    }

    const bgResult = recommendationService.findContrastingColor(currentBg, currentFg, targetRatio);
    if (bgResult.valid) {
      const { r, g, b } = bgResult.outsRGB;
      const newBg = rgbToHex(r, g, b);
      const ratio = dataService.calculateRatio(currentFg, newBg);
      suggestions.push({ fg: currentFg, bg: newBg, ratio });
    }

    if (!suggestions.length) {
      resultsContainer.appendChild(
        createTag('div', { class: 'cc-suggestions-message' }, 'Could not find colors meeting the target ratio.'),
      );
      return;
    }

    suggestions.forEach((s) => resultsContainer.appendChild(renderCard(s)));
  }

  computeBtn.addEventListener('click', handleCompute);

  function update(foreground, background) {
    currentFg = foreground;
    currentBg = background;
  }

  function destroy() {
    computeBtn.removeEventListener('click', handleCompute);
    element.replaceChildren();
  }

  return { element, update, destroy };
}
