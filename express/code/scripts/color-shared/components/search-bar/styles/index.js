import loadMiloStyle from '../../../utils/loadMiloStyle.js';

const SEARCH_BAR_STYLES_PATH = 'scripts/color-shared/components/search-bar/styles/search-bar.css';
const SEARCH_BAR_SUGGESTIONS_STYLES_PATH = 'scripts/color-shared/components/search-bar/styles/suggestions.css';

export function loadSearchBarStyles() {
  return loadMiloStyle(SEARCH_BAR_STYLES_PATH);
}

export function loadSearchBarSuggestionStyles() {
  return loadMiloStyle(SEARCH_BAR_SUGGESTIONS_STYLES_PATH);
}
