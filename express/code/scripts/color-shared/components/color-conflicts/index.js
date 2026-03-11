import { LitElement, html } from '../../../../libs/deps/lit-all.min.js';
import { style } from './styles.css.js';
import { loadBadge, loadTooltip } from '../../spectrum/load-spectrum.js';

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
    loadTooltip();
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
        <sp-theme system="spectrum-two" color="light" scale="medium">
          <span class="cc-label-wrap" tabindex="0">
            <sp-tooltip self-managed placement="top">The conflicts between colors are shown with a caution symbol.</sp-tooltip>
            <span class="cc-label">${this.label}</span>
          </span>
          ${badge}
        </sp-theme>
      </div>
    `;
  }
}

customElements.define('color-conflicts', ColorConflicts);

export default ColorConflicts;
