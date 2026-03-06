import { LitElement, html, nothing } from '../../../../libs/deps/lit-all.min.js';
import { style } from './styles.css.js';
import {
  hexToRGB,
  rgbToHSB,
  hsbToRGB,
  hsbToHEX,
} from '../../../../libs/color-components/utils/ColorConversions.js';
import { loadSwatch, loadMenu, loadTextfield } from '../../spectrum/load-spectrum.js';
import { loadColorTokens } from '../../utils/loadColorTokens.js';
import { trapFocus } from '../../spectrum/utils/a11y.js';
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

  connectedCallback() {
    super.connectedCallback();
    loadColorTokens();
    loadSwatch();
    this._menuLoadPromise = loadMenu();
    loadTextfield();
    this._syncFromPalette();
    this._closeMenuOnOutsideClick = (e) => {
      if (this._modeMenuOpen && !e.composedPath().includes(this.shadowRoot.querySelector('.ce-mode-wrap'))) {
        this._modeMenuOpen = false;
      }
    };
    this._closeMenuOnEscape = (e) => {
      if (this._modeMenuOpen && e.key === 'Escape') {
        this._modeMenuOpen = false;
        this.shadowRoot.querySelector('button.ce-mode-trigger')?.focus();
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

  async _toggleModeMenu() {
    await this._menuLoadPromise;
    this._modeMenuOpen = !this._modeMenuOpen;
    if (this._modeMenuOpen) {
      await this.updateComplete;
      const menu = this.shadowRoot.querySelector('#ce-mode-menu');
      menu?.focus();
    }
  }

  _onModeMenuKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      this._modeMenuOpen = false;
      this.shadowRoot.querySelector('.ce-mode-trigger')?.focus();
    }
  }

  // --- Bottom sheet ---

  show() {
    this._previouslyFocused = document.activeElement;
    this.open = true;
    this.updateComplete.then(() => {
      const sheet = this.shadowRoot.querySelector('.ce-sheet');
      const focusable = sheet?.querySelector('input, button, [tabindex]:not([tabindex="-1"]), sp-button');
      if (focusable) focusable.focus();
      if (sheet) this._focusTrap = trapFocus(sheet);
    });
  }

  hide() {
    if (!this.open) return;
    this.open = false;
    this._focusTrap?.release();
    this._focusTrap = null;

    const sheet = this.shadowRoot.querySelector('.ce-sheet');
    const done = () => {
      this.dispatchEvent(new CustomEvent('panel-close', { bubbles: true, composed: true }));
      if (this._previouslyFocused) {
        this._previouslyFocused.focus();
        this._previouslyFocused = null;
      }
    };

    if (sheet) {
      sheet.addEventListener('transitionend', done, { once: true });
    } else {
      done();
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

  // --- Templates ---

  _renderDragHandle() {
    if (!this.mobile) return nothing;
    return html`
      <div
        class="ce-drag-handle"
        aria-hidden="true"
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
          <button
            type="button"
            class="ce-mode-trigger"
            @click=${this._toggleModeMenu}
            aria-label="Color mode, ${this.colorMode}"
            aria-haspopup="listbox"
            aria-expanded=${this._modeMenuOpen}
            aria-controls=${this._modeMenuOpen ? 'ce-mode-menu' : nothing}
          >
            <span class="ce-mode-label">${this.colorMode}</span>
            <span class="ce-mode-chevron"><img src="/express/code/icons/S2_Icon_ChevronDown_20_N.svg" alt="" width="14" height="14" aria-hidden="true" /></span>
          </button>
          ${this._modeMenuOpen ? html`
            <sp-theme system="spectrum-two" color="light" scale="medium">
              <sp-menu
                id="ce-mode-menu"
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
          <div
            class="ce-sheet ${this.open ? 'open' : ''}"
            role="dialog"
            aria-modal="true"
            aria-label="Edit color"
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

customElements.define('color-edit', ColorEdit);

export default ColorEdit;
