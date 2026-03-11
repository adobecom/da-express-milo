import { LitElement, html } from '../../../../libs/deps/lit-all.min.js';
import { style } from './styles.css.js';
import { loadBadge } from '../../spectrum/load-spectrum.js';

class ColorConflicts extends LitElement {
  static get styles() {
    return [style];
  }

  static get properties() {
    return {
      conflictsFound: { type: Boolean, attribute: 'conflicts-found' },
      label: { type: String },
      mobile: { type: Boolean, reflect: true },
    };
  }

  constructor() {
    super();
    this.conflictsFound = false;
    this.label = 'Potential color blind conflicts';
    this.mobile = false;
  }

  connectedCallback() {
    super.connectedCallback();
    loadBadge();
  }

  render() {
    const badge = this.conflictsFound
      ? html`
        <sp-badge variant="negative" size="s">
          <sp-icon-alert-triangle slot="icon"></sp-icon-alert-triangle>
          Conflicts found
        </sp-badge>`
      : html`
        <sp-badge variant="positive" size="s">
          <sp-icon-checkmark-circle slot="icon"></sp-icon-checkmark-circle>
          None
        </sp-badge>`;

    return html`
      <div class="cc-container">
        <span class="cc-label">${this.label}</span>
        <sp-theme system="spectrum-two" color="light" scale="medium">
          ${badge}
        </sp-theme>
      </div>
    `;
  }
}

customElements.define('color-conflicts', ColorConflicts);

export default ColorConflicts;
