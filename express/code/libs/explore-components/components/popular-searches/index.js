import { LitElement, html } from '../../../deps/lit.js';
import { style } from './styles.css.js';

class PopularSearches extends LitElement {
  static get styles() {
    return [style];
  }

  static get properties() {
    return {
      items: { type: Array },
    };
  }

  constructor() {
    super();
    this.items = [];
  }

  handleTagClick(item, index, e) {
    e.preventDefault();
    this.trackTagImpression(item.label, index);
    this.dispatchEvent(new CustomEvent('tag-select', {
      bubbles: true,
      composed: true,
      detail: { label: item.label, url: item.url, index },
    }));
  }

  async trackTagImpression(label, index) {
    try {
      this.dispatchEvent(new CustomEvent('tag-impression', {
        bubbles: true,
        composed: true,
        detail: { label, index },
      }));
    } catch (err) {
      // ignore
    }
  }

  render() {
    return html`
      <div class="explore-popular-searches">
        <div class="tags-container" role="list">
          ${this.items.map((item, index) => html`
            <a 
              class="search-tag" 
              href="${item.url}" 
              role="listitem"
              aria-label="Search for ${item.label} color palettes"
              @click="${(e) => this.handleTagClick(item, index, e)}"
            >
              ${item.label}
            </a>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('popular-searches', PopularSearches);
export default PopularSearches;
