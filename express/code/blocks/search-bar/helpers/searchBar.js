import { createTag } from '../../../scripts/utils.js';
import { createAutoStickyBehavior } from '../../../libs/utils/sticky-behavior/index.js';
import { createAutocomplete } from '../../../libs/utils/autocomplete.js';
import { CSS_CLASSES, DEFAULTS } from './constants.js';
import { createSearchBarWrapper, updateClearButtonVisibility, createStickyWrapper } from './dom.js';
import { initSearchHandlers } from './handlers.js';
import { createVisibilityManager, createNoopVisibilityManager } from './visibility.js';
import { createSuggestionsDropdown } from './searchResults.js';

// ==============================================
// Search Bar Factory
// ==============================================

/**
 * Create Explore Search Bar component
 * @param {Object} props - Component properties
 * @param {string} [props.placeholder] - Search placeholder text
 * @param {boolean} [props.enableSuggestions=true] - Whether to enable suggestions dropdown
 * @param {boolean} [props.enableStickyBehavior=false] - Whether to enable sticky behavior
 * @param {Object} [props.suggestionsConfig] - Configuration for suggestions dropdown
 * @param {Object} callbacks - Event callbacks
 * @param {Function} [callbacks.onInput] - Input change handler: ({ value: string }) => void
 * @param {Function} [callbacks.onSubmit] - Search submit handler: ({ query: string, suggestion?: Object }) => void
 * @param {Function} [callbacks.onClear] - Search cleared handler: () => void
 * @param {Function} [callbacks.onSuggestionSelect] - Suggestion selected handler: ({ suggestion: Object }) => void
 * @returns {Promise<Object>} Component API
 */
export async function createExploreSearchBar(props = {}, callbacks = {}) {
  const {
    placeholder = DEFAULTS.PLACEHOLDER,
    enableSuggestions = true,
    enableStickyBehavior = false,
    suggestionsConfig = {},
    autocompleteConfig = {},
    enableAutocomplete = false,
  } = props;

  const state = {
    query: '',
    isFetching: false,
    showSuggestions: false,
  };

  const outerWrapper = createTag('div', { class: CSS_CLASSES.OUTER_WRAPPER });

  const sentinel = createTag('div', {
    class: CSS_CLASSES.SENTINEL,
    'aria-hidden': 'true',
  });

  const container = createTag('div', { class: CSS_CLASSES.CONTAINER });
  const { wrapper, form, input, clearBtn } = createSearchBarWrapper(placeholder);

  let suggestionsDropdown = null;
  let visibility;

  if (enableSuggestions) {
    const labelField = suggestionsConfig.itemConfig?.labelField || 'label';

    const handleSuggestionSelect = (suggestion) => {
      const labelValue = suggestion[labelField] || suggestion.label || '';
      state.query = labelValue;
      input.value = labelValue;
      updateClearButtonVisibility(clearBtn, true);
      visibility.hide();
      callbacks.onSuggestionSelect?.({ suggestion });
      callbacks.onSubmit?.({ query: labelValue, suggestion });
    };

    suggestionsDropdown = await createSuggestionsDropdown(
      {
        id: DEFAULTS.SUGGESTIONS_ID,
        headerText: suggestionsConfig.headerText || DEFAULTS.SUGGESTIONS_HEADER,
        itemConfig: suggestionsConfig.itemConfig,
        maxItems: suggestionsConfig.maxItems,
        emptyMessage: suggestionsConfig.emptyMessage,
        showHeader: suggestionsConfig.showHeader !== false,
      },
      { onSelect: handleSuggestionSelect, onHover: () => {} },
    );

    container.append(wrapper, suggestionsDropdown.element);
    visibility = createVisibilityManager(suggestionsDropdown, input, container, state);

    suggestionsDropdown.attachKeyboardNavigation(input, {
      onSelect: handleSuggestionSelect,
      onEscape: visibility.hide,
    });

    input.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!suggestionsDropdown.isVisible() && state.query) {
        visibility.show();
      }
    }, { passive: true });
  } else {
    container.append(wrapper);
    visibility = createNoopVisibilityManager();
  }

  outerWrapper.append(sentinel, container);

  initSearchHandlers(
    { container, input, clearBtn, form },
    state,
    callbacks,
    { hideSuggestions: visibility.hide },
  );

  let stickyBehavior = null;

  if (enableStickyBehavior) {
    stickyBehavior = createAutoStickyBehavior({
      sentinel,
      element: container,
      createWrapper: createStickyWrapper,
      animation: { duration: 200 },
      observer: {
        rootMargin: '-1px 0px 0px 0px',
      },
      onShow: () => {},
      onHide: () => {
        visibility.hide();
      },
    });
  }

  if (enableAutocomplete) {
    const autocomplete = createAutocomplete(
      (suggestions) => {
        if (suggestionsDropdown) {
          suggestionsDropdown.setSuggestions(suggestions);
          if (suggestions.length > 0) {
            visibility.show();
          } else {
            visibility.hide();
          }
        }
      },
      {
        throttleDelay: autocompleteConfig.throttleDelay ?? 300,
        debounceDelay: autocompleteConfig.debounceDelay ?? 500,
        minLength: autocompleteConfig.minLength ?? 2,
      },
    );

    input.addEventListener('input', autocomplete.inputHandler);

    const originalClear = callbacks.onClear;
    callbacks.onClear = () => {
      autocomplete.clear();
      originalClear?.();
    };
  }

  return {
    element: outerWrapper,

    setQuery(query) {
      state.query = query;
      input.value = query;
      const hasValue = Boolean(query);
      clearBtn.style.display = hasValue ? 'inline-block' : 'none';
      clearBtn.classList.toggle(CSS_CLASSES.HIDDEN, !hasValue);
    },

    setSuggestions(suggestions) {
      if (suggestionsDropdown) {
        suggestionsDropdown.setSuggestions(suggestions);
        if (suggestions.length > 0) visibility.show();
      }
    },

    clear() {
      state.query = '';
      input.value = '';
      updateClearButtonVisibility(clearBtn, false);
      if (suggestionsDropdown) {
        suggestionsDropdown.reset();
      }
      visibility.hide();
      callbacks.onClear?.();
    },

    focus: () => input.focus(),

    getValue: () => state.query,

    setFetching(fetching) {
      state.isFetching = fetching;
      container.classList.toggle(CSS_CLASSES.IS_FETCHING, fetching);
    },

    hideSuggestions: () => visibility.hide(),

    showSuggestions: () => visibility.show(),

    initStickyBehavior: (scrollRoot) => stickyBehavior?.init(scrollRoot),

    destroyStickyBehavior: () => stickyBehavior?.destroy(),

    destroy() {
      stickyBehavior?.destroy();
      if (suggestionsDropdown) {
        suggestionsDropdown.destroy();
      }
    },
  };
}
