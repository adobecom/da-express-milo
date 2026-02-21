// ==============================================
// CSS Classes
// ==============================================

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

// ==============================================
// ARIA Attributes
// ==============================================

export const ARIA = {
  EXPANDED_TRUE: 'true',
  EXPANDED_FALSE: 'false',
};

// ==============================================
// Default Values
// ==============================================

export const DEFAULTS = {
  PLACEHOLDER: 'Search for colors, moods, themes, etc.',
  SUGGESTIONS_ID: 'search-suggestions',
  SUGGESTIONS_HEADER: 'Suggestions',
  QUERY_PARAM: 'q',
  DEBOUNCE_MS: 300,
};

// ==============================================
// Suggestions Item Configuration
// ==============================================

/**
 * @typedef {Object} SuggestionItemConfig
 * @property {boolean} showIcon - Whether to display the icon
 * @property {string} iconType - Type of icon to show (maps to SUGGESTION_ICONS)
 * @property {string} labelField - Field name in data to use as primary label
 * @property {string} [subtextField] - Field name in data to use as subtext
 * @property {string} [typeField] - Field name to use for type label
 * @property {string} [imageField] - Field name for thumbnail image URL
 * @property {boolean} [showType] - Whether to show the type label
 */

/**
 * @typedef {Object} SuggestionsConfig
 * @property {string} headerText - Header text for suggestions panel
 * @property {SuggestionItemConfig} itemConfig - Configuration for each suggestion item
 * @property {number} [maxItems] - Maximum number of suggestions to display
 * @property {string} [emptyMessage] - Message to show when no results
 */

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

// ==============================================
// Deep Linking Configuration
// ==============================================

/**
 * @typedef {Object} DeepLinkConfig
 * @property {boolean} enabled - Whether deep linking is enabled
 * @property {string} queryParam - URL query parameter name
 * @property {boolean} updateOnSearch - Whether to update URL on search
 * @property {boolean} autoPopulate - Whether to auto-populate from URL on load
 */

export const DEFAULT_DEEP_LINK_CONFIG = {
  enabled: true,
  queryParam: DEFAULTS.QUERY_PARAM,
  updateOnSearch: true,
  autoPopulate: true,
};
