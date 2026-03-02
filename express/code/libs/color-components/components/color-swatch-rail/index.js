/* eslint-disable no-underscore-dangle, class-methods-use-this, import/prefer-default-export */
import { LitElement, html } from '../../../deps/lit-all.min.js';
import { getContrastTextColor } from '../../utils/ColorConversions.js';
import { style } from './styles.css.js';

/** Default features: copy + colorPicker, no lock. Pass swatchFeatures to override. */
const DEFAULT_FEATURES = { copy: true, colorPicker: true, lock: false, hexCode: true };

function normalizeFeatures(features) {
  if (!features) return DEFAULT_FEATURES;
  if (Array.isArray(features)) {
    const set = new Set(features);
    return {
      copy: set.has('copy'),
      colorPicker: set.has('colorPicker'),
      lock: set.has('lock'),
      hexCode: set.has('hexCode') !== false,
    };
  }
  return { ...DEFAULT_FEATURES, ...features };
}

/** S2_Icon_Copy_20_N from Figma [6567-192257](https://www.figma.com/design/mcJuQTxJdWsL0dMmqaecpn/Final-Color-Expansion-CCEX-221263?node-id=6567-192257) — Spectrum Web Components icons-s2/Copy */
const S2_COPY_ICON = html`<svg class="icon icon--copy" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m11.75,18h-7.5c-1.24023,0-2.25-1.00977-2.25-2.25v-7.5c0-1.24023,1.00977-2.25,2.25-2.25.41406,0,.75.33594.75.75s-.33594.75-.75.75c-.41309,0-.75.33691-.75.75v7.5c0,.41309.33691.75.75.75h7.5c.41309,0,.75-.33691.75-.75,0-.41406.33594-.75.75-.75s.75.33594.75.75c0,1.24023-1.00977,2.25-2.25,2.25Z"/><path d="m6.75,5c-.41406,0-.75-.33594-.75-.75,0-1.24023,1.00977-2.25,2.25-2.25.41406,0,.75.33594.75.75s-.33594.75-.75.75c-.41309,0-.75.33691-.75.75,0,.41406-.33594.75-.75.75Z"/><path d="m13,3.5h-2c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h2c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z"/><path d="m13,14h-2c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h2c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z"/><path d="m15.75,14c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75c.41309,0,.75-.33691.75-.75,0-.41406.33594-.75.75-.75s.75.33594.75.75c0,1.24023-1.00977,2.25-2.25,2.25Z"/><path d="m17.25,5c-.41406,0-.75-.33594-.75-.75,0-.41309-.33691-.75-.75-.75-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75c1.24023,0,2.25,1.00977,2.25,2.25,0,.41406-.33594.75-.75.75Z"/><path d="m17.25,9.75c-.41406,0-.75-.33594-.75-.75v-2c0-.41406.33594-.75.75-.75s.75.33594.75.75v2c0,.41406-.33594.75-.75.75Z"/><path d="m6.75,9.75c-.41406,0-.75-.33594-.75-.75v-2c0-.41406.33594-.75.75-.75s.75.33594.75.75v2c0,.41406-.33594.75-.75.75Z"/><path d="m8.25,14c-1.24023,0-2.25-1.00977-2.25-2.25,0-.41406.33594-.75.75-.75s.75.33594.75.75c0,.41309.33691.75.75.75.41406,0,.75.33594.75.75s-.33594.75-.75.75Z"/></svg>`;

const ICONS = {
  lockOpen: html`<svg class="icon" viewBox="0 0 18 18"><path d="M14.5,8H13V5A4,4,0,0,0,5,5V8H3.5a.5.5,0,0,0-.5.5v8a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5V8.5A.5.5,0,0,0,14.5,8ZM6.5,5a2.5,2.5,0,0,1,5,0V8H6.5Z"/></svg>`,
  lockClosed: html`<svg class="icon" viewBox="0 0 18 18"><path d="M14.5,8H13V5A4,4,0,0,0,5,5V8H3.5a.5.5,0,0,0-.5.5v8a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5V8.5A.5.5,0,0,0,14.5,8ZM9,13.5a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,9,13.5Zm2.5-5.5H6.5V5a2.5,2.5,0,0,1,5,0Z"/></svg>`,
  copy: S2_COPY_ICON,
  /** Figma "Frame 20 x 20" – circle that opens color picker (node 6215-355725). Filled for visibility. */
  colorPicker: html`<svg class="icon icon--picker" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
};

export class ColorSwatchRail extends LitElement {
  static get properties() {
    return {
      controller: { attribute: false },
      orientation: { type: String, reflect: true },
      /** Config for which features/icons to render. Object: { copy, colorPicker, lock, hexCode } or array: ['copy','colorPicker'] */
      swatchFeatures: { attribute: false },
    };
  }

  static get styles() {
    return [style];
  }

  constructor() {
    super();
    this.controller = null;
    this.orientation = 'vertical';
    this.swatchFeatures = null;
    this._controllerUnsubscribe = null;
    this.swatches = [];
    this.baseColorIndex = 0;
  }

  get _features() {
    return normalizeFeatures(this.swatchFeatures);
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

    const orientation = this.orientation || 'vertical';
    const f = this._features;
    return html`
      <div class="swatch-rail" data-orientation="${orientation}">
        ${this.swatches.map((swatch, index) => {
          const isLocked = false;
          const textColor = getContrastTextColor(swatch.hex);
          const shadow = textColor === '#ffffff' ? '0 0 2px rgba(0,0,0,0.5)' : '0 0 2px rgba(255,255,255,0.5)';
          return html`
            <div class="swatch-column ${isLocked ? 'locked' : ''}" style="background-color: ${swatch.hex}; --swatch-text-color: ${textColor}; --swatch-text-shadow: ${shadow}">
              ${f.lock ? html`
                <div class="top-actions">
                  <button class="icon-button" @click=${() => this._handleLock(index)} aria-label="Lock color">
                    ${isLocked ? ICONS.lockClosed : ICONS.lockOpen}
                  </button>
                </div>
              ` : ''}
              <div class="bottom-info" part="bottom-info">
                ${f.colorPicker ? html`<input type="color" id="picker-${index}" class="picker-native" value=${swatch.hex} @input=${(ev) => this._onNativePickerChange(index, ev)} />` : ''}
                ${f.hexCode ? html`<span class="hex-code" @click=${f.copy ? () => this._handleCopy(swatch.hex) : null} style=${f.copy ? '' : 'cursor: default;'}">${swatch.hex}</span>` : ''}
                <div class="bottom-info__actions">
                  ${f.colorPicker ? html`
                    <button type="button" class="icon-button icon-button--picker" @click=${() => this._handleColorPicker(index)} aria-label="Open color picker">
                      ${ICONS.colorPicker}
                    </button>
                  ` : ''}
                  ${f.copy ? html`
                    <button type="button" class="icon-button icon-button--copy" @click=${() => this._handleCopy(swatch.hex)} aria-label="Copy Hex">
                      ${ICONS.copy}
                    </button>
                  ` : ''}
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
