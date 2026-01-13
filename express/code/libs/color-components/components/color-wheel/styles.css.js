import { css } from '../../../deps/lit-all.min.js';

export const style = css`
    :host {
        display: block;
        width: 100%;
    }

    .canvas-container {
        margin: auto;
        position: relative;
        display: flex;
        width: 100%;
        justify-content: center;
        touch-action: none; /* Prevent scrolling while dragging on wheel */
    }

    .wheel {
        border-radius: 50%;
        display: block;
    }

    /* Legacy single marker - deprecated but kept for fallback */
    .wheel-marker {
        position: absolute;
        width: 21px;
        height: 21px;
        border-radius: 50%;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        touch-action: none;
        z-index: 10;
        cursor: pointer;
        /* Transform is handled by JS */
        pointer-events: none; /* Let marker-layer handle events */
        display: none; /* Hiding in favor of new marker-layer system */
    }

    .marker-layer {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        z-index: 5;
        pointer-events: none;
    }

    .wheel-marker-overlay {
        position: absolute;
        transform: translate(-50%, -50%);
        cursor: grab;
        pointer-events: auto;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: transform 0.05s linear;
    }

    .wheel-marker-overlay:active {
        cursor: grabbing;
    }

    /* Spoke lines */
    .wheel-spoke {
        position: absolute;
        top: 50%;
        left: 50%;
        height: 2px;
        background-color: rgba(255, 255, 255, 0.8);
        transform-origin: 0 50%;
        pointer-events: none;
        z-index: 4;
    }
`;
