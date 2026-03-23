import { CSS_CLASSES, ARIA } from './constants.js';

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

export function createNoopVisibilityManager() {
  return {
    show() {},
    hide() {},
  };
}
