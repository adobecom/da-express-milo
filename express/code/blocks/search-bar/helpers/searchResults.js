import { createTag } from '../../../scripts/utils.js';
import { createKeyboardNavigation, attachItemNavigation } from '../../../libs/utils/keyboardNavigation.js';
import { loadComponentStyles } from '../../../libs/utils/loadComponentStyles.js';
import { SUGGESTION_ICONS } from './icons.js';
import { DEFAULT_ITEM_CONFIG, DEFAULT_SUGGESTIONS_CONFIG } from './constants.js';

// ==============================================
// Suggestions Dropdown Component
// ==============================================

let cssLoaded = false;

/**
 * @typedef {Object} Suggestion
 * @property {string} label - Display text for the suggestion
 * @property {string} type - Suggestion type (term, tag, hex, etc.)
 * @property {string} [typeLabel] - Human-readable type label
 * @property {*} [data] - Additional data associated with the suggestion
 */

/**
 * @typedef {Object} SuggestionsDropdownOptions
 * @property {string} [id='suggestions-dropdown'] - Unique ID for the dropdown
 * @property {string} [headerText='Suggestions'] - Header text
 * @property {Object} [icons] - Icon SVG strings keyed by suggestion type
 * @property {Object} [itemConfig] - Configuration for suggestion item rendering
 */

/**
 * @typedef {Object} SuggestionsDropdownCallbacks
 * @property {Function} [onSelect] - Called when a suggestion is selected
 * @property {Function} [onHover] - Called when a suggestion is hovered
 */

/**
 * Gets a nested value from an object using dot notation
 * @param {Object} obj - Source object
 * @param {string} path - Dot-notation path (e.g., 'data.title')
 * @returns {*} Value at path or undefined
 */
function getNestedValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

/**
 * Creates a suggestion item element with configurable structure
 * @param {Suggestion} suggestion - Suggestion data
 * @param {number} index - Item index
 * @param {Object} icons - Icon SVG strings
 * @param {Object} itemConfig - Item configuration
 * @param {SuggestionsDropdownCallbacks} callbacks - Event callbacks
 * @returns {HTMLElement}
 */
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

  // Add image/thumbnail if configured
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

  // Add icon if configured
  if (showIcon && !imageField) {
    const icon = createTag('span', { class: 'suggestion-icon', 'aria-hidden': 'true' });
    const iconKey = suggestion.type || iconType;
    icon.innerHTML = icons[iconKey] || icons.term || SUGGESTION_ICONS.term;
    item.appendChild(icon);
  }

  // Create text content wrapper
  const textWrapper = createTag('div', { class: 'suggestion-text' });

  // Primary label
  const labelText = getNestedValue(suggestion, labelField) || suggestion.label || '';
  const label = createTag('span', { class: 'suggestion-label' }, labelText);
  textWrapper.appendChild(label);

  // Subtext (if configured)
  if (subtextField) {
    const subtextValue = getNestedValue(suggestion, subtextField);
    if (subtextValue) {
      const subtext = createTag('span', { class: 'suggestion-subtext' }, subtextValue);
      textWrapper.appendChild(subtext);
    }
  }

  // Type label (if configured to show)
  if (showType && typeField) {
    const typeValue = getNestedValue(suggestion, typeField);
    if (typeValue) {
      const typeLabel = createTag('span', { class: 'suggestion-type' }, typeValue);
      textWrapper.appendChild(typeLabel);
    }
  }

  item.appendChild(textWrapper);

  // Event handlers
  item.addEventListener('click', () => {
    callbacks.onSelect?.(suggestion, index);
  }, { passive: true });

  item.addEventListener('mouseenter', () => {
    callbacks.onHover?.(suggestion, index);
  }, { passive: true });

  return item;
}

/**
 * Creates a suggestions dropdown component
 *
 * @param {SuggestionsDropdownOptions} [options] - Configuration options
 * @param {SuggestionsDropdownCallbacks} [callbacks] - Event callbacks
 * @returns {Promise<Object>} Public API
 */
export async function createSuggestionsDropdown(options = {}, callbacks = {}) {
  if (!cssLoaded) {
    await loadComponentStyles('../styles/suggestions.css', import.meta.url);
    cssLoaded = true;
  }

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

  /**
   * Updates the visual selection state
   * @param {number} selectedIndex - Current selected index
   */
  function updateSelectionState(selectedIndex) {
    const items = list.querySelectorAll('.suggestion-item');
    items.forEach((item, index) => {
      const isSelected = index === selectedIndex;
      item.classList.toggle('is-selected', isSelected);
      item.setAttribute('aria-selected', String(isSelected));
    });
  }

  /**
   * Shows the dropdown
   */
  function show() {
    if (suggestions.length === 0) return;
    isVisible = true;
    dropdown.classList.remove('hidden');
  }

  /**
   * Hides the dropdown
   */
  function hide() {
    isVisible = false;
    dropdown.classList.add('hidden');
    if (keyboardNav) {
      keyboardNav.reset();
    }
  }

  /**
   * Renders suggestions to the list
   * @param {Object} [renderOptions] - Optional render-time options
   * @param {boolean} [renderOptions.showEmpty=false] - Show empty message if no results
   */
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

    // Limit to maxItems
    const limitedSuggestions = maxItems ? suggestions.slice(0, maxItems) : suggestions;

    limitedSuggestions.forEach((suggestion, index) => {
      const item = createSuggestionItem(suggestion, index, icons, itemConfig, {
        onSelect: (sug, idx) => {
          callbacks.onSelect?.(sug, idx);
        },
        onHover: (sug, idx) => {
          if (keyboardNav) {
            keyboardNav.setSelectedIndex(idx);
          }
          callbacks.onHover?.(sug, idx);
        },
      });
      list.appendChild(item);
    });

    if (itemNavCleanup) {
      itemNavCleanup();
    }
    itemNavCleanup = attachItemNavigation(list, {
      itemSelector: '.suggestion-item',
      onSelect: (item, index) => {
        callbacks.onSelect?.(suggestions[index], index);
      },
    });

    show();
  }

  /**
   * Sets suggestions and renders them
   * @param {Suggestion[]} newSuggestions - Array of suggestions
   * @param {Object} [renderOptions] - Render options
   * @param {boolean} [renderOptions.showEmpty=false] - Show empty message
   */
  function setSuggestions(newSuggestions, renderOptions = {}) {
    suggestions = newSuggestions;
    if (keyboardNav) {
      keyboardNav.reset();
    }
    renderSuggestions(renderOptions);
  }

  /**
   * Attaches keyboard navigation to an input element
   * @param {HTMLElement} inputElement - Input element to attach to
   * @param {Object} [navOptions] - Additional navigation options
   */
  function attachKeyboardNavigation(inputElement, navOptions = {}) {
    if (keyboardNav) {
      keyboardNav.detach();
    }

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

  /**
   * Resets the dropdown state
   */
  function reset() {
    suggestions = [];
    list.innerHTML = '';
    hide();
  }

  /**
   * Cleans up event listeners and resources
   */
  function destroy() {
    if (keyboardNav) {
      keyboardNav.detach();
      keyboardNav = null;
    }
    if (itemNavCleanup) {
      itemNavCleanup();
      itemNavCleanup = null;
    }
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
