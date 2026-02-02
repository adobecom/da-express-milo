import { LitElement, html, nothing } from '../../../deps/lit.js';
import { style } from './styles.css.js';
import { createKeyboardNavigation } from '../../../utils/keyboardNavigation.js';

const DEFAULT_ICONS = {
  term: html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  tag: html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1148 12.2678 21.1666 12.005 21.1666C11.7422 21.1666 11.4819 21.1148 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V2H12L20.59 10.59C20.9625 10.9647 21.1716 11.4716 21.1716 12C21.1716 12.5284 20.9625 13.0353 20.59 13.41Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 7H7.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  hex: html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

class SuggestionsDropdown extends LitElement {
  static get styles() {
    return [style];
  }

  static get properties() {
    return {
      suggestions: { type: Array },
      headerText: { type: String, attribute: 'header-text' },
      isVisible: { type: Boolean, reflect: true },
      selectedIndex: { type: Number },
    };
  }

  constructor() {
    super();
    this.suggestions = [];
    this.headerText = 'Suggestions';
    this.isVisible = false;
    this.selectedIndex = -1;
    this.keyboardNav = null;
  }

  updated(changedProperties) {
    if (changedProperties.has('suggestions')) {
      if (this.suggestions.length === 0) {
        this.isVisible = false;
      }
      this.selectedIndex = -1;
      if (this.keyboardNav) {
        this.keyboardNav.reset();
      }
    }
  }

  handleSelect(suggestion, index) {
    this.dispatchEvent(new CustomEvent('select', {
      bubbles: true,
      composed: true,
      detail: { suggestion, index },
    }));
  }

  handleHover(suggestion, index) {
    this.selectedIndex = index;
    this.dispatchEvent(new CustomEvent('hover', {
      bubbles: true,
      composed: true,
      detail: { suggestion, index },
    }));
  }

  attachKeyboardNavigation(inputElement) {
    if (this.keyboardNav) {
      this.keyboardNav.detach();
    }

    // We need to wait for render to have the list element
    this.updateComplete.then(() => {
      const list = this.shadowRoot.querySelector('.suggestions-list');
      if (!list) return;

      this.keyboardNav = createKeyboardNavigation(list, {
        itemSelector: '.suggestion-item',
        selectedClass: 'is-selected',
        onSelect: (item, index) => {
          this.handleSelect(this.suggestions[index], index);
        },
        onNavigate: (item, index) => {
          this.selectedIndex = index;
          this.handleHover(this.suggestions[index], index);
        },
        onEscape: () => {
          this.isVisible = false;
          this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
        },
      });

      this.keyboardNav.attach(inputElement);
    });
  }

  render() {
    if (!this.isVisible || this.suggestions.length === 0) {
      return nothing;
    }

    return html`
      <div class="search-suggestions-dropdown" role="listbox">
        <div class="suggestions-header">${this.headerText}</div>
        <ul class="suggestions-list">
          ${this.suggestions.map((suggestion, index) => html`
            <li 
              class="suggestion-item ${index === this.selectedIndex ? 'is-selected' : ''}"
              role="option"
              aria-selected="${index === this.selectedIndex}"
              data-index="${index}"
              tabindex="0"
              @click="${() => this.handleSelect(suggestion, index)}"
              @mouseenter="${() => this.handleHover(suggestion, index)}"
            >
              <span class="suggestion-icon" aria-hidden="true">
                ${DEFAULT_ICONS[suggestion.type] || DEFAULT_ICONS.term}
              </span>
              <div class="suggestion-text">
                <span class="suggestion-label">${suggestion.label}</span>
                ${suggestion.typeLabel ? html`<span class="suggestion-type">${suggestion.typeLabel}</span>` : nothing}
              </div>
            </li>
          `)}
        </ul>
      </div>
    `;
  }
}

customElements.define('suggestions-dropdown', SuggestionsDropdown);
export default SuggestionsDropdown;
