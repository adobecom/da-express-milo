import { createTag } from '../../../../scripts/utils.js';
import { createContrastCheckerPlaceholders } from '../../utils/placeholders.js';
import { rgbToHex } from '../../utils/contrastUtils.js';
import createSuggestionCard from './createSuggestionCard.js';

export default function createSetRatioTab({
  dataService,
  recommendationService,
  onApply,
  strings: placeholderOverrides,
}) {
  const strings = createContrastCheckerPlaceholders(placeholderOverrides);
  const defaultRatioValue = '4.5';
  const element = createTag('div', { class: 'cc-set-ratio-container' });

  let currentFg = '';
  let currentBg = '';
  let isPreviewState = false;
  let ratioInput = null;
  let actionBtn = null;
  let previewContainer = null;
  let previewCards = [];

  function cleanupPreviewCards() {
    previewCards.forEach((card) => card.destroy());
    previewCards = [];
  }

  function clearPreview() {
    cleanupPreviewCards();
    previewContainer?.replaceChildren();
  }

  function resetPreviewState() {
    clearPreview();
    isPreviewState = false;
    if (ratioInput) {
      ratioInput.value = defaultRatioValue;
    }
    updateButtonLabel();
  }

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
    actionBtn.textContent = isPreviewState ? strings.refresh : strings.seePreview;
  }

  function handleAction() {
    if (!ratioInput || !previewContainer) return;

    if (isPreviewState) {
      resetPreviewState();
      return;
    }

    const rawValue = ratioInput.value;
    const targetRatio = Number.parseFloat(rawValue);
    if (Number.isNaN(targetRatio) || targetRatio < 1 || targetRatio > 20) return;

    clearPreview();

    const suggestions = computeSuggestions(targetRatio);

    if (suggestions.length) {
      suggestions.forEach((s) => {
        const card = createSuggestionCard({
          suggestion: s,
          onApply,
          strings,
        });
        previewCards.push(card);
        previewContainer.appendChild(card.element);
      });
    } else {
      previewContainer.appendChild(
        createTag('div', { class: 'cc-suggestions-message' }, strings.noTargetRatioSuggestions),
      );
    }

    isPreviewState = true;
    updateButtonLabel();
  }

  function handleInputChange() {
    if (isPreviewState) {
      clearPreview();
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
    }, strings.setContrastRatio);

    ratioInput = createTag('input', {
      class: 'cc-set-ratio-field-input',
      id: 'cc-set-ratio-input',
      type: 'text',
      value: defaultRatioValue,
      inputmode: 'decimal',
    });
    ratioInput.addEventListener('input', handleInputChange);

    const helpText = createTag('p', { class: 'cc-set-ratio-field-help' }, strings.ratioInputHelpText);

    field.appendChild(label);
    field.appendChild(ratioInput);
    field.appendChild(helpText);

    const buttonContainer = createTag('div', { class: 'cc-set-ratio-button-container' });
    const buttonRow = createTag('div', { class: 'cc-set-ratio-button-row' });

    const separator = createTag('span', { class: 'cc-set-ratio-separator' }, strings.ratioUnitSuffix);

    actionBtn = createTag('button', {
      class: 'cc-set-ratio-action-btn',
      type: 'button',
    }, strings.seePreview);
    actionBtn.addEventListener('click', handleAction);

    buttonRow.appendChild(separator);
    buttonRow.appendChild(actionBtn);
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
    cleanupPreviewCards();
    ratioInput?.removeEventListener('input', handleInputChange);
    actionBtn?.removeEventListener('click', handleAction);
    element.replaceChildren();
  }

  return { element, update, destroy };
}
