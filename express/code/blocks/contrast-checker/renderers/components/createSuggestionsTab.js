import { createTag } from '../../../../scripts/utils.js';

/* eslint-disable max-len */
const CHEVRON_RIGHT_SVG = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 4l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/* eslint-enable max-len */

export default function createSuggestionsTab({ dataService, recommendationService, onApply }) {
  const element = createTag('div', { class: 'cc-suggestions-container' });
  let cards = [];
  let dots = [];
  let track = null;
  let observer = null;

  function renderCard(suggestion) {
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

  function updateDots(activeIndex) {
    dots.forEach((dot, i) => {
      dot.classList.toggle('cc-suggestions-dot--active', i === activeIndex);
    });
  }

  function setupObserver() {
    if (observer) observer.disconnect();
    if (!track || !cards.length) return;

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = cards.indexOf(entry.target);
          if (idx >= 0) updateDots(idx);
        }
      });
    }, {
      root: track,
      threshold: 0.6,
    });

    cards.forEach((card) => observer.observe(card));
  }

  function scrollToNext() {
    if (!track || !cards.length) return;
    const activeIdx = dots.findIndex((d) => d.classList.contains('cc-suggestions-dot--active'));
    const nextIdx = Math.min(activeIdx + 1, cards.length - 1);
    cards[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }

  function buildGalleryControls(count) {
    const controls = createTag('div', { class: 'cc-suggestions-gallery-controls' });
    controls.appendChild(createTag('div', { class: 'cc-suggestions-fade' }));

    const pagination = createTag('div', { class: 'cc-suggestions-pagination' });
    dots = [];
    for (let i = 0; i < count; i += 1) {
      const dotClass = i === 0
        ? 'cc-suggestions-dot cc-suggestions-dot--active'
        : 'cc-suggestions-dot';
      const dot = createTag('span', { class: dotClass });
      dots.push(dot);
      pagination.appendChild(dot);
    }
    controls.appendChild(pagination);

    const chevronBtn = createTag('button', {
      class: 'cc-suggestions-chevron-btn',
      type: 'button',
      'aria-label': 'Next suggestion',
    }, CHEVRON_RIGHT_SVG);
    chevronBtn.addEventListener('click', scrollToNext);
    controls.appendChild(chevronBtn);

    return controls;
  }

  function update(foreground, background, results) {
    element.replaceChildren();
    cards = [];
    dots = [];
    if (observer) { observer.disconnect(); observer = null; }

    if (results.ratio >= 7) {
      element.appendChild(
        createTag('div', { class: 'cc-suggestions-message' }, 'Your colors meet AAA contrast requirements.'),
      );
      return;
    }

    const suggestions = recommendationService.getSuggestedColors(
      results.ratio,
      background,
      foreground,
    );

    if (!suggestions.length) {
      element.appendChild(
        createTag('div', { class: 'cc-suggestions-message' }, 'No suggestions available for the current color pair.'),
      );
      return;
    }

    const viewport = createTag('div', { class: 'cc-suggestions-viewport' });
    track = createTag('div', { class: 'cc-suggestions-track' });

    suggestions.forEach((s) => {
      const card = renderCard(s);
      cards.push(card);
      track.appendChild(card);
    });

    viewport.appendChild(track);

    if (suggestions.length > 1) {
      viewport.appendChild(buildGalleryControls(suggestions.length));
    }

    element.appendChild(viewport);
    setupObserver();
  }

  function destroy() {
    if (observer) { observer.disconnect(); observer = null; }
    cards = [];
    dots = [];
    track = null;
    element.replaceChildren();
  }

  return { element, update, destroy };
}
