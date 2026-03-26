import loadMiloStyle from '../../../utils/loadMiloStyle.js';

const STYLES_BASE = 'scripts/color-shared/components/search-bar/styles';

export function loadSearchBarStyles() {
  return loadMiloStyle(`${STYLES_BASE}/search-bar.css`);
}

export function loadSearchBarSuggestionStyles() {
  return loadMiloStyle(`${STYLES_BASE}/suggestions.css`);
}
