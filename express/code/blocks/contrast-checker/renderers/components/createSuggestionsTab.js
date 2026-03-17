import { createTag } from '../../../../scripts/utils.js';
import { createContrastCheckerPlaceholders } from '../../placeholders.js';
import createSuggestionCard from './createSuggestionCard.js';
import createSimpleCarousel from '../../../../scripts/widgets/simple-carousel.js';

export default function createSuggestionsTab({
  recommendationService,
  onApply,
  strings: placeholderOverrides,
}) {
  const strings = createContrastCheckerPlaceholders(placeholderOverrides);
  const element = createTag('div', { class: 'cc-suggestions-container' });
  let carouselInstance = null;
  let cardInstances = [];

  function cleanupCards() {
    cardInstances.forEach((card) => card.destroy());
    cardInstances = [];
  }

  async function update(foreground, background, results) {
    if (carouselInstance) {
      carouselInstance.cleanup();
      carouselInstance = null;
    }
    cleanupCards();
    element.replaceChildren();

    if (results.ratio >= 7) {
      element.appendChild(
        createTag('div', { class: 'cc-suggestions-message' }, strings.highContrastNoSuggestions),
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
        createTag('div', { class: 'cc-suggestions-message' }, strings.noSuggestionsAvailable),
      );
      return;
    }

    const shouldUseCarousel = suggestions.length > 1;
    const trackClassName = shouldUseCarousel
      ? 'cc-suggestions-track cc-suggestions-track-pending-carousel'
      : 'cc-suggestions-track';
    const track = createTag('div', { class: trackClassName });

    suggestions.forEach((s) => {
      const card = createSuggestionCard({ suggestion: s, onApply, strings });
      cardInstances.push(card);
      track.appendChild(card.element);
    });

    element.appendChild(track);

    if (shouldUseCarousel && element.offsetWidth > 0) {
      carouselInstance = await createSimpleCarousel('.cc-suggestion-card', track);
      track.classList.remove('cc-suggestions-track-pending-carousel');
    }
  }

  async function onVisible() {
    const track = element.querySelector('.cc-suggestions-track');
    if (track && !carouselInstance && track.querySelectorAll('.cc-suggestion-card').length > 1) {
      carouselInstance = await createSimpleCarousel('.cc-suggestion-card', track);
      track.classList.remove('cc-suggestions-track-pending-carousel');
    }
  }

  function destroy() {
    if (carouselInstance) {
      carouselInstance.cleanup();
      carouselInstance = null;
    }
    cleanupCards();
    element.replaceChildren();
  }

  return { element, update, destroy, onVisible };
}
