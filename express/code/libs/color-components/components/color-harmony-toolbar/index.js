
import { LitElement, html } from '../../../deps/lit-all.min.js';
import { style } from './styles.css.js';

// Restoring correct inline SVGs for harmony rules
const ICONS = {
  ANALOGOUS: html`<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="12" cy="4" r="2" fill="currentColor"/><circle cx="19" cy="8" r="2" fill="currentColor"/><circle cx="5" cy="8" r="2" fill="currentColor"/></svg>`,
  MONOCHROMATIC: html`<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="12" y1="12" x2="12" y2="3" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="3" r="2" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg>`,
  TRIAD: html`<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/><polygon points="12,4 19,16 5,16" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="12" cy="4" r="2" fill="currentColor"/><circle cx="19" cy="16" r="2" fill="currentColor"/><circle cx="5" cy="16" r="2" fill="currentColor"/></svg>`,
  COMPLEMENTARY: html`<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="3" r="2" fill="currentColor"/><circle cx="12" cy="21" r="2" fill="currentColor"/></svg>`,
  SQUARE: html`<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="6" y="6" width="12" height="12" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="6" cy="6" r="2" fill="currentColor"/><circle cx="18" cy="6" r="2" fill="currentColor"/><circle cx="18" cy="18" r="2" fill="currentColor"/><circle cx="6" cy="18" r="2" fill="currentColor"/></svg>`,
  COMPOUND: html`<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M12 3 L5 16 L19 16 Z" stroke="currentColor" fill="none"/><circle cx="12" cy="3" r="2" fill="currentColor"/></svg>`, // simplified
  SHADES: html`<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="12" cy="3" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`,
  SPLIT_COMPLEMENTARY: html`<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="12" y1="12" x2="12" y2="3" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="3" r="2" fill="currentColor"/><circle cx="5" cy="18" r="2" fill="currentColor"/><circle cx="19" cy="18" r="2" fill="currentColor"/></svg>`,
  DOUBLE_SPLIT_COMPLEMENTARY: html`<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="8" y="4" width="8" height="16" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="8" cy="4" r="2" fill="currentColor"/><circle cx="16" cy="4" r="2" fill="currentColor"/><circle cx="8" cy="20" r="2" fill="currentColor"/><circle cx="16" cy="20" r="2" fill="currentColor"/></svg>`,
  CUSTOM: html`<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="12" cy="3" r="2" fill="currentColor" opacity="0.5"/><circle cx="19" cy="12" r="2" fill="currentColor" opacity="0.5"/><circle cx="5" cy="16" r="2" fill="currentColor" opacity="0.5"/></svg>`,
};

export class ColorHarmonyToolbar extends LitElement {
  static get properties() {
    return {
      controller: { attribute: false },
    };
  }

  static get styles() {
    return [style];
  }

  constructor() {
    super();
    this.controller = null;
    this._controllerUnsubscribe = null;
    this.harmonyRule = 'ANALOGOUS';
  }

  connectedCallback() {
    super.connectedCallback();
    this.attachController();
  }

  disconnectedCallback() {
    if (this._controllerUnsubscribe) {
      this._controllerUnsubscribe();
      this._controllerUnsubscribe = null;
    }
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has('controller')) {
      this.attachController();
    }
  }

  attachController() {
    if (this._controllerUnsubscribe) {
      this._controllerUnsubscribe();
      this._controllerUnsubscribe = null;
    }

    if (this.controller && typeof this.controller.subscribe === 'function') {
      this._controllerUnsubscribe = this.controller.subscribe((state) => {
        this.harmonyRule = state.harmonyRule || 'ANALOGOUS';
        this.requestUpdate();
      });
    }
  }

  _setRule(rule) {
    if (this.controller) {
      this.controller.setHarmonyRule(rule);
    }
  }

  render() {
    const rules = Object.keys(ICONS);

    return html`
      <div class="harmony-toolbar">
        <span class="label">Color harmonies: ${this.harmonyRule.charAt(0) + this.harmonyRule.slice(1).toLowerCase()}</span>
        <div class="harmony-options">
          ${rules.map((rule) => html`
            <button 
              class="harmony-btn ${this.harmonyRule === rule ? 'active' : ''}" 
              @click=${() => this._setRule(rule)}
              title=${rule.charAt(0) + rule.slice(1).toLowerCase()}
            >
              ${ICONS[rule]}
            </button>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('color-harmony-toolbar', ColorHarmonyToolbar);
