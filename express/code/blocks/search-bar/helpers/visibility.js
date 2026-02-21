import { CSS_CLASSES, ARIA } from './constants.js';

// ==============================================
// Visibility Manager
// ==============================================

/**
 * Creates a visibility manager for the suggestions dropdown
 * @param {Object} dropdown - Suggestions dropdown instance
 * @param {HTMLInputElement} input - Search input element
 * @param {HTMLElement} container - Container element
 * @param {Object} state - Shared state object
 * @returns {{ show: Function, hide: Function }}
 */
export function createVisibilityManager(dropdown, input, container, state) {
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

/**
 * Creates a no-op visibility manager for when suggestions are disabled
 * @returns {{ show: Function, hide: Function }}
 */
export function createNoopVisibilityManager() {
  return {
    show() {},
    hide() {},
  };
}
