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

/** S2 icons from Spectrum Web Components — Figma Color-strip (6180-230477) */
const ICONS = {
  /** Copy hex — icons-s2/Copy.js */
  copy: html`<svg class="icon icon--copy" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m11.75,18h-7.5c-1.24023,0-2.25-1.00977-2.25-2.25v-7.5c0-1.24023,1.00977-2.25,2.25-2.25.41406,0,.75.33594.75.75s-.33594.75-.75.75c-.41309,0-.75.33691-.75.75v7.5c0,.41309.33691.75.75.75h7.5c.41309,0,.75-.33691.75-.75,0-.41406.33594-.75.75-.75s.75.33594.75.75c0,1.24023-1.00977,2.25-2.25,2.25Z"/><path d="m6.75,5c-.41406,0-.75-.33594-.75-.75,0-1.24023,1.00977-2.25,2.25-2.25.41406,0,.75.33594.75.75s-.33594.75-.75.75c-.41309,0-.75.33691-.75.75,0,.41406-.33594.75-.75.75Z"/><path d="m13,3.5h-2c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h2c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z"/><path d="m13,14h-2c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h2c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z"/><path d="m15.75,14c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75c.41309,0,.75-.33691.75-.75,0-.41406.33594-.75.75-.75s.75.33594.75.75c0,1.24023-1.00977,2.25-2.25,2.25Z"/><path d="m17.25,5c-.41406,0-.75-.33594-.75-.75,0-.41309-.33691-.75-.75-.75-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75c1.24023,0,2.25,1.00977,2.25,2.25,0,.41406-.33594.75-.75.75Z"/><path d="m17.25,9.75c-.41406,0-.75-.33594-.75-.75v-2c0-.41406.33594-.75.75-.75s.75.33594.75.75v2c0,.41406-.33594.75-.75.75Z"/><path d="m6.75,9.75c-.41406,0-.75-.33594-.75-.75v-2c0-.41406.33594-.75.75-.75s.75.33594.75.75v2c0,.41406-.33594.75-.75.75Z"/><path d="m8.25,14c-1.24023,0-2.25-1.00977-2.25-2.25,0-.41406.33594-.75.75-.75s.75.33594.75.75c0,.41309.33691.75.75.75.41406,0,.75.33594.75.75s-.33594.75-.75.75Z"/></svg>`,
  /** Color picker circle — Figma 6215-355725 */
  colorPicker: html`<svg class="icon icon--picker" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  /** Edit tint — icons-s2/ColorFill.js */
  editTint: html`<svg class="icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10.91113,9.42188c-.19238,0-.38379-.07324-.53027-.21973L3.67871,2.50098c-.29297-.29297-.29297-.76758,0-1.06055s.76758-.29297,1.06055,0l6.70215,6.70117c.29297.29297.29297.76758,0,1.06055-.14648.14648-.33789.21973-.53027.21973Z"/><path d="M17.58325,9.16895c-.32153-.39404-.71692-.7644-1.08691-1.05859-.00122-.00122-.00195-.00269-.00317-.00391l-4.64941-4.64746c-.5293-.5293-1.28711-.75879-2.02051-.61816-.40723.0791-.67285.47266-.59375.87891.07812.40625.47852.6709.87891.59375.24219-.0498.49707.02832.6748.20605l4.64941,4.64844c.14258.1416.2207.3291.2207.5293s-.07812.38867-.21973.53027l-6.00293,6.00293c-.29297.29297-.76758.29297-1.06055,0l-4.64941-4.64844c-.29297-.29297-.29297-.76855,0-1.06152l2.39746-2.39648c.29297-.29297.29297-.76758,0-1.06055-.29297-.29199-.76758-.29395-1.06055,0l-2.39746,2.39648c-.4248.4248-.65918.99023-.65918,1.59082,0,.60156.23438,1.16699.65918,1.5918l4.64941,4.64844c.4248.4248.99023.65918,1.59082.65918s1.16602-.23438,1.59082-.65918l6.00293-6.00293c.17566-.17578.30994-.37964.41736-.5957.4635,2.39355-.72485,3.43652-.92053,4.54346-.12769.78906.40845,1.53198,1.19751,1.65967.15991.02588.323.02466.48242-.00342.83447-.07715,1.39001-.62646,1.34448-1.93823-.04541-1.31177-.59863-4.76416-1.43213-5.78491Z"/></svg>`,
  /** Trash — icons-s2/Delete.js */
  trash: html`<svg class="icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m8.24902,15.02148c-.40039,0-.7334-.31738-.74805-.7207l-.25-6.5c-.0166-.41406.30664-.7627.71973-.77832.01074-.00098.02051-.00098.03027-.00098.40039,0,.7334.31738.74805.7207l.25,6.5c.0166.41406-.30664.7627-.71973.77832-.01074.00098-.02051.00098-.03027.00098Z"/><path d="m11.75098,15.02148c-.00977,0-.01953,0-.03027-.00098-.41309-.01562-.73633-.36426-.71973-.77832l.25-6.5c.01465-.40332.34766-.7207.74805-.7207.00977,0,.01953,0,.03027.00098.41309.01562.73633.36426.71973.77832l-.25,6.5c-.01465.40332-.34766.7207-.74805.7207Z"/><path d="m17,4h-3.5v-.75c0-1.24023-1.00977-2.25-2.25-2.25h-2.5c-1.24023,0-2.25,1.00977-2.25,2.25v.75h-3.5c-.41406,0-.75.33594-.75.75s.33594.75.75.75h.52002l.42236,10.3418c.04785,1.20996,1.03613,2.1582,2.24805,2.1582h7.61914c1.21191,0,2.2002-.94824,2.24805-2.1582l.42236-10.3418h.52002c.41406,0,.75-.33594.75-.75s-.33594-.75-.75-.75Zm-9-.75c0-.41309.33691-.75.75-.75h2.5c.41309,0,.75.33691.75.75v.75h-4v-.75Zm6.55957,12.53125c-.0166.40332-.3457.71875-.75.71875h-7.61914c-.4043,0-.7334-.31543-.75-.71875l-.41968-10.28125h9.9585l-.41968,10.28125Z"/></svg>`,
  /** Drag handle — icons/DragHandle.js */
  drag: html`<svg class="icon icon--drag" viewBox="0 0 36 36" fill="currentColor" aria-hidden="true"><circle cx="14" cy="26" r="2"/><circle cx="14" cy="20" r="2"/><circle cx="14" cy="14" r="2"/><circle cx="14" cy="8" r="2"/><circle cx="20" cy="26" r="2"/><circle cx="20" cy="20" r="2"/><circle cx="20" cy="14" r="2"/><circle cx="20" cy="8" r="2"/></svg>`,
  /** Add — icons-s2/Add.js */
  add: html`<svg class="icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m16.25,9.25h-5.5V3.75c0-.41406-.33594-.75-.75-.75s-.75.33594-.75.75v5.5H3.75c-.41406,0-.75.33594-.75.75s.33594.75.75.75h5.5v5.5c0,.41406.33594.75.75.75s.75-.33594.75-.75v-5.5h5.5c.41406,0,.75-.33594.75-.75s-.33594-.75-.75-.75Z"/></svg>`,
  /** Color blindness — icons-s2/BrightnessContrast.js */
  colorBlindness: html`<svg class="icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m10,3.0127c-.41406,0-.75-.33594-.75-.75v-1.0127c0-.41406.33594-.75.75-.75s.75.33594.75.75v1.0127c0,.41406-.33594.75-.75.75Z"/><path d="m10,19.5c-.41406,0-.75-.33594-.75-.75v-1c0-.41406.33594-.75.75-.75s.75.33594.75.75v1c0,.41406-.33594.75-.75.75Z"/><path d="m18.75,10.75h-.99902c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h.99902c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z"/><path d="m2.24512,10.75h-.99512c-.41406,0-.75-.33594-.75-.75s.33594-.75.75-.75h.99512c.41406,0,.75.33594.75.75s-.33594.75-.75.75Z"/><path d="m4.51953,5.26953c-.19238,0-.38379-.07324-.53027-.21973l-.70703-.70703c-.29297-.29297-.29297-.76758,0-1.06055s.76758-.29297,1.06055,0l.70703.70703c.29297.29297.29297.76758,0,1.06055-.14648.14648-.33789.21973-.53027.21973Z"/><path d="m16.1875,16.9375c-.19238,0-.38379-.07324-.53027-.21973l-.70508-.70508c-.29297-.29297-.29297-.76758,0-1.06055s.76758-.29297,1.06055,0l.70508.70508c.29297.29297.29297.76758,0,1.06055-.14648.14648-.33789.21973-.53027.21973Z"/><path d="m15.47656,5.26855c-.19238,0-.38574-.07422-.53223-.22168-.29199-.29395-.29004-.76855.00391-1.06055l.71094-.70605c.29395-.29199.76855-.29004,1.06055.00391s.29004.76855-.00391,1.06055l-.71094.70605c-.14648.14551-.33691.21777-.52832.21777Z"/><path d="m3.8125,16.9375c-.19238,0-.38477-.07324-.53125-.2207-.29199-.29297-.29199-.76758.00195-1.06055l.70703-.70508c.29297-.29199.76758-.29199,1.06055.00195.29199.29297.29199.76758-.00195,1.06055l-.70703.70508c-.14648.14551-.33789.21875-.5293.21875Z"/><path d="m10,4c-3.30811,0-6,2.69189-6,6s2.69189,6,6,6,6-2.69189,6-6-2.69189-6-6-6Zm-4.5,6c0-2.4812,2.0188-4.5,4.5-4.5v9c-2.4812,0-4.5-2.0188-4.5-4.5Z"/></svg>`,
  lockOpen: html`<svg class="icon" viewBox="0 0 18 18"><path d="M14.5,8H13V5A4,4,0,0,0,5,5V8H3.5a.5.5,0,0,0-.5.5v8a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5V8.5A.5.5,0,0,0,14.5,8ZM6.5,5a2.5,2.5,0,0,1,5,0V8H6.5Z"/></svg>`,
  lockClosed: html`<svg class="icon" viewBox="0 0 18 18"><path d="M14.5,8H13V5A4,4,0,0,0,5,5V8H3.5a.5.5,0,0,0-.5.5v8a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5V8.5A.5.5,0,0,0,14.5,8ZM9,13.5a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,9,13.5Zm2.5-5.5H6.5V5a2.5,2.5,0,0,1,5,0Z"/></svg>`,
};

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
    const hex = this.swatches[index]?.hex;
    const e = new CustomEvent('color-swatch-rail-edit', { bubbles: true, composed: true, detail: { index, hex } });
    if (this.dispatchEvent(e) && !e.defaultPrevented) {
      const input = this.shadowRoot?.querySelector(`#picker-${index}`);
      if (input) input.click();
    }
  }

  _onNativePickerChange(index, e) {
    const hex = e.target?.value;
    if (hex && this.controller?.setState) {
      const swatches = [...this.swatches];
      swatches[index] = { hex: hex.toUpperCase() };
      this.controller.setState({ swatches });
    }
  }

  _handleDragStart(index, e) {
    if (!this._features.drag) return;
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
      return html`<button type="button" class="icon-button icon-button--add" @click=${handler} aria-label="${label}">${ICONS.add}</button>`;
    };

    const isStacked = orientation === 'stacked';
    const renderSwatch = (swatch, index) => {
      const isLocked = (this.lockedByIndex || new Set()).has(index);
      const isBase = f.baseColor && index === this.baseColorIndex;
      const textColor = getContrastTextColor(swatch.hex);
      const shadow = textColor === '#ffffff' ? '0 0 2px rgba(0,0,0,0.5)' : '0 0 2px rgba(255,255,255,0.5)';
      const editIcon = f.editTint ? ICONS.editTint : ICONS.colorPicker;
      const showEdit = (f.colorPicker || f.editTint) && !editDisabled;

      const topActions = (f.lock || f.drag) ? html`
        <div class="top-actions">
          ${f.drag ? html`<button type="button" class="icon-button icon-button--drag" aria-label="Drag to reorder">${ICONS.drag}</button>` : ''}
          ${f.lock ? html`<button type="button" class="icon-button icon-button--lock" @click=${() => this._handleLock(index)} aria-label="Lock color">${isLocked ? ICONS.lockClosed : ICONS.lockOpen}</button>` : ''}
        </div>
      ` : '';

      const stackedRightIcons = html`
        ${topActions}
        ${f.baseColor && isBase ? html`<div class="base-color-badge" aria-label="Base color">Base</div>` : ''}
        ${f.colorBlindness && index === 0 ? html`<div class="color-blindness-badge" aria-label="Color blindness view">${ICONS.colorBlindness}</div>` : ''}
        ${showEdit ? html`<button type="button" class="icon-button icon-button--picker" @click=${() => this._handleColorPicker(index)} aria-label="Open color picker">${editIcon}</button>` : ''}
        ${f.copy ? html`<button type="button" class="icon-button icon-button--copy" @click=${() => this._handleCopy(swatch.hex)} aria-label="Copy Hex">${ICONS.copy}</button>` : ''}
        ${f.trash ? html`<button type="button" class="icon-button icon-button--trash" @click=${() => this._handleTrash(index)} aria-label="Delete color">${ICONS.trash}</button>` : ''}
      `;

      return html`
        <div class="swatch-column ${isLocked ? 'locked' : ''} ${isBase ? 'base-color' : ''} ${f.drag ? 'swatch-column--draggable' : ''}"
          style="background-color: ${swatch.hex}; --swatch-text-color: ${textColor}; --swatch-text-shadow: ${shadow}"
          data-swatch-index="${index}"
          ?draggable=${f.drag}
          @dragstart=${(ev) => f.drag && this._handleDragStart(index, ev)}
          @dragend=${this._handleDragEnd}
          @dragover=${this._handleDragOver}
          @dragleave=${this._handleDragLeave}
          @drop=${this._handleDrop}>
          ${!isStacked ? html`
            ${topActions}
            ${f.baseColor && isBase ? html`<div class="base-color-badge" aria-label="Base color">Base</div>` : ''}
            ${f.colorBlindness && index === 0 ? html`<div class="color-blindness-badge" aria-label="Color blindness view">${ICONS.colorBlindness}</div>` : ''}
          ` : ''}
          <div class="bottom-info" part="bottom-info">
            ${showEdit ? html`<input type="color" id="picker-${index}" class="picker-native" value=${swatch.hex} @input=${(ev) => this._onNativePickerChange(index, ev)} />` : ''}
            ${f.hexCode ? html`<span class="hex-code" @click=${f.copy ? () => this._handleCopy(swatch.hex) : null} style=${f.copy ? '' : 'cursor: default;'}">${swatch.hex}</span>` : ''}
            ${isStacked
              ? html`<div class="bottom-info__actions bottom-info__actions--all">${stackedRightIcons}</div>`
              : html`<div class="bottom-info__actions">
                ${showEdit ? html`<button type="button" class="icon-button icon-button--picker" @click=${() => this._handleColorPicker(index)} aria-label="Open color picker">${editIcon}</button>` : ''}
                ${f.copy ? html`<button type="button" class="icon-button icon-button--copy" @click=${() => this._handleCopy(swatch.hex)} aria-label="Copy Hex">${ICONS.copy}</button>` : ''}
                ${f.trash ? html`<button type="button" class="icon-button icon-button--trash" @click=${() => this._handleTrash(index)} aria-label="Delete color">${ICONS.trash}</button>` : ''}
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
