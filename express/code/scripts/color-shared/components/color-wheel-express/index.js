/* eslint-disable */
import { html } from '../../../../libs/deps/lit-all.min.js';
import { ColorWheel } from '../../../../libs/color-components/components/color-wheel/index.js';
import { style } from './styles.css.js';
import {
  rgbToHSL,
  xyToPolar,
  polarToXy,
  degToRad,
  hexToRGB,
  rgbToHSB,
  rgbToHex,
  hsbToRGB,
} from '../../../../libs/color-components/utils/ColorConversions.js';
import {
  isRightMouseButtonClicked,
  preventDefault,
} from '../../../../libs/color-components/utils/util.js';
import { drawColorwheel, scientificToArtisticSmooth } from '../../../../libs/color-components/components/color-wheel/ColorWheelUtils.js';
import {
  hsvToWheelXY,
  computeConfusionLinePoints,
  drawConfusionLinesCurve,
  drawConflictLinesOnCanvas,
} from '../../utils/confusionLineUtils.js';

export class ColorWheelExpress extends ColorWheel {
  static get styles() {
    return [style];
  }

  static get properties() {
    return {
      ...super.properties,
      showLines: { type: Boolean },
      conflictPairs: { type: Array },
      isMarkerUp: { type: Boolean },
      markerAriaTemplate: { attribute: false },
    };
  }

  constructor() {
    super();
    this.activeSwatchIndex = 0;
    this.harmonyRule = 'ANALOGOUS';
    this.showLines = false;
    this.conflictPairs = [];
    this.isMarkerUp = true;
    this._dragIndex = -1;
    this._kbFocusIndex = -1;
    this.markerAriaTemplate = '{hex}, use arrow keys to move';
  }

  firstUpdated() {
    this.container = this.shadowRoot.querySelector('.canvas-container');
    this.canvas = this.shadowRoot.querySelector('canvas.wheel');
    this.conflictCanvas = this.shadowRoot.querySelector('.conflict-lines-canvas');
    this.confusionCanvas = this.shadowRoot.querySelector('.confusion-lines-canvas');

    // Drag reads pixels via getImageData on every rAF tick. Without this
    // flag the canvas is GPU-backed and each read forces a sync GPU→CPU
    // readback (allocating staging buffers each call). iOS Safari's
    // WebContent process gets killed under that pressure. Setting the
    // flag once here is sticky — the parent class's bare getContext('2d')
    // calls return this same context, so reads stay cheap.
    this.canvas?.getContext('2d', { willReadFrequently: true });

    this._resizeObserver = new ResizeObserver(() => this.updateRadius());
    this._resizeObserver.observe(this.container);

    this.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this._kbFocusIndex < 0) {
        e.preventDefault();
        const firstMarker = this.shadowRoot?.querySelector('.wheel-marker-overlay[data-index="0"]');
        if (firstMarker) {
          this._kbFocusIndex = 0;
          firstMarker.focus({ preventScroll: true });
        }
      }
    });

    this.generateColorWheel();
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    if (this._controllerUnsubscribe) {
      this._controllerUnsubscribe();
      this._controllerUnsubscribe = null;
    }
    if (this._dragRaf) {
      cancelAnimationFrame(this._dragRaf);
      this._dragRaf = 0;
    }
    if (this._dragWriteTimer) {
      clearTimeout(this._dragWriteTimer);
      this._dragWriteTimer = null;
    }
    // If the component is torn down mid-drag (e.g. breakpoint re-init), the
    // window-level pointer listeners would otherwise leak forever, holding
    // closures over the dead element and re-firing on every subsequent drag.
    if (this._activeDragCleanup) {
      try { this._activeDragCleanup(); } catch (_) { /* noop */ }
      this._activeDragCleanup = null;
    }
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has('controller')) {
      this.attachController();
    }
    if (changedProperties.has('color')) {
      if (this.swatches.length === 0 && this.color) {
        const { red, green, blue } = hexToRGB(this.color);
        const hsb = rgbToHSB(red, green, blue);
        const v = Math.min(100, Math.max(0, Math.round(hsb.brightness ?? 100)));
        if (this.wheelBrightness !== v) {
          this.wheelBrightness = v;
          this.generateColorWheel();
          return;
        }
      }
      this.paint();
    }
    if (changedProperties.has('wheelBrightness')) {
      this.generateColorWheel();
    }
    if (changedProperties.has('showLines')
      || changedProperties.has('conflictPairs')
      || changedProperties.has('isMarkerUp')) {
      this.drawLines();
    }
  }

  generateColorWheel() {
    setTimeout(() => {
      if (!this.canvas) return;

      const context = this.canvas.getContext('2d');
      drawColorwheel(this.wheelBrightness / 100, this.wheelRadius, context);
      this.paint();
    }, 1);
  }

  paint() {
    if (!this.canvas) return;

    if (this.swatches.length > 0) {
      this.updateMarkers();
      return;
    }

    const { red, green, blue } = hexToRGB(this.color);
    const { hue, saturation } = rgbToHSB(red, green, blue);
    const smoothH = scientificToArtisticSmooth(hue);
    const radius = (this.wheelRadius * saturation) / 100;
    const phi = degToRad(180 - smoothH);
    const [x, y] = polarToXy(radius, phi);

    const markerLayer = this.shadowRoot.querySelector('.marker-layer');
    if (!markerLayer) return;
    markerLayer.innerHTML = '';
    const showSpokes = this.harmonyRule !== 'CUSTOM';
    if (radius > 0 && showSpokes) {
      const spoke = document.createElement('div');
      spoke.className = 'wheel-spoke';
      spoke.style.width = `${radius}px`;
      spoke.style.transform = `rotate(${-smoothH}deg)`;
      markerLayer.appendChild(spoke);
    }
    const marker = document.createElement('div');
    marker.className = 'wheel-marker-overlay';
    marker.style.position = 'absolute';
    marker.style.left = `calc(50% + ${x}px)`;
    marker.style.top = `calc(50% + ${y}px)`;
    marker.style.transform = 'translate(-50%, -50%)';
    marker.style.setProperty('--wheel-marker-color', this.color);
    marker.style.zIndex = 10;
    markerLayer.appendChild(marker);
  }

  _createMarker(index) {
    const marker = document.createElement('div');
    marker.className = 'wheel-marker-overlay';
    marker.style.position = 'absolute';
    marker.style.transform = 'translate(-50%, -50%)';
    marker.dataset.index = index;
    marker.setAttribute('role', 'button');
    marker.setAttribute('tabindex', '-1');
    // Listeners are bound once at creation; index is read live from dataset
    // to avoid stale closures if a marker's slot index ever shifts.
    marker.addEventListener('pointerdown', (e) => {
      this.handleMarkerDown(e, Number(marker.dataset.index));
    });
    marker.addEventListener('keydown', (e) => {
      this._handleMarkerKeydown(e, Number(marker.dataset.index));
    });
    marker.addEventListener('focus', () => {
      this._kbFocusIndex = Number(marker.dataset.index);
      marker.classList.add('wheel-marker-overlay--kb-focused');
    });
    marker.addEventListener('blur', (e) => {
      marker.classList.remove('wheel-marker-overlay--kb-focused');
      if (!e.relatedTarget || !this.shadowRoot.contains(e.relatedTarget)) {
        this._kbFocusIndex = -1;
      }
    });
    return marker;
  }

  updateMarkers() {
    const markerLayer = this.shadowRoot.querySelector('.marker-layer');
    if (!markerLayer || !this.swatches.length) return;

    // Patch existing markers/spokes in place. Wiping markerLayer.innerHTML on
    // every drag tick destroys the marker the user is currently pressing,
    // which on iOS Safari corrupts the active gesture (handle drift, in some
    // cases triggering a navigation/refresh) and leaks DOM/listeners until
    // the tab OOMs. Only create/remove DOM when the swatch count changes.
    const showSpokes = this.harmonyRule !== 'CUSTOM';
    const desiredCount = this.swatches.length;

    const existingMarkers = markerLayer.querySelectorAll('.wheel-marker-overlay');
    for (let i = existingMarkers.length - 1; i >= desiredCount; i -= 1) {
      existingMarkers[i].remove();
    }
    const existingSpokes = markerLayer.querySelectorAll('.wheel-spoke');
    existingSpokes.forEach((spoke) => spoke.remove());

    this.swatches.forEach((swatch, index) => {
      if (!swatch?.hsv) return;
      const { h, s } = swatch.hsv;
      const smoothH = scientificToArtisticSmooth(h);
      const radius = (this.wheelRadius * s) / 100;
      const phi = degToRad(180 - smoothH);
      const [x, y] = polarToXy(radius, phi);

      if (radius > 0 && showSpokes) {
        const spoke = document.createElement('div');
        spoke.className = 'wheel-spoke';
        spoke.dataset.spoke = index;
        spoke.style.width = `${radius}px`;
        spoke.style.transform = `rotate(${-smoothH}deg)`;
        markerLayer.appendChild(spoke);
      }

      let marker = markerLayer.querySelector(`.wheel-marker-overlay[data-index="${index}"]`);
      if (!marker) {
        marker = this._createMarker(index);
        markerLayer.appendChild(marker);
      } else if (Number(marker.dataset.index) !== index) {
        marker.dataset.index = index;
      }
      marker.style.left = `calc(50% + ${x}px)`;
      marker.style.top = `calc(50% + ${y}px)`;
      marker.style.setProperty('--wheel-marker-color', swatch.hex);
      marker.style.zIndex = index === this.baseColorIndex ? 10 : 5;
      marker.setAttribute('aria-label', (this.markerAriaTemplate || '{hex}, use arrow keys to move').replace('{hex}', swatch.hex));
      const isBase = index === this.baseColorIndex && this.harmonyRule !== 'CUSTOM';
      marker.classList.toggle('wheel-marker-overlay--base', isBase);
      marker.classList.toggle('wheel-marker-overlay--active', index === this.activeSwatchIndex);
    });

    if (this._kbFocusIndex >= 0 && this._kbFocusIndex < this.swatches.length) {
      const kbIdx = this._kbFocusIndex;
      const m = markerLayer.querySelector(`[data-index="${kbIdx}"]`);
      if (m && this.shadowRoot.activeElement !== m) {
        requestAnimationFrame(() => m.focus({ preventScroll: true }));
      }
    }

    this.drawLines();
  }

  _handleMarkerKeydown(e, index) {
    const step = 3;
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); this._moveMarkerByKey(index, step, 0); break;
      case 'ArrowLeft': e.preventDefault(); this._moveMarkerByKey(index, -step, 0); break;
      case 'ArrowUp': e.preventDefault(); this._moveMarkerByKey(index, 0, step); break;
      case 'ArrowDown': e.preventDefault(); this._moveMarkerByKey(index, 0, -step); break;
      case 'Tab': {
        e.preventDefault();
        const count = this.swatches.length;
        const next = e.shiftKey ? (index - 1 + count) % count : (index + 1) % count;
        const nextMarker = this.shadowRoot?.querySelector(`.wheel-marker-overlay[data-index="${next}"]`);
        if (nextMarker) {
          this._kbFocusIndex = next;
          nextMarker.focus({ preventScroll: true });
        }
        break;
      }
      case 'Escape':
        e.preventDefault();
        this._kbFocusIndex = -1;
        this.focus({ preventScroll: true });
        break;
      default: break;
    }
  }

  _moveMarkerByKey(index, dh, ds) {
    const swatch = this.swatches[index];
    if (!swatch?.hsv || !this.controller) return;
    const { h, s, v } = swatch.hsv;
    const newH = ((h + dh) % 360 + 360) % 360;
    const newS = Math.min(100, Math.max(0, s + ds));
    const fixedV = v != null ? Math.min(100, Math.max(0, Number(v))) : this.wheelBrightness;
    const rgb = hsbToRGB(newH / 360, newS / 100, fixedV / 100);
    const hex = rgbToHex(rgb);
    this._dragIndex = index;
    this._dragFixedBrightness = fixedV;
    this.controller.setSwatchHex(index, hex);
    requestAnimationFrame(() => {
      if (this._dragIndex === index) {
        this._dragIndex = -1;
        this._dragFixedBrightness = null;
      }
    });
  }

  updateMarkerPosition(event) {
    const position = {
      x: event.clientX - this.canvasPosition.x,
      y: event.clientY - this.canvasPosition.y,
    };

    position.x = Math.round(position.x);
    position.y = Math.round(position.y);

    position.x = Math.min(this.canvas.width - 1, Math.max(0, position.x));
    position.y = Math.min(this.canvas.height - 1, Math.max(0, position.y));

    let [r, angle] = xyToPolar(
      position.x - this.wheelRadius,
      position.y - this.wheelRadius,
    );

    let red; let green; let blue;

    if (r < this.wheelRadius) {
      [red, green, blue] = this.getColor(position);
    } else {
      r = this.wheelRadius;
      const [x, y] = polarToXy(r, angle);

      const edgePos = {
        x: x + this.wheelRadius,
        y: y + this.wheelRadius,
      };
      [red, green, blue] = this.getColor(edgePos);
    }

    const hsb = rgbToHSB(red / 255, green / 255, blue / 255);
    const brightnessToUse = this._dragFixedBrightness != null
      ? Math.min(100, Math.max(0, this._dragFixedBrightness)) / 100
      : Math.min(100, Math.max(0, this.wheelBrightness)) / 100;
    const rgb = hsbToRGB(hsb.hue / 360, hsb.saturation / 100, brightnessToUse);
    const hex = rgbToHex(rgb);
    const hsl = rgbToHSL(rgb.red / 255, rgb.green / 255, rgb.blue / 255);

    this.dispatchEvent(new CustomEvent('change', { detail: hsl }));
    return hex;
  }

  // Decouple visual feedback from controller writes during drag.
  //
  // The dominant cost of a drag tick is NOT the rAF rate — it is the
  // setSwatchHex fan-out: 2 deep-clone _notify calls × ~6 controller
  // subscribers, including the swatch-rail bridge that re-emits to a Lit
  // re-render of the entire strip (Spectrum components, hex labels, lock /
  // trash buttons, etc.) plus the context provider's listeners and document
  // event bus dispatch. On iOS Safari the resulting per-second allocation
  // and shadow-DOM churn causes the WebContent process to be killed by
  // jetsam (page-refresh symptom) and eventually shows
  // "a problem repeatedly occurred".
  //
  // Strategy:
  //   • Visual update (marker DOM position + colour) at every rAF tick —
  //     cheap, keeps the marker locked to the finger.
  //   • controller.setSwatchHex throttled to ~12 Hz (every ~80 ms). The
  //     strip and harmony recompute breathe between writes.
  //   • A trailing setTimeout flush guarantees the user's final cursor
  //     position is committed even if it arrives inside a throttle gap.
  //
  // Compute marker position via the same HSB→wheel-coords pipeline that
  // updateMarkers() uses, so the local position matches the eventual
  // controller-driven re-render and there is no snap when it commits.
  _updateMarkerDomLocally(index, hex) {
    const layer = this.shadowRoot?.querySelector('.marker-layer');
    if (!layer) return;
    const marker = layer.querySelector(`.wheel-marker-overlay[data-index="${index}"]`);
    if (!marker) return;

    const { red, green, blue } = hexToRGB(hex);
    const { hue, saturation } = rgbToHSB(red, green, blue);
    const smoothH = scientificToArtisticSmooth(hue);
    const radius = (this.wheelRadius * saturation) / 100;
    const phi = degToRad(180 - smoothH);
    const [x, y] = polarToXy(radius, phi);

    marker.style.left = `calc(50% + ${x}px)`;
    marker.style.top = `calc(50% + ${y}px)`;
    marker.style.setProperty('--wheel-marker-color', hex);
  }

  _flushPendingDragWrite() {
    if (this._dragWriteTimer) {
      clearTimeout(this._dragWriteTimer);
      this._dragWriteTimer = null;
    }
    if (this._pendingDragWrite && this.controller) {
      const { index, hex } = this._pendingDragWrite;
      this._pendingDragWrite = null;
      this._lastDragWriteAt = performance.now();
      this.controller.setSwatchHex(index, hex);
    }
  }

  _scheduleDragUpdate(index, event) {
    this._pendingDragEvent = event;
    this._pendingDragIndex = index;
    if (this._dragRaf) return;
    this._dragRaf = requestAnimationFrame(() => {
      this._dragRaf = 0;
      const e = this._pendingDragEvent;
      const i = this._pendingDragIndex;
      this._pendingDragEvent = null;
      if (!e || !this.controller) return;

      // Hex of the dragged position.
      const hex = this.updateMarkerPosition(e);

      // Cheap visual update — marker tracks the finger every frame.
      this._updateMarkerDomLocally(i, hex);

      // Throttle controller writes to ~12Hz so the strip updates during the
      // drag without forcing a deep-clone + multi-subscriber Lit re-render
      // on every frame. The trailing setTimeout guarantees the final
      // position commits even if the gap was inside the throttle window.
      const now = performance.now();
      const elapsed = now - (this._lastDragWriteAt || 0);
      const MIN_WRITE_INTERVAL_MS = 80;

      if (elapsed >= MIN_WRITE_INTERVAL_MS) {
        this._lastDragWriteAt = now;
        this._pendingDragWrite = null;
        if (this._dragWriteTimer) {
          clearTimeout(this._dragWriteTimer);
          this._dragWriteTimer = null;
        }
        this.controller.setSwatchHex(i, hex);
      } else {
        this._pendingDragWrite = { index: i, hex };
        if (!this._dragWriteTimer) {
          this._dragWriteTimer = setTimeout(() => {
            this._dragWriteTimer = null;
            this._flushPendingDragWrite();
          }, MIN_WRITE_INTERVAL_MS - elapsed);
        }
      }
    });
  }

  handlePointerDown(event) {
    preventDefault(event);
    event.stopPropagation();

    if (isRightMouseButtonClicked(event)) return;
    this.getCanvasPosition();

    if (event.target === this.canvas) {
      if (this.showLines && !this.isMarkerUp) {
        this.isMarkerUp = true;
        this.dispatchEvent(new CustomEvent('marker-deselect'));
      }
      const hex = this.updateMarkerPosition(event);
      if (this.controller) {
        this._lastDragWriteAt = performance.now();
        this.controller.setSwatchHex(this.activeSwatchIndex, hex);
      }
    }

    if (this._activeDragCleanup) {
      try { this._activeDragCleanup(); } catch (_) { /* noop */ }
      this._activeDragCleanup = null;
    }

    const target = event.target;
    const pointerId = event.pointerId;
    try { target?.setPointerCapture?.(pointerId); } catch (_) { /* noop */ }

    const moveHandler = (e) => {
      if (e.pointerId !== pointerId) return;
      this._scheduleDragUpdate(this.activeSwatchIndex, e);
    };
    const endDrag = () => {
      if (this._dragRaf) {
        cancelAnimationFrame(this._dragRaf);
        this._dragRaf = 0;
        this._pendingDragEvent = null;
      }
      // Commit the user's final cursor position, even if a throttle gap
      // would have otherwise dropped it.
      this._flushPendingDragWrite();
      try { target?.releasePointerCapture?.(pointerId); } catch (_) { /* noop */ }
      const { red, green, blue } = hexToRGB(this.color);
      this.dispatchEvent(new CustomEvent('change-end', {
        detail: rgbToHSL(red / 255, green / 255, blue / 255),
      }));
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', upHandler);
      window.removeEventListener('pointercancel', cancelHandler);
      target?.removeEventListener?.('lostpointercapture', lostHandler);
      this._activeDragCleanup = null;
    };
    const upHandler = (e) => {
      if (e.pointerId !== pointerId) return;
      endDrag();
    };
    const cancelHandler = (e) => {
      if (e.pointerId !== pointerId) return;
      endDrag();
    };
    // iOS Safari can lose pointer capture mid-drag (multi-touch interruption,
    // backgrounding) without firing pointerup OR pointercancel. Without this
    // fallback the window listeners would leak.
    const lostHandler = () => endDrag();

    this._activeDragCleanup = endDrag;

    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', upHandler);
    window.addEventListener('pointercancel', cancelHandler);
    target?.addEventListener?.('lostpointercapture', lostHandler);
  }

  handleMarkerDown(event, index) {
    preventDefault(event);
    event.stopPropagation();

    if (isRightMouseButtonClicked(event)) return;

    // Paint the active ring optimistically — the controller fan-out (deep
    // clone state + Lit re-render across ~6 subscribers) can take many ms
    // on iOS and the user otherwise sees no feedback during that window.
    if (index !== this.activeSwatchIndex) {
      const layer = this.shadowRoot?.querySelector('.marker-layer');
      if (layer) {
        layer.querySelectorAll('.wheel-marker-overlay--active')
          .forEach((m) => m.classList.remove('wheel-marker-overlay--active'));
        const next = layer.querySelector(`.wheel-marker-overlay[data-index="${index}"]`);
        next?.classList.add('wheel-marker-overlay--active');
      }
    }

    if (this.controller && index !== this.activeSwatchIndex) {
      this.controller.setActiveSwatchIndex(index);
    }

    if (this.showLines && this.isMarkerUp) {
      this.isMarkerUp = false;
      this.dispatchEvent(new CustomEvent('marker-select', { detail: { index } }));
    }

    this.getCanvasPosition();
    this._dragIndex = index;

    const rawV = this.swatches[index]?.hsv?.v != null
      ? Number(this.swatches[index].hsv.v)
      : this.wheelBrightness;
    const markerV = rawV > 0 ? rawV : this.wheelBrightness;
    this._dragFixedBrightness = markerV;

    if (this._activeDragCleanup) {
      try { this._activeDragCleanup(); } catch (_) { /* noop */ }
      this._activeDragCleanup = null;
    }

    const target = event.currentTarget || event.target;
    const pointerId = event.pointerId;
    // Capture the pointer to the marker so the gesture survives any DOM
    // movement and the browser stops considering native pan/refresh gestures.
    try { target?.setPointerCapture?.(pointerId); } catch (_) { /* noop */ }

    // Reset the throttle clock so the first move during a fresh drag commits
    // immediately rather than waiting for the trailing flush.
    this._lastDragWriteAt = 0;

    const moveHandler = (e) => {
      if (e.pointerId !== pointerId) return;
      this._scheduleDragUpdate(index, e);
    };
    const endDrag = () => {
      if (this._dragRaf) {
        cancelAnimationFrame(this._dragRaf);
        this._dragRaf = 0;
        this._pendingDragEvent = null;
      }
      // Commit the user's final cursor position, even if a throttle gap
      // would have otherwise dropped it.
      this._flushPendingDragWrite();
      this._dragIndex = -1;
      this._dragFixedBrightness = null;
      if (this.showLines && !this.isMarkerUp) {
        this.isMarkerUp = true;
        this.dispatchEvent(new CustomEvent('marker-deselect'));
      }
      try { target?.releasePointerCapture?.(pointerId); } catch (_) { /* noop */ }
      const { red, green, blue } = hexToRGB(this.color);
      this.dispatchEvent(new CustomEvent('change-end', {
        detail: rgbToHSL(red / 255, green / 255, blue / 255),
      }));
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', upHandler);
      window.removeEventListener('pointercancel', cancelHandler);
      target?.removeEventListener?.('lostpointercapture', lostHandler);
      this._activeDragCleanup = null;
    };
    const upHandler = (e) => {
      if (e.pointerId !== pointerId) return;
      endDrag();
    };
    const cancelHandler = (e) => {
      if (e.pointerId !== pointerId) return;
      endDrag();
    };
    // iOS Safari can lose pointer capture mid-drag (multi-touch interruption,
    // backgrounding) without firing pointerup OR pointercancel. Without this
    // fallback the window listeners would leak.
    const lostHandler = () => endDrag();

    this._activeDragCleanup = endDrag;

    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', upHandler);
    window.addEventListener('pointercancel', cancelHandler);
    target?.addEventListener?.('lostpointercapture', lostHandler);
  }

  attachController() {
    if (this._controllerUnsubscribe) {
      this._controllerUnsubscribe();
      this._controllerUnsubscribe = null;
    }

    if (this.controller && typeof this.controller.subscribe === 'function') {
      this._controllerUnsubscribe = this.controller.subscribe((state) => {
        this.swatches = state?.swatches || [];
        this.baseColorIndex = state?.baseColorIndex ?? 0;
        this.activeSwatchIndex = state?.activeSwatchIndex ?? state?.baseColorIndex ?? 0;
        this.harmonyRule = state?.harmonyRule || 'ANALOGOUS';

        const active = state?.swatches?.[this.activeSwatchIndex];
        if (active?.hex && active.hex !== this.color) {
          this.color = active.hex;
        } else {
          this.paint();
        }

        if (this.swatches.length > 0 && active?.hsv != null && this._dragIndex < 0) {
          const activeV = Math.round(Number(active.hsv.v) ?? 100);
          const v = Math.min(100, Math.max(0, activeV));
          if (v > 0 && this.wheelBrightness !== v) {
            this.wheelBrightness = v;
            this.generateColorWheel();
          }
        }
      });
    }
  }

  drawLines() {
    if (!this.showLines) {
      this.clearConflictCanvas();
      this.clearConfusionCanvas();
      return;
    }

    if (this.isMarkerUp) {
      this.clearConfusionCanvas();
      this._drawConflictLines();
    } else {
      this.clearConflictCanvas();
      this._drawConfusionLines();
    }
  }

  _drawConflictLines() {
    if (!this.conflictCanvas) return;

    const ctx = this.conflictCanvas.getContext('2d');
    const size = this.wheelRadius * 2;
    ctx.clearRect(0, 0, size, size);

    if (!this.conflictPairs?.length || !this.swatches?.length) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.wheelRadius, this.wheelRadius, this.wheelRadius, 0, Math.PI * 2);
    ctx.clip();

    drawConflictLinesOnCanvas(ctx, this.swatches, this.conflictPairs, this.wheelRadius);

    ctx.restore();
  }

  _drawConfusionLines() {
    if (!this.confusionCanvas) return;

    const swatch = this.swatches[this.activeSwatchIndex];
    if (!swatch?.hsv) return;

    const { h, s } = swatch.hsv;
    const brightness = this.wheelBrightness ?? 100;

    const linesPoints = computeConfusionLinePoints([h, s], brightness);

    const ctx = this.confusionCanvas.getContext('2d');
    const size = this.wheelRadius * 2;
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.wheelRadius, this.wheelRadius, this.wheelRadius, 0, Math.PI * 2);
    ctx.clip();

    for (const type of Object.keys(linesPoints)) {
      const hsvPoints = linesPoints[type];
      if (!hsvPoints?.length) continue;

      const xyPoints = hsvPoints.map(([pH, pS]) => hsvToWheelXY(pH, pS, this.wheelRadius));

      drawConfusionLinesCurve(ctx, xyPoints, {
        lineWidth: 4,
        wheelRadius: this.wheelRadius,
      });
    }

    ctx.restore();
  }

  clearConflictCanvas() {
    if (!this.conflictCanvas) return;
    const size = this.wheelRadius * 2;
    this.conflictCanvas.getContext('2d').clearRect(0, 0, size, size);
  }

  clearConfusionCanvas() {
    if (!this.confusionCanvas) return;
    const size = this.wheelRadius * 2;
    this.confusionCanvas.getContext('2d').clearRect(0, 0, size, size);
  }

  render() {
    const size = this.wheelRadius * 2;
    return html`
            <div
                class="canvas-container"
                aria-label=${this.ariaLabel}
            >
                <div class="wheel-wrapper" style="width: ${size}px; height: ${size}px;">
                    <canvas
                        class="wheel"
                        width=${size}
                        height=${size}
                        @pointerdown=${this.handlePointerDown}
                    ></canvas>
                    <canvas class="conflict-lines-canvas" width=${size} height=${size}></canvas>
                    <canvas class="confusion-lines-canvas" width=${size} height=${size}></canvas>
                    <div class="marker-layer" style="width: ${size}px; height: ${size}px;"></div>
                </div>
            </div>
        `;
  }
}

if (!customElements.get('color-wheel-express')) {
  customElements.define('color-wheel-express', ColorWheelExpress);
}
