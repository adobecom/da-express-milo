/* eslint-disable no-underscore-dangle, class-methods-use-this, import/prefer-default-export */
import { LitElement, html } from '../../../deps/lit-all.min.js';
import { style } from './styles.css.js';

const ICONS = {
  lockOpen: html`<svg class="icon" viewBox="0 0 18 18"><path d="M14.5,8H13V5A4,4,0,0,0,5,5V8H3.5a.5.5,0,0,0-.5.5v8a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5V8.5A.5.5,0,0,0,14.5,8ZM6.5,5a2.5,2.5,0,0,1,5,0V8H6.5Z"/></svg>`,
  lockClosed: html`<svg class="icon" viewBox="0 0 18 18"><path d="M14.5,8H13V5A4,4,0,0,0,5,5V8H3.5a.5.5,0,0,0-.5.5v8a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5V8.5A.5.5,0,0,0,14.5,8ZM9,13.5a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,9,13.5Zm2.5-5.5H6.5V5a2.5,2.5,0,0,1,5,0Z"/></svg>`,
  copy: html`<svg class="icon" viewBox="0 0 18 18"><path d="M13.5,2H4.5A1.5,1.5,0,0,0,3,3.5v9a.5.5,0,0,0,.5.5h1A.5.5,0,0,0,5,12.5V3.5a.5.5,0,0,1,.5-.5h8a.5.5,0,0,0,.5-.5V2.5A.5.5,0,0,0,13.5,2Z"/><path d="M14.5,5H7.5A1.5,1.5,0,0,0,6,6.5v9A1.5,1.5,0,0,0,7.5,17h7A1.5,1.5,0,0,0,16,15.5V6.5A1.5,1.5,0,0,0,14.5,5Zm-2,8.5H8.5a.5.5,0,0,1-.5-.5v-1a.5.5,0,0,1,.5-.5h4a.5.5,0,0,1,.5.5v1A.5.5,0,0,1,12.5,13.5Z"/></svg>`,
  /** Figma "Frame 20 x 20" – circle that opens color picker (node 6215-355725) */
  colorPicker: html`<svg class="icon icon--picker" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="9"/></svg>`,
};

export class ColorSwatchRail extends LitElement {
  static get properties() {
    return {
      controller: { attribute: false },
      orientation: { type: String, reflect: true },
    };
  }

  static get styles() {
    return [style];
  }

  constructor() {
    super();
    this.controller = null;
    this.orientation = 'vertical';
    this._controllerUnsubscribe = null;
    this.swatches = [];
    this.baseColorIndex = 0;
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
        this.swatches = state.swatches || [];
        this.baseColorIndex = state.baseColorIndex || 0;
        this.requestUpdate();
      });
    }
  }

  _handleCopy(hex) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hex);
      // In a real app, we'd show a toast here
    }
  }

  _handleLock() {
    // Placeholder for lock logic (needs controller support)
  }

  _handleColorPicker(index) {
    const hex = this.swatches[index]?.hex;
    const e = new CustomEvent('color-swatch-rail-edit', { bubbles: true, composed: true, detail: { index, hex } });
    if (this.dispatchEvent(e) && !e.defaultPrevented) {
      const input = this.shadowRoot?.querySelector(`#picker-${index}`);
      if (input) input.click();
    }
  }

  _onNativePickerChange(index, e) {
    const hex = e.target?.value;
    if (hex && this.controller?.setState) {
      const swatches = [...this.swatches];
      swatches[index] = { hex: hex.toUpperCase() };
      this.controller.setState({ swatches });
    }
  }

  render() {
    if (!this.swatches.length) return html``;

    return html`
      <div class="swatch-rail" data-orientation="${this.orientation || 'vertical'}">
        ${this.swatches.map((swatch, index) => {
    const isLocked = false;

    return html`
            <div class="swatch-column ${isLocked ? 'locked' : ''}" style="background-color: ${swatch.hex}">
              <div class="top-actions">
                <button class="icon-button" @click=${() => this._handleLock(index)} aria-label="Lock color">
                  ${isLocked ? ICONS.lockClosed : ICONS.lockOpen}
                </button>
              </div>
              <div class="bottom-info" part="bottom-info">
                <input type="color" id="picker-${index}" class="picker-native" value=${swatch.hex} @input=${(ev) => this._onNativePickerChange(index, ev)} />
                <span class="hex-code" @click=${() => this._handleCopy(swatch.hex)}>${swatch.hex}</span>
                <div class="bottom-info__actions">
                  <button type="button" class="icon-button icon-button--picker" @click=${() => this._handleColorPicker(index)} aria-label="Open color picker">
                    ${ICONS.colorPicker}
                  </button>
                  <button class="icon-button" @click=${() => this._handleCopy(swatch.hex)} aria-label="Copy Hex">
                    ${ICONS.copy}
                  </button>
                </div>
              </div>
            </div>
          `;
  })}
      </div>
    `;
  }
}

customElements.define('color-swatch-rail', ColorSwatchRail);
