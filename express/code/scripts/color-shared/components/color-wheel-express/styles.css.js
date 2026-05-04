/* eslint-disable */
import { css } from '../../../../libs/deps/lit-all.min.js';

export const style = css`
    :host {
        display: block;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        box-sizing: border-box;
    }

    .canvas-container {
        margin: auto;
        position: relative;
        display: flex;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        box-sizing: border-box;
        justify-content: center;
        touch-action: none; /* Prevent scrolling while dragging on wheel */
    }

    .wheel-wrapper {
        position: relative;
        flex-shrink: 0;
    }

    .wheel {
        position: absolute;
        top: 0;
        left: 0;
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
        left: 0;
        z-index: 5;
        pointer-events: none;
    }

    .wheel-marker-overlay {
        --wheel-marker-size: 33px;
        --wheel-marker-stroke: 2px;
        --wheel-marker-color: #808080;
        position: absolute;
        transform: translate(-50%, -50%);
        width: var(--wheel-marker-size);
        height: var(--wheel-marker-size);
        border: var(--wheel-marker-stroke) solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 12px 0 rgba(0, 0, 0, 0.16), inset 0 0 0 1px rgba(31, 31, 31, 0.40);
        background-color: var(--wheel-marker-color);
        box-sizing: border-box;
        cursor: grab;
        pointer-events: auto;
        /* Prevent iOS Safari pull-to-refresh / scroll when dragging a handle.
           touch-action is read from the element the touch starts on, so the
           parent .canvas-container rule does not cover marker drags. */
        touch-action: none;
        transition: transform 0.05s linear;
    }

    .wheel-marker-overlay:active {
        cursor: grabbing;
    }

    .wheel-marker-overlay--base::before {
        content: '';
        height: 4px;
        width: 4px;
        position: absolute;
        top: 12.5px;
        left: 12.5px;
        background: #fff;
        box-shadow: 0 0 0 1px rgba(31, 31, 31, 0.30);
        border-radius: 15px;
    }

    .wheel-marker-overlay--base::after {
        content: '';
        height: 15px;
        width: 15px;
        position: absolute;
        top: 5px;
        left: 5px;
        border: 2px solid #fff;
        box-shadow: inset 0 0 0 1px rgba(31, 31, 31, 0.30);
        border-radius: 15px;
    }

    .wheel-marker-overlay--locked,
    .wheel-marker-overlay--locked:active {
        cursor: not-allowed;
    }

    .wheel-marker-overlay:focus,
    .wheel-marker-overlay--kb-focused {
        outline: 2px solid var(--Alias-content-semantic-accent-key-focus);
        outline-offset: 2px;
        z-index: 20;
    }

    /* Conflict / confusion line overlay canvases */
    .conflict-lines-canvas,
    .confusion-lines-canvas {
        position: absolute;
        top: 0;
        left: 0;
        border-radius: 50%;
        pointer-events: none;
        z-index: 3;
    }

    /* Spoke lines */
    .wheel-spoke {
        position: absolute;
        top: 50%;
        left: 50%;
        height: 2px;
        background-color: #ffffff;
        box-shadow: 1px 0 8.1px 0 rgba(0, 0, 0, 0.39);
        transform-origin: 0 50%;
        pointer-events: none;
        z-index: 4;
    }
`;
