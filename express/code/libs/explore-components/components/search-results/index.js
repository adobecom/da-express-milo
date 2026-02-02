import { LitElement, html, nothing } from '../../../deps/lit.js';
import { style } from './styles.css.js';

class SearchResults extends LitElement {
  static get styles() {
    return [style];
  }

  static get properties() {
    return {
      query: { type: String },
      count: { type: Number },
      hasError: { type: Boolean, attribute: 'has-error' },
      visible: { type: Boolean, reflect: true },
    };
  }

  constructor() {
    super();
    this.query = '';
    this.count = 0;
    this.hasError = false;
    this.visible = false;
  }

  render() {
    const hasNoResults = this.count === 0 && this.query;
    
    if (!this.visible || !hasNoResults) {
      return nothing;
    }

    return html`
      <div class="explore-search-results">
        <h2 class="results-title">'<span class="query-text">${this.query}</span>' color palettes</h2>
        <p class="results-message">
          <strong>Sorry, no color palettes found for "${this.query}".</strong> See other palettes you might like...
        </p>
      </div>
    `;
  }
}

customElements.define('search-results', SearchResults);
export default SearchResults;
