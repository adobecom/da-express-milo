import { css } from '../../../deps/lit-all.min.js';

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
        background: var(--Alias-overlay-curtain);
        pointer-events: auto;
    }

    .ce-sheet {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--Alias-background-app-frame-elevated);
        border-radius: var(--Corner-radius-corner-radius-200) var(--Corner-radius-corner-radius-200) 0 0;
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
        padding: var(--Spacing-Spacing-200) 0 var(--Spacing-Spacing-75);
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
        background: var(--Modal-handle-background);
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

    .ce-palette-label {
        font-family: var(--Family-font-family-label);
        font-size: var(--Global-Typography-Size-Label-Label-M);
        font-weight: var(--Font-weight-regular);
        line-height: var(--Global-Typography-Line-height-Label-Label-M);
        letter-spacing: 0;
        color: var(--Alias-content-typography-Title);
    }

`;
