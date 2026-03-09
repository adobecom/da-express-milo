import { createTag } from '../../../../scripts/utils.js';

export default function createSuggestionsTab({ dataService, recommendationService, onApply }) {
  const element = createTag('div', { class: 'cc-suggestions-container' });

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

  function update(foreground, background, results) {
    element.replaceChildren();

    if (results.ratio >= 7) {
      element.appendChild(
        createTag('div', { class: 'cc-suggestions-message' }, 'Your colors meet AAA contrast requirements.'),
      );
      return;
    }

    const suggestions = recommendationService.getSuggestedColors(results.ratio, background, foreground);

    if (!suggestions.length) {
      element.appendChild(
        createTag('div', { class: 'cc-suggestions-message' }, 'No suggestions available for the current color pair.'),
      );
      return;
    }

    suggestions.forEach((s) => element.appendChild(renderCard(s)));
  }

  function destroy() {
    element.replaceChildren();
  }

  return { element, update, destroy };
}
