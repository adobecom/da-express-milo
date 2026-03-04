import { LitElement, html, nothing } from '../../../deps/lit-all.min.js';
import { style } from './styles.css.js';
import {
  hexToRGB,
  rgbToHSB,
  hsbToRGB,
  hsbToHEX,
  rgbToHex,
} from '../../utils/ColorConversions.js';
import { preventDefault, isRightMouseButtonClicked } from '../../utils/util.js';
import { loadSwatch, loadMenu, loadTextfield } from '../../../../scripts/color-shared/spectrum/load-spectrum.js';
import '../base-color/index.js';

const COLOR_MODES = ['RGB', 'HEX'];

class ColorEdit extends LitElement {
  static get styles() {
    return [style];
  }

  static get properties() {
    return {
      palette: { type: Array },
      selectedIndex: { type: Number, attribute: 'selected-index' },
      colorMode: { type: String, attribute: 'color-mode' },
      showPalette: { type: Boolean, attribute: 'show-palette' },
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
    this.palette = [];
    this.selectedIndex = 0;
    this.colorMode = 'RGB';
    this.showPalette = true;
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
    ColorEdit.loadColorTokens();
    loadSwatch();
    loadMenu();
    loadTextfield();
    this._syncFromPalette();
    this._closeMenuOnOutsideClick = (e) => {
      if (this._modeMenuOpen && !e.composedPath().includes(this.shadowRoot.querySelector('.ce-mode-wrap'))) {
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
    if (changed.has('palette') || changed.has('selectedIndex')) {
      this._syncFromPalette();
    }
  }

  _syncFromPalette() {
    const hex = this.palette?.[this.selectedIndex];
    if (!hex) return;
    const rgb = hexToRGB(hex);
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
        index: this.selectedIndex,
        hue: this._hue,
        saturation: this._saturation,
        brightness: this._brightness,
      },
    }));
  }

  _onSwatchClick(index) {
    if (index === this.selectedIndex) return;
    this.selectedIndex = index;
    this._syncFromPalette();
    this.dispatchEvent(new CustomEvent('swatch-select', {
      bubbles: true,
      composed: true,
      detail: { index },
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

  _onSheetDragStart(e) {
    const startY = e.touches?.[0]?.clientY ?? e.clientY;
    const sheet = this.shadowRoot.querySelector('.ce-sheet');
    if (!sheet) return;

    const move = (ev) => {
      const currentY = ev.touches?.[0]?.clientY ?? ev.clientY;
      const delta = currentY - startY;
      if (delta > 0) sheet.style.transform = `translateY(${delta}px)`;
    };

    const up = (ev) => {
      const endY = ev.changedTouches?.[0]?.clientY ?? ev.clientY;
      sheet.style.transform = '';
      if (endY - startY > 100) this.hide();
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };

    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  // --- Saturation/Brightness area ---

  _onAreaPointerDown(e) {
    preventDefault(e);
    if (isRightMouseButtonClicked(e)) return;

    const area = this.shadowRoot.querySelector('.sb-area');
    this._updateAreaFromPointer(e, area);

    const move = (ev) => this._updateAreaFromPointer(ev, area);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  _updateAreaFromPointer(e, area) {
    const rect = area.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    this._saturation = parseFloat(((x / rect.width) * 100).toFixed(2));
    this._brightness = parseFloat(((1 - y / rect.height) * 100).toFixed(2));
    this._emitColorChange();
  }

  // --- Hue slider ---

  _onHueInput(e) {
    this._hue = Number(e.target.value);
    this._emitColorChange();
  }

  // --- RGB channel sliders ---

  _onChannelInput(channel, value) {
    const clamped = Math.max(0, Math.min(255, Math.round(Number(value))));
    const rgb = { ...this._rgb };
    rgb[channel] = clamped;

    const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
    this._hue = hsb.hue;
    this._saturation = hsb.saturation;
    this._brightness = hsb.brightness;
    this._emitColorChange();
  }

  // --- Templates ---

  _renderDragHandle() {
    if (!this.mobile) return nothing;
    return html`
      <div
        class="ce-drag-handle"
        @touchstart=${this._onSheetDragStart}
        @mousedown=${this._onSheetDragStart}
      >
        <div class="ce-drag-pill"></div>
      </div>
    `;
  }

  _renderHeader() {
    return html`
      <div class="ce-header">
        <span class="ce-title">Edit color</span>
        <div class="ce-mode-wrap">
          <sp-button class="ce-mode-trigger" @click=${this._toggleModeMenu} aria-label="Color mode">
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
    `;
  }

  _renderPaletteSwatches() {
    if (!this.showPalette || !this.palette?.length) return nothing;
    return html`
      <div class="ce-palette-section">
        <span class="ce-palette-label">Palette colors</span>
        <sp-theme system="spectrum-two" color="light" scale="medium">
          <sp-swatch-group
            selects="single"
            size="s"
            cornerRadius="partial"
            @change=${this._onSwatchGroupChange}
          >
            ${this.palette.map((hex, i) => {
    const validHex = hex.startsWith('#') ? hex : `#${hex}`;
    return html`
                <sp-swatch
                  border="light"
                  cornerRounding="partial"
                  color=${validHex}
                  value=${String(i)}
                  ?selected=${i === this.selectedIndex}
                  aria-label="Color ${validHex}"
                ></sp-swatch>
              `;
  })}
          </sp-swatch-group>
        </sp-theme>
      </div>
    `;
  }

  _onSwatchGroupChange(e) {
    e.preventDefault();
    const group = e.target;
    const selectedValue = group.selected?.[0];
    if (selectedValue != null) {
      const index = Number(selectedValue);
      this._onSwatchClick(index);
    }
  }

  _renderSBArea() {
    const hueColor = `hsl(${this._hue}, 100%, 50%)`;
    const handleX = this._saturation;
    const handleY = 100 - this._brightness;

    return html`
      <div
        class="sb-area"
        style="background-color: ${hueColor}"
        @pointerdown=${this._onAreaPointerDown}
      >
        <div class="sb-white-gradient"></div>
        <div class="sb-black-gradient"></div>
        <div
          class="sb-handle"
          style="left: ${handleX}%; top: ${handleY}%"
        ></div>
      </div>
    `;
  }

  _renderHueSlider() {
    return html`
      <div class="ce-hue-slider">
        <input
          type="range"
          class="hue-range"
          min="0"
          max="360"
          .value=${String(Math.round(this._hue))}
          @input=${this._onHueInput}
          aria-label="Hue"
        />
      </div>
    `;
  }

  _renderChannelSliders() {
    const rgb = this._rgb;
    const channels = [
      { key: 'red', label: 'R', value: rgb.red, from: rgbToHex({ red: 0, green: rgb.green, blue: rgb.blue }), to: rgbToHex({ red: 255, green: rgb.green, blue: rgb.blue }) },
      { key: 'green', label: 'G', value: rgb.green, from: rgbToHex({ red: rgb.red, green: 0, blue: rgb.blue }), to: rgbToHex({ red: rgb.red, green: 255, blue: rgb.blue }) },
      { key: 'blue', label: 'B', value: rgb.blue, from: rgbToHex({ red: rgb.red, green: rgb.green, blue: 0 }), to: rgbToHex({ red: rgb.red, green: rgb.green, blue: 255 }) },
    ];

    return html`
      <div class="ce-channels">
        ${channels.map((ch) => html`
          <div class="ce-channel-row">
            <span class="ce-channel-label">${ch.label}</span>
            <div class="ce-channel-track" style="background: linear-gradient(to right, ${ch.from}, ${ch.to})">
              <input
                type="range"
                class="channel-range"
                min="0"
                max="255"
                .value=${String(ch.value)}
                @input=${(e) => this._onChannelInput(ch.key, e.target.value)}
                aria-label="${ch.label} channel"
              />
            </div>
            <input
              type="number"
              class="ce-channel-input"
              min="0"
              max="255"
              .value=${String(ch.value)}
              @change=${(e) => this._onChannelInput(ch.key, e.target.value)}
              aria-label="${ch.label} value"
            />
          </div>
        `)}
      </div>
    `;
  }

  _onBaseColorChange(e) {
    const { hue, saturation, brightness } = e.detail;
    this._hue = hue;
    this._saturation = saturation;
    this._brightness = brightness;
    this._emitColorChange();
  }

  _onHexInput(e) {
    const value = e.target.value.trim();
    if (value.match(/^#?[0-9A-Fa-f]{6}$/)) {
      const hex = value.startsWith('#') ? value : `#${value}`;
      const rgb = hexToRGB(hex);
      if (!rgb) return;
      const hsb = rgbToHSB(rgb.red / 255, rgb.green / 255, rgb.blue / 255);
      this._hue = hsb.hue;
      this._saturation = hsb.saturation;
      this._brightness = hsb.brightness;
      this._emitColorChange();
    }
  }

  _renderHexInput() {
    return html`
      <div class="ce-hex-section">
        <span class="ce-hex-label">HEX</span>
        <div class="ce-hex-field">
          <input
            type="text"
            class="ce-hex-input"
            .value=${this._hex}
            @change=${this._onHexInput}
            aria-label="HEX color value"
          />
        </div>
      </div>
    `;
  }

  _renderPanel() {
    const isHexMode = this.colorMode === 'HEX';

    return html`
      ${this._renderDragHandle()}
      <div class="color-edit-panel">
        <div class="ce-title-dropdown-colors">
          ${this._renderHeader()}
          ${this._renderPaletteSwatches()}
        </div>
        ${isHexMode ? this._renderHexInput() : nothing}
        <base-color
          color=${this._hex}
          color-mode=${this.colorMode}
          .showHeader=${false}
          .showBrightnessControl=${isHexMode}
          @color-change=${this._onBaseColorChange}
        ></base-color>
      </div>
    `;
  }

  render() {
    if (this.mobile) {
      return html`
        <div class="ce-overlay ${this.open ? 'open' : ''}" @click=${this._onOverlayClick}>
          <div class="ce-sheet ${this.open ? 'open' : ''}">
            ${this._renderPanel()}
          </div>
        </div>
      `;
    }
    return this._renderPanel();
  }
}

customElements.define('color-edit', ColorEdit);

export default ColorEdit;
