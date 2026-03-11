import { createTag } from '../../../../scripts/utils.js';
import createSuggestionCard from './createSuggestionCard.js';
import createSimpleCarousel from '../../../../scripts/widgets/simple-carousel.js';

export default function createSuggestionsTab({ recommendationService, onApply }) {
  const element = createTag('div', { class: 'cc-suggestions-container' });
  let carouselInstance = null;

  async function update(foreground, background, results) {
    if (carouselInstance) {
      carouselInstance.cleanup();
      carouselInstance = null;
    }
    element.replaceChildren();

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

    const track = createTag('div', { class: 'cc-suggestions-track' });

    suggestions.forEach((s) => {
      const card = createSuggestionCard({ suggestion: s, onApply });
      track.appendChild(card);
    });

    element.appendChild(track);

    if (suggestions.length > 1) {
      carouselInstance = await createSimpleCarousel('.cc-suggestion-card', track);
    }
  }

  function destroy() {
    if (carouselInstance) {
      carouselInstance.cleanup();
      carouselInstance = null;
    }
    element.replaceChildren();
  }

  return { element, update, destroy };
}
