import { LitElement, html, classMap } from '../../../deps/lit.js';
import { style, WRAP_COLORS_IN_ROW } from './styles.css.js';

// NOTE: Decorators are removed in favor of static properties for standard ES compatibility
class ColorPalette extends LitElement {
  static get styles() {
    return [style];
  }

  static get properties() {
    return {
      palette: { type: Object },
      wrap: { type: Boolean },
      isActive: { type: Boolean, attribute: 'active' },
      paletteAriaLabel: { type: String, attribute: 'palette-aria-label' },
      searchQuery: { type: String },
      showNameTooltip: { type: Boolean, attribute: 'show-name-tooltip' },
      selectionSource: { type: String, attribute: 'selection-source' },
    };
  }

  constructor() {
    super();
    this.wrap = false;
    this.isActive = false;
    this.searchQuery = '';
    this.showNameTooltip = false;
    this.selectionSource = 'default-palette';

    this.addEventListener('click', this.handleClick);
    this.addEventListener('keydown', this.handleKeyDown);
  }

  palettesTemplate = () => this.palette.colors.map((color, index) => {
    let hex = color;

    if (!color.startsWith('#')) {
      hex = `#${color}`;
      this.palette.colors[index] = hex;
    }
    // eslint-disable-next-line
    return html`<div class="palette" data-testid="palette-color-pill" style="background-color: ${hex}" role="button" aria-label=${this.paletteAriaLabel?.replace('{hex}', hex).replace('{index}', index + 1)}><slot class="btn-slot" name=${`color-picker-button-${index.toString()}`}></slot></div>`;
  });

  handleKeyDown = (event) => {
    if (event.keyCode === 13) {
      this.handleClick();
    }
  };

  handleClick = () => {
    if (this.isActive) {
      return false;
    }

    const event = new CustomEvent('ac-palette-select', {
      bubbles: true,
      composed: true,
      detail: {
        palette: this.palette,
        searchQuery: this.searchQuery,
        selectionSource: this.searchQuery ? 'search-palette' : this.selectionSource,
      },
    });

    this.dispatchEvent(event);
    return true;
  };

  render() {
    if (typeof this.palette === 'undefined' || this.palette.colors.length === 0) {
      return null;
    }

    const classes = { 'color-palette': true, 'custom-outline': true, wrap: this.wrap && this.palette.colors.length > WRAP_COLORS_IN_ROW };

    if (this.showNameTooltip && this.palette.name) {
      return html`
                <sp-overlay-trigger class="icon-button-libraries" placement="top" id="trigger" offset="0">
                    <div class=${classMap(classes)} tabindex="0" slot="trigger">
                        ${this.palettesTemplate()}
                        <slot class="mobile-btn-slot" name='mobile-color-picker-button'></slot>
                    </div>
                    <sp-tooltip slot="hover-content" delayed>
                        ${this.palette.name}
                    </sp-tooltip>
                </sp-overlay-trigger>
            `;
    }

    return html`
            <div class=${classMap(classes)} tabindex="0">
                ${this.palettesTemplate()}
                <slot class="mobile-btn-slot" name='mobile-color-picker-button'></slot>
            </div>
        `;
  }
}

customElements.define('color-palette', ColorPalette);

export default ColorPalette;
