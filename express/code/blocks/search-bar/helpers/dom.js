import { createTag } from '../../../scripts/utils.js';
import { CSS_CLASSES } from './constants.js';
import { ICONS } from './icons.js';

// ==============================================
// DOM Creation Helpers
// ==============================================

/**
 * Creates the search bar wrapper with form, input, and buttons
 * @param {string} placeholder - Input placeholder text
 * @returns {{ wrapper: HTMLElement, form: HTMLElement, input: HTMLInputElement, clearBtn: HTMLButtonElement }}
 */
export function createSearchBarWrapper(placeholder) {
  const wrapper = createTag('div', { class: CSS_CLASSES.WRAPPER });
  const form = createTag('form', { class: CSS_CLASSES.FORM, role: 'search' });
  const inputWrapper = createTag('div', { class: CSS_CLASSES.INPUT_WRAPPER });

  const searchIcon = createTag('span', { class: CSS_CLASSES.SEARCH_ICON, 'aria-hidden': 'true' });
  searchIcon.innerHTML = ICONS.search;

  const input = createTag('input', {
    type: 'search',
    class: CSS_CLASSES.INPUT,
    placeholder,
    'aria-label': placeholder,
    'aria-autocomplete': 'list',
    'aria-controls': 'search-suggestions',
    'aria-expanded': 'false',
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

/**
 * Updates the visibility of the clear button
 * @param {HTMLButtonElement} btn - Clear button element
 * @param {boolean} hasValue - Whether input has a value
 */
export function updateClearButtonVisibility(btn, hasValue) {
  btn.style.display = hasValue ? 'inline-block' : 'none';
  btn.classList.toggle(CSS_CLASSES.HIDDEN, !hasValue);
}

/**
 * Creates sticky wrapper element for the search bar
 * @returns {HTMLElement} Sticky wrapper element
 */
export function createStickyWrapper() {
  return createTag('div', { class: 'search-bar-sticky-wrapper' });
}
