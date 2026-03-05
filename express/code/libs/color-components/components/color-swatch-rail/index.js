
import { LitElement, html } from '../../../deps/lit-all.min.js';
import { style } from './styles.css.js';

const ICONS = {
  copy: html`<svg class="icon" viewBox="0 0 20 20"><path d="M15,3H5.5A1.5,1.5,0,0,0,4,4.5V15a.5.5,0,0,0,.5.5H5a.5.5,0,0,0,.5-.5V4.5A.5.5,0,0,1,6,4h9a.5.5,0,0,0,.5-.5V3.5A.5.5,0,0,0,15,3Z"/><path d="M16,6H8.5A1.5,1.5,0,0,0,7,7.5v9A1.5,1.5,0,0,0,8.5,18h7.5A1.5,1.5,0,0,0,17.5,16.5v-9A1.5,1.5,0,0,0,16,6Z"/></svg>`,
  check: html`<svg class="icon" viewBox="0 0 20 20"><path d="M8.5,15.5,3.5,10.5,5,9l3.5,3.5L16,5l1.5,1.5Z"/></svg>`,
  trash: html`<svg class="icon" viewBox="0 0 20 20"><path d="M15.75,5H13V3.5A1.5,1.5,0,0,0,11.5,2h-3A1.5,1.5,0,0,0,7,3.5V5H4.25a.25.25,0,0,0-.25.25v.5A.25.25,0,0,0,4.25,6H5V16.5A1.5,1.5,0,0,0,6.5,18h7A1.5,1.5,0,0,0,15,16.5V6h.75A.25.25,0,0,0,16,5.75v-.5A.25.25,0,0,0,15.75,5ZM8.5,3.5a.5.5,0,0,1,.5-.5h2a.5.5,0,0,1,.5.5V5h-3ZM13.5,16.5a.5.5,0,0,1-.5.5h-6a.5.5,0,0,1-.5-.5V6h7Z"/></svg>`,
};

const COPY_TOAST_MS = 1500;
const HEX_PATTERN = /^#?[0-9A-Fa-f]{6}$/;
const LUMINANCE_THRESHOLD = 150;

function hexToLuminance(hex) {
  const clean = (hex || '').replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return r * 0.299 + g * 0.587 + b * 0.114;
}

export class ColorSwatchRail extends LitElement {
  static get properties() {
    return {
      controller: { attribute: false },
      onSwatchSelect: { attribute: false },
      onSwatchDelete: { attribute: false },
    };
  }

  static get styles() {
    return [style];
  }

  constructor() {
    super();
    this.controller = null;
    this.onSwatchSelect = null;
    this.onSwatchDelete = null;
    this._controllerUnsubscribe = null;
    this.swatches = [];
    this.baseColorIndex = 0;
    this._editingIndex = -1;
    this._copiedIndex = -1;
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
        this.baseColorIndex = state.baseColorIndex ?? 0;
        this.requestUpdate();
      });
    }
  }

  _handleSelect(index) {
    if (this.controller) {
      this.controller.setBaseColorIndex(index);
    }
    if (typeof this.onSwatchSelect === 'function') {
      this.onSwatchSelect(index);
    }
  }

  _handleCopy(hex, index) {
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard.writeText(hex).then(() => {
      this._copiedIndex = index;
      this.requestUpdate();
      setTimeout(() => {
        this._copiedIndex = -1;
        this.requestUpdate();
      }, COPY_TOAST_MS);
    }).catch(() => {});
  }

  _handleDelete(index) {
    if (typeof this.onSwatchDelete === 'function') {
      this.onSwatchDelete(index);
    }
  }

  _startEdit(index) {
    this._editingIndex = index;
    this.requestUpdate();
    this.updateComplete.then(() => {
      const input = this.shadowRoot?.querySelector('.hex-input');
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  _commitEdit(index, value) {
    this._editingIndex = -1;
    const cleaned = value.trim();
    if (HEX_PATTERN.test(cleaned) && this.controller) {
      const hex = cleaned.startsWith('#') ? cleaned.toUpperCase() : `#${cleaned}`.toUpperCase();
      this.controller.setSwatchHex(index, hex);
    }
    this.requestUpdate();
  }

  _handleEditKeydown(e, index) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._commitEdit(index, e.target.value);
    } else if (e.key === 'Escape') {
      this._editingIndex = -1;
      this.requestUpdate();
    }
  }

  render() {
    if (!this.swatches.length) return html``;

    return html`
      <div class="swatch-rail">
        ${this.swatches.map((swatch, index) => {
    const isBase = index === this.baseColorIndex;
    const isEditing = this._editingIndex === index;
    const isCopied = this._copiedIndex === index;
    const isDark = hexToLuminance(swatch.hex) < LUMINANCE_THRESHOLD;
    const textColor = isDark ? '#fff' : '#131313';

    return html`
            <div
              class="swatch-row ${isBase ? 'is-active' : ''} ${isDark ? 'is-dark' : ''}"
              style="background-color: ${swatch.hex}; color: ${textColor}"
              @click=${() => this._handleSelect(index)}
              role="button"
              tabindex="0"
              aria-label="Color ${index + 1}: ${swatch.hex}"
              aria-pressed=${isBase ? 'true' : 'false'}
              @keydown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._handleSelect(index); } }}
            >
              <div class="row-left" @click=${(e) => e.stopPropagation()}>
                ${isEditing
      ? html`<input
                      class="hex-input"
                      type="text"
                      .value=${swatch.hex}
                      maxlength="7"
                      style="color: ${textColor}"
                      @blur=${(e) => this._commitEdit(index, e.target.value)}
                      @keydown=${(e) => this._handleEditKeydown(e, index)}
                      aria-label="Edit hex value"
                    />`
      : html`<span
                      class="hex-code"
                      style="color: ${textColor}"
                      @click=${() => this._startEdit(index)}
                      title="Click to edit"
                    >${swatch.hex}</span>`
    }
              </div>
              <div class="row-right" @click=${(e) => e.stopPropagation()} style="color: ${textColor}">
                <button
                  class="icon-button copy-btn ${isCopied ? 'is-copied' : ''}"
                  @click=${() => this._handleCopy(swatch.hex, index)}
                  aria-label="${isCopied ? 'Copied!' : 'Copy hex'}"
                  title="${isCopied ? 'Copied!' : 'Copy hex'}"
                >
                  ${isCopied ? ICONS.check : ICONS.copy}
                </button>
                <button
                  class="icon-button delete-btn"
                  @click=${() => this._handleDelete(index)}
                  aria-label="Remove color"
                  title="Remove color"
                >
                  ${ICONS.trash}
                </button>
                ${isCopied ? html`<span class="copy-toast">Copied!</span>` : ''}
              </div>
            </div>
          `;
  })}
      </div>
    `;
  }
}

customElements.define('color-swatch-rail', ColorSwatchRail);
