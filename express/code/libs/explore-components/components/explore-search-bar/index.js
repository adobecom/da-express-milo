import { LitElement, html, nothing } from '../../../deps/lit.js';
import { style } from './styles.css.js';
import '../suggestions-dropdown/index.js';

const ICONS = {
  search: html`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  clear: html`<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

class ExploreSearchBar extends LitElement {
  static get styles() {
    return [style];
  }

  static get properties() {
    return {
      placeholder: { type: String },
      query: { type: String },
      suggestions: { type: Array },
      isFetching: { type: Boolean, reflect: true },
    };
  }

  constructor() {
    super();
    this.placeholder = 'Search color palettes...';
    this.query = '';
    this.suggestions = [];
    this.isFetching = false;
  }

  handleInput(e) {
    this.query = e.target.value;
    this.dispatchEvent(new CustomEvent('input', {
      bubbles: true,
      composed: true,
      detail: { value: this.query },
    }));
  }

  handleSubmit(e) {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('submit', {
      bubbles: true,
      composed: true,
      detail: { query: this.query },
    }));
    this.closeSuggestions();
  }

  handleClear() {
    this.query = '';
    this.suggestions = [];
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('clear', {
      bubbles: true,
      composed: true,
    }));
    this.closeSuggestions();
  }

  handleSuggestionSelect(e) {
    const { suggestion } = e.detail;
    this.query = suggestion.label;
    this.dispatchEvent(new CustomEvent('submit', {
      bubbles: true,
      composed: true,
      detail: { query: this.query, suggestion },
    }));
    this.closeSuggestions();
  }

  closeSuggestions() {
    const dropdown = this.shadowRoot.querySelector('suggestions-dropdown');
    if (dropdown) {
      dropdown.isVisible = false;
    }
  }

  openSuggestions() {
    if (this.suggestions.length > 0) {
      const dropdown = this.shadowRoot.querySelector('suggestions-dropdown');
      if (dropdown) {
        dropdown.isVisible = true;
        dropdown.attachKeyboardNavigation(this.shadowRoot.querySelector('input'));
      }
    }
  }

  focus() {
    const input = this.shadowRoot.querySelector('input');
    if (input) input.focus();
  }

  render() {
    return html`
      <div class="explore-search-outer">
        <div class="explore-search-container ${this.isFetching ? 'is-fetching' : ''}">
          <div class="explore-search-wrapper">
            <form class="explore-search-form" @submit="${this.handleSubmit}">
              <div class="search-input-wrapper">
                <span class="search-icon" aria-hidden="true">${ICONS.search}</span>
                <input
                  type="search"
                  class="explore-search-input"
                  placeholder="${this.placeholder}"
                  .value="${this.query}"
                  @input="${this.handleInput}"
                  @click="${this.openSuggestions}"
                  aria-label="${this.placeholder}"
                  autocomplete="off"
                />
                <button
                  type="button"
                  class="search-clear-btn ${this.query ? '' : 'hidden'}"
                  aria-label="Clear search"
                  @click="${this.handleClear}"
                >
                  ${ICONS.clear}
                </button>
              </div>
            </form>
          </div>
          <suggestions-dropdown
            .suggestions="${this.suggestions}"
            .isVisible="${this.suggestions.length > 0}"
            @select="${this.handleSuggestionSelect}"
            @close="${this.closeSuggestions}"
          ></suggestions-dropdown>
        </div>
      </div>
    `;
  }
}

customElements.define('explore-search-bar', ExploreSearchBar);
export default ExploreSearchBar;
