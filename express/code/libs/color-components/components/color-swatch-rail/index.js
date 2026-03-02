/* eslint-disable no-underscore-dangle, class-methods-use-this, import/prefer-default-export */
import { LitElement, html } from '../../../deps/lit-all.min.js';
import { getContrastTextColor } from '../../utils/ColorConversions.js';
import { style } from './styles.css.js';

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

/** Icon asset filenames — Express way: img src to cached SVG assets */
const ICON_FILES = {
  copy: 's2-icon-copy-20.svg',
  colorPicker: 's2-icon-color-picker-20.svg',
  editTint: 's2-icon-edit-tint-20.svg',
  trash: 's2-icon-trash-20.svg',
  drag: 's2-icon-drag-20.svg',
  add: 's2-icon-add-20-accent.svg',
  colorBlindness: 's2-icon-color-blindness-20.svg',
  lockOpen: 's2-icon-lock-open-20.svg',
  lockClosed: 's2-icon-lock-20.svg',
};

const ICON_BASE = '/express/code/icons';

/** Renders an icon img (Express way — cached assets) */
const icon = (name) => html`<img class="icon" src="${ICON_BASE}/${ICON_FILES[name]}" alt="" width="20" height="20" aria-hidden="true">`;

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
      // In a real app, we'd show a toast here
    }
  }

  _handleLock(index) {
    const next = new Set(this.lockedByIndex || []);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    if (this.controller?.setState) this.controller.setState({ lockedByIndex: next });
  }

  _handleTrash(index) {
    if ((this.lockedByIndex || new Set()).has(index)) return;
    const e = new CustomEvent('color-swatch-rail-delete', { bubbles: true, composed: true, detail: { index } });
    if (this.dispatchEvent(e) && !e.defaultPrevented && this.controller?.setState) {
      const swatches = this.swatches.filter((_, i) => i !== index);
      this.controller.setState({ swatches });
    }
  }

  _handleAddLeft(index) {
    const e = new CustomEvent('color-swatch-rail-add', { bubbles: true, composed: true, detail: { side: 'left', index } });
    if (this.dispatchEvent(e) && !e.defaultPrevented && this.controller?.setState) {
      const swatches = [...this.swatches];
      swatches.splice(index, 0, { hex: '#808080' });
      this.controller.setState({ swatches });
    }
  }

  _handleAddRight(index) {
    const e = new CustomEvent('color-swatch-rail-add', { bubbles: true, composed: true, detail: { side: 'right', index } });
    if (this.dispatchEvent(e) && !e.defaultPrevented && this.controller?.setState) {
      const swatches = [...this.swatches];
      swatches.splice(index + 1, 0, { hex: '#808080' });
      this.controller.setState({ swatches });
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

    const renderAddButton = (side, index) => {
      if (side === 'left' && !f.addLeft) return '';
      if (side === 'right' && !f.addRight) return '';
      const label = side === 'left' ? 'Add color left' : 'Add color right';
      const handler = side === 'left' ? () => this._handleAddLeft(index) : () => this._handleAddRight(index);
      return html`<button type="button" class="icon-button icon-button--add" part="add-button" @click=${handler} aria-label="${label}" title="${label}">${icon('add')}</button>`;
    };

    const isStacked = orientation === 'stacked';
    const renderSwatch = (swatch, index) => {
      const isLocked = (this.lockedByIndex || new Set()).has(index);
      const isBase = f.baseColor && index === this.baseColorIndex;
      const textColor = getContrastTextColor(swatch.hex);
      const shadow = textColor === '#ffffff' ? '0 0 2px rgba(0,0,0,0.5)' : '0 0 2px rgba(255,255,255,0.5)';
      const editIconName = f.editTint ? 'editTint' : 'colorPicker';
      const showEdit = (f.colorPicker || f.editTint) && !editDisabled && !isLocked;

      const topActions = (f.lock || f.drag) ? html`
        <div class="top-actions">
          ${f.drag && !isLocked ? html`<button type="button" class="icon-button icon-button--drag" aria-label="Drag to reorder">${icon('drag')}</button>` : ''}
          ${f.lock ? html`<button type="button" class="icon-button icon-button--lock" @click=${() => this._handleLock(index)} aria-label="Lock color">${icon(isLocked ? 'lockClosed' : 'lockOpen')}</button>` : ''}
        </div>
      ` : '';

      const stackedRightIcons = html`
        ${topActions}
        ${f.baseColor && isBase ? html`<div class="base-color-badge" aria-label="Base color">Base</div>` : ''}
        ${f.colorBlindness && index === 0 ? html`<div class="color-blindness-badge" aria-label="Color blindness view">${icon('colorBlindness')}</div>` : ''}
        ${showEdit ? html`<button type="button" class="icon-button icon-button--picker" @click=${() => this._handleColorPicker(index)} aria-label="Open color picker">${icon(editIconName)}</button>` : ''}
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
            ${f.baseColor && isBase ? html`<div class="base-color-badge" aria-label="Base color">Base</div>` : ''}
            ${f.colorBlindness && index === 0 ? html`<div class="color-blindness-badge" aria-label="Color blindness view">${icon('colorBlindness')}</div>` : ''}
          ` : ''}
          <div class="bottom-info" part="bottom-info">
            ${showEdit ? html`<input type="color" id="picker-${index}" class="picker-native" value=${swatch.hex} @input=${(ev) => this._onNativePickerChange(index, ev)} />` : ''}
            ${f.hexCode ? html`<span class="hex-code" @click=${f.copy ? () => this._handleCopy(swatch.hex) : null} style=${f.copy ? '' : 'cursor: default;'}">${swatch.hex}</span>` : ''}
            ${isStacked
              ? html`<div class="bottom-info__actions bottom-info__actions--all">${stackedRightIcons}</div>`
              : html`<div class="bottom-info__actions">
                ${showEdit ? html`<button type="button" class="icon-button icon-button--picker" @click=${() => this._handleColorPicker(index)} aria-label="Open color picker">${icon(editIconName)}</button>` : ''}
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

    return html`
      <div class="swatch-rail" data-orientation="${orientation}">
        ${f.addLeft ? html`<div class="add-slot add-slot--left">${renderAddButton('left', 0)}</div>` : ''}
        ${swatches.map((swatch, index) => renderSwatch(swatch, index))}
        ${f.addRight && swatches.length ? html`<div class="add-slot add-slot--right">${renderAddButton('right', swatches.length - 1)}</div>` : ''}
        ${renderEmptyStrip()}
      </div>
    `;
  }
}

customElements.define('color-swatch-rail', ColorSwatchRail);
