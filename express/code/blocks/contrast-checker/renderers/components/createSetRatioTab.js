import { createTag } from '../../../../scripts/utils.js';
import { createExpressTextfield } from '../../../../scripts/color-shared/spectrum/components/express-textfield.js';
import createSuggestionCard from './createSuggestionCard.js';

function rgbToHex(r, g, b) {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

export default function createSetRatioTab({ dataService, recommendationService, onApply }) {
  const element = createTag('div', { class: 'cc-set-ratio-container' });

  let currentFg = '';
  let currentBg = '';
  let isPreviewState = false;
  let ratioFieldInstance = null;
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
    if (!ratioFieldInstance || !previewContainer) return;

    const rawValue = ratioFieldInstance.element.querySelector('input')?.value;
    const targetRatio = Number.parseFloat(rawValue);
    if (Number.isNaN(targetRatio) || targetRatio < 1 || targetRatio > 20) return;

    previewContainer.replaceChildren();

    const suggestions = computeSuggestions(targetRatio);

    if (suggestions.length) {
      suggestions.forEach((s) => {
        previewContainer.appendChild(createSuggestionCard({
          suggestion: s,
          onApply,
          width: 182,
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

  async function buildContent() {
    element.replaceChildren();

    const inputRow = createTag('div', { class: 'cc-set-ratio-input-row' });

    ratioFieldInstance = await createExpressTextfield({
      label: 'Set contrast ratio',
      value: '4.5',
      size: 'l',
      helpText: 'Enter a value between 1 and 20',
      onChange: () => {
        if (isPreviewState) {
          isPreviewState = false;
          updateButtonLabel();
        }
      },
    });

    const separator = createTag('span', { class: 'cc-set-ratio-separator' }, ': 1');

    actionBtn = createTag('button', {
      class: 'cc-set-ratio-action-btn',
      type: 'button',
    }, 'See preview');
    actionBtn.addEventListener('click', handleAction);

    inputRow.appendChild(ratioFieldInstance.element);
    inputRow.appendChild(separator);
    inputRow.appendChild(actionBtn);

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
    ratioFieldInstance?.destroy();
    actionBtn?.removeEventListener('click', handleAction);
    element.replaceChildren();
  }

  return { element, update, destroy };
}
