import { css } from '../../../../libs/deps/lit-all.min.js';

export const style = css`
    :host {
        display: block;
        font-family: var(--Family-font-family-label);
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
        background: var(--Alias-background-app-frame-elevated);
        border-radius: var(--Corner-radius-corner-radius-100);
        padding: var(--Spacing-Spacing-300);
        gap: var(--Spacing-Spacing-300);
        width: 280px;
    }

    :host(:not([mobile])) .color-edit-panel {
        box-shadow: var(--Elevation-Dialog);
    }

    /* ---- Mobile overlay + bottom sheet ---- */

    .ce-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;
        background: var(--Alias-overlay-curtain);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
    }

    .ce-overlay.open {
        opacity: 1;
        pointer-events: auto;
    }

    .ce-sheet {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--Alias-background-app-frame-elevated, #fff);
        border-radius: var(--Corner-radius-corner-radius-200) var(--Corner-radius-corner-radius-200) 0 0;
        transform: translateY(100%);
        transition: transform 0.3s ease;
    }

    .ce-sheet.open {
        transform: translateY(0);
    }

    .ce-sheet .color-edit-panel {
        width: 100%;
        max-width: none;
        border-radius: 0;
        box-shadow: none;
        padding: 0 var(--Spacing-Spacing-300) var(--Spacing-Spacing-300);
        gap: var(--Spacing-Spacing-200);
    }

    /* ---- Drag handle ---- */

    .ce-drag-handle {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--Spacing-Spacing-100) 0 var(--Spacing-Spacing-200);
        cursor: grab;
        touch-action: none;
        position: relative;
    }

    .ce-drag-handle:active {
        cursor: grabbing;
    }

    .ce-drag-pill {
        width: 80px;
        height: var(--Spacing-Spacing-75);
        border-radius: 2px;
        background: var(--Modal-handle-background, #D5D5D5);
    }

    /* ---- Title + Dropdown + Colors container ---- */

    .ce-title-dropdown-colors {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: var(--Spacing-Spacing-100);
        padding-bottom: var(--Spacing-Spacing-200);
        box-shadow: inset 0 -1px 0 0 var(--Palette-gray-300);
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
        font-weight: var(--Font-weight-bold);
        line-height: var(--Global-Typography-Line-height-Label-Label-L);
        letter-spacing: 0;
        color: var(--Alias-content-typography-Title);
    }

    /* ---- Mode dropdown ---- */

    .ce-mode-wrap {
        display: flex;
        flex: 1;
        justify-content: flex-end;
        position: relative;
    }

    .ce-mode-trigger {
        display: inline-flex;
        align-items: center;
        gap: var(--Spacing-Spacing-75);
        font-family: var(--Family-font-family-label);
        font-size: var(--Global-Typography-Size-Label-Label-M);
        font-weight: var(--Font-weight-medium);
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
        gap: var(--Spacing-Spacing-75);
    }

    .ce-palette-section sp-theme {
        display: block;
        height: var(--Spacing-Spacing-400);
        min-height: 0;
    }

    .ce-palette-label {
        font-family: var(--Family-font-family-label);
        font-size: var(--Global-Typography-Size-Label-Label-M);
        font-weight: var(--Font-weight-regular);
        line-height: var(--Global-Typography-Line-height-Label-Label-M);
        letter-spacing: 0;
        color: var(--Alias-content-typography-Title);
    }

    /* ---- HEX input ---- */

    .ce-hex-section {
        display: flex;
        flex-direction: column;
        gap: var(--Spacing-Spacing-75);
        width: 100%;
    }

    .ce-hex-label {
        font-family: var(--Family-font-family-label);
        font-size: var(--Global-Typography-Size-Label-Label-M);
        font-weight: var(--Font-weight-regular);
        line-height: var(--Global-Typography-Line-height-Label-Label-M);
        letter-spacing: 0;
        color: var(--Alias-content-neutral-subdued-default);
    }

    .ce-hex-field {
        display: flex;
        align-items: center;
        width: 100%;
        height: var(--Spacing-Spacing-500);
        border: var(--Spacing-Spacing-50) solid var(--Palette-gray-300);
        border-radius: var(--Corner-radius-corner-radius-100);
        padding: 0 var(--Spacing-Spacing-200);
        background: var(--Palette-white);
    }

    .ce-hex-field:focus-within {
        border-color: var(--Alias-focus-indicator-default);
    }

    .ce-hex-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        padding: 0;
        font-family: var(--Family-font-family-label);
        font-size: var(--Font-size-200);
        line-height: var(--Global-Typography-Line-height-Label-Label-M);
        color: var(--Alias-content-neutral-default);
    }

`;
