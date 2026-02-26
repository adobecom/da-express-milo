import { LitElement, html, nothing } from '../../../deps/lit-all.min.js';
import { style } from './styles.css.js';
import {
  hexToRGB,
  rgbToHSB,
  hsbToRGB,
  hsbToHEX,
  hsbToHSL,
} from '../../utils/ColorConversions.js';
import { loadMenu, loadButton, loadColorArea, loadColorSlider } from '../../../../scripts/color-shared/spectrum/load-spectrum.js';

const COLOR_MODES = ['HEX', 'RGB', 'HSB', 'Lab'];

class BaseColor extends LitElement {
  static get styles() {
    return [style];
  }

  static get properties() {
    return {
      color: { type: String },
      colorMode: { type: String, attribute: 'color-mode' },
      showHeader: { type: Boolean, attribute: 'show-header' },
      mobile: { type: Boolean, reflect: true },
      open: { type: Boolean, reflect: true },
      _hue: { type: Number, state: true },
      _saturation: { type: Number, state: true },
      _brightness: { type: Number, state: true },
      _modeMenuOpen: { type: Boolean, state: true },
    };
  }

  constructor() {
    super();
    this.color = '#FF0000';
    this.colorMode = 'HEX';
    this.showHeader = true;
    this.mobile = false;
    this.open = false;
    this._hue = 0;
    this._saturation = 100;
    this._brightness = 100;
    this._modeMenuOpen = false;
  }

  get _rgb() {
    return hsbToRGB(this._hue / 360, this._saturation / 100, this._brightness / 100);
  }

  get _hex() {
    return hsbToHEX(this._hue / 360, this._saturation / 100, this._brightness / 100);
  }

  get _hsb() {
    return {
      h: Math.round(this._hue),
      s: Math.round(this._saturation),
      b: Math.round(this._brightness),
    };
  }

  get _hsl() {
    return hsbToHSL(this._hue, this._saturation, this._brightness);
  }

  get _lab() {
    // Convert RGB to Lab color space
    const rgb = this._rgb;
    // Simplified Lab conversion (would need proper XYZ conversion in production)
    return {
      l: Math.round((rgb.red * 0.299 + rgb.green * 0.587 + rgb.blue * 0.114) / 255 * 100),
      a: Math.round((rgb.red - rgb.green) / 2),
      b: Math.round((rgb.blue - rgb.green) / 2),
    };
  }

  get _colorValue() {
    switch (this.colorMode) {
      case 'RGB':
        const rgb = this._rgb;
        return `${rgb.red}, ${rgb.green}, ${rgb.blue}`;
      case 'HSB':
        const hsb = this._hsb;
        return `${hsb.h}°, ${hsb.s}%, ${hsb.b}%`;
      case 'Lab':
        const lab = this._lab;
        return `${lab.l}, ${lab.a}, ${lab.b}`;
      case 'HEX':
      default:
        return this._hex;
    }
  }

  static loadColorTokens() {
    const id = 'color-tokens-css';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = '/express/code/scripts/color-shared/color-tokens.css';
    document.head.appendChild(link);
  }

  connectedCallback() {
    super.connectedCallback();
    BaseColor.loadColorTokens();
    loadButton();
    loadMenu();
    loadColorArea();
    loadColorSlider();
    this._syncFromColor();
    this._closeMenuOnOutsideClick = (e) => {
      if (this._modeMenuOpen && !e.composedPath().includes(this.shadowRoot.querySelector('.bc-mode-wrap'))) {
        this._modeMenuOpen = false;
      }
    };
    document.addEventListener('click', this._closeMenuOnOutsideClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._closeMenuOnOutsideClick);
    super.disconnectedCallback();
  }

  updated(changed) {
    if (changed.has('color')) {
      this._syncFromColor();
    }
  }

  _syncFromColor() {
    if (!this.color) return;
    const rgb = hexToRGB(this.color);
    if (!rgb) return;
    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
  }

  _emitColorChange() {
    const rgb = this._rgb;
    this.dispatchEvent(new CustomEvent('color-change', {
      bubbles: true,
      composed: true,
      detail: {
        hex: this._hex,
        rgb,
        hsb: this._hsb,
        hsl: this._hsl,
        lab: this._lab,
        hue: this._hue,
        saturation: this._saturation,
        brightness: this._brightness,
      },
    }));
  }

  _onModeSelect(mode) {
    this.colorMode = mode;
    this._modeMenuOpen = false;
    this.dispatchEvent(new CustomEvent('mode-change', {
      bubbles: true,
      composed: true,
      detail: { mode },
    }));
  }

  _onModeMenuChange(e) {
    const mode = e.target?.value;
    if (mode && COLOR_MODES.includes(mode)) {
      this._onModeSelect(mode);
    }
  }

  _toggleModeMenu() {
    this._modeMenuOpen = !this._modeMenuOpen;
  }

  _onColorValueInput(e) {
    const value = e.target.value.trim();
    // Parse the input based on current color mode - only HEX mode shows the input
    if (this.colorMode === 'HEX') {
      // Match 6-digit hex with or without #
      if (value.match(/^#?[0-9A-Fa-f]{6}$/)) {
        const newColor = value.startsWith('#') ? value : `#${value}`;
        this.color = newColor;
        this._syncFromColor();
        this._emitColorChange();
      }
    }
  }

  // --- Bottom sheet ---

  show() {
    this.open = true;
  }

  hide() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('panel-close', { bubbles: true, composed: true }));
  }

  _onOverlayClick(e) {
    if (e.target === e.currentTarget) this.hide();
  }

  // --- Color area (Saturation/Brightness) ---

  _onColorAreaInput(e) {
    const color = e.target.color;
    if (!color) return;

    // sp-color-area returns color in hex format
    const rgb = hexToRGB(color);
    if (!rgb) return;

    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
    this._emitColorChange();
  }

  // --- Hue slider ---

  _onHueInput(e) {
    const color = e.target.color;
    if (!color) return;

    // sp-color-slider returns color in hex format
    const rgb = hexToRGB(color);
    if (!rgb) return;

    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
    this._emitColorChange();
  }

  // --- Templates ---

  _renderHeader() {
    if (!this.showHeader) return nothing;

    return html`
      <div class="bc-header">
        <div class="bc-header-row">
          <span class="bc-title">Base color</span>
          <div class="bc-mode-wrap">
            <sp-button class="bc-mode-trigger" @click=${this._toggleModeMenu} aria-label="Color mode">
              ${this.colorMode}
              <img src="/express/code/icons/S2_Icon_ChevronDown_20_N.svg" alt="" width="14" height="14" />
            </sp-button>
            ${this._modeMenuOpen ? html`
              <sp-theme system="spectrum-two" color="light" scale="medium">
                <sp-menu
                  selects="single"
                  size="s"
                  label="Color mode"
                  @change=${this._onModeMenuChange}
                >
                  ${COLOR_MODES.map((m) => html`
                    <sp-menu-item
                      value=${m}
                      ?selected=${m === this.colorMode}
                    >${m}</sp-menu-item>
                  `)}
                </sp-menu>
              </sp-theme>
            ` : nothing}
          </div>
        </div>
        ${this.colorMode === 'HEX' ? html`
          <input
            type="text"
            class="bc-color-value"
            .value=${this._colorValue}
            @input=${this._onColorValueInput}
            aria-label="Color value"
          />
        ` : nothing}
      </div>
    `;
  }

  _renderColorPicker() {
    const currentColor = this._hex;

    return html`
      <div class="bc-picker-section">
        <sp-theme system="spectrum-two" color="light" scale="medium">
          <sp-color-area
            color=${currentColor}
            @input=${this._onColorAreaInput}
            @change=${this._onColorAreaInput}
          ></sp-color-area>
          <sp-color-slider
            gradient="hue"
            color=${currentColor}
            @input=${this._onHueInput}
            @change=${this._onHueInput}
          ></sp-color-slider>
        </sp-theme>
      </div>
    `;
  }

  _renderPanel() {
    return html`
      <div class="base-color-panel">
        ${this._renderHeader()}
        ${this._renderColorPicker()}
      </div>
    `;
  }

  render() {
    if (this.mobile) {
      return html`
        <div
          class="bc-overlay ${this.open ? 'open' : ''}"
          @click=${this._onOverlayClick}
        >
          <div class="bc-sheet ${this.open ? 'open' : ''}">
            ${this._renderPanel()}
          </div>
        </div>
      `;
    }
    return this._renderPanel();
  }
}

customElements.define('base-color', BaseColor);

export default BaseColor;
