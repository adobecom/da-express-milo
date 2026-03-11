
import { LitElement, html } from '../../../deps/lit-all.min.js';
import { getContrastTextColor } from '../../utils/ColorConversions.js';
import { getFirstFocusableInGroup } from '../../utils/util.js';
import { style } from './styles.css.js';
import { showExpressToast } from '../../../../scripts/color-shared/spectrum/components/express-toast.js';
import { loadIconsRail } from '../../../../scripts/color-shared/spectrum/load-spectrum.js';
import { announceToScreenReader, clearScreenReaderAnnouncement } from '../../../../scripts/color-shared/spectrum/utils/a11y.js';
import {
  TYPE_ORDER,
  getConflictPairs,
  getConflictingIndices,
  simulateHex as simulateHexService,
} from '../../../../scripts/color-shared/services/createColorBlindnessService.js';


const MAX_SWATCHES = 10;
const MAX_SWATCHES_TWO_ROWS = 12;
const MAX_SWATCHES_FOUR_ROWS = 20;
const FOUR_ROWS_COLS = 5;
const FOUR_ROWS_ROWS = 4;


const DEFAULT_FEATURES = {
  copy: true,
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
  emptyStrip: false,
  editColorDisabled: false,
};


const ALL_FEATURES = {
  copy: true,
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
      emptyStrip: set.has('emptyStrip'),
      editColorDisabled: set.has('editColorDisabled'),
    };
  }
  return { ...DEFAULT_FEATURES, ...features };
}


const ICON_MAP = {
  copy: () => html`<sp-icon-copy size="m" aria-hidden="true"></sp-icon-copy>`,
  editTint: () => html`<img class="icon-tint" src="/express/code/icons/S2_Icon_Tint_20_N.svg" alt="" width="20" height="20" aria-hidden="true">`,
  trash: () => html`<sp-icon-delete size="m" aria-hidden="true"></sp-icon-delete>`,
  drag: () => html`<img class="icon-drag" src="/express/code/icons/S2_Icon_Drag_20_N.svg" alt="" width="20" height="20" aria-hidden="true">`,
  add: () => html`<sp-icon-add size="m" aria-hidden="true"></sp-icon-add>`,
  
  colorBlindness: () => html`<span class="color-blindness-placeholder" aria-hidden="true">A11y</span>`,
  lockOpen: () => html`<sp-icon-lock-open size="m" aria-hidden="true"></sp-icon-lock-open>`,
  lockClosed: () => html`<sp-icon-lock-closed size="m" aria-hidden="true"></sp-icon-lock-closed>`,
  baseColorCircle: () => html`<sp-icon-circle size="m" aria-hidden="true"></sp-icon-circle>`,
  baseColorTarget: () => html`<sp-icon-target size="m" aria-hidden="true"></sp-icon-target>`,
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
    <sp-icon-alert size="m" aria-hidden="true"></sp-icon-alert>
  </button>
`;


function buildDisplaySwatchesForFourRowsCB(swatches) {
  const first5 = [];
  for (let i = 0; i < FOUR_ROWS_COLS; i += 1) {
    first5.push(swatches[i]?.hex ? { hex: swatches[i].hex } : { hex: '#e5e5e5' });
  }
  const out = first5.map((s) => ({ hex: s.hex, conflict: false }));
  const hexes = first5.map((s) => s.hex);
  TYPE_ORDER.forEach((type) => {
    const pairs = getConflictPairs(hexes, type);
    const conflicting = getConflictingIndices(pairs);
    first5.forEach((s, i) => {
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
    this.hexCopyFirstRowOnly = false;
    this._controllerUnsubscribe = null;
    this.swatches = [];
    this.baseColorIndex = 0;
    this.lockedByIndex = new Set();
    this._dragFromIndex = -1;
    this._touchDragFromIndex = -1;
    this._resizeObserver = null;
    this._boundRailKeydown = (e) => this._handleRailKeydown(e);
    this._boundRailKeydownCapture = (e) => this._handleRailKeydownCapture(e);
    this._boundTouchStart = (e) => this._handleTouchDragStart(e);
    this._boundTouchMove = (e) => this._handleTouchDragMove(e);
    this._boundTouchEnd = (e) => this._handleTouchDragEnd(e);
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
    this.shadowRoot?.addEventListener('touchstart', this._boundTouchStart, { passive: true });
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
        this.lockedByIndex = state.lockedByIndex ?? new Set();
        this.requestUpdate();
      });
    }
  }

  _handleCopy(hex) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hex);
      showExpressToast({ message: 'Copied to clipboard', variant: 'positive', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
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
      this.controller.setState({ swatches });
      showExpressToast({ message: 'Color removed', variant: 'neutral', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
    }
  }

  
  _handleAddAt(insertIndex, side) {
    if ((this.swatches?.length ?? 0) >= MAX_SWATCHES) return;
    const e = new CustomEvent('color-swatch-rail-add', { bubbles: true, composed: true, detail: { side, insertIndex } });
    if (this.dispatchEvent(e) && !e.defaultPrevented && this.controller?.setState) {
      const swatches = [...this.swatches];
      swatches.splice(insertIndex, 0, { hex: '#808080' });
      this.controller.setState({ swatches });
      showExpressToast({ message: 'Color added', variant: 'positive', timeout: 2000, anchor: this.closest('.strip-container') || undefined });
    }
  }

  _handleColorPicker(index) {
    if ((this.lockedByIndex || new Set()).has(index)) return;
    const hex = this.swatches[index]?.hex;
    const e = new CustomEvent('color-swatch-rail-edit', { bubbles: true, composed: true, detail: { index, hex } });
    if (this.dispatchEvent(e) && !e.defaultPrevented) {
      const input = this.shadowRoot?.querySelector(`#edit-input-${index}`);
      if (input) input.click();
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
    const hex = e.target?.value;
    if (hex && this.controller?.setState) {
      const swatches = [...this.swatches];
      swatches[index] = { hex: hex.toUpperCase() };
      this.controller.setState({ swatches });
    }
  }

  _handleDragStart(index, e) {
    if (!this._features.drag) return;
    if ((this.lockedByIndex || new Set()).has(index)) return;
    if (e.target.closest('.icon-button--copy, .icon-button--edit-tint, .icon-button--trash, .icon-button--add, .icon-button--lock, .base-color-badge, .color-blindness-badge')) return;
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
    if (e.target.closest('.icon-button--copy, .icon-button--edit-tint, .icon-button--trash, .icon-button--add, .icon-button--lock, .base-color-badge, .color-blindness-badge')) return;
    this._touchDragFromIndex = Number(idx);
    col.classList.add('swatch-column--dragging');
    document.addEventListener('touchmove', this._boundTouchMove, { passive: false });
    document.addEventListener('touchend', this._boundTouchEnd, { once: true });
    document.addEventListener('touchcancel', this._boundTouchEnd, { once: true });
  }

  _handleTouchDragMove(e) {
    if (this._touchDragFromIndex < 0) return;
    e.preventDefault();
    const t = e.touches[0];
    if (!t) return;
    const under = document.elementFromPoint(t.clientX, t.clientY);
    const dropCol = under?.closest?.('.swatch-column[data-swatch-index]');
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
    const under = document.elementFromPoint(t.clientX, t.clientY);
    const dropTarget = under?.closest?.('.swatch-column[data-swatch-index]');
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
    const focusables = [...col.querySelectorAll('.swatch-column-focusable')];
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
        return html`
          <div class="swatch-column swatch-column--simulated" tabindex="-1" role="group" aria-label="Simulated color"
            style="background-color: ${swatch.hex}; --swatch-text-color: ${textColor}; --swatch-text-shadow: ${shadow}; --swatch-icon-color: ${textColor};"
            data-swatch-index="${index}">
            ${swatch.conflict ? conflictIcon() : ''}
          </div>
        `;
      }
      const isLocked = (this.lockedByIndex || new Set()).has(index);
      const isBase = f.baseColor && index === this.baseColorIndex;
      const showAddLeftHere = !isStacked && canAddGlobal && f.addLeft;
      const showAddRightHere = !isStacked && canAddGlobal && f.addRight;
      
      const showAddTopHere = isStacked && canAddGlobal && f.addLeft;
      const showAddBottomHere = isStacked && canAddGlobal && f.addRight;
      
      const effectiveLocked = isLocked || isBase;
      const textColor = getContrastTextColor(swatch.hex);
      const shadow = textColor === '#ffffff' ? '0 0 2px rgba(0,0,0,0.5)' : '0 0 2px rgba(255,255,255,0.5)';
      const showEdit = (f.colorPicker || f.editTint) && !editDisabled && !effectiveLocked;
      
      
      const showHexCopyForThisSwatch = !(orientation === 'four-rows' && this.hexCopyFirstRowOnly && index >= FOUR_ROWS_COLS);

      
      const baseColorIcon = f.baseColor ? (isBase ? icon('baseColorTarget') : icon('baseColorCircle')) : '';
      const baseColorBadgeClass = `base-color-badge${!isBase ? ' base-color-badge--hover-only' : ''}`;
      const topLeftIcons = html`
        <div class="top-actions top-actions--left">
          ${f.baseColor ? html`<button type="button" class="${baseColorBadgeClass} swatch-column-focusable" tabindex="-1" aria-label=${isBase ? 'Clear base color' : 'Set as base color'} title=${isBase ? 'Clear base color' : 'Set as base color'} @click=${(e) => { e.stopPropagation(); this._handleBaseColorToggle(index); }}>${baseColorIcon}</button>` : ''}
        </div>
      `;
      const topRightIcons = html`
        <div class="top-actions top-actions--right">
          ${f.drag && !effectiveLocked ? html`<button type="button" class="icon-button icon-button--drag swatch-column-focusable" tabindex="-1" aria-label="Drag to reorder" title="Drag to reorder">${icon('drag')}</button>` : ''}
          ${f.lock ? html`<button type="button" class="icon-button icon-button--lock swatch-column-focusable" tabindex="-1" @click=${() => this._handleLock(index)} aria-label=${effectiveLocked ? 'Unlock color' : 'Lock color'} title=${effectiveLocked ? 'Unlock color' : 'Lock color'}>${icon(effectiveLocked ? 'lockClosed' : 'lockOpen')}</button>` : ''}
          ${f.editTint && showEdit ? html`<button type="button" class="icon-button icon-button--edit-tint swatch-column-focusable" tabindex="-1" @click=${() => this._handleColorPicker(index)} aria-label="Edit tint" title="Edit tint">${icon('editTint')}</button>` : ''}
          ${f.trash ? html`<button type="button" class="icon-button icon-button--trash swatch-column-focusable" tabindex="-1" @click=${() => this._handleTrash(index)} aria-label="Delete color" title="Delete color" ?disabled=${effectiveLocked} aria-disabled="${effectiveLocked}">${icon('trash')}</button>` : ''}
        </div>
      `;
      
      const stackedIcons = html`
        <div class="stacked-row__icons">
          ${f.baseColor ? html`<button type="button" class="${baseColorBadgeClass} swatch-column-focusable" tabindex="-1" aria-label=${isBase ? 'Clear base color' : 'Set as base color'} title=${isBase ? 'Clear base color' : 'Set as base color'} @click=${(e) => { e.stopPropagation(); this._handleBaseColorToggle(index); }}>${baseColorIcon}</button>` : ''}
          ${f.copy ? html`<button type="button" class="icon-button icon-button--copy swatch-column-focusable" tabindex="-1" @click=${() => this._handleCopy(swatch.hex)} aria-label="Copy Hex" title="Copy Hex">${icon('copy')}</button>` : ''}
          ${f.drag && !effectiveLocked ? html`<button type="button" class="icon-button icon-button--drag swatch-column-focusable" tabindex="-1" aria-label="Drag to reorder" title="Drag to reorder">${icon('drag')}</button>` : ''}
          ${f.lock ? html`<button type="button" class="icon-button icon-button--lock swatch-column-focusable" tabindex="-1" @click=${() => this._handleLock(index)} aria-label=${effectiveLocked ? 'Unlock color' : 'Lock color'} title=${effectiveLocked ? 'Unlock color' : 'Lock color'}>${icon(effectiveLocked ? 'lockClosed' : 'lockOpen')}</button>` : ''}
          ${f.editTint && showEdit ? html`<button type="button" class="icon-button icon-button--edit-tint swatch-column-focusable" tabindex="-1" @click=${() => this._handleColorPicker(index)} aria-label="Edit tint" title="Edit tint">${icon('editTint')}</button>` : ''}
          ${f.trash ? html`<button type="button" class="icon-button icon-button--trash swatch-column-focusable" tabindex="-1" @click=${() => this._handleTrash(index)} aria-label="Delete color" title="Delete color" ?disabled=${effectiveLocked} aria-disabled="${effectiveLocked}">${icon('trash')}</button>` : ''}
        </div>
      `;
      const stackedContent = html`
        <div class="bottom-info bottom-info--stacked" part="bottom-info">
          ${showEdit ? html`<input type="color" id="edit-input-${index}" class="edit-input-native" tabindex="-1" aria-hidden="true" value=${swatch.hex} @input=${(ev) => this._onNativePickerChange(index, ev)} />` : ''}
          ${f.hexCode ? (showEdit || f.copy ? html`<button type="button" class="hex-code hex-code--${showEdit ? 'editable' : 'copyable'} swatch-column-focusable" tabindex="-1" @click=${showEdit ? () => this._handleColorPicker(index) : () => this._handleCopy(swatch.hex)} aria-label=${showEdit ? 'Edit color' : 'Copy hex'} title=${showEdit ? 'Edit color' : 'Copy hex'}>${swatch.hex}</button>` : html`<span class="hex-code hex-code--static" aria-label="Hex code" title="Hex code">${swatch.hex}</span>`) : ''}
        </div>
        ${stackedIcons}
      `;

      return html`
        <div class="swatch-column ${effectiveLocked ? 'locked' : ''} ${isBase ? 'base-color' : ''} ${f.drag && !effectiveLocked ? 'swatch-column--draggable' : ''}"
          data-contrast="${textColor === '#ffffff' ? 'dark' : 'light'}"
          style="background-color: ${swatch.hex}; --swatch-text-color: ${textColor}; --swatch-text-shadow: ${shadow}; --swatch-icon-filter: ${textColor === '#ffffff' ? 'brightness(0) invert(1)' : 'brightness(0)'}"
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
          ${!isStacked ? html`
            <div class="top-actions-row">
              ${topLeftIcons}
              ${topRightIcons}
            </div>
          ` : html`<div class="stacked-row">${stackedContent}</div>`}
          ${!isStacked ? html`<div class="bottom-info" part="bottom-info">
            ${showEdit && showHexCopyForThisSwatch ? html`<input type="color" id="edit-input-${index}" class="edit-input-native" tabindex="-1" aria-hidden="true" value=${swatch.hex} @input=${(ev) => this._onNativePickerChange(index, ev)} />` : ''}
            ${f.hexCode && showHexCopyForThisSwatch ? (showEdit || f.copy ? html`<button type="button" class="hex-code hex-code--${showEdit ? 'editable' : 'copyable'} swatch-column-focusable" tabindex="-1" @click=${showEdit ? () => this._handleColorPicker(index) : () => this._handleCopy(swatch.hex)} aria-label=${showEdit ? 'Edit color' : 'Copy hex'} title=${showEdit ? 'Edit color' : 'Copy hex'}>${swatch.hex}</button>` : html`<span class="hex-code hex-code--static" aria-label="Hex code" title="Hex code">${swatch.hex}</span>`) : ''}
            <div class="bottom-info__actions">
              ${f.copy && showHexCopyForThisSwatch ? html`<button type="button" class="icon-button icon-button--copy swatch-column-focusable" tabindex="-1" @click=${() => this._handleCopy(swatch.hex)} aria-label="Copy Hex" title="Copy Hex">${icon('copy')}</button>` : ''}
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
      const showEmpty = f.emptyStrip && swatches.length < MAX_SWATCHES_FOUR_ROWS;
      const useCBData = this.hexCopyFirstRowOnly;
      const displaySwatches = useCBData ? buildDisplaySwatchesForFourRowsCB(swatches) : null;
      const allItems = [];
      for (let r = 0; r < FOUR_ROWS_ROWS; r += 1) {
        const start = r * FOUR_ROWS_COLS;
        const rowSwatches = useCBData && displaySwatches
          ? displaySwatches.slice(start, start + FOUR_ROWS_COLS)
          : swatches.slice(start, start + FOUR_ROWS_COLS);
        const isSimulatedRow = useCBData && r >= 1;
        rowSwatches.forEach((swatch, c) => {
          const idx = start + c;
          allItems.push(renderSwatch(swatch, idx, { isSimulatedCell: isSimulatedRow }));
        });
        const isLastRow = r === FOUR_ROWS_ROWS - 1;
        const showEmptySlot = isLastRow && showEmpty && (useCBData ? swatches.length < MAX_SWATCHES_FOUR_ROWS : rowSwatches.length < FOUR_ROWS_COLS);
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
        <div class="swatch-rail vertical--four-rows" data-orientation="vertical">
          ${allItems}
        </div>
      `;
    }

    
    if (orientation === 'two-rows') {
      const maxSwatches = MAX_SWATCHES_TWO_ROWS;
      const COLORS_PER_ROW = 6;
      const row0Swatches = swatches.slice(0, COLORS_PER_ROW);
      const row1Swatches = swatches.slice(COLORS_PER_ROW, COLORS_PER_ROW * 2);
      const showEmpty = f.emptyStrip && swatches.length < maxSwatches;
      const renderRow = (rowSwatches, rowIndex) => {
        const items = rowSwatches.map((swatch, colIndex) => renderSwatch(swatch, rowIndex * COLORS_PER_ROW + colIndex));
        if (rowIndex === 1 && showEmpty && rowSwatches.length < COLORS_PER_ROW) {
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
      const VERTICAL_ROW1_MAX = 5;

      if (totalSlots > 6) {
        const row1Swatches = swatches.slice(0, VERTICAL_ROW1_MAX);
        const row2Swatches = swatches.slice(VERTICAL_ROW1_MAX);
        const row1Items = row1Swatches.map((swatch, i) => renderSwatch(swatch, i));
        const row2Items = row2Swatches.map((swatch, i) => renderSwatch(swatch, VERTICAL_ROW1_MAX + i));
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
          <div class="swatch-rail vertical--two-rows" data-orientation="vertical">
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
