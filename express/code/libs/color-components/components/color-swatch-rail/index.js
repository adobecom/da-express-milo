/* eslint-disable no-underscore-dangle, class-methods-use-this, import/prefer-default-export */
import { LitElement, html } from '../../../deps/lit-all.min.js';
import { getContrastTextColor } from '../../utils/ColorConversions.js';
import { style } from './styles.css.js';
import { showExpressToast } from '../../../../scripts/color-shared/spectrum/components/express-toast.js';
import { loadIconsRail } from '../../../../scripts/color-shared/spectrum/load-spectrum.js';

/** Figma edit tint: Color Strip (6215-124479) uses S2_Icon_Tint_20_N (2492:109195). Replace via: node dev/figma-export-tint-icon.js */
const TINT_ICON_URL = (typeof document !== 'undefined'
  ? new URL('/express/code/icons/S2_Icon_Tint_20_N.svg', document.baseURI).href
  : new URL('../../../../icons/S2_Icon_Tint_20_N.svg', import.meta.url).href);

/** Figma 2492:145648 S2_Icon_DragHandle_20_N. Replace via: node dev/figma-export-drag-icon.js */
const DRAG_ICON_URL = (typeof document !== 'undefined'
  ? new URL('/express/code/icons/S2_Icon_Drag_20_N.svg', document.baseURI).href
  : new URL('../../../../icons/S2_Icon_Drag_20_N.svg', import.meta.url).href);

/** Contract: max 10 swatches (Figma 5806-89102). */
const MAX_SWATCHES = 10;

/** Figma Color-strip API (6180-230477): all feature flags. Default: copy + colorPicker + hexCode. */
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

/** All Figma Color-strip features enabled (for demo/review). */
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

/** Spectrum workflow icon components. colorPicker/editTint use Figma S2_Icon_Tint_20_N (6082-526066). */
const ICON_MAP = {
  copy: () => html`<sp-icon-copy size="s" aria-hidden="true"></sp-icon-copy>`,
  colorPicker: () => html`<span class="icon-tint" style="--tint-icon: url(${TINT_ICON_URL})" aria-hidden="true"></span>`,
  editTint: () => html`<span class="icon-tint" style="--tint-icon: url(${TINT_ICON_URL})" aria-hidden="true"></span>`,
  trash: () => html`<sp-icon-delete size="s" aria-hidden="true"></sp-icon-delete>`,
  drag: () => html`<span class="icon-drag" style="--drag-icon: url(${DRAG_ICON_URL})" aria-hidden="true"></span>`,
  add: () => html`<sp-icon-add size="s" aria-hidden="true"></sp-icon-add>`,
  colorBlindness: () => html`<sp-icon-accessibility size="s" aria-hidden="true"></sp-icon-accessibility>`,
  lockOpen: () => html`<sp-icon-lock-open size="s" aria-hidden="true"></sp-icon-lock-open>`,
  lockClosed: () => html`<sp-icon-lock-closed size="s" aria-hidden="true"></sp-icon-lock-closed>`,
  baseColorCircle: () => html`<sp-icon-circle size="s" aria-hidden="true"></sp-icon-circle>`,
  baseColorTarget: () => html`<sp-icon-target size="s" aria-hidden="true"></sp-icon-target>`,
};

const icon = (name) => (ICON_MAP[name] ? ICON_MAP[name]() : html``);

export class ColorSwatchRail extends LitElement {
  static get properties() {
    return {
      controller: { attribute: false },
      orientation: { type: String, reflect: true },
      /** Config for which features/icons to render. Object: { copy, colorPicker, lock, hexCode } or array: ['copy','colorPicker'] */
      swatchFeatures: { attribute: false },
    };
  }

  static get styles() {
    return [style];
  }

  constructor() {
    super();
    this.controller = null;
    this.orientation = 'vertical';
    this.swatchFeatures = null;
    this._controllerUnsubscribe = null;
    this.swatches = [];
    this.baseColorIndex = 0;
    this.lockedByIndex = new Set();
    this._dragFromIndex = -1;
  }

  get _features() {
    return normalizeFeatures(this.swatchFeatures);
  }

  connectedCallback() {
    super.connectedCallback();
    this.attachController();
    loadIconsRail().then(() => this.requestUpdate());
  }

  disconnectedCallback() {
    if (this._controllerUnsubscribe) {
      this._controllerUnsubscribe();
      this._controllerUnsubscribe = null;
    }
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has('controller')) {
      this.attachController();
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
        this.baseColorIndex = state.baseColorIndex ?? 0;
        this.lockedByIndex = state.lockedByIndex ?? new Set();
        this.requestUpdate();
      });
    }
  }

  _handleCopy(hex) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hex);
      showExpressToast({ message: 'Copied to clipboard', variant: 'positive', timeout: 2000 });
    }
  }

  _handleLock(index) {
    const next = new Set(this.lockedByIndex || []);
    const wasLocked = next.has(index);
    if (wasLocked) next.delete(index);
    else next.add(index);
    if (this.controller?.setState) {
      this.controller.setState({ lockedByIndex: next });
      showExpressToast({ message: wasLocked ? 'Color unlocked' : 'Color locked', variant: 'neutral', timeout: 2000 });
    }
  }

  _handleTrash(index) {
    if ((this.lockedByIndex || new Set()).has(index)) return;
    const e = new CustomEvent('color-swatch-rail-delete', { bubbles: true, composed: true, detail: { index } });
    if (this.dispatchEvent(e) && !e.defaultPrevented && this.controller?.setState) {
      const swatches = this.swatches.filter((_, i) => i !== index);
      this.controller.setState({ swatches });
      showExpressToast({ message: 'Color removed', variant: 'neutral', timeout: 2000 });
    }
  }

  /** Insert at insertIndex. Figma: add-left between 1st and 2nd (insert 1), add-right between 2nd and 3rd (insert 2). Contract: max 10 swatches. */
  _handleAddAt(insertIndex, side) {
    if ((this.swatches?.length ?? 0) >= MAX_SWATCHES) return;
    const e = new CustomEvent('color-swatch-rail-add', { bubbles: true, composed: true, detail: { side, insertIndex } });
    if (this.dispatchEvent(e) && !e.defaultPrevented && this.controller?.setState) {
      const swatches = [...this.swatches];
      swatches.splice(insertIndex, 0, { hex: '#808080' });
      this.controller.setState({ swatches });
      showExpressToast({ message: 'Color added', variant: 'positive', timeout: 2000 });
    }
  }

  _handleColorPicker(index) {
    if ((this.lockedByIndex || new Set()).has(index)) return;
    const hex = this.swatches[index]?.hex;
    const e = new CustomEvent('color-swatch-rail-edit', { bubbles: true, composed: true, detail: { index, hex } });
    if (this.dispatchEvent(e) && !e.defaultPrevented) {
      const input = this.shadowRoot?.querySelector(`#picker-${index}`);
      if (input) input.click();
    }
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
    if (e.target.closest('.icon-button--copy, .icon-button--picker, .icon-button--trash, .icon-button--add, .icon-button--lock')) return;
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
      showExpressToast({ message: 'Reordered', variant: 'neutral', timeout: 2000 });
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

  render() {
    const orientation = this.orientation || 'vertical';
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
    const renderSwatch = (swatch, index) => {
      const isLocked = (this.lockedByIndex || new Set()).has(index);
      const isBase = f.baseColor && index === this.baseColorIndex;
      const textColor = getContrastTextColor(swatch.hex);
      const shadow = textColor === '#ffffff' ? '0 0 2px rgba(0,0,0,0.5)' : '0 0 2px rgba(255,255,255,0.5)';
      const showEdit = (f.colorPicker || f.editTint) && !editDisabled && !isLocked;
      /** Edit color = picker opens when clicking hex (Figma). No separate picker icon. */

      const topActions = (f.lock || f.drag) ? html`
        <div class="top-actions">
          ${f.drag && !isLocked ? html`<button type="button" class="icon-button icon-button--drag" aria-label="Drag to reorder">${icon('drag')}</button>` : ''}
          ${f.lock ? html`<button type="button" class="icon-button icon-button--lock" @click=${() => this._handleLock(index)} aria-label="Lock color">${icon(isLocked ? 'lockClosed' : 'lockOpen')}</button>` : ''}
        </div>
      ` : '';

      const baseColorIcon = f.baseColor ? (isBase ? icon('baseColorTarget') : icon('baseColorCircle')) : '';
      const baseColorBadgeClass = `base-color-badge${!isBase ? ' base-color-badge--hover-only' : ''}`;
      const stackedRightIcons = html`
        ${topActions}
        ${f.baseColor ? html`<div class=${baseColorBadgeClass} aria-label=${isBase ? 'Base color' : 'Not base color'}>${baseColorIcon}</div>` : ''}
        ${f.colorBlindness && index === 0 ? html`<div class="color-blindness-badge" aria-label="Color blindness view">${icon('colorBlindness')}</div>` : ''}
        ${showEdit ? html`<button type="button" class="icon-button icon-button--picker" @click=${() => this._handleColorPicker(index)} aria-label="Edit color">${icon('editTint')}</button>` : ''}
        ${f.copy ? html`<button type="button" class="icon-button icon-button--copy" @click=${() => this._handleCopy(swatch.hex)} aria-label="Copy Hex">${icon('copy')}</button>` : ''}
        ${f.trash ? html`<button type="button" class="icon-button icon-button--trash" @click=${() => this._handleTrash(index)} aria-label="Delete color" ?disabled=${isLocked} aria-disabled="${isLocked}">${icon('trash')}</button>` : ''}
      `;

      return html`
        <div class="swatch-column ${isLocked ? 'locked' : ''} ${isBase ? 'base-color' : ''} ${f.drag && !isLocked ? 'swatch-column--draggable' : ''}"
          data-contrast="${textColor === '#ffffff' ? 'dark' : 'light'}"
          style="background-color: ${swatch.hex}; --swatch-text-color: ${textColor}; --swatch-text-shadow: ${shadow}"
          data-swatch-index="${index}"
          ?draggable=${f.drag && !isLocked}
          @dragstart=${(ev) => f.drag && !isLocked && this._handleDragStart(index, ev)}
          @dragend=${this._handleDragEnd}
          @dragover=${this._handleDragOver}
          @dragleave=${this._handleDragLeave}
          @drop=${this._handleDrop}>
          ${!isStacked ? html`
            ${topActions}
            ${f.baseColor ? html`<div class=${baseColorBadgeClass} aria-label=${isBase ? 'Base color' : 'Not base color'}>${baseColorIcon}</div>` : ''}
            ${f.colorBlindness && index === 0 ? html`<div class="color-blindness-badge" aria-label="Color blindness view">${icon('colorBlindness')}</div>` : ''}
          ` : ''}
          <div class="bottom-info" part="bottom-info">
            ${showEdit ? html`<input type="color" id="picker-${index}" class="picker-native" value=${swatch.hex} @input=${(ev) => this._onNativePickerChange(index, ev)} />` : ''}
            ${f.hexCode ? html`<span class="hex-code hex-code--${showEdit ? 'editable' : f.copy ? 'copyable' : 'static'}" @click=${showEdit ? () => this._handleColorPicker(index) : (f.copy ? () => this._handleCopy(swatch.hex) : null)} aria-label=${showEdit ? 'Edit color' : (f.copy ? 'Copy hex' : 'Hex code')}>${swatch.hex}</span>` : ''}
            ${isStacked
              ? html`<div class="bottom-info__actions bottom-info__actions--all">${stackedRightIcons}</div>`
              : html`<div class="bottom-info__actions">
                ${showEdit ? html`<button type="button" class="icon-button icon-button--picker" @click=${() => this._handleColorPicker(index)} aria-label="Edit color">${icon('editTint')}</button>` : ''}
                ${f.copy ? html`<button type="button" class="icon-button icon-button--copy" @click=${() => this._handleCopy(swatch.hex)} aria-label="Copy Hex">${icon('copy')}</button>` : ''}
                ${f.trash ? html`<button type="button" class="icon-button icon-button--trash" @click=${() => this._handleTrash(index)} aria-label="Delete color" ?disabled=${isLocked} aria-disabled="${isLocked}">${icon('trash')}</button>` : ''}
              </div>`}
          </div>
        </div>
      `;
    };

    const renderEmptyStrip = () => f.emptyStrip ? html`
      <div class="swatch-column swatch-column--empty" aria-label="Empty color slot">
        <div class="empty-strip-placeholder">+</div>
      </div>
    ` : '';

    if (!swatches.length && !f.emptyStrip && !f.addLeft && !f.addRight) return html``;

    /* Figma 6215-124479: add-left between 1st and 2nd, add-right between 2nd and 3rd. Contract: max 10 swatches. */
    const canAdd = swatches.length < MAX_SWATCHES;
    const railItems = [];
    swatches.forEach((swatch, index) => {
      railItems.push(renderSwatch(swatch, index));
      if (index === 0 && f.addLeft && swatches.length >= 2 && canAdd) {
        railItems.push(renderAddButton('left', 1));
      }
      if (index === 1 && f.addRight && swatches.length >= 3 && canAdd) {
        railItems.push(renderAddButton('right', 2));
      }
    });

    return html`
      <div class="swatch-rail" data-orientation="${orientation}">
        ${railItems}
        ${renderEmptyStrip()}
      </div>
    `;
  }
}

customElements.define('color-swatch-rail', ColorSwatchRail);
