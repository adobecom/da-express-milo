import { css } from '../../../../libs/deps/lit-all.min.js';

const TRACK_HEIGHT = 24;
const TRACK_RADIUS = TRACK_HEIGHT / 2;
const THUMB_SIZE = 16;

export const style = css`
    :host {
        display: flex;
        align-items: center;
        width: 100%;
        --channel-slider-thumb-size: ${THUMB_SIZE}px;
        --channel-slider-handle-border-color: var(--color-white);
        --channel-slider-handle-inner-border-width: 1px;
        --channel-slider-handle-inner-border-color: #1F1F1F4D;
    }

    :host([disabled]) {
        opacity: 0.5;
        pointer-events: none;
    }

    input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: ${TRACK_HEIGHT}px;
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        outline: none;
    }

    /* --- WebKit (Chrome, Safari, Edge) --- */

    input[type="range"]::-webkit-slider-runnable-track {
        height: ${TRACK_HEIGHT}px;
        border-radius: ${TRACK_RADIUS}px;
        background: var(--channel-gradient, #ccc);
    }

    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: var(--channel-slider-thumb-size);
        height: var(--channel-slider-thumb-size);
        border-radius: 50%;
        background: transparent;
        border: var(--spacing-50) solid var(--channel-slider-handle-border-color);
        box-shadow: inset 0 0 0 var(--channel-slider-handle-inner-border-width, 1px)
            var(--channel-slider-handle-inner-border-color);
        margin-top: calc((${TRACK_HEIGHT}px - var(--channel-slider-thumb-size)) / 2);
        cursor: pointer;
    }

    /* --- Firefox --- */

    input[type="range"]::-moz-range-track {
        height: ${TRACK_HEIGHT}px;
        border-radius: ${TRACK_RADIUS}px;
        background: var(--channel-gradient, #ccc);
        border: none;
    }

    input[type="range"]::-moz-range-thumb {
        width: var(--channel-slider-thumb-size);
        height: var(--channel-slider-thumb-size);
        border-radius: 50%;
        background: transparent;
        border: var(--spacing-50) solid var(--channel-slider-handle-border-color);
        box-shadow: inset 0 0 0 var(--channel-slider-handle-inner-border-width, 1px)
            var(--channel-slider-handle-inner-border-color);
        cursor: pointer;
        appearance: none;
    }

    input[type="range"]::-moz-range-progress {
        background: transparent;
    }

    /* --- Keyboard focus --- */

    input[type="range"]:focus-visible {
        outline: var(--spacing-50) solid var(--color-blue-800);
        outline-offset: var(--spacing-50);
        border-radius: ${TRACK_RADIUS}px;
    }

    input[type="range"]:focus-visible::-webkit-slider-thumb {
        border-color: var(--color-blue-800);
    }

    input[type="range"]:focus-visible::-moz-range-thumb {
        border-color: var(--color-blue-800);
    }
`;
