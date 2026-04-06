
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
  editTint: () => html`<img class="icon-asset icon-tint" src="/express/code/icons/S2_Icon_BrightnessContrast_20_N.svg" alt="" width="20" height="20" aria-hidden="true">`,
  trash: () => (hasIcon('sp-icon-delete')
    ? html`<sp-icon-delete size="m" aria-hidden="true"></sp-icon-delete>`
    : iconFallback('M7 3h6l1 2h3v2H3V5h3l1-2zm-1 6h2v7H6V9zm6 0h2v7h-2V9zM9 9h2v7H9V9z')),
  drag: () => iconFallback('M7 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM7 8.5A1.5 1.5 0 1 0 7 11a1.5 1.5 0 0 0 0-2.5zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM7 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z'),
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


const conflictIcon = () => html`
  <button
    type="button"
    class="strip-color-blindness-swatch__conflict-icon"
    tabindex="-1"
    aria-label="Conflict detected"
    title="Conflict detected"
  >
    ${hasIcon('sp-icon-alert')
    ? html`<sp-icon-alert size="m" aria-hidden="true"></sp-icon-alert>`
    : iconFallback('M10 2 19 18H1L10 2zm-1 5h2v6H9V7zm0 8h2v2H9v-2z')}
  </button>
`;


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
    this._controllerUnsubscribe = null;
    this.swatches = [];
    this.baseColorIndex = 0;
    this.tintIndex = null;
    this.lockedByIndex = new Set();
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
          this.updateComplete.then(() => this._scheduleTooltipsRefresh()).catch(() => {});
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
    try {
      const copied = await this._copyText(hex);
      if (!copied) throw new Error('clipboard_copy_failed');
      showExpressToast({ message: 'Copied to clipboard', variant: 'positive', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
      announceToScreenReader('Copied to clipboard');
    } catch (error) {
      showExpressToast({ message: 'Failed to copy', variant: 'negative', timeout: 2000 });
    }
  }

  _handleLock(index) {
    const next = new Set(this.lockedByIndex || []);
    const wasLocked = next.has(index);
    if (wasLocked) next.delete(index);
    else next.add(index);
    if (this.controller?.setState) {
      this.controller.setState({ lockedByIndex: next });
      showExpressToast({ message: wasLocked ? 'Color unlocked' : 'Color locked', variant: 'neutral', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
    }
  }

  _handleBaseColorToggle(index) {
    const next = this.baseColorIndex === index ? null : index;
    if (this.controller?.setState) {
      this.controller.setState({ baseColorIndex: next });
      showExpressToast({ message: next != null ? 'Base color set' : 'Base color cleared', variant: 'neutral', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
    }
  }

  _handleTrash(index) {
    if ((this.lockedByIndex || new Set()).has(index)) return;
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
      this.controller.setState({ swatches, tintIndex: nextTintIndex });
      showExpressToast({ message: 'Color removed', variant: 'neutral', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
    }
  }

  
  _handleAddAt(insertIndex, side) {
    if ((this.swatches?.length ?? 0) >= MAX_SWATCHES) return;
    const e = new CustomEvent('color-swatch-rail-add', { bubbles: true, composed: true, detail: { side, insertIndex } });
    if (this.dispatchEvent(e) && !e.defaultPrevented && this.controller?.setState) {
      const swatches = [...this.swatches];
      swatches.splice(insertIndex, 0, { hex: '#808080' });
      const currentTintIndex = Number.isInteger(this.tintIndex) ? this.tintIndex : null;
      const nextTintIndex = currentTintIndex != null && insertIndex <= currentTintIndex
        ? currentTintIndex + 1
        : currentTintIndex;
      this.controller.setState({ swatches, tintIndex: nextTintIndex });
      showExpressToast({ message: 'Color added', variant: 'positive', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
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
    let toneLabel = 'Tone';
    if (id === 'base') {
      toneLabel = 'Base color';
    } else if (id.startsWith('tint-')) {
      toneLabel = `Tint ${id.split('-')[1] || ''}`.trim();
    } else if (id.startsWith('shade-')) {
      toneLabel = `Shade ${id.split('-')[1] || ''}`.trim();
    }
    return `${toneLabel}, ${bandIndex + 1} of ${totalBands}, ${hex}`;
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

    const firstTintButton = tintButtons.find((el) => !el.disabled) || tintButtons[0];
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
    if ((this.lockedByIndex || new Set()).has(index)) return;
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
    if ((this.lockedByIndex || new Set()).has(index)) return;
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
    if ((this.lockedByIndex || new Set()).has(index)) return;
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
    if ((this.lockedByIndex || new Set()).has(index)) return;
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
    if ((this.lockedByIndex || new Set()).has(index)) return;
    if (e.target.closest('.icon-button--copy, .icon-button--edit-tint, .icon-button--trash, .icon-button--add, .icon-button--lock, .base-color-badge, .color-blindness-badge, .tint-band-btn')) return;
    this._dragFromIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.setData('application/x-color-swatch-index', String(index));
    e.target.closest('.swatch-column')?.classList.add('swatch-column--dragging');
  }

  _handleDragEnd(e) {
    this._dragFromIndex = -1;
    e.target.closest('.swatch-column')?.classList.remove('swatch-column--dragging');
    this.shadowRoot?.querySelectorAll('.swatch-column--drag-over').forEach((el) => el.classList.remove('swatch-column--drag-over'));
  }

  _handleDragOver(e) {
    if (!this._features.drag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget?.classList.add('swatch-column--drag-over');
  }

  _handleDragLeave(e) {
    const col = e.currentTarget;
    if (!col?.contains(e.relatedTarget)) {
      col.classList.remove('swatch-column--drag-over');
    }
  }

  _handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropTarget = e.target.closest('.swatch-column[data-swatch-index]');
    if (!dropTarget) return;
    dropTarget.classList.remove('swatch-column--drag-over');
    const f = this._features;
    if (!f.drag || !this.controller?.setState) return;
    const fromData = e.dataTransfer?.getData('application/x-color-swatch-index') ?? e.dataTransfer?.getData('text/plain') ?? '';
    const fromIndex = fromData !== '' && Number(fromData) >= 0 ? Number(fromData) : this._dragFromIndex;
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
    const e2 = new CustomEvent('color-swatch-rail-reorder', { bubbles: true, composed: true, detail: { fromIndex, toIndex, swatches } });
    if (this.dispatchEvent(e2) && !e2.defaultPrevented) {
      this.controller.setState(stateUpdate);
      showExpressToast({ message: 'Reordered', variant: 'neutral', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
    }
  }

  
  _handleTouchDragStart(e) {
    if (!this._features.drag) return;
    const col = e.target.closest('.swatch-column--draggable');
    if (!col || col.closest('.swatch-column--empty')) return;
    const idx = col.getAttribute('data-swatch-index');
    if (idx === null || idx === '') return;
    if ((this.lockedByIndex || new Set()).has(Number(idx))) return;
    if (e.target.closest('.icon-button--copy, .icon-button--edit-tint, .icon-button--trash, .icon-button--add, .icon-button--lock, .base-color-badge, .color-blindness-badge, .tint-band-btn')) return;
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
      showExpressToast({ message: 'Reordered', variant: 'neutral', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
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
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const focusables = [...column.querySelectorAll('.swatch-column-focusable')];
      if (!focusables.length) return;
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
      column.setAttribute('tabindex', '0');
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
    if (e.key === 'Escape' && insideColumn) {
      e.preventDefault();
      e.stopPropagation();
      clearScreenReaderAnnouncement();
      const swatchIndex = col.getAttribute('data-swatch-index');
      const colLabel = col.getAttribute('aria-label') || 'Color strip';
      col.querySelectorAll('.swatch-column-focusable').forEach((el) => el.setAttribute('tabindex', '-1'));
      col.setAttribute('tabindex', '0');
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
    column.setAttribute('tabindex', '0');
    column.querySelectorAll('.swatch-column-focusable').forEach((el) => el.setAttribute('tabindex', '-1'));
  }

  render() {
    const orientation = (this.orientation || 'vertical').toLowerCase();
    const f = this._features;
    const swatches = this.swatches || [];
    const editDisabled = f.editColorDisabled;

    const renderAddButton = (side, insertIndex) => {
      if (side === 'left' && !f.addLeft) return '';
      if (side === 'right' && !f.addRight) return '';
      const label = side === 'left' ? 'Add color left' : 'Add color right';
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
        return html`
          <div class="swatch-column swatch-column--simulated ${simulatedSuperLight ? 'swatch-column--super-light' : ''}" tabindex="-1" role="group" aria-label="Simulated color"
            style="background-color: ${swatch.hex}; --swatch-text-color: ${textColor}; --swatch-text-shadow: var(--swatch-text-shadow-override, ${shadow}); --swatch-icon-color: ${textColor};"
            data-swatch-index="${index}">
            ${swatch.conflict ? conflictIcon() : ''}
          </div>
        `;
      }
      const isLocked = (this.lockedByIndex || new Set()).has(index);
      const isBase = f.baseColor && index === this.baseColorIndex;
      const isBaseReadOnly = f.baseColorReadOnly && index === this.baseColorIndex;
      const showAddLeftHere = !isStacked && canAddGlobal && f.addLeft;
      const showAddRightHere = !isStacked && canAddGlobal && f.addRight;
      
      const showAddTopHere = isStacked && canAddGlobal && f.addLeft;
      const showAddBottomHere = isStacked && canAddGlobal && f.addRight;
      
      const effectiveLocked = isLocked || isBase;
      const textColor = getContrastTextColor(swatch.hex);
      const shadow = textColor === '#ffffff' ? '0 0 2px rgba(0,0,0,0.5)' : '0 0 2px rgba(255,255,255,0.5)';
      const superLight = isSuperLight(swatch.hex);
      const showColorEdit = f.colorPicker && !editDisabled && !effectiveLocked;
      const showHexCopyButton = f.copy && f.copyFromHex !== false && !isBase;
      const tintMode = f.editTint && !f.colorPicker;
      const showTintSelect = tintMode && !editDisabled && !effectiveLocked;
      const resolvedTintIndex = this._resolveTintIndex();
      const isTintSelected = tintMode && resolvedTintIndex != null && index === resolvedTintIndex;
      const tintBands = isTintSelected ? this._buildTintBands(swatch.hex) : [];
      
      
      const showHexCopyForThisSwatch = !(orientation === 'four-rows' && this.hexCopyFirstRowOnly && index >= swatches.length);

      
      const baseColorIcon = f.baseColor
        ? (
          isBase && !f.colorBlindness
            ? html`
              <span class="base-color-icon base-color-icon--target">${icon('baseColorTarget')}</span>
              <span class="base-color-icon base-color-icon--circle">${icon('baseColorCircle')}</span>
            `
            : icon(isBase ? 'baseColorTarget' : 'baseColorCircle')
        )
        : '';
      const baseColorBadgeClass = `base-color-badge${!isBase ? ' base-color-badge--hover-only' : ''}${isBase ? ' base-color-badge--active' : ''}`;
      const topLeftIcons = html`
        <div class="top-actions top-actions--left">
          ${f.baseColor ? html`<button type="button" class="${baseColorBadgeClass} swatch-column-focusable" tabindex="-1" aria-label=${isBase ? 'Clear base color' : 'Set as base color'} title=${isBase ? 'Clear base color' : 'Set as base color'} @click=${(e) => { e.stopPropagation(); this._handleBaseColorToggle(index); }}>${baseColorIcon}</button>` : ''}
          ${isBaseReadOnly ? html`<span class="base-color-badge base-color-badge--active base-color-badge--readonly" aria-label="Base color">${icon('baseColorTarget')}</span>` : ''}
        </div>
      `;
      const topRightIcons = html`
        <div class="top-actions top-actions--right">
          ${f.drag && !effectiveLocked ? html`
            <button
              type="button"
              class="icon-button icon-button--drag swatch-column-focusable"
              tabindex="-1"
              aria-label="Drag to reorder"
              title="Drag to reorder"
              draggable="true"
              @dragstart=${(ev) => this._handleDragStart(index, ev)}
              @dragend=${this._handleDragEnd}
            >${icon('drag')}</button>
          ` : ''}
          ${f.lock ? html`<button type="button" class="icon-button icon-button--lock swatch-column-focusable" tabindex="-1" @click=${() => this._handleLock(index)} aria-label=${effectiveLocked ? 'Unlock color' : 'Lock color'} title=${effectiveLocked ? 'Unlock color' : 'Lock color'}>${icon(effectiveLocked ? 'lockClosed' : 'lockOpen')}</button>` : ''}
          ${showTintSelect ? html`<button type="button" class="icon-button icon-button--edit-tint swatch-column-focusable" tabindex="-1" @click=${(ev) => this._handleTintSelect(index, ev.currentTarget)} aria-label=${isTintSelected ? 'Tint selected' : 'Select tint'} title=${isTintSelected ? 'Tint selected' : 'Select tint'} aria-pressed=${isTintSelected ? 'true' : 'false'}>${icon('editTint')}</button>` : ''}
          ${f.trash ? html`<button type="button" class="icon-button icon-button--trash swatch-column-focusable" tabindex="-1" @click=${() => this._handleTrash(index)} aria-label="Delete color" title="Delete color" ?disabled=${effectiveLocked} aria-disabled="${effectiveLocked}">${icon('trash')}</button>` : ''}
        </div>
      `;
      
      const stackedIcons = html`
        <div class="stacked-row__icons">
          ${f.baseColor ? html`<button type="button" class="${baseColorBadgeClass} swatch-column-focusable" tabindex="-1" aria-label=${isBase ? 'Clear base color' : 'Set as base color'} title=${isBase ? 'Clear base color' : 'Set as base color'} @click=${(e) => { e.stopPropagation(); this._handleBaseColorToggle(index); }}>${baseColorIcon}</button>` : ''}
          ${isBaseReadOnly ? html`<span class="base-color-badge base-color-badge--active base-color-badge--readonly" aria-label="Base color">${icon('baseColorTarget')}</span>` : ''}
          ${f.copy ? html`<button type="button" class="icon-button icon-button--copy swatch-column-focusable" tabindex="-1" @click=${(e) => this._handleCopy(swatch.hex, e.currentTarget)} aria-label="Copy hex" title="Copy hex">${icon('copy')}</button>` : ''}
          ${f.drag && !effectiveLocked ? html`
            <button
              type="button"
              class="icon-button icon-button--drag swatch-column-focusable"
              tabindex="-1"
              aria-label="Drag to reorder"
              title="Drag to reorder"
              draggable="true"
              @dragstart=${(ev) => this._handleDragStart(index, ev)}
              @dragend=${this._handleDragEnd}
            >${icon('drag')}</button>
          ` : ''}
          ${f.lock ? html`<button type="button" class="icon-button icon-button--lock swatch-column-focusable" tabindex="-1" @click=${() => this._handleLock(index)} aria-label=${effectiveLocked ? 'Unlock color' : 'Lock color'} title=${effectiveLocked ? 'Unlock color' : 'Lock color'}>${icon(effectiveLocked ? 'lockClosed' : 'lockOpen')}</button>` : ''}
          ${showTintSelect ? html`<button type="button" class="icon-button icon-button--edit-tint swatch-column-focusable" tabindex="-1" @click=${(ev) => this._handleTintSelect(index, ev.currentTarget)} aria-label=${isTintSelected ? 'Tint selected' : 'Select tint'} title=${isTintSelected ? 'Tint selected' : 'Select tint'} aria-pressed=${isTintSelected ? 'true' : 'false'}>${icon('editTint')}</button>` : ''}
          ${f.trash ? html`<button type="button" class="icon-button icon-button--trash swatch-column-focusable" tabindex="-1" @click=${() => this._handleTrash(index)} aria-label="Delete color" title="Delete color" ?disabled=${effectiveLocked} aria-disabled="${effectiveLocked}">${icon('trash')}</button>` : ''}
        </div>
      `;
      const stackedContent = html`
        <div class="bottom-info bottom-info--stacked" part="bottom-info">
          ${showColorEdit ? html`<input type="color" id="edit-input-${index}" class="edit-input-native" tabindex="-1" aria-hidden="true" value=${swatch.hex} @input=${(ev) => this._onNativePickerChange(index, ev)} @change=${() => this._markNativePickerClosedSoon(50)} @blur=${() => this._markNativePickerClosedSoon(50)} />` : ''}
          ${f.hexCode ? (showColorEdit || showHexCopyButton ? html`<button type="button" class="hex-code hex-code--${showColorEdit ? 'editable' : 'copyable'} swatch-column-focusable" tabindex="-1" @click=${showColorEdit ? (ev) => this._handleColorPicker(index, ev.currentTarget) : (ev) => this._handleCopy(swatch.hex, ev.currentTarget)} aria-label=${showColorEdit ? 'Edit color' : 'Copy hex'} title=${showColorEdit ? 'Edit color' : 'Copy hex'}>${swatch.hex}</button>` : html`<span class="hex-code hex-code--static" aria-label="Hex code" title="Hex code">${swatch.hex}</span>`) : ''}
        </div>
        ${stackedIcons}
      `;

      return html`
        <div class="swatch-column ${effectiveLocked ? 'locked' : ''} ${isBase ? 'base-color' : ''} ${tintMode ? 'swatch-column--tint-mode' : ''} ${isTintSelected ? 'swatch-column--tint-selected' : ''} ${f.drag && !effectiveLocked ? 'swatch-column--draggable' : ''} ${superLight ? 'swatch-column--super-light' : ''}"
          data-contrast="${textColor.toLowerCase() === '#ffffff' ? 'dark' : 'light'}"
          style="background-color: ${swatch.hex}; --swatch-base-color: ${swatch.hex}; --swatch-text-color: ${textColor}; --swatch-text-shadow: var(--swatch-text-shadow-override, ${shadow}); --swatch-icon-filter: ${textColor.toLowerCase() === '#ffffff' ? 'brightness(0) invert(1)' : 'brightness(0)'}"
          data-swatch-index="${index}"
          tabindex="0"
          role="group"
          aria-label="Color ${index + 1}, ${swatch.hex}"
          @keydown=${(ev) => this._handleColumnKeydown(ev, index)}
          @focusout=${(ev) => this._handleColumnFocusout(ev)}
          ?draggable=${f.drag && !effectiveLocked}
          @dragstart=${(ev) => f.drag && !effectiveLocked && this._handleDragStart(index, ev)}
          @dragend=${this._handleDragEnd}
          @dragover=${this._handleDragOver}
          @dragleave=${this._handleDragLeave}
          @drop=${this._handleDrop}>
          ${isTintSelected ? html`
            <div
              class="tint-bands"
              role="radiogroup"
              aria-label="Tint and shade options for color ${index + 1}"
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
                    title=${this._getTintBandA11yLabel(band, bandIndex, tintBands.length)}
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
            ${showColorEdit && showHexCopyForThisSwatch ? html`<input type="color" id="edit-input-${index}" class="edit-input-native" tabindex="-1" aria-hidden="true" value=${swatch.hex} @input=${(ev) => this._onNativePickerChange(index, ev)} @change=${() => this._markNativePickerClosedSoon(50)} @blur=${() => this._markNativePickerClosedSoon(50)} />` : ''}
            ${f.hexCode && showHexCopyForThisSwatch ? (showColorEdit || showHexCopyButton ? html`<button type="button" class="hex-code hex-code--${showColorEdit ? 'editable' : 'copyable'} swatch-column-focusable${this._activeEditIndex === index ? ' hex-code--editor-open' : ''}" tabindex="-1" @click=${showColorEdit ? (ev) => this._handleColorPicker(index, ev.currentTarget) : (ev) => this._handleCopy(swatch.hex, ev.currentTarget)} aria-label=${showColorEdit ? 'Edit color' : 'Copy hex'} title=${showColorEdit ? 'Edit color' : 'Copy hex'}>${swatch.hex}</button>` : html`<span class="hex-code hex-code--static" aria-label="Hex code" title="Hex code">${swatch.hex}</span>`) : ''}
            <div class="bottom-info__actions">
              ${f.copy && showHexCopyForThisSwatch ? html`<button type="button" class="icon-button icon-button--copy swatch-column-focusable" tabindex="-1" @click=${(e) => this._handleCopy(swatch.hex, e.currentTarget)} aria-label="Copy hex" title="Copy hex">${icon('copy')}</button>` : ''}
            </div>
          </div>` : ''}
          ${showAddLeftHere ? html`<div class="add-slot add-slot--column add-slot--column-left">
            <button type="button" class="icon-button icon-button--add swatch-column-focusable" part="add-button" tabindex="-1" @click=${() => this._handleAddAt(index, 'left')} aria-label="Add color left" title="Add color left">${icon('add')}</button>
          </div>` : ''}
          ${showAddRightHere ? html`<div class="add-slot add-slot--column add-slot--column-right">
            <button type="button" class="icon-button icon-button--add swatch-column-focusable" part="add-button" tabindex="-1" @click=${() => this._handleAddAt(index + 1, 'right')} aria-label="Add color right" title="Add color right">${icon('add')}</button>
          </div>` : ''}
          ${showAddTopHere ? html`<div class="add-slot add-slot--column add-slot--column-top">
            <button type="button" class="icon-button icon-button--add swatch-column-focusable" part="add-button" tabindex="-1" @click=${() => this._handleAddAt(index, 'left')} aria-label="Add color above" title="Add color above">${icon('add')}</button>
          </div>` : ''}
          ${showAddBottomHere ? html`<div class="add-slot add-slot--column add-slot--column-bottom">
            <button type="button" class="icon-button icon-button--add swatch-column-focusable" part="add-button" tabindex="-1" @click=${() => this._handleAddAt(index + 1, 'right')} aria-label="Add color below" title="Add color below">${icon('add')}</button>
          </div>` : ''}
        </div>
      `;
    };

    const renderEmptyStrip = () => {
      const max = orientation === 'two-rows' ? MAX_SWATCHES_TWO_ROWS : MAX_SWATCHES;
      if (!f.emptyStrip || (swatches?.length ?? 0) >= max) return '';
      const label = 'Add color';
      return html`
        <div class="swatch-column swatch-column--empty" tabindex="0" role="group" aria-label="${label}"
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
        rowSwatches.forEach((swatch, c) => {
          const idx = start + c;
          allItems.push(renderSwatch(swatch, idx, { isSimulatedCell: isSimulatedRow }));
        });
        const isLastRow = r === FOUR_ROWS_ROWS - 1;
        const showEmptySlot = isLastRow && showEmpty && (useCBData ? swatches.length < MAX_SWATCHES_FOUR_ROWS : rowSwatches.length < colCount);
        if (showEmptySlot) {
          allItems.push(html`
            <div class="swatch-column swatch-column--empty" tabindex="0" role="group" aria-label="Add color"
              @keydown=${(ev) => this._handleColumnKeydown(ev, swatches.length)}
              @focusout=${(ev) => this._handleColumnFocusout(ev)}>
              <button type="button" class="icon-button icon-button--add swatch-column-focusable" tabindex="-1" part="add-button" @click=${() => this._handleAddAt(swatches.length, 'end')} aria-label="Add color" title="Add color">${icon('add')}</button>
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
            <div class="swatch-column swatch-column--empty" tabindex="0" role="group" aria-label="Add color"
              @keydown=${(ev) => this._handleColumnKeydown(ev, swatches.length)}
              @focusout=${(ev) => this._handleColumnFocusout(ev)}>
              <button type="button" class="icon-button icon-button--add swatch-column-focusable" tabindex="-1" part="add-button" @click=${() => this._handleAddAt(swatches.length, 'end')} aria-label="Add color" title="Add color">${icon('add')}</button>
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
      const showEmpty = f.emptyStrip && swatches.length < MAX_SWATCHES;
      const totalSlots = swatches.length + (showEmpty ? 1 : 0);
      const rawVerticalMax = Number(this.verticalMaxPerRow);
      const verticalMaxPerRow = Number.isFinite(rawVerticalMax)
        ? Math.max(1, Math.min(MAX_SWATCHES, Math.floor(rawVerticalMax)))
        : DEFAULT_VERTICAL_MAX_PER_ROW;

      if (totalSlots > verticalMaxPerRow) {
        const row1Swatches = swatches.slice(0, verticalMaxPerRow);
        const row2Swatches = swatches.slice(verticalMaxPerRow);
        const row1Items = row1Swatches.map((swatch, i) => renderSwatch(swatch, i));
        const row2Items = row2Swatches.map((swatch, i) => renderSwatch(swatch, verticalMaxPerRow + i));
        if (showEmpty) {
          row2Items.push(html`
            <div class="swatch-column swatch-column--empty" tabindex="0" role="group" aria-label="Add color"
              @keydown=${(ev) => this._handleColumnKeydown(ev, swatches.length)}
              @focusout=${(ev) => this._handleColumnFocusout(ev)}>
              <button type="button" class="icon-button icon-button--add swatch-column-focusable" tabindex="-1" part="add-button" @click=${() => this._handleAddAt(swatches.length, 'end')} aria-label="Add color" title="Add color">${icon('add')}</button>
            </div>
          `);
        }
        return html`
          <div class="swatch-rail vertical--two-rows" data-orientation="vertical" style="--vertical-max-per-row: ${verticalMaxPerRow}">
            ${row1Items}
            ${row2Items}
          </div>
        `;
      }

      const railItems = swatches.map((swatch, index) => renderSwatch(swatch, index));
      return html`
        <div class="swatch-rail" data-orientation="vertical" style="--rail-columns: ${totalSlots}">
          ${railItems}
          ${renderEmptyStrip()}
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
