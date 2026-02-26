import { css } from '../../../deps/lit-all.min.js';

export const style = css`
    :host {
        display: block;
        font-family: adobe-clean, 'Segoe UI', sans-serif;
    }

    :host *,
    :host *::before,
    :host *::after {
        box-sizing: border-box;
    }

    /* ---- Panel ---- */

    .color-edit-panel {
        display: flex;
        flex-direction: column;
        background: #fff;
        border-radius: 8px;
        padding: 16px;
        gap: 16px;
        width: 280px;
    }

    :host(:not([mobile])) .color-edit-panel {
        box-shadow: 0 0 12px 0 rgba(0, 0, 0, 0.16);
    }

    /* ---- Bottom-sheet overlay (mobile) ---- */

    .ce-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0);
        pointer-events: none;
        transition: background 0.3s ease;
    }

    .ce-overlay.open {
        background: rgba(0, 0, 0, 0.4);
        pointer-events: auto;
    }

    .ce-sheet {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: #fff;
        border-radius: 16px 16px 0 0;
        transform: translateY(100%);
        transition: transform 0.3s ease;
        max-height: 90vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }

    .ce-sheet.open {
        transform: translateY(0);
    }

    .ce-sheet .color-edit-panel {
        max-width: none;
        border-radius: 0;
        box-shadow: none;
    }

    /* ---- Drag handle ---- */

    .ce-drag-handle {
        display: flex;
        justify-content: center;
        padding: 12px 0 4px;
        cursor: grab;
        touch-action: none;
    }

    .ce-drag-handle:active {
        cursor: grabbing;
    }

    .ce-drag-pill {
        width: 36px;
        height: 4px;
        border-radius: 2px;
        background: #c4c4c4;
    }

    /* ---- Title + Dropdown + Colors container ---- */

    .ce-title-dropdown-colors {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: var(--Spacing-Spacing-100);
        padding-bottom: var(--Spacing-Spacing-200);
        border-bottom: 1px solid var(--Palette-gray-300);
    }

    /* ---- Header ---- */

    .ce-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .ce-title {
        font-family: var(--Family-font-family-label);
        font-size: var(--Global-Typography-Size-Label-Label-L);
        font-weight: 700;
        line-height: var(--Global-Typography-Line-height-Label-Label-L);
        letter-spacing: 0;
        color: var(--Alias-content-typography-Title);
    }

    /* ---- Mode dropdown ---- */

    .ce-mode-wrap {
        display: flex;
        flex: 1;
        justify-content: flex-end;
        gap: 142px;
        position: relative;
    }

    .ce-mode-trigger {
        display: inline-flex;
        align-items: center;
        gap: var(--Spacing-Spacing-75);
        font-family: var(--Family-font-family-label);
        font-size: var(--Global-Typography-Size-Label-Label-M);
        font-weight: 500;
        line-height: var(--Global-Typography-Line-height-Label-Label-M);
        letter-spacing: 0;
        color: var(--Alias-content-neutral-subdued-default);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
    }

    .ce-mode-trigger img {
        flex-shrink: 0;
    }

    .ce-mode-wrap sp-theme {
        position: absolute;
        top: calc(100% - 2px);
        right: 2px;
        z-index: 10;
    }

    .ce-mode-wrap sp-menu {
        width: 114px;
        background-color: var(--Palette-white);
        box-shadow: var(--Alias-drop-shadow-ambient), var(--Alias-drop-shadow-transition), var(--Alias-drop-shadow-elevated-key);
        border-radius: var(--Corner-radius-corner-radius-100);
    }

    /* ---- Palette swatches ---- */

    .ce-palette-section {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: var(--Spacing-spacing-75);
    }

    .ce-palette-label {
        font-family: var(--Family-font-family-label);
        font-size: var(--Global-Typography-Size-Label-Label-M);
        font-weight: 400;
        line-height: var(--Global-Typography-Line-height-Label-Label-M);
        letter-spacing: 0;
        color: var(--Alias-content-typography-Title);
    }

    /* ---- Saturation / Brightness area ---- */

    .sb-area {
        position: relative;
        width: 100%;
        aspect-ratio: 4 / 3;
        border-radius: 12px;
        overflow: hidden;
        cursor: crosshair;
        touch-action: none;
        margin-block-end: 16px;
    }

    .sb-white-gradient,
    .sb-black-gradient {
        position: absolute;
        inset: 0;
    }

    .sb-white-gradient {
        background: linear-gradient(to right, #fff, transparent);
    }

    .sb-black-gradient {
        background: linear-gradient(to bottom, transparent, #000);
    }

    .sb-handle {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2.5px solid #fff;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 1;
    }

    /* ---- Hue slider ---- */

    .ce-hue-slider {
        margin-block-end: 22px;
    }

    .hue-range {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 16px;
        border-radius: 8px;
        background: linear-gradient(
            to right,
            hsl(0, 100%, 50%),
            hsl(60, 100%, 50%),
            hsl(120, 100%, 50%),
            hsl(180, 100%, 50%),
            hsl(240, 100%, 50%),
            hsl(300, 100%, 50%),
            hsl(360, 100%, 50%)
        );
        outline: none;
        cursor: pointer;
    }

    .hue-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #fff;
        border: 2.5px solid #333;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        cursor: grab;
    }

    .hue-range::-moz-range-thumb {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #fff;
        border: 2.5px solid #333;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        cursor: grab;
    }

    /* ---- Channel sliders ---- */

    .ce-channels {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .ce-channel-row {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .ce-channel-label {
        font-size: 16px;
        font-weight: 600;
        color: #1d1d1d;
        width: 18px;
        flex-shrink: 0;
    }

    .ce-channel-track {
        flex: 1;
        position: relative;
        height: 16px;
        border-radius: 8px;
        overflow: hidden;
    }

    .channel-range {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 100%;
        background: transparent;
        margin: 0;
        position: relative;
        z-index: 1;
        cursor: pointer;
    }

    .channel-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #fff;
        border: 2.5px solid #333;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        cursor: grab;
    }

    .channel-range::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #fff;
        border: 2.5px solid #333;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        cursor: grab;
    }

    .ce-channel-input {
        width: 56px;
        height: 36px;
        border: 1px solid #d6d6d6;
        border-radius: 8px;
        text-align: center;
        font-family: inherit;
        font-size: 14px;
        color: #1d1d1d;
        flex-shrink: 0;
        padding: 0 4px;
    }

    .ce-channel-input:focus {
        outline: 2px solid #1473e6;
        outline-offset: -1px;
        border-color: transparent;
    }

    .ce-channel-input::-webkit-inner-spin-button,
    .ce-channel-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .ce-channel-input[type='number'] {
        -moz-appearance: textfield;
    }
`;
