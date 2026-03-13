import { createTag } from '../../../../scripts/utils.js';

export default function createSuggestionCard({ suggestion, onApply }) {
  const card = createTag('div', { class: 'cc-suggestion-card' });

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
  }, 'Apply');
  applyLink.addEventListener('click', () => onApply({ fg: suggestion.fg, bg: suggestion.bg }));

  const ratioLabel = createTag('span', { class: 'cc-suggestion-ratio-label' });
  const ratio = Math.round(suggestion.ratio * 100) / 100;
  ratioLabel.appendChild(document.createTextNode('Ratio: '));
  ratioLabel.appendChild(createTag('span', { class: 'cc-suggestion-ratio-value' }, `${ratio} : 1`));

  footer.appendChild(applyLink);
  footer.appendChild(ratioLabel);

  card.appendChild(previewBar);
  card.appendChild(footer);

  return card;
}
