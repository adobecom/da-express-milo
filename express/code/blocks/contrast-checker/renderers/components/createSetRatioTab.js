import { createTag } from '../../../../scripts/utils.js';
import createSuggestionCard from './createSuggestionCard.js';

function rgbToHex(r, g, b) {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

export default function createSetRatioTab({ dataService, recommendationService, onApply }) {
  const element = createTag('div', { class: 'cc-set-ratio-container' });

  let currentFg = '';
  let currentBg = '';
  let isPreviewState = false;
  let ratioInput = null;
  let actionBtn = null;
  let previewContainer = null;

  function computeSuggestions(targetRatio) {
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

    return suggestions;
  }

  function updateButtonLabel() {
    if (!actionBtn) return;
    actionBtn.textContent = isPreviewState ? 'Refresh' : 'See preview';
  }

  function handleAction() {
    if (!ratioInput || !previewContainer) return;

    const rawValue = ratioInput.value;
    const targetRatio = Number.parseFloat(rawValue);
    if (Number.isNaN(targetRatio) || targetRatio < 1 || targetRatio > 20) return;

    previewContainer.replaceChildren();

    const suggestions = computeSuggestions(targetRatio);

    if (suggestions.length) {
      suggestions.forEach((s) => {
        previewContainer.appendChild(createSuggestionCard({
          suggestion: s,
          onApply,
        }));
      });
    } else {
      previewContainer.appendChild(
        createTag('div', { class: 'cc-suggestions-message' }, 'Could not find colors meeting the target ratio.'),
      );
    }

    isPreviewState = true;
    updateButtonLabel();
  }

  function handleInputChange() {
    if (isPreviewState) {
      isPreviewState = false;
      updateButtonLabel();
    }
  }

  function buildContent() {
    element.replaceChildren();

    const inputRow = createTag('div', { class: 'cc-set-ratio-input-row' });

    const field = createTag('div', { class: 'cc-set-ratio-field' });

    const label = createTag('label', {
      class: 'cc-set-ratio-field-label',
      for: 'cc-set-ratio-input',
    }, 'Set contrast ratio');

    ratioInput = createTag('input', {
      class: 'cc-set-ratio-field-input',
      id: 'cc-set-ratio-input',
      type: 'text',
      value: '4.5',
      inputmode: 'decimal',
    });
    ratioInput.addEventListener('input', handleInputChange);

    const helpText = createTag('p', { class: 'cc-set-ratio-field-help' }, 'Enter a value between 1 and 20');

    field.appendChild(label);
    field.appendChild(ratioInput);
    field.appendChild(helpText);

    const buttonContainer = createTag('div', { class: 'cc-set-ratio-button-container' });
    const buttonSpacer = createTag('div', { class: 'cc-set-ratio-button-spacer' });
    const buttonRow = createTag('div', { class: 'cc-set-ratio-button-row' });

    const separator = createTag('span', { class: 'cc-set-ratio-separator' }, ': 1');

    actionBtn = createTag('button', {
      class: 'cc-set-ratio-action-btn',
      type: 'button',
    }, 'See preview');
    actionBtn.addEventListener('click', handleAction);

    buttonRow.appendChild(separator);
    buttonRow.appendChild(actionBtn);
    buttonContainer.appendChild(buttonSpacer);
    buttonContainer.appendChild(buttonRow);

    inputRow.appendChild(field);
    inputRow.appendChild(buttonContainer);

    previewContainer = createTag('div', { class: 'cc-set-ratio-preview' });

    element.appendChild(inputRow);
    element.appendChild(previewContainer);
  }

  buildContent();

  function update(foreground, background) {
    currentFg = foreground;
    currentBg = background;
  }

  function destroy() {
    ratioInput?.removeEventListener('input', handleInputChange);
    actionBtn?.removeEventListener('click', handleAction);
    element.replaceChildren();
  }

  return { element, update, destroy };
}
