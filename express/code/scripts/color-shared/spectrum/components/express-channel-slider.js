/**
 * Express Channel Slider — Custom range slider with gradient track
 *
 * Uses a native <input type="range"> with full CSS control in shadow DOM.
 * Renders a 24px-tall track with rounded ends, a dynamic gradient background,
 * and a circular 14px-diameter handle.
 *
 * Usage (in Lit templates):
 *   import '../../../../scripts/color-shared/spectrum/components/express-channel-slider.js';
 *
 *   html`<express-channel-slider
 *     .value=${50}
 *     min="0"
 *     max="100"
 *     label="Red"
 *     gradient="linear-gradient(to right, rgb(0,128,200), rgb(255,128,200))"
 *     @input=${handler}
 *   ></express-channel-slider>`
 */

import { LitElement, html, css } from '../../../../libs/deps/lit-all.min.js';

const TRACK_HEIGHT = 24;
const TRACK_RADIUS = TRACK_HEIGHT / 2;
const THUMB_SIZE = 14;

class ExpressChannelSlider extends LitElement {
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
    return css`
      :host {
        display: flex;
        align-items: center;
        width: 100%;
      }

      :host([disabled]) {
        opacity: 0.5;
        pointer-events: none;
      }

      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: ${TRACK_HEIGHT}px;
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        outline: none;
      }

      /* --- WebKit (Chrome, Safari, Edge) --- */

      input[type="range"]::-webkit-slider-runnable-track {
        height: ${TRACK_HEIGHT}px;
        border-radius: ${TRACK_RADIUS}px;
        background: var(--channel-gradient, #ccc);
      }

      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: ${THUMB_SIZE}px;
        height: ${THUMB_SIZE}px;
        border-radius: 50%;
        background: transparent;
        border: 2px solid rgba(31, 31, 31, 0.3);
        margin-top: ${(TRACK_HEIGHT - THUMB_SIZE) / 2}px;
        cursor: pointer;
      }

      /* --- Firefox --- */

      input[type="range"]::-moz-range-track {
        height: ${TRACK_HEIGHT}px;
        border-radius: ${TRACK_RADIUS}px;
        background: var(--channel-gradient, #ccc);
        border: none;
      }

      input[type="range"]::-moz-range-thumb {
        width: ${THUMB_SIZE}px;
        height: ${THUMB_SIZE}px;
        border-radius: 50%;
        background: transparent;
        border: 2px solid rgba(31, 31, 31, 0.3);
        cursor: pointer;
        appearance: none;
      }

      input[type="range"]::-moz-range-progress {
        background: transparent;
      }
    `;
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

customElements.define('express-channel-slider', ExpressChannelSlider);

export default ExpressChannelSlider;
