import { createTag } from '../../../../scripts/utils.js';
import { createContrastCheckerPlaceholders } from '../../utils/placeholders.js';

export default function createSuggestionCard({
  suggestion,
  onApply,
  strings: placeholderOverrides,
}) {
  const strings = createContrastCheckerPlaceholders(placeholderOverrides);
  const card = createTag('div', { class: 'cc-suggestion-card' });
  const controller = new AbortController();
  const { signal } = controller;

  const previewBar = createTag('div', { class: 'cc-suggestion-preview-bar' });

  const fgHalf = createTag('div', {
    class: 'cc-suggestion-preview-fg',
    style: `background: ${suggestion.fg}`,
  });
  fgHalf.appendChild(createTag('span', { class: 'cc-suggestion-preview-fg-letter' }, 'T'));

  const bgHalf = createTag('div', {
    class: 'cc-suggestion-preview-bg',
    style: `background: ${suggestion.bg}`,
  });

  previewBar.appendChild(fgHalf);
  previewBar.appendChild(bgHalf);

  const footer = createTag('div', { class: 'cc-suggestion-footer' });

  const applyLink = createTag('button', {
    class: 'cc-suggestion-apply-link',
    type: 'button',
  }, strings.apply);
  applyLink.addEventListener('click', () => onApply({ fg: suggestion.fg, bg: suggestion.bg }), { signal });

  const ratioLabel = createTag('span', { class: 'cc-suggestion-ratio-label' });
  const ratio = Math.round(suggestion.ratio * 100) / 100;
  ratioLabel.appendChild(document.createTextNode(`${strings.ratio}: `));
  ratioLabel.appendChild(createTag('span', { class: 'cc-suggestion-ratio-value' }, `${ratio} ${strings.ratioUnitSuffix}`));

  footer.appendChild(applyLink);
  footer.appendChild(ratioLabel);

  card.appendChild(previewBar);
  card.appendChild(footer);

  return {
    element: card,
    destroy() {
      controller.abort();
      card.remove();
    },
  };
}
