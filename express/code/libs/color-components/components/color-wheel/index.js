/* eslint-disable */
import { LitElement, html } from '../../../deps/lit-all.min.js';
import { style } from './styles.css.js';
import {
    rgbToHSL,
    xyToPolar,
    polarToXy,
    degToRad,
    hexToRGB,
    rgbToHSB,
    rgbToHex,
    hsbToRGB
} from '../../utils/ColorConversions.js';
import {
    isRightMouseButtonClicked,
    preventDefault
} from '../../utils/util.js';
import { drawColorwheel, scientificToArtisticSmooth } from './ColorWheelUtils.js';

const COLOR_WHEEL_PROPS = {
    DEFAULT_COLORWHEEL_RADIUS: 105,
    DEFAULT_COLORWHEEL_MARKER_RADIUS: 10.5,
    DEFAULT_WHEEL_BRIGHTNESS: 100
};

export class ColorWheel extends LitElement {
    static get properties() {
        return {
            color: { type: String },
            wheelBrightness: { type: Number },
            wheelMarkerSize: { type: Number },
            ariaLabel: { type: String, attribute: 'aria-label' },
            controller: { attribute: false }
        };
    }

    static get styles() {
        return [style];
    }

    constructor() {
        super();
        this.color = '#FF0000';
        this.wheelBrightness = COLOR_WHEEL_PROPS.DEFAULT_WHEEL_BRIGHTNESS;
        this.wheelRadius = COLOR_WHEEL_PROPS.DEFAULT_COLORWHEEL_RADIUS;
        this.canvasPosition = {};
        this.controller = null;
        this._controllerUnsubscribe = null;
        this.swatches = [];
        this.baseColorIndex = 0;
        this.activeSwatchIndex = 0;
        this.harmonyRule = 'ANALOGOUS';
    }

    get wheelMarkerRadius() {
        return this.wheelMarkerSize ? this.wheelMarkerSize / 2 : COLOR_WHEEL_PROPS.DEFAULT_COLORWHEEL_MARKER_RADIUS;
    }

    firstUpdated() {
        this.container = this.shadowRoot.querySelector('.canvas-container');
        this.canvas = this.shadowRoot.querySelector('canvas');
        
        // Initial sizing
        this.updateRadius();
        window.addEventListener('resize', () => this.updateRadius());
        
        // Initial draw
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

    updateRadius() {
        if (this.container && this.container.offsetWidth) {
            this.wheelRadius = this.container.offsetWidth / 2;
            this.requestUpdate();
            this.generateColorWheel();
        }
    }

    generateColorWheel() {
        // Wait for next frame to ensure canvas is ready and sized
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

        // Single-marker fallback when no controller / no swatches
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
        
        // Center of the wheel relative to the layer
        const centerX = this.wheelRadius;
        const centerY = this.wheelRadius;

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
                // Calculate rotation and width for the line
                // transform-origin is 0 50%, so we position it at center and rotate
                spoke.style.width = `${radius}px`;
                // The spoke should start at center and go to marker.
                // My math for x,y is relative to center (0,0).
                // Rotation: -smoothH (degrees) matches the polar calc.
                // Legacy code used: `rotate(${-smoothH}deg)`
                spoke.style.transform = `rotate(${-smoothH}deg)`;
                
                // The styles.css.js positions .wheel-spoke at top:50%, left:50%
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

    getCanvasPosition() {
        const canvasBounds = this.canvas.getBoundingClientRect();
        this.canvasPosition = {
            x: canvasBounds.left,
            y: canvasBounds.top
        };
    }

    getColor(position) {
        return this.canvas
            .getContext('2d')
            .getImageData(position.x, position.y, 1, 1).data;
    }

    updateMarkerPosition(event) {
        const position = {
            x: event.clientX - this.canvasPosition.x,
            y: event.clientY - this.canvasPosition.y
        };

        position.x = Math.round(position.x);
        position.y = Math.round(position.y);

        // Constrain to canvas bounds
        position.x = Math.min(this.canvas.width - 1, Math.max(0, position.x));
        position.y = Math.min(this.canvas.height - 1, Math.max(0, position.y));

        let [r, _] = xyToPolar(
            position.x - this.wheelRadius,
            position.y - this.wheelRadius
        );

        let red, green, blue;

        if (r < this.wheelRadius) {
            [red, green, blue] = this.getColor(position);
        } else {
            // Clamp to edge
            r = this.wheelRadius;
            const [x, y] = polarToXy(r, _);
            
            // Recalculate position on edge
            const edgePos = {
                x: x + this.wheelRadius,
                y: y + this.wheelRadius
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
            
            // Initial update
            if (event.target === this.canvas) {
                const hex = this.updateMarkerPosition(event);
                if (this.controller) {
                    this.controller.setSwatchHex(this.activeSwatchIndex, hex);
                }
            }

            // Setup move tracking (wheel canvas moves the active swatch, like colorweb)
            const moveHandler = (e) => {
                const hex = this.updateMarkerPosition(e);
                if (this.controller) {
                    this.controller.setSwatchHex(this.activeSwatchIndex, hex);
                }
            };
            const upHandler = (e) => {
                const { red, green, blue } = hexToRGB(this.color);
                this.dispatchEvent(new CustomEvent('change-end', { 
                    detail: rgbToHSL(red / 255, green / 255, blue / 255) 
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

        const markerV = this.swatches[index]?.hsv?.v != null ? Number(this.swatches[index].hsv.v) : this.wheelBrightness;

        const moveHandler = (e) => {
            this._dragFixedBrightness = markerV;
            const hex = this.updateMarkerPosition(e);
            if (this.controller) {
                this.controller.setSwatchHex(index, hex);
            }
        };

        const upHandler = () => {
            this._dragFixedBrightness = null;
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

    disconnectedCallback() {
        if (this._controllerUnsubscribe) {
            this._controllerUnsubscribe();
            this._controllerUnsubscribe = null;
        }
        super.disconnectedCallback();
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

customElements.define('color-wheel', ColorWheel);
