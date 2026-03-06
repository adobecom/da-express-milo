import { LitElement, html, nothing } from '../../../../libs/deps/lit-all.min.js';
import { style } from './styles.css.js';
import {
  hexToRGB,
  rgbToHSB,
  hsbToRGB,
  hsbToHEX,
  hsbToHSL,
  rgbToLab,
  labToRGB,
} from '../../../../libs/color-components/utils/ColorConversions.js';
import { loadMenu, loadButton, loadColorArea, loadColorSlider, loadTextfield } from '../../spectrum/load-spectrum.js';
import { loadColorTokens } from '../../utils/loadColorTokens.js';
import { trapFocus } from '../../spectrum/utils/a11y.js';
import '../color-channel-slider/index.js';

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
    const rgb = this._rgb;
    return rgbToLab(rgb.red, rgb.green, rgb.blue);
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

  connectedCallback() {
    super.connectedCallback();
    loadColorTokens();
    loadButton();
    this._menuLoadPromise = loadMenu();
    loadColorArea();
    loadColorSlider();
    loadTextfield();
    this._syncFromColor();
    this._closeMenuOnOutsideClick = (e) => {
      if (this._modeMenuOpen && !e.composedPath().includes(this.shadowRoot.querySelector('.bc-mode-wrap'))) {
        this._modeMenuOpen = false;
      }
    };
    this._closeMenuOnEscape = (e) => {
      if (this._modeMenuOpen && e.key === 'Escape') {
        this._modeMenuOpen = false;
        this.shadowRoot.querySelector('.bc-mode-trigger')?.focus();
      }
    };
    document.addEventListener('click', this._closeMenuOnOutsideClick);
    document.addEventListener('keydown', this._closeMenuOnEscape);
  }

  disconnectedCallback() {
    this._focusTrap?.release();
    this._focusTrap = null;
    document.removeEventListener('click', this._closeMenuOnOutsideClick);
    document.removeEventListener('keydown', this._closeMenuOnEscape);
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

  async _toggleModeMenu() {
    await this._menuLoadPromise;
    this._modeMenuOpen = !this._modeMenuOpen;
    if (this._modeMenuOpen) {
      await this.updateComplete;
      const menu = this.shadowRoot.querySelector('#bc-mode-menu');
      menu?.focus();
    }
  }

  _onModeMenuKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      this._modeMenuOpen = false;
      this.shadowRoot.querySelector('.bc-mode-trigger')?.focus();
    }
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
    this._previouslyFocused = document.activeElement;
    this.open = true;
    this.updateComplete.then(() => {
      const sheet = this.shadowRoot.querySelector('.bc-sheet');
      const focusable = sheet?.querySelector('input, button, [tabindex]:not([tabindex="-1"]), sp-button');
      if (focusable) focusable.focus();
      if (sheet) this._focusTrap = trapFocus(sheet);
    });
  }

  hide() {
    this.open = false;
    this._focusTrap?.release();
    this._focusTrap = null;
    this.dispatchEvent(new CustomEvent('panel-close', { bubbles: true, composed: true }));
    if (this._previouslyFocused) {
      this._previouslyFocused.focus();
      this._previouslyFocused = null;
    }
  }

  _onOverlayClick(e) {
    if (e.target === e.currentTarget) this.hide();
  }

  _onSheetKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.hide();
    }
  }

  // --- Color area (Saturation/Brightness) ---

  _onColorAreaInput(e) {
    if (this._isLocked) return;

    const area = e.target;
    if (!area) return;

    // Read saturation/brightness directly from sp-color-area's x/y properties
    // to avoid precision loss from hex round-trip that causes erratic keyboard navigation.
    // x = saturation (0–1), y = brightness (0–1). Hue is unchanged by the color area.
    this._saturation = area.x * 100;
    this._brightness = area.y * 100;
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

    const value = Math.round(Number(e.target.value));
    const rgb = { ...this._rgb };
    rgb[channel] = value;

    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
    this._emitColorChange();
  }

  _onRGBChannelTextInput(e, channel) {
    if (this._isLocked) return;

    const value = Math.max(0, Math.min(255, Math.round(Number(e.target.value))));
    const rgb = { ...this._rgb };
    rgb[channel] = value;

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
      this._hue = value;
    } else if (channel === 's') {
      this._saturation = value;
    } else if (channel === 'b') {
      this._brightness = value;
    }

    this._emitColorChange();
  }

  _onHSBChannelTextInput(e, channel) {
    if (this._isLocked) return;

    const raw = Number(e.target.value);

    if (channel === 'h') {
      this._hue = Math.max(0, Math.min(360, raw));
    } else if (channel === 's') {
      this._saturation = Math.max(0, Math.min(100, raw));
    } else if (channel === 'b') {
      this._brightness = Math.max(0, Math.min(100, raw));
    }

    this._emitColorChange();
  }

  _onLabChannelSliderInput(e, channel) {
    if (this._isLocked) return;

    const sliderValue = Number(e.target.value);
    const lab = this._lab;

    if (channel === 'l') {
      lab.l = sliderValue;
    } else if (channel === 'a') {
      lab.a = Math.round(sliderValue);
    } else if (channel === 'b') {
      lab.b = Math.round(sliderValue);
    }

    const rgb = labToRGB(lab.l, lab.a, lab.b);
    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
    this._emitColorChange();
  }

  _onLabChannelTextInput(e, channel) {
    if (this._isLocked) return;

    const raw = Number(e.target.value);
    const lab = this._lab;

    if (channel === 'l') {
      lab.l = Math.max(0, Math.min(100, raw));
    } else if (channel === 'a') {
      lab.a = Math.max(-128, Math.min(127, Math.round(raw)));
    } else if (channel === 'b') {
      lab.b = Math.max(-128, Math.min(127, Math.round(raw)));
    }

    const rgb = labToRGB(lab.l, lab.a, lab.b);
    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
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
        case 'l': {
          const lStart = labToRGB(0, lab.a, lab.b);
          const lMid = labToRGB(50, lab.a, lab.b);
          const lEnd = labToRGB(100, lab.a, lab.b);
          return `linear-gradient(to right, rgb(${lStart.red},${lStart.green},${lStart.blue}), rgb(${lMid.red},${lMid.green},${lMid.blue}), rgb(${lEnd.red},${lEnd.green},${lEnd.blue}))`;
        }
        case 'a': {
          const aStart = labToRGB(lab.l, -128, lab.b);
          const aMid = labToRGB(lab.l, 0, lab.b);
          const aEnd = labToRGB(lab.l, 127, lab.b);
          return `linear-gradient(to right, rgb(${aStart.red},${aStart.green},${aStart.blue}), rgb(${aMid.red},${aMid.green},${aMid.blue}), rgb(${aEnd.red},${aEnd.green},${aEnd.blue}))`;
        }
        case 'b': {
          const bStart = labToRGB(lab.l, lab.a, -128);
          const bMid = labToRGB(lab.l, lab.a, 0);
          const bEnd = labToRGB(lab.l, lab.a, 127);
          return `linear-gradient(to right, rgb(${bStart.red},${bStart.green},${bStart.blue}), rgb(${bMid.red},${bMid.green},${bMid.blue}), rgb(${bEnd.red},${bEnd.green},${bEnd.blue}))`;
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
            <button
              type="button"
              class="bc-mode-trigger"
              @click=${this._toggleModeMenu}
              aria-label="Color mode, ${this.colorMode}"
              aria-haspopup="listbox"
              aria-expanded=${this._modeMenuOpen}
              aria-controls=${this._modeMenuOpen ? 'bc-mode-menu' : nothing}
            >
              <span class="bc-mode-label">${this.colorMode}</span>
              <span class="bc-mode-chevron"><img src="/express/code/icons/S2_Icon_ChevronDown_20_N.svg" alt="" width="14" height="14" aria-hidden="true" /></span>
            </button>
            ${this._modeMenuOpen ? html`
              <sp-theme system="spectrum-two" color="light" scale="medium">
                <sp-menu
                  id="bc-mode-menu"
                  role="listbox"
                  selects="single"
                  size="s"
                  label="Color mode"
                  @change=${this._onModeMenuChange}
                  @keydown=${this._onModeMenuKeyDown}
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
            <div class="bc-color-swatch" style="background-color: ${this._hex}" aria-hidden="true"></div>
            <input
              type="text"
              class="bc-color-value"
              .value=${this._colorValue}
              ?disabled=${this._isLocked}
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

  _renderBrightnessSlider() {
    if (!this.showBrightnessControl) return nothing;
    const h = this._hue / 360;
    const s = this._saturation / 100;
    const gradient = `linear-gradient(to right, ${hsbToHEX(h, s, 0)}, ${hsbToHEX(h, s, 1)})`;
    const value = Math.round(this._brightness);
    const label = html`<img src="/express/code/icons/S2_Icon_BrightnessContrast_20_N.svg" alt="Brightness/Contrast" width="20" height="20" />`;

    return html`
      <div class="bc-channel-row">
        <span class="bc-channel-label is-icon">${label}</span>
        <div class="bc-slider-wrapper">
          <color-channel-slider
            min="0"
            max="100"
            .value=${value}
            label="Brightness/Contrast"
            valuetext=${`Brightness: ${value}%`}
            gradient=${gradient}
            ?disabled=${this._isLocked}
            @input=${(e) => this._onHSBChannelSliderInput(e, 'b')}
          ></color-channel-slider>
        </div>
        <sp-theme system="spectrum-two" color="light" scale="medium">
          <sp-textfield
            class="bc-channel-input"
            type="number"
            size="s"
            .value=${String(value)}
            label="Brightness/Contrast"
            label-visibility="none"
            ?disabled=${this._isLocked}
            @input=${(e) => this._onHSBChannelTextInput(e, 'b')}
          ></sp-textfield>
        </sp-theme>
      </div>
    `;
  }

  _renderAdditionalSliders() {
    if (this.colorMode === 'HEX') return this._renderBrightnessSlider();

    if (this.colorMode === 'RGB') {
      const rgb = this._rgb;
      const channels = [
        { key: 'red', label: 'R', ariaLabel: 'Red', value: Math.round(rgb.red), min: 0, max: 255, unit: '' },
        { key: 'green', label: 'G', ariaLabel: 'Green', value: Math.round(rgb.green), min: 0, max: 255, unit: '' },
        { key: 'blue', label: 'B', ariaLabel: 'Blue', value: Math.round(rgb.blue), min: 0, max: 255, unit: '' },
      ];

      if (this.showBrightnessControl) {
        channels.push({
          key: 'brightness',
          label: html`<img src="/express/code/icons/S2_Icon_BrightnessContrast_20_N.svg" alt="Brightness/Contrast" width="20" height="20" />`,
          ariaLabel: 'Brightness/Contrast',
          value: Math.round(this._brightness),
          min: 0,
          max: 100,
          isIcon: true,
          unit: '%',
        });
      }

      return html`
        ${channels.map((ch) => html`
          <div class="bc-channel-row">
            <span class="bc-channel-label ${ch.isIcon ? 'is-icon' : ''}">${ch.label}</span>
            <div class="bc-slider-wrapper">
              <color-channel-slider
                min=${ch.min}
                max=${ch.max}
                .value=${ch.value}
                label=${ch.isIcon ? 'Brightness/Contrast' : ch.ariaLabel}
                valuetext=${`${ch.ariaLabel}: ${ch.value}${ch.unit}`}
                gradient=${this._getChannelGradient(ch.key)}
                ?disabled=${this._isLocked}
                @input=${(e) => ch.key === 'brightness' ? this._onHSBChannelSliderInput(e, 'b') : this._onRGBChannelSliderInput(e, ch.key)}
              ></color-channel-slider>
            </div>
            <sp-theme system="spectrum-two" color="light" scale="medium">
              <sp-textfield
                class="bc-channel-input"
                type="number"
                size="s"
                .value=${String(ch.value)}
                label=${ch.isIcon ? 'Brightness/Contrast' : ch.ariaLabel}
                label-visibility="none"
                ?disabled=${this._isLocked}
                @input=${(e) => ch.key === 'brightness' ? this._onHSBChannelTextInput(e, 'b') : this._onRGBChannelTextInput(e, ch.key)}
              ></sp-textfield>
            </sp-theme>
          </div>
        `)}
      `;
    }

    if (this.colorMode === 'HSB') {
      const channels = [
        { key: 'h', label: 'H', ariaLabel: 'Hue', value: Math.round(this._hue), min: 0, max: 360, unit: ' degrees' },
        { key: 's', label: 'S', ariaLabel: 'Saturation', value: Math.round(this._saturation), min: 0, max: 100, unit: '%' },
        { key: 'b', label: 'B', ariaLabel: 'Brightness', value: Math.round(this._brightness), min: 0, max: 100, unit: '%' },
      ];

      return html`
        ${channels.map((ch) => html`
          <div class="bc-channel-row">
            <span class="bc-channel-label">${ch.label}</span>
            <div class="bc-slider-wrapper">
              <color-channel-slider
                min=${ch.min}
                max=${ch.max}
                .value=${ch.value}
                label=${ch.ariaLabel}
                valuetext=${`${ch.ariaLabel}: ${ch.value}${ch.unit}`}
                gradient=${this._getChannelGradient(ch.key)}
                ?disabled=${this._isLocked}
                @input=${(e) => this._onHSBChannelSliderInput(e, ch.key)}
              ></color-channel-slider>
            </div>
            <sp-theme system="spectrum-two" color="light" scale="medium">
              <sp-textfield
                class="bc-channel-input"
                type="number"
                size="s"
                .value=${String(ch.value)}
                label=${ch.ariaLabel}
                label-visibility="none"
                ?disabled=${this._isLocked}
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
        { key: 'l', label: 'L', ariaLabel: 'Lightness', value: Math.round(lab.l), min: 0, max: 100, unit: '' },
        { key: 'a', label: 'a', ariaLabel: 'a (green-red)', value: Math.round(lab.a), min: -128, max: 127, unit: '' },
        { key: 'b', label: 'b', ariaLabel: 'b (blue-yellow)', value: Math.round(lab.b), min: -128, max: 127, unit: '' },
      ];

      return html`
        ${channels.map((ch) => html`
          <div class="bc-channel-row">
            <span class="bc-channel-label">${ch.label}</span>
            <div class="bc-slider-wrapper">
              <color-channel-slider
                min=${ch.min}
                max=${ch.max}
                .value=${ch.value}
                label=${ch.ariaLabel}
                valuetext=${`${ch.ariaLabel}: ${ch.value}${ch.unit}`}
                gradient=${this._getChannelGradient(ch.key)}
                ?disabled=${this._isLocked}
                @input=${(e) => this._onLabChannelSliderInput(e, ch.key)}
              ></color-channel-slider>
            </div>
            <sp-theme system="spectrum-two" color="light" scale="medium">
              <sp-textfield
                class="bc-channel-input"
                type="number"
                size="s"
                .value=${String(ch.value)}
                label=${ch.ariaLabel}
                label-visibility="none"
                ?disabled=${this._isLocked}
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
        <div class="bc-color-area-wrapper ${this.colorMode !== 'HEX' || this.showBrightnessControl ? 'has-sliders' : ''}">
          <sp-theme system="spectrum-two" color="light" scale="medium">
            <sp-color-area
              .x=${this._saturation / 100}
              .y=${this._brightness / 100}
              .hue=${this._hue}
              ?disabled=${this._isLocked}
              @change=${this._onColorAreaInput}
            ></sp-color-area>
            <sp-color-slider
              gradient="hue"
              color=${currentColor}
              ?disabled=${this._isLocked}
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
          <div
            class="bc-sheet ${this.open ? 'open' : ''}"
            role="dialog"
            aria-modal="true"
            aria-label="Color picker"
            @keydown=${this._onSheetKeyDown}
          >
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
