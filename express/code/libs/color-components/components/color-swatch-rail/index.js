
import { LitElement, html } from '../../../deps/lit-all.min.js';
import { getContrastTextColor, isSuperLight } from '../../utils/ColorConversions.js';
import { getFirstFocusableInGroup } from '../../utils/util.js';
import { style } from './styles.css.js';
import { showExpressToast } from '../../../../scripts/color-shared/spectrum/components/express-toast.js';
import { loadIconsRail } from '../../../../scripts/color-shared/spectrum/load-spectrum.js';
import { createExpressTooltip } from '../../../../scripts/color-shared/spectrum/components/express-tooltip.js';
import { announceToScreenReader, clearScreenReaderAnnouncement } from '../../../../scripts/color-shared/spectrum/utils/a11y.js';
import {
  TYPE_ORDER,
  getConflictPairs,
  getConflictingIndices,
  simulateHex as simulateHexService,
} from '../../../../scripts/color-shared/services/createColorBlindnessService.js';
import { DEFAULT_PLACEHOLDERS as SWATCH_RAIL_DEFAULTS } from '../../../../scripts/color-shared/i18n/loadColorSwatchRailPlaceholders.js';


const MAX_SWATCHES = 10;
const MAX_SWATCHES_TWO_ROWS = 10;
const TWO_ROWS_COLORS_PER_ROW = 5;
const MAX_SWATCHES_FOUR_ROWS = 20;

const FOUR_ROWS_ROWS = 4;
const DEFAULT_VERTICAL_MAX_PER_ROW = 5;
const TINT_BAND_STOPS = [
  { id: 'tint-1', mode: 'white', baseWeight: 0.2 },
  { id: 'tint-2', mode: 'white', baseWeight: 0.4 },
  { id: 'tint-3', mode: 'white', baseWeight: 0.7 },
  { id: 'base', mode: 'base', baseWeight: 1 },
  { id: 'shade-1', mode: 'black', baseWeight: 0.75 },
  { id: 'shade-2', mode: 'black', baseWeight: 0.55 },
  { id: 'shade-3', mode: 'black', baseWeight: 0.35 },
];


const DEFAULT_FEATURES = {
  copy: true,
  copyFromHex: true,
  colorPicker: true,
  lock: false,
  hexCode: true,
  trash: false,
  drag: false,
  addLeft: false,
  addRight: false,
  editTint: false,
  colorBlindness: false,
  baseColor: false,
  baseColorReadOnly: false,
  emptyStrip: false,
  editColorDisabled: false,
};


const ALL_FEATURES = {
  copy: true,
  copyFromHex: true,
  colorPicker: true,
  lock: true,
  hexCode: true,
  trash: true,
  drag: true,
  addLeft: true,
  addRight: true,
  editTint: true,
  colorBlindness: true,
  baseColor: true,
  baseColorReadOnly: false,
  emptyStrip: true,
  editColorDisabled: false,
};

function normalizeFeatures(features) {
  if (!features) return { ...DEFAULT_FEATURES };
  if (features === 'all') return { ...ALL_FEATURES };
  if (Array.isArray(features)) {
    const set = new Set(features);
    return {
      copy: set.has('copy'),
      copyFromHex: true,
      colorPicker: set.has('colorPicker'),
      lock: set.has('lock'),
      hexCode: set.has('hexCode') !== false,
      trash: set.has('trash'),
      drag: set.has('drag'),
      addLeft: set.has('addLeft'),
      addRight: set.has('addRight'),
      editTint: set.has('editTint'),
      colorBlindness: set.has('colorBlindness'),
      baseColor: set.has('baseColor'),
      baseColorReadOnly: set.has('baseColorReadOnly'),
      emptyStrip: set.has('emptyStrip'),
      editColorDisabled: set.has('editColorDisabled'),
    };
  }
  return { ...DEFAULT_FEATURES, ...features };
}


const hasIcon = (tagName) => Boolean(window.customElements?.get(tagName));

const iconFallback = (pathD, viewBox = '0 0 20 20') => html`
  <svg class="icon-fallback" viewBox="${viewBox}" aria-hidden="true" focusable="false">
    <path d="${pathD}"></path>
  </svg>
`;

const ICON_MAP = {
  copy: () => (hasIcon('sp-icon-copy')
    ? html`<sp-icon-copy size="m" aria-hidden="true"></sp-icon-copy>`
    : iconFallback('m11.75,18h-7.5c-1.24023,0-2.25-1.00977-2.25-2.25v-7.5c0-1.24023,1.00977-2.25,2.25-2.25.41406,0,.75.33594.75.75s-.33594.75-.75.75c-.41309,0-.75.33691-.75.75v7.5c0,.41309.33691.75.75.75h7.5c.41309,0,.75-.33691.75-.75,0-.41406.33594-.75.75-.75s.75.33594.75.75c0,1.24023-1.00977,2.25-2.25,2.25Zm-5-13c-.41406,0-.75-.33594-.75-.75,0-1.24023,1.00977-2.25,2.25-2.25.41406,0,.75.33594.75.75s-.33594.75-.75.75c-.41309,0-.75.33691-.75.75,0,.41406-.33594.75-.75.75Zm6.25-1.5h-2c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h2c.41406,0,.75.33594.75.75s-.33594.75-.75.75Zm0,10.5h-2c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h2c.41406,0,.75.33594.75.75s-.33594.75-.75.75Zm2.75,0c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75c.41309,0,.75-.33691.75-.75,0-.41406.33594-.75.75-.75s.75.33594.75.75c0,1.24023-1.00977,2.25-2.25,2.25Zm1.5-9c-.41406,0-.75-.33594-.75-.75,0-.41309-.33691-.75-.75-.75-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75c1.24023,0,2.25,1.00977,2.25,2.25,0,.41406-.33594.75-.75.75Zm0,4.75c-.41406,0-.75-.33594-.75-.75v-2c0-.41406.33594-.75.75-.75s.75.33594.75.75v2c0,.41406-.33594.75-.75.75Zm-10.5,0c-.41406,0-.75-.33594-.75-.75v-2c0-.41406.33594-.75.75-.75s.75.33594.75.75v2c0,.41406-.33594.75-.75.75Zm1.5,4.25c-1.24023,0-2.25-1.00977-2.25-2.25,0-.41406.33594-.75.75-.75s.75.33594.75.75c0,.41309.33691.75.75.75.41406,0,.75.33594.75.75s-.33594.75-.75.75Z')),
  editTint: () => html`<img class="icon-tint" src="/express/code/icons/S2_Icon_Tint_20_N.svg" alt="" width="32" height="32" aria-hidden="true">`,
  trash: () => (hasIcon('sp-icon-delete')
    ? html`<sp-icon-delete size="m" aria-hidden="true"></sp-icon-delete>`
    : iconFallback('M7 3h6l1 2h3v2H3V5h3l1-2zm-1 6h2v7H6V9zm6 0h2v7h-2V9zM9 9h2v7H9V9z')),
  drag: () => html`<img class="icon-drag" src="/express/code/icons/drag.svg" alt="" width="32" height="32" aria-hidden="true">`,
  add: () => (hasIcon('sp-icon-add')
    ? html`<sp-icon-add size="m" aria-hidden="true"></sp-icon-add>`
    : iconFallback('M9 3h2v6h6v2h-6v6H9v-6H3V9h6V3z')),

  colorBlindness: () => html`<span class="color-blindness-placeholder" aria-hidden="true">A11y</span>`,
  lockOpen: () => html`<img class="icon-asset icon-lock" src="/express/code/icons/S2_Icon_LockOpen_20_N.svg" alt="" width="20" height="20" aria-hidden="true">`,
  lockClosed: () => html`<img class="icon-asset icon-lock" src="/express/code/icons/S2_Icon_Lock_20_N.svg" alt="" width="20" height="20" aria-hidden="true">`,
  baseColorCircle: () => (hasIcon('sp-icon-circle')
    ? html`<sp-icon-circle size="m" aria-hidden="true"></sp-icon-circle>`
    : html`<svg class="icon-fallback" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="6.25" fill="none" stroke="currentColor" stroke-width="1.8"></circle></svg>`),
  baseColorTarget: () => (hasIcon('sp-icon-target')
    ? html`<sp-icon-target size="m" aria-hidden="true"></sp-icon-target>`
    : html`<svg class="icon-fallback" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="2"></circle><circle cx="10" cy="10" r="2"></circle></svg>`),
};

const icon = (name) => (ICON_MAP[name] ? ICON_MAP[name]() : html``);


const conflictIcon = (strings = SWATCH_RAIL_DEFAULTS) => {
  const label = strings?.conflictDetected || SWATCH_RAIL_DEFAULTS.conflictDetected;
  return html`
  <button
    type="button"
    class="strip-color-blindness-swatch__conflict-icon"
    tabindex="-1"
    aria-label="${label}"
    title="${label}"
  >
    ${hasIcon('sp-icon-alert')
    ? html`<sp-icon-alert size="m" aria-hidden="true"></sp-icon-alert>`
    : iconFallback('M10 2 19 18H1L10 2zm-1 5h2v6H9V7zm0 8h2v2H9v-2z')}
  </button>
`;
};


function buildDisplaySwatchesForFourRowsCB(swatches) {
  const paletteColors = swatches.map((s) => (s?.hex ? { hex: s.hex } : { hex: '#e5e5e5' }));
  const out = paletteColors.map((s) => ({ hex: s.hex, conflict: false }));
  const hexes = paletteColors.map((s) => s.hex);
  TYPE_ORDER.forEach((type) => {
    const pairs = getConflictPairs(hexes, type);
    const conflicting = getConflictingIndices(pairs);
    paletteColors.forEach((s, i) => {
      out.push({
        hex: simulateHexService(s.hex, type),
        conflict: conflicting.has(i),
      });
    });
  });
  return out;
}

export class ColorSwatchRail extends LitElement {
  static get properties() {
    return {
      controller: { attribute: false },
      orientation: { type: String, reflect: true },
      
      embedded: { type: Boolean, reflect: true },
      
      swatchFeatures: { attribute: false },
      verticalMaxPerRow: { type: Number, attribute: 'vertical-max-per-row' },

      hexCopyFirstRowOnly: { type: Boolean, reflect: true, attribute: 'hex-copy-first-row-only' },
      hideBaseColorBadge: { type: Boolean, attribute: 'hide-base-color-badge' },
      hideLock: { type: Boolean, attribute: 'hide-lock' },
      strings: { attribute: false },
    };
  }

  static get styles() {
    return [style];
  }

  constructor() {
    super();
    this.controller = null;
    this.orientation = 'vertical';
    this.embedded = false;
    this.swatchFeatures = null;
    this.verticalMaxPerRow = DEFAULT_VERTICAL_MAX_PER_ROW;
    this.hexCopyFirstRowOnly = false;
    this.hideBaseColorBadge = false;
    this.hideLock = false;
    this.strings = SWATCH_RAIL_DEFAULTS;
    this._controllerUnsubscribe = null;
    this.swatches = [];
    this.baseColorIndex = 0;
    this.tintIndex = null;
    this.lockedByIndex = new Set();
    this._rovingIndex = 0;
    this._dragFromIndex = -1;
    this._touchDragFromIndex = -1;
    this._resizeObserver = null;
    this._boundRailKeydown = (e) => this._handleRailKeydown(e);
    this._boundRailKeydownCapture = (e) => this._handleRailKeydownCapture(e);
    this._boundTouchStart = (e) => this._handleTouchDragStart(e);
    this._boundTouchMove = (e) => this._handleTouchDragMove(e);
    this._boundTouchEnd = (e) => this._handleTouchDragEnd(e);
    this._tooltipDestroys = [];
    this._tooltipRefreshRafId = null;
    this._tooltipRefreshInProgress = false;
    this._tooltipRefreshQueued = false;
    this._tooltipsInitialized = false;
    this._nativePickerOpen = false;
    this._nativePickerCloseTimer = null;
    this._activeEditIndex = null;
  }

  setActiveEditIndex(index) {
    this._activeEditIndex = index ?? null;
    this.requestUpdate();
  }

  get _features() {
    const f = normalizeFeatures(this.swatchFeatures);
    
    if ((this.orientation === 'vertical' || this.orientation === 'stacked') && f.colorBlindness !== false) {
      f.colorBlindness = true;
    }
    return f;
  }

  connectedCallback() {
    super.connectedCallback();
    this.attachController();
    loadIconsRail().then(() => this.requestUpdate());
  }

  firstUpdated() {
    this.shadowRoot?.addEventListener('keydown', this._boundRailKeydown);
    this.addEventListener('keydown', this._boundRailKeydownCapture, true);
    this.shadowRoot?.addEventListener('touchstart', this._boundTouchStart, { passive: false });
    this._scheduleTooltipsRefresh();
    this._tooltipsInitialized = true;
  }

  disconnectedCallback() {
    this.shadowRoot?.removeEventListener('keydown', this._boundRailKeydown);
    this.removeEventListener('keydown', this._boundRailKeydownCapture, true);
    this.shadowRoot?.removeEventListener('touchstart', this._boundTouchStart);
    document.removeEventListener('touchmove', this._boundTouchMove);
    document.removeEventListener('touchend', this._boundTouchEnd);
    document.removeEventListener('touchcancel', this._boundTouchEnd);
    if (this._controllerUnsubscribe) {
      this._controllerUnsubscribe();
      this._controllerUnsubscribe = null;
    }
    if (this._resizeObserver) {
      const rail = this.shadowRoot?.querySelector('.swatch-rail');
      if (rail) this._resizeObserver.unobserve(rail);
      this._resizeObserver = null;
    }
    if (this._tooltipRefreshRafId != null) {
      cancelAnimationFrame(this._tooltipRefreshRafId);
      this._tooltipRefreshRafId = null;
    }
    if (this._subscribeTooltipDebounceId != null) {
      clearTimeout(this._subscribeTooltipDebounceId);
      this._subscribeTooltipDebounceId = null;
    }
    if (this._nativePickerCloseTimer != null) {
      clearTimeout(this._nativePickerCloseTimer);
      this._nativePickerCloseTimer = null;
    }
    this._clearTooltips();
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has('controller')) {
      this.attachController();
    }
    if (changedProperties.has('orientation')) {
      requestAnimationFrame(() => this.requestUpdate());
    }
    requestAnimationFrame(() => {
      this._measureAddSlots();
      const rail = this.shadowRoot?.querySelector('.swatch-rail');
      if (rail?.getAttribute('data-orientation') === 'stacked') {
        requestAnimationFrame(() => this._measureAddSlots());
      }
      this._applyRovingTabindex();
    });
    const tooltipRelevantChange = changedProperties.has('orientation')
      || changedProperties.has('swatchFeatures')
      || changedProperties.has('hexCopyFirstRowOnly')
      || changedProperties.has('embedded');
    if (this._tooltipsInitialized && tooltipRelevantChange) {
      this._scheduleTooltipsRefresh();
    }
  }

  _clearTooltips() {
    this._tooltipDestroys.forEach((destroyFn) => destroyFn?.());
    this._tooltipDestroys.length = 0;
  }

  _scheduleTooltipsRefresh() {
    if (this._nativePickerOpen) {
      this._tooltipRefreshQueued = true;
      return;
    }
    if (this._tooltipRefreshRafId != null) cancelAnimationFrame(this._tooltipRefreshRafId);
    this._tooltipRefreshRafId = requestAnimationFrame(() => {
      this._tooltipRefreshRafId = null;
      this._refreshTooltips();
    });
  }

  async _refreshTooltips() {
    if (this._tooltipRefreshInProgress) {
      this._tooltipRefreshQueued = true;
      return;
    }
    this._tooltipRefreshInProgress = true;
    do {
      this._tooltipRefreshQueued = false;
      this._clearTooltips();
      const root = this.shadowRoot;
      if (!root) continue;

      const titled = root.querySelectorAll?.('[title]') || [];
      titled.forEach((el) => el.removeAttribute('title'));

      // Four-rows can trigger expensive cascades in interactive demo toggles only.
      const isFourRows = (this.orientation || '').toLowerCase() === 'four-rows';
      const isInteractiveDemoRail = !!this.closest('.strip-variant--interactive');
      if (isFourRows && isInteractiveDemoRail) continue;

      const targets = root.querySelectorAll?.('button[aria-label]') || [];
      for (const targetEl of targets) {
        const content = (targetEl.getAttribute('aria-label') || '').trim();
        if (!content) continue;
        targetEl.querySelectorAll?.('sp-tooltip, sp-theme').forEach((el) => el.remove());
        if (targetEl.dataset?.spectrumTooltipTitleGuard !== 'true') {
          targetEl.addEventListener('mouseenter', () => targetEl.removeAttribute('title'));
          targetEl.addEventListener('focusin', () => targetEl.removeAttribute('title'));
          targetEl.dataset.spectrumTooltipTitleGuard = 'true';
        }
        try {
          // eslint-disable-next-line no-await-in-loop
          const tip = await createExpressTooltip({
            targetEl,
            content,
            placement: 'top',
            mountToBody: true,
          });
          this._tooltipDestroys.push(() => tip.destroy());
        } catch (error) {
          // Ignore tooltip errors to avoid impacting rail interactivity.
        }
      }
    } while (this._tooltipRefreshQueued);
    this._tooltipRefreshInProgress = false;
  }

  
  _measureAddSlots() {
    const overlay = this.shadowRoot?.querySelector('.add-slots-overlay');
    if (!overlay) return;
    const rail = this.shadowRoot?.querySelector('.swatch-rail');
    if (!rail) return;
    const col0 = this.shadowRoot?.querySelector('.swatch-column[data-swatch-index="0"]');
    const col1 = this.shadowRoot?.querySelector('.swatch-column[data-swatch-index="1"]');
    const addLeft = overlay.querySelector('.add-slot--left');
    const addRight = overlay.querySelector('.add-slot--right');
    const btnSize = 36;
    const half = btnSize / 2;
    const stacked = rail.getAttribute('data-orientation') === 'stacked';
    const railRect = rail.getBoundingClientRect();

    if (addLeft && col0) {
      const col0Rect = col0.getBoundingClientRect();
      if (stacked) {
        
        addLeft.style.top = `${-half}px`;
        addLeft.style.left = '50%';
        addLeft.style.bottom = '';
      } else {
        const boundary = col0Rect.right - railRect.left;
        addLeft.style.top = '';
        addLeft.style.left = `${boundary - half}px`;
      }
    }
    if (addRight && col1) {
      const col1Rect = col1.getBoundingClientRect();
      if (stacked) {
        
        addRight.style.top = '';
        addRight.style.left = '50%';
        addRight.style.bottom = `${-half}px`;
      } else {
        const boundary = col1Rect.right - railRect.left;
        addRight.style.top = '';
        addRight.style.left = `${boundary - half}px`;
      }
    }

    if (!this._resizeObserver && rail) {
      this._resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => this._measureAddSlots());
      });
      this._resizeObserver.observe(rail);
    }
  }

  attachController() {
    if (this._controllerUnsubscribe) {
      this._controllerUnsubscribe();
      this._controllerUnsubscribe = null;
    }

    if (this.controller && typeof this.controller.subscribe === 'function') {
      this._controllerUnsubscribe = this.controller.subscribe((state) => {
        this.swatches = state.swatches || [];
        this.baseColorIndex = state.baseColorIndex ?? null;
        this.tintIndex = Number.isInteger(state.tintIndex) ? state.tintIndex : null;
        this.lockedByIndex = state.lockedByIndex ?? new Set();
        this.requestUpdate();
        if (this._tooltipsInitialized) {
          // Debounce tooltip refreshes during sustained controller activity.
          // Each _refreshTooltips tears down and rebuilds Spectrum tooltips
          // on every visible button (sp-tooltip in shadow DOM, listeners,
          // observers, ...). At ~12 Hz (color-wheel drag throttle rate) that
          // allocation churn was a major contributor to the iOS Safari
          // WebContent jetsam during long drags. The aria-labels on the
          // buttons are updated immediately by the Lit render above; only
          // the floating Spectrum tooltip nodes are stale until quiescence.
          if (this._subscribeTooltipDebounceId != null) {
            clearTimeout(this._subscribeTooltipDebounceId);
          }
          this._subscribeTooltipDebounceId = setTimeout(() => {
            this._subscribeTooltipDebounceId = null;
            this.updateComplete.then(() => this._scheduleTooltipsRefresh()).catch(() => {});
          }, 150);
        }
      });
    }
  }

  _copyTextFallback(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      const copied = document.execCommand('copy');
      textarea.remove();
      return Boolean(copied);
    } catch {
      return false;
    }
  }

  async _copyText(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fallback supports environments where Clipboard API is unavailable/blocked.
      }
    }
    return this._copyTextFallback(text);
  }

  async _handleCopy(hex) {
    if (!hex) return;
    const s = this.strings || SWATCH_RAIL_DEFAULTS;
    try {
      const copied = await this._copyText(hex);
      if (!copied) throw new Error('clipboard_copy_failed');
      showExpressToast({ message: s.copiedToast || SWATCH_RAIL_DEFAULTS.copiedToast, variant: 'positive', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
      announceToScreenReader(s.copiedToast || SWATCH_RAIL_DEFAULTS.copiedToast);
    } catch (error) {
      showExpressToast({ message: s.copyFailedToast || SWATCH_RAIL_DEFAULTS.copyFailedToast, variant: 'negative', timeout: 2000 });
    }
  }

  _handleLock(index) {
    const next = new Set(this.lockedByIndex || []);
    const wasLocked = next.has(index);
    if (wasLocked) next.delete(index);
    else next.add(index);
    if (this.controller?.setState) {
      this.controller.setState({ lockedByIndex: next });
      const s = this.strings || SWATCH_RAIL_DEFAULTS;
      showExpressToast({ message: wasLocked ? (s.colorUnlockedToast || SWATCH_RAIL_DEFAULTS.colorUnlockedToast) : (s.colorLockedToast || SWATCH_RAIL_DEFAULTS.colorLockedToast), variant: 'neutral', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
    }
  }

  _handleBaseColorToggle(index) {
    const next = this.baseColorIndex === index ? null : index;
    if (this.controller?.setState) {
      this.controller.setState({ baseColorIndex: next });
      const s = this.strings || SWATCH_RAIL_DEFAULTS;
      showExpressToast({ message: next != null ? (s.baseColorSetToast || SWATCH_RAIL_DEFAULTS.baseColorSetToast) : (s.baseColorClearedToast || SWATCH_RAIL_DEFAULTS.baseColorClearedToast), variant: 'neutral', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
    }
  }

  _handleTrash(index) {
    const minSwatches = this._features.minSwatches ?? 0;
    if ((this.swatches?.length ?? 0) <= minSwatches) return;
    const e = new CustomEvent('color-swatch-rail-delete', { bubbles: true, composed: true, detail: { index } });
    if (this.dispatchEvent(e) && !e.defaultPrevented && this.controller?.setState) {
      const swatches = this.swatches.filter((_, i) => i !== index);
      const currentTintIndex = Number.isInteger(this.tintIndex) ? this.tintIndex : null;
      let nextTintIndex = currentTintIndex;
      if (currentTintIndex != null) {
        if (swatches.length === 0) nextTintIndex = null;
        else if (index < currentTintIndex) nextTintIndex = currentTintIndex - 1;
        else if (index === currentTintIndex) nextTintIndex = Math.min(currentTintIndex, swatches.length - 1);
      }
      const nextLocked = new Set();
      for (const i of (this.lockedByIndex || [])) {
        if (i === index) continue;
        nextLocked.add(i > index ? i - 1 : i);
      }
      this.controller.setState({ swatches, tintIndex: nextTintIndex, lockedByIndex: nextLocked });
      const s = this.strings || SWATCH_RAIL_DEFAULTS;
      showExpressToast({ message: s.colorRemovedToast || SWATCH_RAIL_DEFAULTS.colorRemovedToast, variant: 'neutral', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
    }
  }

  
  _handleAddAt(insertIndex, side) {
    if ((this.swatches?.length ?? 0) >= MAX_SWATCHES) return;
    const e = new CustomEvent('color-swatch-rail-add', { bubbles: true, composed: true, cancelable: true, detail: { side, insertIndex } });
    if (this.dispatchEvent(e) && !e.defaultPrevented && this.controller?.setState) {
      const swatches = [...this.swatches];
      swatches.splice(insertIndex, 0, { hex: '#808080' });
      const currentTintIndex = Number.isInteger(this.tintIndex) ? this.tintIndex : null;
      const nextTintIndex = currentTintIndex != null && insertIndex <= currentTintIndex
        ? currentTintIndex + 1
        : currentTintIndex;
      this.controller.setState({ swatches, tintIndex: nextTintIndex });
      const s = this.strings || SWATCH_RAIL_DEFAULTS;
      showExpressToast({ message: s.colorAddedToast || SWATCH_RAIL_DEFAULTS.colorAddedToast, variant: 'positive', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
    }
  }

  _resolveTintIndex() {
    if (Number.isInteger(this.tintIndex) && this.tintIndex >= 0 && this.tintIndex < this.swatches.length) {
      return this.tintIndex;
    }
    return null;
  }

  _normalizeHex(hex) {
    const raw = String(hex || '').trim().replace(/^#/, '');
    const expanded = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;
    return `#${expanded.toUpperCase()}`;
  }

  _hexToRgb(hex) {
    const normalized = this._normalizeHex(hex);
    if (!normalized) return null;
    return [
      Number.parseInt(normalized.slice(1, 3), 16),
      Number.parseInt(normalized.slice(3, 5), 16),
      Number.parseInt(normalized.slice(5, 7), 16),
    ];
  }

  _rgbToHex(r, g, b) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    const toHex = (v) => clamp(v).toString(16).toUpperCase().padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  _mixHex(baseHex, mixHex, mixWeight = 0.5) {
    const base = this._hexToRgb(baseHex);
    const mix = this._hexToRgb(mixHex);
    if (!base || !mix) return this._normalizeHex(baseHex) || '#808080';
    const w = Math.max(0, Math.min(1, mixWeight));
    const inv = 1 - w;
    return this._rgbToHex(
      (base[0] * inv) + (mix[0] * w),
      (base[1] * inv) + (mix[1] * w),
      (base[2] * inv) + (mix[2] * w),
    );
  }

  _buildTintBands(baseHex) {
    const normalized = this._normalizeHex(baseHex) || '#808080';
    return TINT_BAND_STOPS.map((stop) => {
      if (stop.mode === 'base') {
        return { ...stop, hex: normalized };
      }
      if (stop.mode === 'white') {
        return {
          ...stop,
          hex: this._mixHex(normalized, '#FFFFFF', 1 - stop.baseWeight),
        };
      }
      return {
        ...stop,
        hex: this._mixHex(normalized, '#000000', 1 - stop.baseWeight),
      };
    });
  }

  _getTintBandA11yLabel(band, bandIndex, totalBands) {
    const hex = this._normalizeHex(band?.hex) || '#808080';
    const id = String(band?.id || '');
    const s = this.strings || SWATCH_RAIL_DEFAULTS;
    let toneLabel = s.toneBase || SWATCH_RAIL_DEFAULTS.toneBase;
    if (id === 'base') {
      toneLabel = s.toneBase || SWATCH_RAIL_DEFAULTS.toneBase;
    } else if (id.startsWith('tint-')) {
      const suffix = id.split('-')[1] || '';
      toneLabel = `${s.toneTint || SWATCH_RAIL_DEFAULTS.toneTint} ${suffix}`.trim();
    } else if (id.startsWith('shade-')) {
      const suffix = id.split('-')[1] || '';
      toneLabel = `${s.toneShade || SWATCH_RAIL_DEFAULTS.toneShade} ${suffix}`.trim();
    }
    const template = s.tintBandAria || SWATCH_RAIL_DEFAULTS.tintBandAria;
    return template
      .replace('{tone}', toneLabel)
      .replace('{index}', String(bandIndex + 1))
      .replace('{total}', String(totalBands))
      .replace('{hex}', hex);
  }

  _getTintBandButtons(scope) {
    return [...(scope?.querySelectorAll?.('.tint-band-btn.swatch-column-focusable') || [])];
  }

  _activateTintBandFocusTrap(column) {
    const tintButtons = this._getTintBandButtons(column);
    if (!tintButtons.length) return false;

    const allFocusables = [...column.querySelectorAll('.swatch-column-focusable')];
    allFocusables.forEach((el) => el.setAttribute('tabindex', '-1'));
    tintButtons.forEach((el) => el.setAttribute('tabindex', '0'));

    const activeTintButton = tintButtons.find((el) => el.classList.contains('is-active'));
    const firstTintButton = activeTintButton || tintButtons.find((el) => !el.disabled) || tintButtons[0];
    firstTintButton?.focus();
    return true;
  }

  _handleTintBandKeydown(index, bandIndex, event) {
    const key = event?.key;
    if (!key) return;
    const navKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!navKeys.includes(key)) return;

    const container = event.currentTarget?.closest?.('.tint-bands');
    if (!container) return;
    const buttons = [...container.querySelectorAll('.tint-band-btn.swatch-column-focusable')];
    if (!buttons.length) return;

    event.preventDefault();
    event.stopPropagation();

    let nextIndex = bandIndex;
    if (key === 'Home') {
      nextIndex = 0;
    } else if (key === 'End') {
      nextIndex = buttons.length - 1;
    } else if (key === 'ArrowRight' || key === 'ArrowDown') {
      nextIndex = (bandIndex + 1) % buttons.length;
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      nextIndex = (bandIndex - 1 + buttons.length) % buttons.length;
    }

    buttons[nextIndex]?.focus();
  }

  _handleTintBandSelect(index, band, event) {
    event?.stopPropagation?.();
    if (!band?.hex || !this.controller?.setState) return;
    const swatches = [...this.swatches];
    if (!swatches[index]) return;
    const nextHex = this._normalizeHex(band.hex);
    if (!nextHex) return;
    swatches[index] = { ...swatches[index], hex: nextHex };
    this.controller.setState({ swatches, tintIndex: null });
    requestAnimationFrame(() => {
      const column = this.shadowRoot?.querySelector?.(`.swatch-column[data-swatch-index="${index}"]`);
      if (!column) return;
      column.querySelectorAll('.swatch-column-focusable').forEach((el) => el.setAttribute('tabindex', '-1'));
      column.setAttribute('tabindex', '0');
      column.focus();
    });
    announceToScreenReader(`Tint applied. Color ${index + 1} set to ${nextHex}.`, 'assertive', { immediate: true });
    this.dispatchEvent(new CustomEvent('color-swatch-rail-tint-apply', {
      bubbles: true,
      composed: true,
      detail: {
        index,
        tone: band.id,
        hex: nextHex,
      },
    }));
  }

  _handleTintSelect(index, anchorEl = null) {
    const hex = this.swatches[index]?.hex;
    const rect = anchorEl?.getBoundingClientRect?.();
    const anchorRect = rect
      ? {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }
      : null;
    if (this.controller?.setState) {
      this.controller.setState({ tintIndex: index });
    }
    requestAnimationFrame(() => {
      const column = this.shadowRoot?.querySelector?.(`.swatch-column[data-swatch-index="${index}"]`);
      if (!column) return;
      this._activateTintBandFocusTrap(column);
      announceToScreenReader(`Tint options opened for color ${index + 1}.`, 'assertive', { immediate: true });
    });
    this.dispatchEvent(new CustomEvent('color-swatch-rail-tint-select', {
      bubbles: true,
      composed: true,
      detail: { index, hex, anchorRect },
    }));
  }

  _handleColorPicker(index, anchorEl = null) {
    const hex = this.swatches[index]?.hex;
    const rect = anchorEl?.getBoundingClientRect?.();
    const anchorRect = rect
      ? {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }
      : null;
    const e = new CustomEvent('color-swatch-rail-edit', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { index, hex, anchorRect },
    });
    if (this.dispatchEvent(e) && !e.defaultPrevented) {
      const input = this.shadowRoot?.querySelector(`#edit-input-${index}`);
      if (input) {
        this._markNativePickerOpen();
        input.click();
        this._markNativePickerClosedSoon(1500);
      }
    }
  }

  _handleColorBlindness() {
    const colors = (this.swatches || []).map((s) => s?.hex).filter(Boolean);
    this.dispatchEvent(new CustomEvent('color-swatch-rail-color-blindness', {
      bubbles: true,
      composed: true,
      detail: { colors },
    }));
  }

  _onNativePickerChange(index, e) {
    this._markNativePickerOpen();
    const hex = e.target?.value;
    if (hex && this.controller?.setState) {
      const swatches = [...this.swatches];
      swatches[index] = { hex: hex.toUpperCase() };
      this.controller.setState({ swatches });
    }
    this._markNativePickerClosedSoon(250);
  }

  _markNativePickerOpen() {
    this._nativePickerOpen = true;
    if (this._nativePickerCloseTimer != null) {
      clearTimeout(this._nativePickerCloseTimer);
      this._nativePickerCloseTimer = null;
    }
  }

  _markNativePickerClosedSoon(delay = 100) {
    if (this._nativePickerCloseTimer != null) clearTimeout(this._nativePickerCloseTimer);
    this._nativePickerCloseTimer = setTimeout(() => {
      this._nativePickerCloseTimer = null;
      this._nativePickerOpen = false;
      if (this._tooltipsInitialized && this._tooltipRefreshQueued) {
        this._scheduleTooltipsRefresh();
      }
    }, delay);
  }

  _handleDragStart(index, e) {
    if (!this._features.drag) return;
    if (e.target.closest('.icon-button--copy, .icon-button--edit-tint, .icon-button--trash, .icon-button--add, .icon-button--lock, .base-color-badge, .color-blindness-badge, .tint-band-btn')) return;
    this._clearDragVisualState();
    this._dragFromIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.setData('application/x-color-swatch-index', String(index));
    e.target.closest('.swatch-column')?.classList.add('swatch-column--dragging');
  }

  _handleDragEnd(e) {
    this._dragFromIndex = -1;
    e.target.closest('.swatch-column')?.classList.remove('swatch-column--dragging');
    this._clearDragVisualState();
  }

  _clearDragVisualState() {
    this.shadowRoot?.querySelectorAll('.swatch-column--drag-over').forEach((el) => el.classList.remove('swatch-column--drag-over'));
    this.shadowRoot?.querySelectorAll('.swatch-column--dragging').forEach((el) => el.classList.remove('swatch-column--dragging'));
  }

  _setDragOverTarget(target) {
    if (!target || target.classList.contains('swatch-column--empty')) return;
    this.shadowRoot?.querySelectorAll('.swatch-column--drag-over').forEach((el) => {
      if (el !== target) el.classList.remove('swatch-column--drag-over');
    });
    target.classList.add('swatch-column--drag-over');
  }

  _handleDragEnter(e) {
    if (!this._features.drag) return;
    this._setDragOverTarget(e.currentTarget);
  }

  _handleDragOver(e) {
    if (!this._features.drag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this._setDragOverTarget(e.currentTarget);
  }

  _handleDragLeave(e) {
    const col = e.currentTarget;
    const related = e.relatedTarget;
    // During HTML5 drag transitions, some browsers emit dragleave with a null
    // relatedTarget while still inside the same column; avoid clearing hover.
    if (!related) return;
    if (!col?.contains(related)) {
      col.classList.remove('swatch-column--drag-over');
    }
  }

  _handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropTarget = e.currentTarget?.matches?.('.swatch-column[data-swatch-index]')
      ? e.currentTarget
      : e.target.closest('.swatch-column[data-swatch-index]');
    if (!dropTarget) return;
    this._clearDragVisualState();
    const f = this._features;
    if (!f.drag || !this.controller?.setState) return;
    const fromData = e.dataTransfer?.getData('application/x-color-swatch-index') ?? e.dataTransfer?.getData('text/plain') ?? '';
    const fromIndex = fromData !== '' && Number(fromData) >= 0 ? Number(fromData) : this._dragFromIndex;
    const toIndex = Number(dropTarget.dataset?.swatchIndex ?? -1);
    this._dragFromIndex = -1;
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const swatches = [...this.swatches];
    const [removed] = swatches.splice(fromIndex, 1);
    swatches.splice(toIndex, 0, removed);
    const nextLocked = this._reorderLockedIndices(this.lockedByIndex || new Set(), fromIndex, toIndex);
    const stateUpdate = { swatches, lockedByIndex: nextLocked };
    if (this.baseColorIndex != null) {
      stateUpdate.baseColorIndex = this._reorderSingleIndex(this.baseColorIndex, fromIndex, toIndex);
    }
    if (this.tintIndex != null) {
      stateUpdate.tintIndex = this._reorderSingleIndex(this.tintIndex, fromIndex, toIndex);
    }
    const e2 = new CustomEvent('color-swatch-rail-reorder', { bubbles: true, composed: true, detail: { fromIndex, toIndex, swatches } });
    if (this.dispatchEvent(e2) && !e2.defaultPrevented) {
      this.controller.setState(stateUpdate);
      const s = this.strings || SWATCH_RAIL_DEFAULTS;
      showExpressToast({ message: s.reorderedToast || SWATCH_RAIL_DEFAULTS.reorderedToast, variant: 'neutral', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
    }
  }


  _handleTouchDragStart(e) {
    if (!this._features.drag) return;
    const col = e.target.closest('.swatch-column--draggable');
    if (!col || col.closest('.swatch-column--empty')) return;
    const idx = col.getAttribute('data-swatch-index');
    if (idx === null || idx === '') return;
    if (e.target.closest('.icon-button--copy, .icon-button--edit-tint, .icon-button--trash, .icon-button--add, .icon-button--lock, .base-color-badge, .color-blindness-badge, .tint-band-btn, .hex-code')) return;
    e.preventDefault();
    this._touchDragFromIndex = Number(idx);
    col.classList.add('swatch-column--dragging');
    document.addEventListener('touchmove', this._boundTouchMove, { passive: false });
    document.addEventListener('touchend', this._boundTouchEnd, { once: true });
    document.addEventListener('touchcancel', this._boundTouchEnd, { once: true });
  }

  _getSwatchColumnAtPoint(clientX, clientY) {
    const inShadow = this.shadowRoot?.elementFromPoint?.(clientX, clientY);
    const inDocument = document.elementFromPoint(clientX, clientY);
    const under = inShadow || inDocument;
    return under?.closest?.('.swatch-column[data-swatch-index]') || null;
  }

  _handleTouchDragMove(e) {
    if (this._touchDragFromIndex < 0) return;
    e.preventDefault();
    const t = e.touches[0];
    if (!t) return;
    const dropCol = this._getSwatchColumnAtPoint(t.clientX, t.clientY);
    this.shadowRoot?.querySelectorAll('.swatch-column--drag-over').forEach((el) => el.classList.remove('swatch-column--drag-over'));
    if (dropCol && !dropCol.classList.contains('swatch-column--empty')) dropCol.classList.add('swatch-column--drag-over');
  }

  _handleTouchDragEnd(e) {
    document.removeEventListener('touchmove', this._boundTouchMove);
    const fromIndex = this._touchDragFromIndex;
    this._touchDragFromIndex = -1;
    this.shadowRoot?.querySelectorAll('.swatch-column--dragging').forEach((el) => el.classList.remove('swatch-column--dragging'));
    this.shadowRoot?.querySelectorAll('.swatch-column--drag-over').forEach((el) => el.classList.remove('swatch-column--drag-over'));
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dropTarget = this._getSwatchColumnAtPoint(t.clientX, t.clientY);
    if (!dropTarget || !this._features.drag || !this.controller?.setState) return;
    const toIndex = Number(dropTarget.dataset?.swatchIndex ?? -1);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const swatches = [...this.swatches];
    const [removed] = swatches.splice(fromIndex, 1);
    swatches.splice(toIndex, 0, removed);
    const nextLocked = this._reorderLockedIndices(this.lockedByIndex || new Set(), fromIndex, toIndex);
    const stateUpdate = { swatches, lockedByIndex: nextLocked };
    if (this.baseColorIndex != null) {
      stateUpdate.baseColorIndex = this._reorderSingleIndex(this.baseColorIndex, fromIndex, toIndex);
    }
    if (this.tintIndex != null) {
      stateUpdate.tintIndex = this._reorderSingleIndex(this.tintIndex, fromIndex, toIndex);
    }
    const ev = new CustomEvent('color-swatch-rail-reorder', { bubbles: true, composed: true, detail: { fromIndex, toIndex, swatches } });
    if (this.dispatchEvent(ev) && !ev.defaultPrevented) {
      this.controller.setState(stateUpdate);
      const s = this.strings || SWATCH_RAIL_DEFAULTS;
      showExpressToast({ message: s.reorderedToast || SWATCH_RAIL_DEFAULTS.reorderedToast, variant: 'neutral', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
    }
  }

  _reorderLockedIndices(locked, fromIndex, toIndex) {
    const next = new Set();
    for (const i of locked) {
      next.add(this._reorderSingleIndex(i, fromIndex, toIndex));
    }
    return next;
  }

  _reorderSingleIndex(i, fromIndex, toIndex) {
    if (i === fromIndex) return toIndex;
    if (fromIndex < toIndex && i > fromIndex && i <= toIndex) return i - 1;
    if (fromIndex > toIndex && i >= toIndex && i < fromIndex) return i + 1;
    return i;
  }

  
  _handleColumnKeydown(e, _index) {
    const column = e.currentTarget;

    const columnHasFocus = column === document.activeElement
      || column === this.shadowRoot?.activeElement
      || e.target === column;
    if (!columnHasFocus) return;

    // Grid inter-cell navigation (vertical orientation only)
    if (this.orientation === 'vertical' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
      const cells = this._getGridCells();
      const currentIdx = cells.indexOf(column);
      if (currentIdx === -1) return;
      const cols = this._getGridCols(cells);
      let nextIdx = currentIdx;
      if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = cells.length - 1;
      else if (e.key === 'ArrowRight') nextIdx = Math.min(currentIdx + 1, cells.length - 1);
      else if (e.key === 'ArrowLeft') nextIdx = Math.max(currentIdx - 1, 0);
      else if (e.key === 'ArrowDown') nextIdx = Math.min(currentIdx + cols, cells.length - 1);
      else if (e.key === 'ArrowUp') nextIdx = Math.max(currentIdx - cols, 0);
      if (nextIdx !== currentIdx) {
        e.preventDefault();
        this._rovingIndex = nextIdx;
        this._applyRovingTabindex();
        cells[nextIdx].focus();
      }
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const focusables = [...column.querySelectorAll('.swatch-column-focusable')];
      if (!focusables.length) return;
      if (this.orientation === 'vertical') {
        const cells = this._getGridCells();
        const idx = cells.indexOf(column);
        if (idx >= 0) this._rovingIndex = idx;
      }
      column.setAttribute('tabindex', '-1');
      if (this._activateTintBandFocusTrap(column)) return;
      focusables.forEach((el) => el.setAttribute('tabindex', '0'));
      const firstVisible = getFirstFocusableInGroup(column, '.swatch-column-focusable') || focusables[0];
      firstVisible.focus();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      column.querySelectorAll('.swatch-column-focusable').forEach((el) => el.setAttribute('tabindex', '-1'));
      if (this.orientation === 'vertical') {
        const cells = this._getGridCells();
        const idx = cells.indexOf(column);
        if (idx >= 0) this._rovingIndex = idx;
        this._applyRovingTabindex();
      } else {
        column.setAttribute('tabindex', '0');
      }
      column.focus();
      return;
    }

  }


  _trapTabInRail(e) {
    if (e.key !== 'Tab') return false;
    const isFocusable = e.target?.classList?.contains('swatch-column-focusable');
    if (!isFocusable) return false;

    const tintContainer = e.target?.closest?.('.tint-bands');
    const isTintBand = e.target?.classList?.contains('tint-band-btn');
    if (tintContainer && isTintBand) {
      const tintButtons = this._getTintBandButtons(tintContainer);
      if (tintButtons.length) {
        e.preventDefault();
        const currentIndex = tintButtons.indexOf(e.target);
        const step = e.shiftKey ? -1 : 1;
        const fallbackIndex = e.shiftKey ? tintButtons.length - 1 : 0;
        const startIndex = currentIndex === -1 ? fallbackIndex : currentIndex;
        const nextIndex = (startIndex + step + tintButtons.length) % tintButtons.length;
        tintButtons[nextIndex]?.focus();
        return true;
      }
    }

    // For vertical grid: Tab/Shift+Tab navigates to next/prev widget across all cells
    if (this.orientation === 'vertical') {
      const currentCell = e.target.closest('.swatch-column');
      const cells = this._getGridCells();
      const currentCellIdx = currentCell ? cells.indexOf(currentCell) : -1;
      const currentCellWidgets = currentCell
        ? [...currentCell.querySelectorAll('.swatch-column-focusable')]
        : [];
      const currentWidgetIdx = currentCellWidgets.indexOf(e.target);

      const exitGrid = () => {
        if (currentCell) currentCell.querySelectorAll('.swatch-column-focusable').forEach((el) => el.setAttribute('tabindex', '-1'));
        if (currentCellIdx >= 0) this._rovingIndex = currentCellIdx;
        this._applyRovingTabindex();
      };

      const enterCell = (cell, fromCell, last = false) => {
        if (fromCell) fromCell.querySelectorAll('.swatch-column-focusable').forEach((el) => el.setAttribute('tabindex', '-1'));
        const widgets = [...cell.querySelectorAll('.swatch-column-focusable')];
        cell.setAttribute('tabindex', '-1');
        widgets.forEach((el) => el.setAttribute('tabindex', '0'));
        const cellIdx = cells.indexOf(cell);
        if (cellIdx >= 0) this._rovingIndex = cellIdx;
        const target = last ? widgets[widgets.length - 1] : widgets[0];
        if (target) target.focus();
        else { this._applyRovingTabindex(); cell.focus(); }
      };

      if (!e.shiftKey) {
        if (currentWidgetIdx < currentCellWidgets.length - 1) {
          e.preventDefault();
          currentCellWidgets[currentWidgetIdx + 1].focus();
          return true;
        }
        if (currentCellIdx + 1 < cells.length) {
          e.preventDefault();
          enterCell(cells[currentCellIdx + 1], currentCell, false);
          return true;
        }
        exitGrid();
        return false;
      } else {
        if (currentWidgetIdx > 0) {
          e.preventDefault();
          currentCellWidgets[currentWidgetIdx - 1].focus();
          return true;
        }
        if (currentCellIdx - 1 >= 0) {
          e.preventDefault();
          enterCell(cells[currentCellIdx - 1], currentCell, true);
          return true;
        }
        exitGrid();
        return false;
      }
    }

    e.preventDefault();
    return true;
  }

  
  _handleRailKeydownCapture(e) {
    if (e.key !== 'Escape') return;
    const col = e.target?.closest?.('.swatch-column');
    const insideColumn = col && col.contains(e.target) && e.target !== col;
    if (!insideColumn) return;
    e.preventDefault();
    e.stopPropagation();
    clearScreenReaderAnnouncement();
    const swatchIndex = col.getAttribute('data-swatch-index');
    const colLabel = col.getAttribute('aria-label') || 'Color strip';
    col.querySelectorAll('.swatch-column-focusable').forEach((el) => el.setAttribute('tabindex', '-1'));
    col.setAttribute('tabindex', '0');
    const host = this;
    requestAnimationFrame(() => {
      const currentCol = swatchIndex != null && swatchIndex !== ''
        ? host.shadowRoot?.querySelector?.(`.swatch-column[data-swatch-index="${swatchIndex}"]`)
        : host.shadowRoot?.querySelector?.('.swatch-column--empty');
      (currentCol || col).focus();
        requestAnimationFrame(() => {
          announceToScreenReader(`Focus on ${colLabel}. Use arrow keys to move between colors, Enter to activate.`, 'assertive', { immediate: true });
        });
      });
  }

  
  _handleRailKeydown(e) {
    const col = e.target.closest('.swatch-column');
    const isFocusable = e.target?.classList?.contains('swatch-column-focusable');
    const insideColumn = col && col.contains(e.target) && e.target !== col;

    
    if (e.key === 'Tab' && this._trapTabInRail(e)) return;
    if (e.key === 'Escape' && e.target?.classList?.contains('tint-band-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const swatchIndex = col?.getAttribute('data-swatch-index');
      this.controller?.setState?.({ tintIndex: null });
      requestAnimationFrame(() => {
        const currentCol = swatchIndex != null && swatchIndex !== ''
          ? this.shadowRoot?.querySelector?.(`.swatch-column[data-swatch-index="${swatchIndex}"]`)
          : col;
        currentCol?.querySelector?.('.icon-button--edit-tint')?.focus();
      });
      return;
    }
    if (e.key === 'Escape' && insideColumn) {
      e.preventDefault();
      e.stopPropagation();
      clearScreenReaderAnnouncement();
      const swatchIndex = col.getAttribute('data-swatch-index');
      const colLabel = col.getAttribute('aria-label') || 'Color strip';
      col.querySelectorAll('.swatch-column-focusable').forEach((el) => el.setAttribute('tabindex', '-1'));
      if (this.orientation === 'vertical') {
        const cells = this._getGridCells();
        const idx = cells.indexOf(col);
        if (idx >= 0) this._rovingIndex = idx;
        this._applyRovingTabindex();
      } else {
        col.setAttribute('tabindex', '0');
      }
      requestAnimationFrame(() => {
        const currentCol = swatchIndex != null && swatchIndex !== ''
          ? this.shadowRoot?.querySelector?.(`.swatch-column[data-swatch-index="${swatchIndex}"]`)
          : this.shadowRoot?.querySelector?.('.swatch-column--empty');
        (currentCol || col).focus();
        requestAnimationFrame(() => {
          announceToScreenReader(`Focus on ${colLabel}. Use arrow keys to move between colors, Enter to activate.`, 'assertive', { immediate: true });
        });
      });
      return;
    }

    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) || !col || !isFocusable) return;
    const tintContainer = e.target?.closest?.('.tint-bands');
    const isTintBand = e.target?.classList?.contains('tint-band-btn');
    const focusables = (tintContainer && isTintBand)
      ? this._getTintBandButtons(tintContainer)
      : [...col.querySelectorAll('.swatch-column-focusable')];
    const curr = focusables.indexOf(e.target);
    if (curr === -1) return;
    e.preventDefault();
    const next = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? curr + 1 : curr - 1;
    const nextIdx = next < 0 ? focusables.length - 1 : next % focusables.length;
    focusables[nextIdx].focus();
  }


  _handleColumnFocusout(e) {
    const column = e.currentTarget;
    const related = e.relatedTarget;
    if (related && column.contains(related)) return;
    column.querySelectorAll('.swatch-column-focusable').forEach((el) => el.setAttribute('tabindex', '-1'));
    if (this.orientation !== 'vertical') {
      column.setAttribute('tabindex', '0');
    }
  }

  _getGridCells() {
    return [
      ...(this.shadowRoot?.querySelectorAll(
        '.swatch-column[data-swatch-index], .swatch-column--empty',
      ) || []),
    ];
  }

  _getGridCols(cells) {
    const rail = this.shadowRoot?.querySelector('.swatch-rail[data-orientation="vertical"]');
    if (!rail) return cells.length;
    const maxPerRow = rail.style.getPropertyValue('--vertical-max-per-row');
    if (maxPerRow) {
      const n = parseInt(maxPerRow, 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return cells.length;
  }

  _applyRovingTabindex() {
    if (this.orientation !== 'vertical') return;
    const cells = this._getGridCells();
    if (!cells.length) return;
    const activeEl = this.shadowRoot?.activeElement;
    if (activeEl?.classList?.contains('swatch-column-focusable')) return;
    const idx = Math.min(Math.max(0, this._rovingIndex ?? 0), cells.length - 1);
    cells.forEach((cell, i) => cell.setAttribute('tabindex', i === idx ? '0' : '-1'));
  }

  render() {
    const orientation = (this.orientation || 'vertical').toLowerCase();
    const f = this._features;
    const swatches = this.swatches || [];
    const editDisabled = f.editColorDisabled;
    const s = this.strings || SWATCH_RAIL_DEFAULTS;
    const sFallback = SWATCH_RAIL_DEFAULTS;
    const labelAddColor = s.addColor || sFallback.addColor;
    const labelAddColorLeft = s.addColorLeft || sFallback.addColorLeft;
    const labelAddColorRight = s.addColorRight || sFallback.addColorRight;
    const labelLockColor = s.lockColor || sFallback.lockColor;
    const labelUnlockColor = s.unlockColor || sFallback.unlockColor;
    const labelEditTint = s.editTint || sFallback.editTint;
    const labelEditColor = s.editColor || sFallback.editColor;
    const labelCopyHex = s.copyHex || sFallback.copyHex;
    const labelDeleteColor = s.deleteColor || sFallback.deleteColor;
    const labelDragToReorder = s.dragToReorder || sFallback.dragToReorder;
    const labelBaseColor = s.baseColor || sFallback.baseColor;
    const labelBaseColorActiveAria = s.baseColorActiveAria || sFallback.baseColorActiveAria;
    const labelSetAsBaseColor = s.setAsBaseColor || sFallback.setAsBaseColor;
    const labelSimulatedColor = s.simulatedColor || sFallback.simulatedColor;
    const labelColorPaletteAria = s.colorPaletteAria || sFallback.colorPaletteAria;
    const colorStripTemplate = s.colorStripAria || sFallback.colorStripAria;
    const colorPositionTemplate = s.colorPositionAria || sFallback.colorPositionAria;
    const tintAndShadeTemplate = s.tintAndShadeAria || sFallback.tintAndShadeAria;

    const renderAddButton = (side, insertIndex) => {
      if (side === 'left' && !f.addLeft) return '';
      if (side === 'right' && !f.addRight) return '';
      const label = side === 'left' ? labelAddColorLeft : labelAddColorRight;
      const btn = html`<button type="button" class="icon-button icon-button--add" part="add-button" @click=${() => this._handleAddAt(insertIndex, side)} aria-label="${label}" title="${label}">${icon('add')}</button>`;
      return html`<div class="add-slot add-slot--${side}">${btn}</div>`;
    };

    const isStacked = orientation === 'stacked';
    const canAddGlobal = swatches.length < MAX_SWATCHES;
    const renderSwatch = (swatch, index, opts = {}) => {
      const isSimulatedCell = opts.isSimulatedCell === true;
      if (isSimulatedCell) {
        const textColor = getContrastTextColor(swatch.hex);
        const shadow = textColor === '#ffffff' ? '0 0 2px rgba(0,0,0,0.5)' : '0 0 2px rgba(255,255,255,0.5)';
        const simulatedSuperLight = isSuperLight(swatch.hex);
        const simClasses = ['swatch-column', 'swatch-column--simulated', simulatedSuperLight && 'swatch-column--super-light', opts.cornerClass || ''].filter(Boolean).join(' ');
        return html`
          <div class="${simClasses}" tabindex="-1" role="group" aria-label="${labelSimulatedColor}"
            style="background-color: ${swatch.hex}; --swatch-text-color: ${textColor}; --swatch-text-shadow: var(--swatch-text-shadow-override, ${shadow}); --swatch-icon-color: ${textColor};"
            data-swatch-index="${index}">
            ${swatch.conflict ? conflictIcon(s) : ''}
          </div>
        `;
      }
      const isLocked = (this.lockedByIndex || new Set()).has(index);
      const isBase = f.baseColor && index === this.baseColorIndex;
      const isBaseReadOnly = f.baseColorReadOnly && index === this.baseColorIndex;
      const showAddLeftHere = !isStacked && canAddGlobal && f.addLeft;
      const showAddRightHere = !isStacked && canAddGlobal && f.addRight;

      const textColor = getContrastTextColor(swatch.hex);
      const superLight = isSuperLight(swatch.hex);
      const useLightIcons = textColor.toUpperCase() === '#FFFFFF';
      const shadow = useLightIcons ? '0 0 2px rgba(0,0,0,0.5)' : '0 0 2px rgba(255,255,255,0.5)';
      const tintMode = f.editTint && !f.colorPicker;
      const resolvedTintIndex = this._resolveTintIndex();
      const isTintSelected = tintMode && resolvedTintIndex != null && index === resolvedTintIndex;
      const tintBands = isTintSelected ? this._buildTintBands(swatch.hex) : [];
      const showEdit = (f.colorPicker || f.editTint) && !editDisabled;
      const atMinSwatches = f.minSwatches != null && swatches.length <= f.minSwatches;
      
      
      const showHexCopyForThisSwatch = !(orientation === 'four-rows' && this.hexCopyFirstRowOnly && index >= swatches.length);

      
      const showBaseColorBadge = f.baseColor && !this.hideBaseColorBadge;
      const baseColorIcon = showBaseColorBadge
        ? (
          isBase && !f.colorBlindness
            ? html`<span class="base-color-icon base-color-icon--target">${icon('baseColorTarget')}</span>`
            : icon(isBase ? 'baseColorTarget' : 'baseColorCircle')
        )
        : '';
      const baseColorBadgeClass = `base-color-badge${!isBase ? ' base-color-badge--hover-only' : ''}${isBase ? ' base-color-badge--active' : ''}`;
      const trashDisabled = atMinSwatches;
      const topLeftIcons = html`
        <div class="top-actions top-actions--left">
          ${showBaseColorBadge ? html`
            <button
              type="button"
              class="${baseColorBadgeClass} swatch-column-focusable"
              tabindex="-1"
              aria-label=${isBase ? labelBaseColorActiveAria : labelSetAsBaseColor}
              title=${isBase ? labelBaseColorActiveAria : labelSetAsBaseColor}
              @click=${(e) => { e.stopPropagation(); if (!isBase) this._handleBaseColorToggle(index); }}
            >${baseColorIcon}</button>
          `: ''}
          ${isBaseReadOnly ? html`
            <span class="base-color-badge base-color-badge--active base-color-badge--readonly" aria-label="${labelBaseColor}">${icon('baseColorTarget')}</span>` : ''}
        </div>
      `;
      const topRightIcons = html`
        <div class="top-actions top-actions--right">
          ${f.lock && !this.hideLock ? html`<button type="button" class="icon-button icon-button--lock swatch-column-focusable" tabindex="-1" @click=${() => this._handleLock(index)} aria-label=${isLocked ? labelUnlockColor : labelLockColor} title=${isLocked ? labelUnlockColor : labelLockColor}>${icon(isLocked ? 'lockClosed' : 'lockOpen')}</button>` : ''}
          ${f.editTint && showEdit ? html`<button type="button" class="icon-button icon-button--edit-tint swatch-column-focusable" tabindex="-1" @click=${tintMode ? (ev) => this._handleTintSelect(index, ev.currentTarget) : (ev) => this._handleColorPicker(index, ev.currentTarget)} aria-label="${labelEditTint}" title=${swatch.hex.toUpperCase()}>${icon('editTint')}</button>` : ''}
          ${f.drag ? html`
            <button
              type="button"
              class="icon-button icon-button--drag swatch-column-focusable"
              tabindex="-1"
              aria-label="${labelDragToReorder}"
              title="${labelDragToReorder}"
              draggable="true"
              @dragstart=${(ev) => this._handleDragStart(index, ev)}
              @dragend=${this._handleDragEnd}
            >${icon('drag')}</button>
          ` : ''}
          ${f.trash ? html`<button type="button" class="icon-button icon-button--trash swatch-column-focusable" tabindex="-1" @click=${() => this._handleTrash(index)} aria-label="${labelDeleteColor}" title="${labelDeleteColor}" ?disabled=${trashDisabled} aria-disabled="${trashDisabled}">${icon('trash')}</button>` : ''}
        </div>
      `;
      
      const stackedIcons = html`
        <div class="stacked-row__icons">
          ${showBaseColorBadge ? html`
            <button
              type="button"
              class="${baseColorBadgeClass} swatch-column-focusable"
              tabindex="-1"
              aria-label=${isBase ? labelBaseColorActiveAria : labelSetAsBaseColor}
              title=${isBase ? labelBaseColorActiveAria : labelSetAsBaseColor}
              @click=${(e) => { e.stopPropagation(); if (!isBase) this._handleBaseColorToggle(index); }}
            >${baseColorIcon}</button>
          ` : ''}
          ${isBaseReadOnly ? html`<span class="base-color-badge base-color-badge--active base-color-badge--readonly" aria-label="${labelBaseColor}">${icon('baseColorTarget')}</span>` : ''}
          ${f.copy ? html`<button type="button" class="icon-button icon-button--copy swatch-column-focusable" tabindex="-1" @click=${(e) => this._handleCopy(swatch.hex, e.currentTarget)} aria-label="${labelCopyHex}" title="${labelCopyHex}">${icon('copy')}</button>` : ''}
          ${f.lock && !this.hideLock ? html`<button type="button" class="icon-button icon-button--lock swatch-column-focusable" tabindex="-1" @click=${() => this._handleLock(index)} aria-label=${isLocked ? labelUnlockColor : labelLockColor} title=${isLocked ? labelUnlockColor : labelLockColor}>${icon(isLocked ? 'lockClosed' : 'lockOpen')}</button>` : ''}
          ${f.editTint && showEdit ? html`<button type="button" class="icon-button icon-button--edit-tint swatch-column-focusable" tabindex="-1" @click=${tintMode ? (ev) => this._handleTintSelect(index, ev.currentTarget) : (ev) => this._handleColorPicker(index, ev.currentTarget)} aria-label="${labelEditTint}" title=${swatch.hex.toUpperCase()}>${icon('editTint')}</button>` : ''}
          ${f.trash ? html`<button type="button" class="icon-button icon-button--trash swatch-column-focusable" tabindex="-1" @click=${() => this._handleTrash(index)} aria-label="${labelDeleteColor}" title="${labelDeleteColor}" ?disabled=${trashDisabled} aria-disabled="${trashDisabled}">${icon('trash')}</button>` : ''}
          ${f.drag ? html`
            <button
              type="button"
              class="icon-button icon-button--drag swatch-column-focusable"
              tabindex="-1"
              aria-label="${labelDragToReorder}"
              title="${labelDragToReorder}"
              draggable="true"
              @dragstart=${(ev) => this._handleDragStart(index, ev)}
              @dragend=${this._handleDragEnd}
            >${icon('drag')}</button>
          ` : ''}
        </div>
      `;
      const stackedContent = html`
        <div class="bottom-info bottom-info--stacked" part="bottom-info">
          ${showEdit ? html`<input type="color" id="edit-input-${index}" class="edit-input-native" tabindex="-1" aria-hidden="true" value=${swatch.hex} @input=${(ev) => this._onNativePickerChange(index, ev)} @change=${() => this._markNativePickerClosedSoon(50)} @blur=${() => this._markNativePickerClosedSoon(50)} />` : ''}
          ${f.hexCode ? ((showEdit || f.copyFromHex) ? html`<button type="button" class="hex-code hex-code--${showEdit ? 'editable' : 'copyable'} swatch-column-focusable${this._activeEditIndex === index ? ' hex-code--editor-open' : ''}" tabindex="-1" @click=${showEdit ? (ev) => this._handleColorPicker(index, ev.currentTarget) : (ev) => this._handleCopy(swatch.hex, ev.currentTarget)} aria-label=${showEdit ? labelEditColor : labelCopyHex} title=${showEdit ? labelEditColor : labelCopyHex}>${swatch.hex}</button>` : html`<span class="hex-code hex-code--static">${swatch.hex}</span>`) : ''}
        </div>
        ${stackedIcons}
      `;

      const swatchClasses = [
        'swatch-column',
        isLocked && 'locked',
        isBase && 'base-color',
        tintMode && 'swatch-column--tint-mode',
        isTintSelected && 'swatch-column--tint-selected',
        f.drag && 'swatch-column--draggable',
        superLight && 'swatch-column--super-light',
        f.rightActionsHoverOnly && 'swatch-column--right-actions-hover-only',
        opts.cornerClass || ''
      ].filter(Boolean).join(' ');

      const stripAriaLabel = orientation === 'vertical'
        ? colorStripTemplate.replace('{hex}', swatch.hex)
        : colorPositionTemplate
            .replace('{index}', String(index + 1))
            .replace('{hex}', swatch.hex);
      const tintAndShadeAriaLabel = tintAndShadeTemplate.replace('{index}', String(index + 1));
      return html`
        <div class="${swatchClasses}"
          data-contrast="${useLightIcons ? 'dark' : 'light'}"
          style="background-color: ${swatch.hex}; --swatch-base-color: ${swatch.hex}; --swatch-text-color: ${textColor}; --swatch-text-shadow: var(--swatch-text-shadow-override, ${shadow}); --swatch-icon-filter: ${useLightIcons ? 'brightness(0) invert(1)' : 'brightness(0)'}"
          data-swatch-index="${index}"
          tabindex="${orientation === 'vertical' ? '-1' : '0'}"
          role="${orientation === 'vertical' ? 'gridcell' : 'group'}"
          aria-label="${stripAriaLabel}"
          @keydown=${(ev) => this._handleColumnKeydown(ev, index)}
          @focusout=${(ev) => this._handleColumnFocusout(ev)}
          ?draggable=${f.drag}
          @dragstart=${(ev) => f.drag && this._handleDragStart(index, ev)}
          @dragend=${this._handleDragEnd}
          @dragenter=${this._handleDragEnter}
          @dragover=${this._handleDragOver}
          @dragleave=${this._handleDragLeave}
          @drop=${this._handleDrop}>
          ${isTintSelected ? html`
            <div
              class="tint-bands"
              role="radiogroup"
              aria-label="${tintAndShadeAriaLabel}"
              aria-orientation=${isStacked ? 'horizontal' : 'vertical'}>
              ${tintBands.map((band, bandIndex) => {
                const isActiveTone = this._normalizeHex(band.hex) === this._normalizeHex(swatch.hex);
                return html`
                  <button
                    type="button"
                    class="tint-band-btn swatch-column-focusable ${isActiveTone ? 'is-active' : ''}"
                    tabindex="-1"
                    style="--tint-band-color: ${band.hex}"
                    role="radio"
                    aria-checked=${isActiveTone ? 'true' : 'false'}
                    @keydown=${(ev) => this._handleTintBandKeydown(index, bandIndex, ev)}
                    @click=${(ev) => this._handleTintBandSelect(index, band, ev)}
                    aria-label=${this._getTintBandA11yLabel(band, bandIndex, tintBands.length)}
                  ></button>
                `;
              })}
            </div>
          ` : ''}
          ${!isStacked ? html`
            <div class="top-actions-row">
              ${topLeftIcons}
              ${topRightIcons}
            </div>
          ` : html`<div class="stacked-row">${stackedContent}</div>`}
          ${!isStacked ? html`<div class="bottom-info" part="bottom-info">
            ${showEdit && showHexCopyForThisSwatch ? html`<input type="color" id="edit-input-${index}" class="edit-input-native" tabindex="-1" aria-hidden="true" value=${swatch.hex} @input=${(ev) => this._onNativePickerChange(index, ev)} @change=${() => this._markNativePickerClosedSoon(50)} @blur=${() => this._markNativePickerClosedSoon(50)} />` : ''}
            ${f.hexCode && showHexCopyForThisSwatch ? (
              showEdit || f.copyFromHex
                ? html`<button type="button" class="hex-code hex-code--${showEdit ? 'editable' : 'copyable'} swatch-column-focusable${this._activeEditIndex === index ? ' hex-code--editor-open' : ''}" tabindex="-1" @click=${showEdit ? (ev) => this._handleColorPicker(index, ev.currentTarget) : (ev) => this._handleCopy(swatch.hex, ev.currentTarget)} aria-label=${showEdit ? labelEditColor : labelCopyHex} title=${showEdit ? labelEditColor : labelCopyHex}>${swatch.hex}</button>`
                : html`<span class="hex-code hex-code--static">${swatch.hex}</span>`
            ) : ''}
            <div class="bottom-info__actions">
              ${f.copy && showHexCopyForThisSwatch ? html`<button type="button" class="icon-button icon-button--copy swatch-column-focusable" tabindex="-1" @click=${(e) => this._handleCopy(swatch.hex, e.currentTarget)} aria-label="${labelCopyHex}" title="${labelCopyHex}">${icon('copy')}</button>` : ''}
            </div>
          </div>` : ''}
          ${showAddLeftHere ? html`<div class="add-slot add-slot--column add-slot--column-left">
            <button type="button" class="icon-button icon-button--add swatch-column-focusable" part="add-button" tabindex="-1" @click=${() => this._handleAddAt(index, 'left')} aria-label="${labelAddColorLeft}" title="${labelAddColorLeft}">${icon('add')}</button>
          </div>` : ''}
          ${showAddRightHere ? html`<div class="add-slot add-slot--column add-slot--column-right">
            <button type="button" class="icon-button icon-button--add swatch-column-focusable" part="add-button" tabindex="-1" @click=${() => this._handleAddAt(index + 1, 'right')} aria-label="${labelAddColorRight}" title="${labelAddColorRight}">${icon('add')}</button>
          </div>` : ''}
        </div>
      `;
    };

    const renderEmptyStrip = () => {
      const max = orientation === 'two-rows' ? MAX_SWATCHES_TWO_ROWS : MAX_SWATCHES;
      if (!f.emptyStrip || (swatches?.length ?? 0) >= max) return '';
      const label = labelAddColor;
      return html`
        <div class="swatch-column swatch-column--empty" tabindex="${orientation === 'vertical' ? '-1' : '0'}" role="${orientation === 'vertical' ? 'gridcell' : 'group'}" aria-label="${label}"
          @keydown=${(ev) => this._handleColumnKeydown(ev, swatches.length)}
          @focusout=${(ev) => this._handleColumnFocusout(ev)}>
          <button type="button" class="icon-button icon-button--add swatch-column-focusable" tabindex="-1" part="add-button" @click=${() => this._handleAddAt(swatches.length, 'end')} aria-label="${label}" title="${label}">${icon('add')}</button>
        </div>
      `;
    };

    if (!swatches.length && !f.emptyStrip && !f.addLeft && !f.addRight) return html``;

    
    if (orientation === 'four-rows') {
      const colCount = swatches.length;
      const showEmpty = f.emptyStrip && swatches.length < MAX_SWATCHES_FOUR_ROWS;
      const useCBData = this.hexCopyFirstRowOnly;
      const displaySwatches = useCBData ? buildDisplaySwatchesForFourRowsCB(swatches) : null;
      const allItems = [];
      for (let r = 0; r < FOUR_ROWS_ROWS; r += 1) {
        const start = r * colCount;
        const rowSwatches = useCBData && displaySwatches
          ? displaySwatches.slice(start, start + colCount)
          : swatches.slice(start, start + colCount);
        const isSimulatedRow = useCBData && r >= 1;
        const isLastRow = r === FOUR_ROWS_ROWS - 1;
        rowSwatches.forEach((swatch, c) => {
          const idx = start + c;
          let cornerClass = '';
          if (r === 0 && c === rowSwatches.length - 1) cornerClass = 'corner-top-right';
          if (isLastRow && c === 0) cornerClass = 'corner-bottom-left';
          allItems.push(renderSwatch(swatch, idx, { isSimulatedCell: isSimulatedRow, cornerClass }));
        });
        const showEmptySlot = isLastRow && showEmpty && (useCBData ? swatches.length < MAX_SWATCHES_FOUR_ROWS : rowSwatches.length < colCount);
        if (showEmptySlot) {
          allItems.push(html`
            <div class="swatch-column swatch-column--empty" tabindex="0" role="group" aria-label="${labelAddColor}"
              @keydown=${(ev) => this._handleColumnKeydown(ev, swatches.length)}
              @focusout=${(ev) => this._handleColumnFocusout(ev)}>
              <button type="button" class="icon-button icon-button--add swatch-column-focusable" tabindex="-1" part="add-button" @click=${() => this._handleAddAt(swatches.length, 'end')} aria-label="${labelAddColor}" title="${labelAddColor}">${icon('add')}</button>
            </div>
          `);
        }
      }
      return html`
        <div class="swatch-rail vertical--four-rows" data-orientation="vertical" style="--four-rows-cols: ${colCount}">
          ${allItems}
        </div>
      `;
    }

    
    if (orientation === 'two-rows') {
      const maxSwatches = MAX_SWATCHES_TWO_ROWS;
      const row0Swatches = swatches.slice(0, TWO_ROWS_COLORS_PER_ROW);
      const row1Swatches = swatches.slice(TWO_ROWS_COLORS_PER_ROW, TWO_ROWS_COLORS_PER_ROW * 2);
      const showEmpty = f.emptyStrip && swatches.length < maxSwatches;
      const renderRow = (rowSwatches, rowIndex) => {
        const items = rowSwatches.map((swatch, colIndex) => renderSwatch(swatch, rowIndex * TWO_ROWS_COLORS_PER_ROW + colIndex));
        if (rowIndex === 1 && showEmpty && rowSwatches.length < TWO_ROWS_COLORS_PER_ROW) {
          items.push(html`
            <div class="swatch-column swatch-column--empty" tabindex="0" role="group" aria-label="${labelAddColor}"
              @keydown=${(ev) => this._handleColumnKeydown(ev, swatches.length)}
              @focusout=${(ev) => this._handleColumnFocusout(ev)}>
              <button type="button" class="icon-button icon-button--add swatch-column-focusable" tabindex="-1" part="add-button" @click=${() => this._handleAddAt(swatches.length, 'end')} aria-label="${labelAddColor}" title="${labelAddColor}">${icon('add')}</button>
            </div>
          `);
        }
        return html`<div class="swatch-rail__row" data-row-index="${rowIndex}">${items}</div>`;
      };
      const row0 = row0Swatches.length ? renderRow(row0Swatches, 0) : renderRow([{ hex: '#e5e5e5' }], 0);
      const row1 = row1Swatches.length ? renderRow(row1Swatches, 1) : (showEmpty ? renderRow([], 1) : renderRow([{ hex: '#e5e5e5' }], 1));
      return html`
        <div class="swatch-rail" data-orientation="two-rows">
          ${row0}
          ${row1}
        </div>
      `;
    }

    
    if (orientation === 'vertical') {
      const rawVerticalMax = Number(this.verticalMaxPerRow);
      const verticalMaxPerRow = Number.isFinite(rawVerticalMax)
        ? Math.max(1, Math.min(MAX_SWATCHES, Math.floor(rawVerticalMax)))
        : DEFAULT_VERTICAL_MAX_PER_ROW;
      const totalSwatches = swatches.length;
      const showEmpty = f.emptyStrip && totalSwatches < MAX_SWATCHES;
      const isColorWheelVerticalLayout = verticalMaxPerRow === 6;

      const emptyGridCell = html`
        <div class="swatch-column swatch-column--empty" tabindex="-1" role="gridcell" aria-label="${labelAddColor}"
          @keydown=${(ev) => this._handleColumnKeydown(ev, swatches.length)}
          @focusout=${(ev) => this._handleColumnFocusout(ev)}>
          <button type="button" class="icon-button icon-button--add swatch-column-focusable" tabindex="-1" part="add-button" @click=${() => this._handleAddAt(swatches.length, 'end')} aria-label="${labelAddColor}" title="${labelAddColor}">${icon('add')}</button>
        </div>
      `;

      if (isColorWheelVerticalLayout) {
        const useTwoRows = totalSwatches > verticalMaxPerRow;

        if (useTwoRows) {
          const rowSize = Math.ceil(totalSwatches / 2);
          const row1Swatches = swatches.slice(0, rowSize);
          const row2Swatches = swatches.slice(rowSize);
          const row1Items = row1Swatches.map((swatch, i) => renderSwatch(swatch, i, { cornerClass: i === 0 ? 'corner-top-left' : i === row1Swatches.length - 1 ? 'corner-top-right' : '' }));
          const row2Items = row2Swatches.map((swatch, i) => renderSwatch(swatch, rowSize + i, { cornerClass: i === 0 ? 'corner-bottom-left' : i === row2Swatches.length - 1 ? 'corner-bottom-right' : '' }));
          if (showEmpty && (totalSwatches % 2 === 1)) row2Items.push(emptyGridCell);

          return html`
            <div class="swatch-rail vertical--two-rows" data-orientation="vertical" style="--vertical-max-per-row: ${rowSize}" role="grid" aria-label="${labelColorPaletteAria}">
              <div role="row" style="display:contents">${row1Items}</div>
              <div role="row" style="display:contents">${row2Items}</div>
            </div>
          `;
        }

        const showSingleRowEmpty = showEmpty && totalSwatches === 0;
        const railColumns = totalSwatches + (showSingleRowEmpty ? 1 : 0);
        const railItems = swatches.map((swatch, index) => renderSwatch(swatch, index));

        return html`
          <div class="swatch-rail" data-orientation="vertical" style="--rail-columns: ${railColumns}" role="grid" aria-label="${labelColorPaletteAria}">
            <div role="row" style="display:contents">
              ${railItems}
              ${showSingleRowEmpty ? renderEmptyStrip() : ''}
            </div>
          </div>
        `;
      }

      const totalSlots = totalSwatches + (showEmpty ? 1 : 0);

      if (totalSlots > verticalMaxPerRow) {
        const row1Swatches = swatches.slice(0, verticalMaxPerRow);
        const row2Swatches = swatches.slice(verticalMaxPerRow);
        const row1Items = row1Swatches.map((swatch, i) => renderSwatch(swatch, i, { cornerClass: i === 0 ? 'corner-top-left' : i === row1Swatches.length - 1 ? 'corner-top-right' : '' }));
        const row2Items = row2Swatches.map((swatch, i) => renderSwatch(swatch, verticalMaxPerRow + i, { cornerClass: i === 0 ? 'corner-bottom-left' : i === row2Swatches.length - 1 ? 'corner-bottom-right' : '' }));
        if (showEmpty) row2Items.push(emptyGridCell);
        return html`
          <div class="swatch-rail vertical--two-rows" data-orientation="vertical" style="--vertical-max-per-row: ${verticalMaxPerRow}" role="grid" aria-label="${labelColorPaletteAria}">
            <div role="row" style="display:contents">${row1Items}</div>
            <div role="row" style="display:contents">${row2Items}</div>
          </div>
        `;
      }

      const railItems = swatches.map((swatch, index) => renderSwatch(swatch, index));
      return html`
        <div class="swatch-rail" data-orientation="vertical" style="--rail-columns: ${totalSlots}" role="grid" aria-label="${labelColorPaletteAria}">
          <div role="row" style="display:contents">
            ${railItems}
            ${renderEmptyStrip()}
          </div>
        </div>
      `;
    }

    
    const railItems = swatches.map((swatch, index) => renderSwatch(swatch, index));
    const addLeftSlot = !isStacked && f.addLeft && swatches.length >= 2 && canAddGlobal ? renderAddButton('left', 1) : '';
    const addRightSlot = !isStacked && f.addRight && swatches.length >= 3 && canAddGlobal ? renderAddButton('right', 2) : '';

    return html`
      <div class="swatch-rail" data-orientation="${orientation}">
        ${railItems}
        ${renderEmptyStrip()}
        ${addLeftSlot || addRightSlot ? html`<div class="add-slots-overlay">${addLeftSlot}${addRightSlot}</div>` : ''}
      </div>
    `;
  }
}

customElements.define('color-swatch-rail', ColorSwatchRail);
