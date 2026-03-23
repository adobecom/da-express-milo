export const CSS_CLASSES = {
  OUTER_WRAPPER: 'search-bar-outer',
  SENTINEL: 'search-bar-sentinel',
  CONTAINER: 'search-bar-container',
  WRAPPER: 'search-bar-wrapper',
  FORM: 'search-bar-form',
  INPUT_WRAPPER: 'search-input-wrapper',
  INPUT: 'search-bar-input',
  SEARCH_ICON: 'search-icon',
  CLEAR_BTN: 'search-clear-btn',
  SUGGESTIONS_VISIBLE: 'suggestions-visible',
  IS_FETCHING: 'is-fetching',
  HIDDEN: 'hidden',
};

export const ARIA = {
  EXPANDED_TRUE: 'true',
  EXPANDED_FALSE: 'false',
};

export const DEFAULTS = {
  PLACEHOLDER: 'Search for colors, moods, themes, etc.',
  SUGGESTIONS_ID: 'search-suggestions',
  SUGGESTIONS_HEADER: 'Suggestions',
  QUERY_PARAM: 'q',
  DEBOUNCE_MS: 300,
};

export const DEFAULT_ITEM_CONFIG = {
  showIcon: true,
  iconType: 'term',
  labelField: 'label',
  subtextField: null,
  typeField: 'typeLabel',
  imageField: null,
  showType: true,
};

export const DEFAULT_SUGGESTIONS_CONFIG = {
  headerText: 'Suggestions',
  itemConfig: DEFAULT_ITEM_CONFIG,
  maxItems: 10,
  emptyMessage: 'No results found',
};

export const DEFAULT_DEEP_LINK_CONFIG = {
  enabled: true,
  queryParam: DEFAULTS.QUERY_PARAM,
  updateOnSearch: true,
  autoPopulate: true,
};
