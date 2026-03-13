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
      _hue: { type: Number, state: true },
      _saturation: { type: Number, state: true },
      _brightness: { type: Number, state: true },
      _modeMenuOpen: { type: Boolean, state: true },
      _isLocked: { type: Boolean, state: true, reflect: true, attribute: 'locked' },
      _hexError: { type: Boolean, state: true },
      _liveRegionText: { type: String, state: true },
      _colorUpdatedFromPicker: { type: Boolean, state: true },
    };
  }

  constructor() {
    super();
    this.color = '#FF0000';
    this.colorMode = 'HEX';
    this.showHeader = true;
    this.showBrightnessControl = true;
    this._hue = 0;
    this._saturation = 100;
    this._brightness = 100;
    this._modeMenuOpen = false;
    this._isLocked = false;
    this._hexError = false;
    this._colorUpdatedFromPicker = false;
    this._liveRegionText = '';
    this._announceTimer = null;
    this._labCache = null;
    this._hasOriginal = false;
    this._originalHue = 0;
    this._originalSaturation = 0;
    this._originalBrightness = 0;
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
    if (this._labCache) return { ...this._labCache };
    const rgb = this._rgb;
    return rgbToLab(rgb.red, rgb.green, rgb.blue);
  }

  get _showOriginalDot() {
    if (!this._hasOriginal) return false;
    return Math.round(this._hue) !== Math.round(this._originalHue)
      || Math.round(this._saturation) !== Math.round(this._originalSaturation)
      || Math.round(this._brightness) !== Math.round(this._originalBrightness);
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
    clearTimeout(this._announceTimer);
    document.removeEventListener('click', this._closeMenuOnOutsideClick);
    document.removeEventListener('keydown', this._closeMenuOnEscape);
    this.renderRoot.querySelector('sp-color-area')?.shadowRoot?.querySelector('.bc-original-dot')?.remove();
    this.renderRoot.querySelector('sp-color-slider')?.shadowRoot?.querySelector('.bc-original-slider-dot')?.remove();
    super.disconnectedCallback();
  }

  updated(changed) {
    if (changed.has('color')) {
      this._syncFromColor();
    }
    this._updateOriginalDots();
  }

  _ensureDotStyles(shadowRoot) {
    if (shadowRoot.querySelector('style[data-bc-dots]')) return;
    const sheet = document.createElement('style');
    sheet.setAttribute('data-bc-dots', '');
    sheet.textContent = `
      .bc-original-dot {
        position: absolute;
        width: var(--spacing-80);
        height: var(--spacing-80);
        border-radius: 50%;
        background-color: #fff;
        border: 1px solid rgba(31, 31, 31, 0.3);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 0;
        left: clamp(var(--spacing-80), var(--dot-x, 50%), calc(100% - var(--spacing-80)));
        top: clamp(var(--spacing-80)/2, var(--dot-y, 50%), calc(100% - var(--spacing-80)/2));
      }
      .bc-original-slider-dot {
        position: absolute;
        width: var(--spacing-75);
        height: var(--spacing-75);
        border-radius: 50%;
        background-color: #fff;
        border: 1px solid rgba(31, 31, 31, 0.3);
        top: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 0;
        left: clamp(var(--spacing-75)/2, var(--dot-x, 50%), calc(100% - var(--spacing-75)/2));
      }
    `;
    shadowRoot.appendChild(sheet);
  }

  _ensureDot(host, cls) {
    if (!host?.shadowRoot) return null;
    this._ensureDotStyles(host.shadowRoot);
    let dot = host.shadowRoot.querySelector(`.${cls}`);
    if (!dot) {
      dot = document.createElement('span');
      dot.className = cls;
      host.shadowRoot.appendChild(dot);
    }
    return dot;
  }

  _updateOriginalDots() {
    const area = this.renderRoot.querySelector('sp-color-area');
    const areaDot = this._ensureDot(area, 'bc-original-dot');
    if (areaDot) {
      if (this._showOriginalDot) {
        areaDot.style.setProperty('--dot-x', `${this._originalSaturation}%`);
        areaDot.style.setProperty('--dot-y', `${100 - this._originalBrightness}%`);
        areaDot.style.display = '';
      } else {
        areaDot.style.display = 'none';
      }
    }

    const slider = this.renderRoot.querySelector('sp-color-slider');
    const sliderDot = this._ensureDot(slider, 'bc-original-slider-dot');
    if (sliderDot) {
      if (this._showOriginalDot) {
        sliderDot.style.setProperty('--dot-x', `${this._originalHue / 360 * 100}%`);
        sliderDot.style.display = '';
      } else {
        sliderDot.style.display = 'none';
      }
    }
  }

  _syncFromColor() {
    if (!this.color) return;
    const rgb = hexToRGB(this.color);
    if (!rgb) return;
    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);

    if (!this._hasOriginal) {
      this._originalHue = hsb.hue;
      this._originalSaturation = hsb.saturation;
      this._originalBrightness = hsb.brightness;
      this._hasOriginal = true;
    }

    if (this.color.toUpperCase() === this._hex.toUpperCase()) return;
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
    this._colorUpdatedFromPicker = true;
    this._labCache = null;
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
    this._announceColorChange();
  }

  _announceColorChange() {
    clearTimeout(this._announceTimer);
    this._announceTimer = setTimeout(() => {
      this._liveRegionText = this._getColorAnnouncement();
    }, 500);
  }

  _getColorAnnouncement() {
    switch (this.colorMode) {
      case 'RGB': {
        const rgb = this._rgb;
        return `Red ${Math.round(rgb.red)}, Green ${Math.round(rgb.green)}, Blue ${Math.round(rgb.blue)}`;
      }
      case 'HSB': {
        const hsb = this._hsb;
        return `Hue ${hsb.h} degrees, Saturation ${hsb.s}%, Brightness ${hsb.b}%`;
      }
      case 'Lab': {
        const lab = this._lab;
        return `Lightness ${lab.l}, a ${lab.a}, b ${lab.b}`;
      }
      case 'HEX':
      default:
        return `Color ${this._hex}`;
    }
  }

  _onModeSelect(mode) {
    this.colorMode = mode;
    this._modeMenuOpen = false;
    this._labCache = null;
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
    this._modeMenuOpen = !this._modeMenuOpen;
    if (this._modeMenuOpen) {
      try {
        await this._menuLoadPromise;
      } catch { /* proceed even if menu components failed to load */ }
      if (!this._modeMenuOpen) return;
      await this.updateComplete;
      this.shadowRoot.querySelector('#bc-mode-menu')?.focus();
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
    const field = e.target;
    const value = field.value;
    if (this.colorMode !== 'HEX') return;

    this._colorUpdatedFromPicker = false;

    const hex = value.replace(/#/g, '');
    const normalized = `#${hex}`;
    if (value !== normalized) {
      field.value = normalized;
    }

    if (hex.match(/^[0-9A-Fa-f]{6}$/)) {
      this._hexError = false;
      this.color = `#${hex}`;
      this._syncFromColor();
      this._emitColorChange();
    }
  }

  _onHexPaste(e) {
    const pasted = (e.clipboardData && e.clipboardData.getData('text')) || '';
    const stripped = pasted.replace(/#/g, '');
    if (stripped === pasted) return;
    e.preventDefault();
    const input = e.composedPath().find((el) => el instanceof HTMLInputElement) || document.activeElement;
    if (!input || !(input instanceof HTMLInputElement)) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const value = input.value.slice(0, start) + stripped + input.value.slice(end);
    input.value = value;
    input.setSelectionRange(start + stripped.length, start + stripped.length);
    input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
  }

  _onHexCommit(e) {
    const field = e.target;
    const hex = field.value.replace(/#/g, '').trim();
    if (!hex.match(/^[0-9A-Fa-f]{6}$/)) {
      if (this._colorUpdatedFromPicker) {
        field.value = this._hex;
        this._hexError = false;
        this._colorUpdatedFromPicker = false;
      } else {
        this._hexError = true;
      }
    }
  }

  _setLocked(locked) {
    this._isLocked = locked;
    this.dispatchEvent(new CustomEvent('lock-change', {
      bubbles: true,
      composed: true,
      detail: { locked: this._isLocked },
    }));
  }

  resetOriginalColor() {
    this._hasOriginal = false;
  }

  // --- Touch focus fix ---
  // On mobile, touching the color area/slider gives the handle a [focused]
  // attribute that increases its size. Because nothing steals focus after
  // the finger lifts, the handle stays enlarged. Track pointer type and
  // blur after touch-initiated changes so the handle returns to normal.

  _onPointerDown(e) {
    this._lastPointerType = e.pointerType;
  }

  _blurOnTouch(target) {
    if (this._lastPointerType === 'touch') {
      this._lastPointerType = null;
      requestAnimationFrame(() => target?.blur());
    }
  }

  // --- Color area (Saturation/Brightness) ---

  _onColorAreaInput(e) {
    const area = e.target;
    if (!area) return;

    this._saturation = area.x * 100;
    this._brightness = area.y * 100;
    this._hexError = false;
    this._colorUpdatedFromPicker = true;
    this._labCache = null;
    this._emitColorChange();
  }

  _onColorAreaChange(e) {
    this._onColorAreaInput(e);
    this._blurOnTouch(e.target);
  }

  // --- Hue slider ---

  _onHueInput(e) {
    const slider = e.target;
    if (slider.value == null) return;

    let hue = slider.value;
    if (this._hasOriginal) {
      const diff = Math.abs(hue - this._originalHue);
      const wrappedDiff = Math.min(diff, 360 - diff);
      if (wrappedDiff <= 5) hue = this._originalHue;
    }

    this._hue = hue;
    this._hexError = false;
    this._colorUpdatedFromPicker = true;
    this._labCache = null;
    this._emitColorChange();
    if (e.type === 'change') {
      this._blurOnTouch(slider);
    }
  }

  _onChannelKeyDown(e, allowNegative = false) {
    if (e.ctrlKey || e.metaKey) return;
    if (e.key.length === 1 && !/[0-9]/.test(e.key) && !(allowNegative && e.key === '-')) {
      e.preventDefault();
    }
  }

  // --- Additional channel sliders ---

  _onRGBChannelSliderInput(e, channel) {
    const value = Math.round(Number(e.target.value));
    const rgb = { ...this._rgb };
    rgb[channel] = value;

    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
    this._hexError = false;
    this._colorUpdatedFromPicker = true;
    this._labCache = null;
    this._emitColorChange();
  }

  _onRGBChannelTextInput(e, channel) {
    const parsed = Number(e.target.value);
    const value = Math.max(0, Math.min(255, Math.round(Number.isNaN(parsed) ? 0 : parsed)));
    const rgb = { ...this._rgb };
    rgb[channel] = value;

    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
    this._hexError = false;
    this._colorUpdatedFromPicker = true;
    this._labCache = null;
    this._emitColorChange();
  }

  _onHSBChannelSliderInput(e, channel) {
    const value = Number(e.target.value);

    if (channel === 'h') {
      this._hue = value;
    } else if (channel === 's') {
      this._saturation = value;
    } else if (channel === 'b') {
      this._brightness = value;
    }

    this._hexError = false;
    this._colorUpdatedFromPicker = true;
    this._labCache = null;
    this._emitColorChange();
  }

  _onHSBChannelTextInput(e, channel) {
    const parsed = Number(e.target.value);
    const raw = Number.isNaN(parsed) ? 0 : parsed;

    if (channel === 'h') {
      this._hue = ((raw % 360) + 360) % 360;
    } else if (channel === 's') {
      this._saturation = Math.max(0, Math.min(100, raw));
    } else if (channel === 'b') {
      this._brightness = Math.max(0, Math.min(100, raw));
    }

    this._hexError = false;
    this._colorUpdatedFromPicker = true;
    this._labCache = null;
    this._emitColorChange();
  }

  _updateFromLab(lab) {
    this._labCache = { l: lab.l, a: lab.a, b: lab.b };
    const rgb = labToRGB(lab.l, lab.a, lab.b);
    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
    this._hexError = false;
    this._colorUpdatedFromPicker = true;
    this._emitColorChange();
  }

  _onLabChannelSliderInput(e, channel) {
    const sliderValue = Number(e.target.value);
    const lab = this._lab;

    if (channel === 'l') {
      lab.l = sliderValue;
    } else if (channel === 'a') {
      lab.a = Math.round(sliderValue);
    } else if (channel === 'b') {
      lab.b = Math.round(sliderValue);
    }

    this._updateFromLab(lab);
  }

  _onLabChannelTextInput(e, channel) {
    const parsed = Number(e.target.value);
    const raw = Number.isNaN(parsed) ? 0 : parsed;
    const lab = this._lab;

    if (channel === 'l') {
      lab.l = Math.max(0, Math.min(100, raw));
    } else if (channel === 'a') {
      lab.a = Math.max(-128, Math.min(127, Math.round(raw)));
    } else if (channel === 'b') {
      lab.b = Math.max(-128, Math.min(127, Math.round(raw)));
    }

    this._updateFromLab(lab);
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
            ` : nothing}
          </div>
        </div>
        ${this.colorMode === 'HEX' ? html`
          <div class="bc-color-value-group">
            <div class="bc-color-value-wrapper ${this._hexError ? 'has-error' : ''}">
              <div class="bc-color-swatch" style="background-color: ${this._hex}" aria-hidden="true"></div>
              <sp-textfield
                id="bc-hex-input"
                class="bc-hex-field"
                quiet
                size="l"
                maxlength="7"
                .value=${this._colorValue}
                ?invalid=${this._hexError}
                label="Base color"
                @input=${this._onColorValueInput}
                @paste=${this._onHexPaste}
                @change=${this._onHexCommit}
              ></sp-textfield>
              <span
                class="bc-lock-icon"
                aria-label="${this._isLocked ? 'Color locked' : 'Color unlocked'}"
              >
                <img
                  src="/express/code/icons/${this._isLocked ? 'S2_Icon_Lock_20_N.svg' : 'S2_Icon_LockOpen_20_N.svg'}"
                  alt=""
                  width="20"
                  height="20"
                />
              </span>
            </div>
            ${this._hexError ? html`<span class="bc-hex-error-text">Please enter a valid 6-character HEX code</span>` : nothing}
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
            @input=${(e) => this._onHSBChannelSliderInput(e, 'b')}
          ></color-channel-slider>
        </div>
        <sp-textfield
          class="bc-channel-input"
          type="number"
          size="s"
          maxlength="3"
          .value=${String(value)}
          label="Brightness/Contrast"
          label-visibility="none"
          @keydown=${(e) => this._onChannelKeyDown(e)}
          @input=${(e) => this._onHSBChannelTextInput(e, 'b')}
        ></sp-textfield>
      </div>
    `;
  }

  _renderAdditionalSliders() {
    if (this.colorMode === 'HEX') return this._renderBrightnessSlider();

    if (this.colorMode === 'RGB') {
      const rgb = this._rgb;
      const channels = [
        { key: 'red', label: 'R', ariaLabel: 'Red', value: Math.round(rgb.red), min: 0, max: 255, unit: '', maxlength: 3 },
        { key: 'green', label: 'G', ariaLabel: 'Green', value: Math.round(rgb.green), min: 0, max: 255, unit: '', maxlength: 3 },
        { key: 'blue', label: 'B', ariaLabel: 'Blue', value: Math.round(rgb.blue), min: 0, max: 255, unit: '', maxlength: 3 },
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
          maxlength: 3,
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
                @input=${(e) => ch.key === 'brightness' ? this._onHSBChannelSliderInput(e, 'b') : this._onRGBChannelSliderInput(e, ch.key)}
              ></color-channel-slider>
            </div>
            <sp-textfield
              class="bc-channel-input"
              type="number"
              size="s"
              maxlength=${ch.maxlength}
              .value=${String(ch.value)}
              label=${ch.isIcon ? 'Brightness/Contrast' : ch.ariaLabel}
              label-visibility="none"
              @keydown=${(e) => this._onChannelKeyDown(e)}
              @input=${(e) => ch.key === 'brightness' ? this._onHSBChannelTextInput(e, 'b') : this._onRGBChannelTextInput(e, ch.key)}
            ></sp-textfield>
          </div>
        `)}
      `;
    }

    if (this.colorMode === 'HSB') {
      const channels = [
        { key: 'h', label: 'H', ariaLabel: 'Hue', value: Math.round(this._hue), min: 0, max: 360, unit: ' degrees', maxlength: 3 },
        { key: 's', label: 'S', ariaLabel: 'Saturation', value: Math.round(this._saturation), min: 0, max: 100, unit: '%', maxlength: 3 },
        { key: 'b', label: 'B', ariaLabel: 'Brightness', value: Math.round(this._brightness), min: 0, max: 100, unit: '%', maxlength: 3 },
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
                @input=${(e) => this._onHSBChannelSliderInput(e, ch.key)}
              ></color-channel-slider>
            </div>
            <sp-textfield
              class="bc-channel-input"
              type="number"
              size="s"
              maxlength=${ch.maxlength}
              .value=${String(ch.value)}
              label=${ch.ariaLabel}
              label-visibility="none"
              @keydown=${(e) => this._onChannelKeyDown(e)}
              @input=${(e) => this._onHSBChannelTextInput(e, ch.key)}
            ></sp-textfield>
          </div>
        `)}
      `;
    }

    if (this.colorMode === 'Lab') {
      const lab = this._lab;
      const channels = [
        { key: 'l', label: 'L', ariaLabel: 'Lightness', value: Math.round(lab.l), min: 0, max: 100, unit: '', maxlength: 3, allowNegative: false },
        { key: 'a', label: 'a', ariaLabel: 'a (green-red)', value: Math.round(lab.a), min: -128, max: 127, unit: '', maxlength: 4, allowNegative: true },
        { key: 'b', label: 'b', ariaLabel: 'b (blue-yellow)', value: Math.round(lab.b), min: -128, max: 127, unit: '', maxlength: 4, allowNegative: true },
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
                @input=${(e) => this._onLabChannelSliderInput(e, ch.key)}
              ></color-channel-slider>
            </div>
            <sp-textfield
              class="bc-channel-input"
              type="number"
              size="s"
              maxlength=${ch.maxlength}
              .value=${String(ch.value)}
              label=${ch.ariaLabel}
              label-visibility="none"
              @keydown=${(e) => this._onChannelKeyDown(e, ch.allowNegative)}
              @input=${(e) => this._onLabChannelTextInput(e, ch.key)}
            ></sp-textfield>
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
          <div class="bc-color-area-container">
            <sp-color-area
              .x=${this._saturation / 100}
              .y=${this._brightness / 100}
              .hue=${this._hue}
              @pointerdown=${this._onPointerDown}
              @input=${this._onColorAreaInput}
              @change=${this._onColorAreaChange}
            ></sp-color-area>
          </div>
          <div class="bc-color-slider-container">
            <sp-color-slider
              gradient="hue"
              color=${currentColor}
              @pointerdown=${this._onPointerDown}
              @input=${this._onHueInput}
              @change=${this._onHueInput}
            ></sp-color-slider>
          </div>
        </div>
        ${this._renderAdditionalSliders()}
      </div>
    `;
  }

  _renderPanel() {
    return html`
      <sp-theme system="spectrum-two" color="light" scale="medium">
        <div class="base-color-panel">
          ${this._renderHeader()}
          ${this._renderColorPicker()}
          <div class="bc-sr-only" role="status" aria-live="polite" aria-atomic="true">${this._liveRegionText}</div>
        </div>
      </sp-theme>
    `;
  }

  render() {
    return this._renderPanel();
  }
}

customElements.define('base-color', BaseColor);

export default BaseColor;
