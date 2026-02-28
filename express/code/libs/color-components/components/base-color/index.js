import { LitElement, html, nothing } from '../../../deps/lit-all.min.js';
import { style } from './styles.css.js';
import {
  hexToRGB,
  rgbToHSB,
  hsbToRGB,
  hsbToHEX,
  hsbToHSL,
} from '../../utils/ColorConversions.js';
import { loadMenu, loadButton, loadColorArea, loadColorSlider, loadTextfield } from '../../../../scripts/color-shared/spectrum/load-spectrum.js';
import '../../../../scripts/color-shared/spectrum/components/express-channel-slider.js';

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
      showBrightnessControl: {
        type: Boolean,
        attribute: 'show-brightness-control',
        converter: {
          fromAttribute: (value) => {
            if (value === null) return true; // Default when attribute is not present
            if (value === '' || value === 'true') return true;
            if (value === 'false') return false;
            return Boolean(value);
          }
        }
      },
      mobile: { type: Boolean, reflect: true },
      open: { type: Boolean, reflect: true },
      _hue: { type: Number, state: true },
      _saturation: { type: Number, state: true },
      _brightness: { type: Number, state: true },
      _modeMenuOpen: { type: Boolean, state: true },
      _isLocked: { type: Boolean, state: true, reflect: true, attribute: 'locked' },
    };
  }

  constructor() {
    super();
    this.color = '#FF0000';
    this.colorMode = 'HEX';
    this.showHeader = true;
    this.showBrightnessControl = true;
    this.mobile = false;
    this.open = false;
    this._hue = 0;
    this._saturation = 100;
    this._brightness = 100;
    this._modeMenuOpen = false;
    this._isLocked = false;
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
    loadTextfield();
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

  _toggleLock() {
    this._isLocked = !this._isLocked;
    this.dispatchEvent(new CustomEvent('lock-change', {
      bubbles: true,
      composed: true,
      detail: { locked: this._isLocked },
    }));
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
    if (this._isLocked) return;

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
    if (this._isLocked) return;

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

  // --- Additional channel sliders ---

  _onRGBChannelSliderInput(e, channel) {
    if (this._isLocked) return;

    const value = Number(e.target.value);
    const rgb = { ...this._rgb };

    // Value is 0-100, convert to 0-255
    rgb[channel] = Math.round((value / 100) * 255);

    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
    this._emitColorChange();
  }

  _onRGBChannelTextInput(e, channel) {
    if (this._isLocked) return;

    const value = Math.max(0, Math.min(100, Number(e.target.value)));
    const rgb = { ...this._rgb };

    // Value is 0-100, convert to 0-255
    rgb[channel] = Math.round((value / 100) * 255);

    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
    this._emitColorChange();
  }

  _onHSBChannelSliderInput(e, channel) {
    if (this._isLocked) return;

    const value = Number(e.target.value);

    if (channel === 'h') {
      this._hue = (value / 100) * 360;
    } else if (channel === 's') {
      this._saturation = value;
    } else if (channel === 'b') {
      this._brightness = value;
    }

    this._emitColorChange();
  }

  _onHSBChannelTextInput(e, channel) {
    if (this._isLocked) return;

    const value = Math.max(0, Math.min(100, Number(e.target.value)));

    if (channel === 'h') {
      this._hue = (value / 100) * 360;
    } else if (channel === 's') {
      this._saturation = value;
    } else if (channel === 'b') {
      this._brightness = value;
    }

    this._emitColorChange();
  }

  _onLabChannelSliderInput(e, channel) {
    if (this._isLocked) return;

    // Lab conversion would need proper implementation
    // For now, this is a simplified version
    // In a production environment, you would convert Lab to RGB properly
    const value = Number(e.target.value);
    // This would need proper Lab to RGB conversion
    this._emitColorChange();
  }

  _onLabChannelTextInput(e, channel) {
    if (this._isLocked) return;

    const value = Math.max(0, Math.min(100, Number(e.target.value)));
    // This would need proper Lab to RGB conversion
    this._emitColorChange();
  }

  // --- Slider gradients ---

  _getChannelGradient(key) {
    const rgb = this._rgb;
    const h = this._hue / 360;
    const s = this._saturation / 100;
    const v = this._brightness / 100;

    if (this.colorMode === 'RGB') {
      switch (key) {
        case 'red':
          return `linear-gradient(to right, rgb(0,${rgb.green},${rgb.blue}), rgb(255,${rgb.green},${rgb.blue}))`;
        case 'green':
          return `linear-gradient(to right, rgb(${rgb.red},0,${rgb.blue}), rgb(${rgb.red},255,${rgb.blue}))`;
        case 'blue':
          return `linear-gradient(to right, rgb(${rgb.red},${rgb.green},0), rgb(${rgb.red},${rgb.green},255))`;
        case 'brightness':
          return `linear-gradient(to right, ${hsbToHEX(h, s, 0)}, ${hsbToHEX(h, s, 1)})`;
        default:
          return '';
      }
    }

    if (this.colorMode === 'HSB') {
      switch (key) {
        case 'h': {
          const stops = [0, 60, 120, 180, 240, 300, 360].map(
            (deg) => hsbToHEX(deg / 360, s, v),
          );
          return `linear-gradient(to right, ${stops.join(', ')})`;
        }
        case 's':
          return `linear-gradient(to right, ${hsbToHEX(h, 0, v)}, ${hsbToHEX(h, 1, v)})`;
        case 'b':
          return `linear-gradient(to right, ${hsbToHEX(h, s, 0)}, ${hsbToHEX(h, s, 1)})`;
        default:
          return '';
      }
    }

    if (this.colorMode === 'Lab') {
      const lab = this._lab;
      switch (key) {
        case 'l':
          return `linear-gradient(to right, #000000, ${hsbToHEX(h, s, v)}, #FFFFFF)`;
        case 'a': {
          const startRGB = hsbToRGB(h, s, Math.max(v * 0.5, 0));
          const endRGB = hsbToRGB(h, Math.min(s + 0.5, 1), v);
          return `linear-gradient(to right, rgb(${startRGB.red},${startRGB.green},${startRGB.blue}), rgb(${endRGB.red},${endRGB.green},${endRGB.blue}))`;
        }
        case 'b': {
          const startRGB = hsbToRGB(Math.max(h - 0.15, 0), s, v);
          const endRGB = hsbToRGB(Math.min(h + 0.15, 1), s, v);
          return `linear-gradient(to right, rgb(${startRGB.red},${startRGB.green},${startRGB.blue}), rgb(${endRGB.red},${endRGB.green},${endRGB.blue}))`;
        }
        default:
          return '';
      }
    }

    return '';
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
          <div class="bc-color-value-wrapper">
            <div class="bc-color-swatch" style="background-color: ${this._hex}"></div>
            <input
              type="text"
              class="bc-color-value"
              .value=${this._colorValue}
              @input=${this._onColorValueInput}
              aria-label="Color value"
            />
            <button
              class="bc-lock-button"
              @click=${this._toggleLock}
              aria-label="${this._isLocked ? 'Unlock color' : 'Lock color'}"
            >
              <img
                src="/express/code/icons/${this._isLocked ? 'S2_Icon_Lock_20_N.svg' : 'S2_Icon_LockOpen_20_N.svg'}"
                alt=""
                width="20"
                height="20"
              />
            </button>
          </div>
        ` : nothing}
      </div>
    `;
  }

  _renderAdditionalSliders() {
    if (this.colorMode === 'HEX') return nothing;

    if (this.colorMode === 'RGB') {
      const rgb = this._rgb;
      const channels = [
        { key: 'red', label: 'R', value: Math.round((rgb.red / 255) * 100) },
        { key: 'green', label: 'G', value: Math.round((rgb.green / 255) * 100) },
        { key: 'blue', label: 'B', value: Math.round((rgb.blue / 255) * 100) },
      ];

      if (this.showBrightnessControl) {
        channels.push({
          key: 'brightness',
          label: html`<img src="/express/code/icons/S2_Icon_BrightnessContrast_20_N.svg" alt="Brightness/Contrast" width="20" height="20" />`,
          value: Math.round(this._brightness),
          isIcon: true
        });
      }

      return html`
        ${channels.map((ch) => html`
          <div class="bc-channel-row">
            <span class="bc-channel-label ${ch.isIcon ? 'is-icon' : ''}">${ch.label}</span>
            <div class="bc-slider-wrapper">
              <express-channel-slider
                min="0"
                max="100"
                .value=${ch.value}
                label=${ch.isIcon ? 'Brightness/Contrast' : ch.label}
                gradient=${this._getChannelGradient(ch.key)}
                @input=${(e) => ch.key === 'brightness' ? this._onHSBChannelSliderInput(e, 'b') : this._onRGBChannelSliderInput(e, ch.key)}
              ></express-channel-slider>
            </div>
            <sp-theme system="spectrum-two" color="light" scale="medium">
              <sp-textfield
                class="bc-channel-input"
                type="number"
                size="s"
                .value=${String(ch.value)}
                label=${ch.isIcon ? 'Brightness/Contrast' : ch.label}
                label-visibility="none"
                style="--mod-textfield-corner-radius: 7px; --mod-textfield-border-width: 2px; --mod-textfield-height: 24px; --mod-textfield-border-color: var(--Palette-gray-300); --mod-textfield-background-color: var(--Palette-gray-25); border-radius: 7px;"
                @input=${(e) => ch.key === 'brightness' ? this._onHSBChannelTextInput(e, 'b') : this._onRGBChannelTextInput(e, ch.key)}
              ></sp-textfield>
            </sp-theme>
          </div>
        `)}
      `;
    }

    if (this.colorMode === 'HSB') {
      const channels = [
        { key: 'h', label: 'H', value: Math.round((this._hue / 360) * 100) },
        { key: 's', label: 'S', value: Math.round(this._saturation) },
        { key: 'b', label: 'B', value: Math.round(this._brightness) },
      ];

      return html`
        ${channels.map((ch) => html`
          <div class="bc-channel-row">
            <span class="bc-channel-label">${ch.label}</span>
            <div class="bc-slider-wrapper">
              <express-channel-slider
                min="0"
                max="100"
                .value=${ch.value}
                label=${ch.label}
                gradient=${this._getChannelGradient(ch.key)}
                @input=${(e) => this._onHSBChannelSliderInput(e, ch.key)}
              ></express-channel-slider>
            </div>
            <sp-theme system="spectrum-two" color="light" scale="medium">
              <sp-textfield
                class="bc-channel-input"
                type="number"
                size="s"
                .value=${String(ch.value)}
                label=${ch.label}
                label-visibility="none"
                style="--mod-textfield-corner-radius: 7px; --mod-textfield-border-width: 2px; --mod-textfield-height: 24px; --mod-textfield-border-color: var(--Palette-gray-300); --mod-textfield-background-color: var(--Palette-gray-25); border-radius: 7px;"
                @input=${(e) => this._onHSBChannelTextInput(e, ch.key)}
              ></sp-textfield>
            </sp-theme>
          </div>
        `)}
      `;
    }

    if (this.colorMode === 'Lab') {
      const lab = this._lab;
      const channels = [
        { key: 'l', label: 'L', value: lab.l },
        { key: 'a', label: 'a', value: Math.round(((lab.a + 128) / 255) * 100) },
        { key: 'b', label: 'b', value: Math.round(((lab.b + 128) / 255) * 100) },
      ];

      return html`
        ${channels.map((ch) => html`
          <div class="bc-channel-row">
            <span class="bc-channel-label">${ch.label}</span>
            <div class="bc-slider-wrapper">
              <express-channel-slider
                min="0"
                max="100"
                .value=${ch.value}
                label=${ch.label}
                gradient=${this._getChannelGradient(ch.key)}
                @input=${(e) => this._onLabChannelSliderInput(e, ch.key)}
              ></express-channel-slider>
            </div>
            <sp-theme system="spectrum-two" color="light" scale="medium">
              <sp-textfield
                class="bc-channel-input"
                type="number"
                size="s"
                .value=${String(ch.value)}
                label=${ch.label}
                label-visibility="none"
                style="--mod-textfield-corner-radius: 7px; --mod-textfield-border-width: 2px; --mod-textfield-height: 24px; --mod-textfield-border-color: var(--Palette-gray-300); --mod-textfield-background-color: var(--Palette-gray-25); border-radius: 7px;"
                @input=${(e) => this._onLabChannelTextInput(e, ch.key)}
              ></sp-textfield>
            </sp-theme>
          </div>
        `)}
      `;
    }

    return nothing;
  }

  _renderColorPicker() {
    const currentColor = this._hex;

    return html`
      <div class="bc-color-control">
        <div class="bc-color-area-wrapper ${this.colorMode !== 'HEX' ? 'has-sliders' : ''}">
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
        ${this._renderAdditionalSliders()}
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
