import { LitElement, html } from '../../../deps/lit.js';
import { style } from './styles.css.js';

class ExploreHeader extends LitElement {
  static get styles() {
    return [style];
  }

  static get properties() {
    return {
      headline: { type: String },
      subcopy: { type: String },
    };
  }

  constructor() {
    super();
    this.headline = 'Explore color palettes.';
    this.subcopy = 'Discover endless inspiration for your next project with our color palettes.';
  }

  render() {
    return html`
      <div class="explore-hero-header">
        <h1 class="headline">${this.headline}</h1>
        <p class="subcopy">${this.subcopy}</p>
      </div>
    `;
  }
}

customElements.define('explore-header', ExploreHeader);
export default ExploreHeader;
