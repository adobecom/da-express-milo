import { LitElement, html } from '../../../deps/lit-all.min.js';
import { style } from './styles.css.js';

class ColorChannelSlider extends LitElement {
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static get properties() {
    return {
      value: { type: Number },
      min: { type: Number },
      max: { type: Number },
      label: { type: String },
      gradient: { type: String },
      disabled: { type: Boolean, reflect: true },
    };
  }

  static get styles() {
    return [style];
  }

  constructor() {
    super();
    this.value = 0;
    this.min = 0;
    this.max = 100;
    this.label = '';
    this.gradient = '';
    this.disabled = false;
  }

  _onInput(e) {
    this.value = Number(e.target.value);
    this.dispatchEvent(new CustomEvent('input', {
      detail: { value: this.value },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const gradientStyle = this.gradient
      ? `--channel-gradient: ${this.gradient}`
      : '';

    return html`
      <input
        type="range"
        min=${this.min}
        max=${this.max}
        .value=${String(this.value)}
        aria-label=${this.label}
        ?disabled=${this.disabled}
        style=${gradientStyle}
        @input=${this._onInput}
      />
    `;
  }
}

customElements.define('color-channel-slider', ColorChannelSlider);

export default ColorChannelSlider;
