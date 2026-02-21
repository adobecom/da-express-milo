import { throttle, debounce } from '../../scripts/utils/hofs.js';

const HEX_PATTERN = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * Check if a string looks like a hex color
 * @param {string} value - Input value
 * @returns {boolean}
 */
function isHexColor(value) {
  return HEX_PATTERN.test(value.trim());
}

/**
 * Normalize hex color (add # if missing, expand 3-char to 6-char)
 * @param {string} value - Input value
 * @returns {string|null} Normalized hex or null if invalid
 */
function normalizeHex(value) {
  const cleaned = value.trim().replace(/^#/, '');
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleaned)) return null;

  const expanded = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;

  return `#${expanded.toUpperCase()}`;
}

/**
 * Generate suggestions based on user input
 * Creates term, tag, and (optionally) hex suggestions
 *
 * @param {string} query - User input
 * @returns {Array<{label: string, type: string, typeLabel: string, value: string}>}
 */
export function generateSuggestions(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const trimmed = query.trim();

  const baseSuggestions = [
    {
      label: trimmed,
      type: 'term',
      typeLabel: 'Term',
      value: trimmed,
      typeOfQuery: 'term',
    },
    {
      label: trimmed,
      type: 'tag',
      typeLabel: 'Tag',
      value: trimmed,
      typeOfQuery: 'tag',
    },
  ];

  let hexSuggestion;
  if (isHexColor(trimmed)) {
    const normalizedHex = normalizeHex(trimmed);
    if (normalizedHex) {
      hexSuggestion = {
        label: normalizedHex,
        type: 'hex',
        typeLabel: 'Hex',
        value: normalizedHex,
        typeOfQuery: 'hex',
      };
    }
  } else {
    hexSuggestion = {
      label: trimmed,
      type: 'hex',
      typeLabel: 'Hex',
      value: trimmed,
      typeOfQuery: 'similarHex',
    };
  }

  return hexSuggestion ? [...baseSuggestions, hexSuggestion] : baseSuggestions;
}

/**
 * Creates an autocomplete handler with throttle and debounce support
 * Follows search-marquee's useInputAutocomplete pattern
 *
 * @param {Function} onSuggestions - Callback when suggestions are ready
 * @param {Object} options - Configuration options
 * @param {number} [options.throttleDelay=300] - Throttle delay in ms
 * @param {number} [options.debounceDelay=500] - Debounce delay in ms
 * @param {number} [options.minLength=2] - Minimum query length to trigger suggestions
 * @returns {{ handleInput: Function, inputHandler: Function, clear: Function, getLastQuery: Function }}
 */
export function createAutocomplete(onSuggestions, options = {}) {
  const {
    throttleDelay = 300,
    debounceDelay = 500,
    minLength = 2,
  } = options;

  const state = {
    query: '',
    waitingFor: '',
  };

  const fetchAndUpdateUI = () => {
    const currentSearch = state.query;
    state.waitingFor = currentSearch;

    if (!currentSearch || currentSearch.trim().length < minLength) {
      onSuggestions([]);
      return;
    }

    const suggestions = generateSuggestions(currentSearch);

    // Only update if this is still the most recent query
    if (state.waitingFor === currentSearch) {
      onSuggestions(suggestions);
    }
  };

  const throttledFetchAndUpdateUI = throttle(fetchAndUpdateUI, throttleDelay, { trailing: true });
  const debouncedFetchAndUpdateUI = debounce(fetchAndUpdateUI, debounceDelay);

  /**
   * Input handler following search-marquee pattern
   * Uses throttle for short queries or queries ending with space
   * Uses debounce for longer, in-progress typing
   * @param {Event|string} eventOrValue - Input event or value string
   */
  const inputHandler = (eventOrValue) => {
    const value = typeof eventOrValue === 'string'
      ? eventOrValue
      : eventOrValue?.target?.value || '';

    state.query = value;

    if (!value || value.trim().length < minLength) {
      onSuggestions([]);
      return;
    }

    if (value.length < 4 || value.endsWith(' ')) {
      throttledFetchAndUpdateUI();
    } else {
      debouncedFetchAndUpdateUI();
    }
  };

  return {
    /**
     * Handle input change (legacy API)
     * @param {string} value - Input value
     */
    handleInput(value) {
      inputHandler(value);
    },

    /**
     * Input handler for event listeners (search-marquee compatible)
     */
    inputHandler,

    /**
     * Clear suggestions
     */
    clear() {
      state.query = '';
      state.waitingFor = '';
      onSuggestions([]);
    },

    /**
     * Get last processed query
     * @returns {string}
     */
    getLastQuery() {
      return state.query;
    },
  };
}

export default createAutocomplete;
