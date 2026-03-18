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
    rgbToHex
} from '../../utils/ColorConversions.js';
import {
    isRightMouseButtonClicked,
    preventDefault
} from '../../utils/util.js';
import { drawColorwheel, scientificToArtisticSmooth } from './ColorWheelUtils.js';

const BASE_MARKER_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="white" stroke="rgba(0,0,0,0.1)" stroke-width="1"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>`;
const MARKER_SVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="9" stroke="white" stroke-width="2"/></svg>`;

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
    }

    get wheelMarkerRadius() {
        return this.wheelMarkerSize ? this.wheelMarkerSize / 2 : COLOR_WHEEL_PROPS.DEFAULT_COLORWHEEL_MARKER_RADIUS;
    }

    firstUpdated() {
        this.container = this.shadowRoot.querySelector('.canvas-container');
        this.canvas = this.shadowRoot.querySelector('canvas');
        this.marker = this.shadowRoot.querySelector('.wheel-marker');
        
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
        if (!this.marker || !this.canvas) return;

        const { red, green, blue } = hexToRGB(this.color);
        const { hue, saturation } = rgbToHSB(red, green, blue);
        const smoothH = scientificToArtisticSmooth(hue);
        const radius = (this.wheelRadius * saturation) / 100;
        const phi = degToRad(180 - smoothH);
        const [x, y] = polarToXy(radius, phi);
        
        const position = {
            x: x + this.wheelRadius,
            y: y + this.wheelRadius
        };

        // Using transform for performance, centering handled by CSS
        this.marker.style.transform = `translate(${position.x}px, ${position.y}px)`;
        this.marker.style.backgroundColor = this.color;

        this.updateMarkers();
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
            
            // Add Spoke
            if (radius > 0) {
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
            marker.style.width = '20px';
            marker.style.height = '20px';
            marker.style.cursor = 'move';
            marker.style.pointerEvents = 'auto';
            marker.dataset.index = index;

            if (index === this.baseColorIndex) {
                marker.innerHTML = BASE_MARKER_SVG;
                // Tint the inner circle of the base marker
                const innerCircle = marker.querySelector('circle[fill="currentColor"]');
                if (innerCircle) innerCircle.setAttribute('fill', swatch.hex);
                marker.style.zIndex = 10;
            } else {
                marker.innerHTML = MARKER_SVG;
                marker.style.zIndex = 5;
                // Fill the ring with color
                const ring = marker.querySelector('circle');
                if (ring) {
                    ring.setAttribute('stroke', swatch.hex);
                    ring.setAttribute('fill', 'rgba(255,255,255,0.2)'); // Slight fill for hit area
                }
            }

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

        const hsl = rgbToHSL(red / 255, green / 255, blue / 255);
        const hex = rgbToHex({ red, green, blue });

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
                    this.controller.setBaseColor(hex);
                }
            }

            // Setup move tracking
            const moveHandler = (e) => {
                const hex = this.updateMarkerPosition(e);
                if (this.controller) {
                    this.controller.setBaseColor(hex);
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
        
        this.getCanvasPosition();
        
        const moveHandler = (e) => {
            const hex = this.updateMarkerPosition(e);
            if (this.controller) {
                this.controller.setSwatchHex(index, hex);
            }
        };

        const upHandler = () => {
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
                const base = state?.swatches?.[state.baseColorIndex];
                this.swatches = state?.swatches || [];
                this.baseColorIndex = state?.baseColorIndex || 0;
                
                if (base?.hex && base.hex !== this.color) {
                    this.color = base.hex;
                } else {
                    this.paint();
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
        return html`
            <div 
                class="canvas-container"
                aria-label=${this.ariaLabel}
            >
                <canvas
                    class="wheel"
                    width=${this.wheelRadius * 2}
                    height=${this.wheelRadius * 2}
                    @pointerdown=${this.handlePointerDown}
                ></canvas>
                <div class="marker-layer" style="width: ${this.wheelRadius * 2}px; height: ${this.wheelRadius * 2}px; position: absolute; top: 0; left: 0; pointer-events: none;"></div>
                <!-- Base marker logic now handled by updateMarkers inside marker-layer -->
            </div>
        `;
    }
}

customElements.define('color-wheel', ColorWheel);
