import { createTag } from '../../../utils.js';
import { createAutoStickyBehavior } from '../../utils/sticky-behavior/index.js';
import { createAutocomplete } from '../../utils/autocomplete.js';
import {
  createKeyboardNavigation,
  attachItemNavigation,
} from '../../utils/keyboardNavigation.js';
import {
  loadSearchBarStyles,
  loadSearchBarSuggestionStyles,
} from './styles/index.js';

export const CSS_CLASSES = {
  OUTER_WRAPPER: 'ax-color-search-bar-outer',
  SENTINEL: 'ax-color-search-bar-sentinel',
  CONTAINER: 'ax-color-search-bar-container',
  WRAPPER: 'ax-color-search-bar-wrapper',
  FORM: 'ax-color-search-bar-form',
  INPUT_WRAPPER: 'ax-color-search-input-wrapper',
  INPUT: 'ax-color-search-bar-input',
  SEARCH_ICON: 'ax-color-search-icon',
  CLEAR_BTN: 'ax-color-search-clear-btn',
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

export const ICONS = {
  search: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  clear: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

export const SUGGESTION_ICONS = {
  term: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  tag: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1148 12.2678 21.1666 12.005 21.1666C11.7422 21.1666 11.4819 21.1148 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V2H12L20.59 10.59C20.9625 10.9647 21.1716 11.4716 21.1716 12C21.1716 12.5284 20.9625 13.0353 20.59 13.41Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 7H7.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  hex: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

function createCleanupRegistry() {
  const cleanupFns = [];

  return {
    addEventListener(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      cleanupFns.push(() => target.removeEventListener(type, handler, options));
    },
    add(fn) {
      cleanupFns.push(fn);
    },
    cleanup() {
      cleanupFns.forEach((fn) => fn());
    },
  };
}

function getNestedValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function createStickyWrapper() {
  return createTag('div', { class: 'ax-color-search-bar-sticky-wrapper' });
}

function createSearchBarWrapper(
  placeholder,
  suggestionsId = DEFAULTS.SUGGESTIONS_ID,
) {
  const wrapper = createTag('div', { class: CSS_CLASSES.WRAPPER });
  const form = createTag('form', { class: CSS_CLASSES.FORM, role: 'search' });
  const inputWrapper = createTag('div', { class: CSS_CLASSES.INPUT_WRAPPER });

  const searchIcon = createTag('span', {
    class: CSS_CLASSES.SEARCH_ICON,
    'aria-hidden': 'true',
  });
  searchIcon.innerHTML = ICONS.search;

  const input = createTag('input', {
    type: 'search',
    class: CSS_CLASSES.INPUT,
    placeholder,
    'aria-label': placeholder,
    'aria-autocomplete': 'list',
    'aria-controls': suggestionsId,
    'aria-expanded': ARIA.EXPANDED_FALSE,
    autocomplete: 'off',
  });

  const clearBtn = createTag('button', {
    type: 'button',
    class: `${CSS_CLASSES.CLEAR_BTN} ${CSS_CLASSES.HIDDEN}`,
    'aria-label': 'Clear search',
  });
  clearBtn.innerHTML = ICONS.clear;

  inputWrapper.append(searchIcon, input, clearBtn);
  form.append(inputWrapper);
  wrapper.append(form);

  return { wrapper, form, input, clearBtn };
}

function updateClearButtonVisibility(btn, hasValue) {
  btn.style.display = hasValue ? 'flex' : 'none';
  btn.classList.toggle(CSS_CLASSES.HIDDEN, !hasValue);
}

function updateQueryState(state, input, clearBtn, query) {
  state.query = query;
  input.value = query;
  updateClearButtonVisibility(clearBtn, Boolean(query));
}

function createVisibilityManager(dropdown, input, container, state) {
  return {
    show() {
      state.showSuggestions = true;
      dropdown.show();
      input.setAttribute('aria-expanded', ARIA.EXPANDED_TRUE);
      container.classList.add(CSS_CLASSES.SUGGESTIONS_VISIBLE);
    },

    hide() {
      state.showSuggestions = false;
      dropdown.hide();
      input.setAttribute('aria-expanded', ARIA.EXPANDED_FALSE);
      container.classList.remove(CSS_CLASSES.SUGGESTIONS_VISIBLE);
    },
  };
}

function createNoopVisibilityManager() {
  return {
    show() {},
    hide() {},
  };
}

function createSuggestionItem(suggestion, index, icons, itemConfig, callbacks) {
  const config = { ...DEFAULT_ITEM_CONFIG, ...itemConfig };
  const {
    showIcon,
    iconType,
    labelField,
    subtextField,
    typeField,
    imageField,
    showType,
  } = config;

  const item = createTag('li', {
    class: 'suggestion-item',
    role: 'option',
    'data-index': index,
    tabindex: 0,
  });

  if (imageField) {
    const imageUrl = getNestedValue(suggestion, imageField);
    if (imageUrl) {
      const thumbnail = createTag('div', { class: 'suggestion-thumbnail' });
      const img = createTag('img', {
        src: imageUrl,
        alt: '',
        loading: 'lazy',
      });
      thumbnail.appendChild(img);
      item.appendChild(thumbnail);
    }
  }

  if (showIcon && !imageField) {
    const icon = createTag('span', {
      class: 'suggestion-icon',
      'aria-hidden': 'true',
    });
    const iconKey = suggestion.type || iconType;
    icon.innerHTML = icons[iconKey] || icons.term || SUGGESTION_ICONS.term;
    item.appendChild(icon);
  }

  const textWrapper = createTag('div', { class: 'suggestion-text' });
  const labelText = getNestedValue(suggestion, labelField) || suggestion.label || '';
  const label = createTag('span', { class: 'suggestion-label' }, labelText);
  textWrapper.appendChild(label);

  if (subtextField) {
    const subtextValue = getNestedValue(suggestion, subtextField);
    if (subtextValue) {
      const subtext = createTag('span', { class: 'suggestion-subtext' }, subtextValue);
      textWrapper.appendChild(subtext);
    }
  }

  if (showType && typeField) {
    const typeValue = getNestedValue(suggestion, typeField);
    if (typeValue) {
      const typeLabel = createTag('span', { class: 'suggestion-type' }, typeValue);
      textWrapper.appendChild(typeLabel);
    }
  }

  item.appendChild(textWrapper);
  item.addEventListener('click', () => {
    callbacks.onSelect?.(suggestion, index);
  }, { passive: true });
  item.addEventListener('mouseenter', () => {
    callbacks.onHover?.(suggestion, index);
  }, { passive: true });

  return item;
}

export async function createSuggestionsDropdown(options = {}, callbacks = {}) {
  await loadSearchBarSuggestionStyles();

  const {
    id = 'suggestions',
    headerText = DEFAULT_SUGGESTIONS_CONFIG.headerText,
    icons = SUGGESTION_ICONS,
    itemConfig = DEFAULT_ITEM_CONFIG,
    maxItems = DEFAULT_SUGGESTIONS_CONFIG.maxItems,
    emptyMessage = DEFAULT_SUGGESTIONS_CONFIG.emptyMessage,
    showHeader = true,
  } = options;

  let suggestions = [];
  let isVisible = false;
  let keyboardNav = null;
  let itemNavCleanup = null;

  const dropdown = createTag('div', {
    id,
    class: 'search-suggestions-dropdown hidden',
    role: 'listbox',
  });
  const header = createTag('div', { class: 'suggestions-header' }, headerText);
  const list = createTag('ul', { class: 'suggestions-list' });
  const emptyEl = createTag('div', { class: 'suggestions-empty hidden' }, emptyMessage);

  if (showHeader) {
    dropdown.append(header, list, emptyEl);
  } else {
    dropdown.append(list, emptyEl);
  }

  function updateSelectionState(selectedIndex) {
    const items = list.querySelectorAll('.suggestion-item');
    items.forEach((item, index) => {
      const isSelected = index === selectedIndex;
      item.classList.toggle('is-selected', isSelected);
      item.setAttribute('aria-selected', String(isSelected));
    });
  }

  function show() {
    if (suggestions.length === 0) return;
    isVisible = true;
    dropdown.classList.remove('hidden');
  }

  function hide() {
    isVisible = false;
    dropdown.classList.add('hidden');
    keyboardNav?.reset();
  }

  function renderSuggestions(renderOptions = {}) {
    const { showEmpty = false } = renderOptions;
    list.innerHTML = '';

    if (suggestions.length === 0) {
      if (showEmpty) {
        emptyEl.classList.remove('hidden');
        dropdown.classList.remove('hidden');
        isVisible = true;
      } else {
        emptyEl.classList.add('hidden');
        hide();
      }
      return;
    }

    emptyEl.classList.add('hidden');

    const limitedSuggestions = maxItems ? suggestions.slice(0, maxItems) : suggestions;
    limitedSuggestions.forEach((suggestion, index) => {
      const item = createSuggestionItem(suggestion, index, icons, itemConfig, {
        onSelect: (selectedSuggestion, selectedIndex) => {
          callbacks.onSelect?.(selectedSuggestion, selectedIndex);
        },
        onHover: (hoveredSuggestion, hoveredIndex) => {
          keyboardNav?.setSelectedIndex(hoveredIndex);
          callbacks.onHover?.(hoveredSuggestion, hoveredIndex);
        },
      });
      list.appendChild(item);
    });

    itemNavCleanup?.();
    itemNavCleanup = attachItemNavigation(list, {
      itemSelector: '.suggestion-item',
      onSelect: (item, index) => {
        callbacks.onSelect?.(suggestions[index], index);
      },
    });

    show();
  }

  function setSuggestions(newSuggestions, renderOptions = {}) {
    suggestions = newSuggestions;
    keyboardNav?.reset();
    renderSuggestions(renderOptions);
  }

  function attachKeyboardNavigation(inputElement, navOptions = {}) {
    keyboardNav?.detach();

    keyboardNav = createKeyboardNavigation(list, {
      itemSelector: '.suggestion-item',
      selectedClass: 'is-selected',
      ...navOptions,
      onSelect: (item, index) => {
        callbacks.onSelect?.(suggestions[index], index);
      },
      onNavigate: (item, index) => {
        updateSelectionState(index);
        callbacks.onHover?.(suggestions[index], index);
      },
      onEscape: () => {
        hide();
      },
    });

    keyboardNav.attach(inputElement);
  }

  function reset() {
    suggestions = [];
    list.innerHTML = '';
    hide();
  }

  function destroy() {
    keyboardNav?.detach();
    keyboardNav = null;

    itemNavCleanup?.();
    itemNavCleanup = null;
  }

  return Object.freeze({
    element: dropdown,
    list,
    setSuggestions,
    show,
    hide,
    isVisible: () => isVisible,
    getSelectedIndex: () => keyboardNav?.getSelectedIndex() ?? -1,
    setSelectedIndex: (index) => {
      if (keyboardNav) {
        keyboardNav.setSelectedIndex(index);
        updateSelectionState(index);
      }
    },
    getSuggestions: () => [...suggestions],
    setHeaderText: (text) => {
      header.textContent = text;
    },
    setEmptyMessage: (text) => {
      emptyEl.textContent = text;
    },
    attachKeyboardNavigation,
    reset,
    destroy,
  });
}

function initSearchHandlers(elements, state, callbacks, actions) {
  const { container, input, clearBtn, form } = elements;
  const { hideSuggestions, handleClear } = actions;
  const cleanupRegistry = createCleanupRegistry();

  clearBtn.style.display = 'none';

  cleanupRegistry.addEventListener(input, 'keyup', () => {
    updateClearButtonVisibility(clearBtn, Boolean(input.value));
  }, { passive: true });

  cleanupRegistry.addEventListener(input, 'input', (event) => {
    state.query = event.target.value;
    callbacks.onInput?.({ value: state.query, event });
  });

  cleanupRegistry.addEventListener(input, 'keydown', (event) => {
    if ((event.key === 'Enter' || event.keyCode === 13) && !state.showSuggestions) {
      event.preventDefault();
      if (state.query.trim()) {
        callbacks.onSubmit?.({ query: state.query.trim() });
        hideSuggestions();
      }
    }
  });

  cleanupRegistry.addEventListener(document, 'click', (event) => {
    if (!container.contains(event.target)) {
      hideSuggestions();
    }
  }, { passive: true });

  cleanupRegistry.addEventListener(clearBtn, 'click', () => {
    handleClear();
    input.focus();
  }, { passive: true });

  cleanupRegistry.addEventListener(form, 'submit', (event) => {
    event.preventDefault();
    if (state.query.trim()) {
      callbacks.onSubmit?.({ query: state.query.trim() });
      hideSuggestions();
    }
  });

  return () => cleanupRegistry.cleanup();
}

export function createDeepLinkManager(config = {}) {
  const mergedConfig = { ...DEFAULT_DEEP_LINK_CONFIG, ...config };
  const {
    enabled,
    queryParam,
    updateOnSearch,
  } = mergedConfig;

  function getQueryFromUrl() {
    if (!enabled) return null;

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(queryParam);
  }

  function updateUrl(query, options = {}) {
    if (!enabled || !updateOnSearch) return;

    const { replace = true } = options;
    const url = new URL(window.location.href);

    if (query?.trim()) {
      url.searchParams.set(queryParam, query.trim());
    } else {
      url.searchParams.delete(queryParam);
    }

    const newUrl = url.toString();

    if (newUrl !== window.location.href) {
      if (replace) {
        window.history.replaceState({}, '', newUrl);
      } else {
        window.history.pushState({}, '', newUrl);
      }
    }
  }

  function clearUrl() {
    updateUrl('');
  }

  function onPopState(callback) {
    if (!enabled) return () => {};

    const handler = () => {
      const query = getQueryFromUrl();
      callback(query);
    };

    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }

  return {
    getQueryFromUrl,
    updateUrl,
    clearUrl,
    onPopState,
    isEnabled: () => enabled,
  };
}

export async function createExploreSearchBar(props = {}, callbacks = {}) {
  await loadSearchBarStyles();

  const {
    placeholder = DEFAULTS.PLACEHOLDER,
    enableSuggestions = true,
    enableStickyBehavior = false,
    suggestionsConfig = {},
    autocompleteConfig = {},
    enableAutocomplete = false,
  } = props;

  const suggestionsId = suggestionsConfig.id || DEFAULTS.SUGGESTIONS_ID;
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
  const {
    wrapper,
    form,
    input,
    clearBtn,
  } = createSearchBarWrapper(placeholder, suggestionsId);

  let suggestionsDropdown = null;
  let stickyBehavior = null;
  let cleanupSuggestions = () => {};
  let resetAutocomplete = () => {};
  let destroyAutocomplete = () => {};
  let visibility = createNoopVisibilityManager();

  const handleClear = () => {
    state.query = '';
    input.value = '';
    updateClearButtonVisibility(clearBtn, false);
    suggestionsDropdown?.reset();
    visibility.hide();
    resetAutocomplete();
    callbacks.onClear?.();
  };

  if (enableSuggestions) {
    const labelField = suggestionsConfig.itemConfig?.labelField || 'label';

    const handleSuggestionSelect = (suggestion) => {
      const labelValue = suggestion[labelField] || suggestion.label || '';
      updateQueryState(state, input, clearBtn, labelValue);
      visibility.hide();
      callbacks.onSuggestionSelect?.({ suggestion });
      callbacks.onSubmit?.({ query: labelValue, suggestion });
    };

    suggestionsDropdown = await createSuggestionsDropdown(
      {
        id: suggestionsId,
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

    const cleanupRegistry = createCleanupRegistry();
    cleanupRegistry.addEventListener(input, 'click', (event) => {
      event.stopPropagation();
      if (!suggestionsDropdown.isVisible() && state.query) {
        visibility.show();
      }
    }, { passive: true });
    cleanupSuggestions = () => cleanupRegistry.cleanup();
  } else {
    container.append(wrapper);
  }

  outerWrapper.append(sentinel, container);

  const cleanupHandlers = initSearchHandlers(
    { container, input, clearBtn, form },
    state,
    callbacks,
    { hideSuggestions: visibility.hide, handleClear },
  );

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
    resetAutocomplete = () => {
      autocomplete.clear();
    };
    destroyAutocomplete = () => {
      input.removeEventListener('input', autocomplete.inputHandler);
      autocomplete.clear();
    };
  }

  return {
    element: outerWrapper,

    setQuery(query) {
      updateQueryState(state, input, clearBtn, query);
    },

    setSuggestions(suggestions) {
      if (suggestionsDropdown) {
        suggestionsDropdown.setSuggestions(suggestions);
        if (suggestions.length > 0) {
          visibility.show();
        }
      }
    },

    clear() {
      handleClear();
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
      destroyAutocomplete();
      cleanupSuggestions();
      cleanupHandlers();
      stickyBehavior?.destroy();
      suggestionsDropdown?.destroy();
    },
  };
}

export const createSearchBar = createExploreSearchBar;
