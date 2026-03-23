import { loadComponentStyles } from '../../../utils/loadComponentStyles.js';

const SEARCH_BAR_STYLES_PATH = './search-bar.css';
const SEARCH_BAR_SUGGESTIONS_STYLES_PATH = './suggestions.css';

export function loadSearchBarStyles() {
  return loadComponentStyles(SEARCH_BAR_STYLES_PATH, import.meta.url);
}

export function loadSearchBarSuggestionStyles() {
  return loadComponentStyles(SEARCH_BAR_SUGGESTIONS_STYLES_PATH, import.meta.url);
}
