import { css } from '../../../deps/lit-all.min.js';

const TRACK_HEIGHT = 24;
const TRACK_RADIUS = TRACK_HEIGHT / 2;
const THUMB_SIZE = 14;

export const style = css`
    :host {
        display: flex;
        align-items: center;
        width: 100%;
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
        width: ${THUMB_SIZE}px;
        height: ${THUMB_SIZE}px;
        border-radius: 50%;
        background: transparent;
        border: 2px solid rgba(31, 31, 31, 0.3);
        margin-top: ${(TRACK_HEIGHT - THUMB_SIZE) / 2}px;
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
        width: ${THUMB_SIZE}px;
        height: ${THUMB_SIZE}px;
        border-radius: 50%;
        background: transparent;
        border: 2px solid rgba(31, 31, 31, 0.3);
        cursor: pointer;
        appearance: none;
    }

    input[type="range"]::-moz-range-progress {
        background: transparent;
    }
`;
