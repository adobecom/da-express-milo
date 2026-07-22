import { LitElement, html } from '../../../../libs/deps/lit-all.min.js';
import { style } from './styles.css.js';
import { loadBadge, loadTooltip } from '../../spectrum/load-spectrum.js';
import { DEFAULT_SHARED_PLACEHOLDERS as CB_DEFAULTS } from '../../i18n/loadColorBlindnessPlaceholders.js';

const TOOLTIP_CSS_PATH = '/express/code/scripts/color-shared/spectrum/styles/tooltip.css';

class ColorConflicts extends LitElement {
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static get styles() {
    return [style];
  }

  static get properties() {
    return {
      conflictsFound: { type: Boolean, attribute: 'conflicts-found' },
      label: { type: String },
      strings: { type: Object },
    };
  }

  constructor() {
    super();
    this.conflictsFound = false;
    this.label = CB_DEFAULTS.summary;
    this.strings = CB_DEFAULTS;
    this._hasRendered = false;
    this._tooltipOpen = false;
    this._isTouchDevice = false;
    this._removeOutsideClickHandler = null;
    this._cleanupPointerBlockers = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    this._isTouchDevice = window.matchMedia?.('(hover: none)')?.matches ?? false;
    loadBadge();
    loadTooltip();
    await this.#loadTooltipStyles();
  }

  firstUpdated() {
    if (!this._isTouchDevice) return;
    const wrap = this.shadowRoot.querySelector('.cc-label-wrap');
    if (!wrap) return;
    const blockTouchPointer = (e) => {
      if (e.pointerType === 'touch') e.stopImmediatePropagation();
    };
    wrap.addEventListener('pointerenter', blockTouchPointer, { capture: true });
    wrap.addEventListener('pointerleave', blockTouchPointer, { capture: true });
    this._cleanupPointerBlockers = () => {
      wrap.removeEventListener('pointerenter', blockTouchPointer, { capture: true });
      wrap.removeEventListener('pointerleave', blockTouchPointer, { capture: true });
    };
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#closeTooltip();
    this._cleanupPointerBlockers?.();
  }

  #closeTooltip() {
    const tooltipEl = this.shadowRoot?.querySelector('sp-tooltip');
    tooltipEl?.removeAttribute('open');
    this._tooltipOpen = false;
    if (this._removeOutsideClickHandler) {
      this._removeOutsideClickHandler();
      this._removeOutsideClickHandler = null;
    }
  }

  #handleLabelClick() {
    if (!this._isTouchDevice) return;
    const tooltipEl = this.shadowRoot?.querySelector('sp-tooltip');
    if (!tooltipEl) return;
    if (this._tooltipOpen) {
      this.#closeTooltip();
      return;
    }
    tooltipEl.setAttribute('open', '');
    this._tooltipOpen = true;
    setTimeout(() => {
      const outsideHandler = (evt) => {
        const path = evt.composedPath?.() || [];
        const wrap = this.shadowRoot?.querySelector('.cc-label-wrap');
        if (wrap && !path.includes(wrap)) {
          this.#closeTooltip();
        }
      };
      document.addEventListener('click', outsideHandler, true);
      this._removeOutsideClickHandler = () => document.removeEventListener('click', outsideHandler, true);
    }, 0);
  }

  async #loadTooltipStyles() {
    try {
      const resp = await fetch(TOOLTIP_CSS_PATH);
      const cssText = await resp.text();
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(cssText);
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        sheet,
      ];
    } catch { /* tooltip overrides are non-critical */ }
  }

  updated() {
    this._hasRendered = true;
  }

  get _statusText() {
    const s = this.strings;
    return this.conflictsFound ? s.statusConflictsFound : s.statusNoConflicts;
  }

  render() {
    const s = this.strings;
    const tooltipContent = s.tooltip;
    const badge = this.conflictsFound
      ? html`
        <sp-badge variant="negative" size="s"
          aria-label="${s.badgeConflictsAria}">
          <sp-icon-alert-triangle slot="icon"></sp-icon-alert-triangle>
          ${s.statusConflictsFound}
        </sp-badge>`
      : html`
        <sp-badge variant="positive" size="s"
          aria-label="${s.badgeNoneAria}">
          <sp-icon-checkmark-circle slot="icon"></sp-icon-checkmark-circle>
          ${s.statusNone}
        </sp-badge>`;

    return html`
      <sp-theme system="spectrum-two" color="light" scale="medium">
        <div class="cc-container" role="group"
          aria-label="${tooltipContent}">
          <span class="cc-label-wrap" tabindex="0"
            @click="${() => this.#handleLabelClick()}">
            <sp-tooltip self-managed placement="top">${tooltipContent}</sp-tooltip>
            <span class="cc-label">${this.label}</span>
          </span>
          ${badge}
        </div>
      </sp-theme>
    `;
  }
}

customElements.define('color-conflicts', ColorConflicts);

export default ColorConflicts;
