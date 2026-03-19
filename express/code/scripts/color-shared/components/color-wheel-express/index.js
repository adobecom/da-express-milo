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

export class ColorWheelExpress extends ColorWheel {
  static get styles() {
    return [style];
  }

  constructor() {
    super();
    this.activeSwatchIndex = 0;
    this.harmonyRule = 'ANALOGOUS';
  }

  firstUpdated() {
    this.container = this.shadowRoot.querySelector('.canvas-container');
    this.canvas = this.shadowRoot.querySelector('canvas');

    this.updateRadius();
    window.addEventListener('resize', () => this.updateRadius());

    this.generateColorWheel();
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

  updateMarkers() {
    const markerLayer = this.shadowRoot.querySelector('.marker-layer');
    if (!markerLayer || !this.swatches.length) return;

    markerLayer.innerHTML = '';

    this.swatches.forEach((swatch, index) => {
      const { h, s } = swatch.hsv;
      const smoothH = scientificToArtisticSmooth(h);
      const radius = (this.wheelRadius * s) / 100;
      const phi = degToRad(180 - smoothH);
      const [x, y] = polarToXy(radius, phi);

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
      marker.style.setProperty('--wheel-marker-color', swatch.hex);
      marker.style.zIndex = index === this.baseColorIndex ? 10 : 5;
      marker.dataset.index = index;
      marker.addEventListener('pointerdown', (e) => this.handleMarkerDown(e, index));

      markerLayer.appendChild(marker);
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

  handlePointerDown(event) {
    preventDefault(event);
    event.stopPropagation();

    if (!isRightMouseButtonClicked(event)) {
      this.getCanvasPosition();

      if (event.target === this.canvas) {
        const hex = this.updateMarkerPosition(event);
        if (this.controller) {
          this.controller.setSwatchHex(this.activeSwatchIndex, hex);
        }
      }

      const moveHandler = (e) => {
        const hex = this.updateMarkerPosition(e);
        if (this.controller) {
          this.controller.setSwatchHex(this.activeSwatchIndex, hex);
        }
      };
      const upHandler = () => {
        const { red, green, blue } = hexToRGB(this.color);
        this.dispatchEvent(new CustomEvent('change-end', {
          detail: rgbToHSL(red / 255, green / 255, blue / 255),
        }));

        window.removeEventListener('pointermove', moveHandler);
        window.removeEventListener('pointerup', upHandler);
        window.removeEventListener('pointercancel', upHandler);
      };

      window.addEventListener('pointermove', moveHandler);
      window.addEventListener('pointerup', upHandler);
      window.addEventListener('pointercancel', upHandler);
    }
  }

  handleMarkerDown(event, index) {
    preventDefault(event);
    event.stopPropagation();

    if (isRightMouseButtonClicked(event)) return;

    if (this.controller && index !== this.activeSwatchIndex) {
      this.controller.setActiveSwatchIndex(index);
    }

    this.getCanvasPosition();

    const markerV = this.swatches[index]?.hsv?.v != null
      ? Number(this.swatches[index].hsv.v)
      : this.wheelBrightness;

    const moveHandler = (e) => {
      this._dragFixedBrightness = markerV;
      const hex = this.updateMarkerPosition(e);
      if (this.controller) {
        this.controller.setSwatchHex(index, hex);
      }
    };

    const upHandler = () => {
      this._dragFixedBrightness = null;
      const { red, green, blue } = hexToRGB(this.color);
      this.dispatchEvent(new CustomEvent('change-end', {
        detail: rgbToHSL(red / 255, green / 255, blue / 255),
      }));
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', upHandler);
      window.removeEventListener('pointercancel', upHandler);
    };

    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', upHandler);
    window.addEventListener('pointercancel', upHandler);
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

        if (this.swatches.length > 0 && active?.hsv != null) {
          const activeV = Math.round(Number(active.hsv.v) ?? 100);
          const v = Math.min(100, Math.max(0, activeV));
          if (this.wheelBrightness !== v) {
            this.wheelBrightness = v;
            this.generateColorWheel();
          }
        }
      });
    }
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
                    <div class="marker-layer" style="width: ${size}px; height: ${size}px;"></div>
                </div>
            </div>
        `;
  }
}

if (!customElements.get('color-wheel-express')) {
  customElements.define('color-wheel-express', ColorWheelExpress);
}
