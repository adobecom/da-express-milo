import { css } from '../../../../libs/deps/lit-all.min.js';

export const style = css`
    :host {
        display: block;
        font-family: var(--body-font-family);
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
        background: var(--color-white);
        border-radius: var(--Corner-radius-corner-radius-100);
        padding: var(--spacing-300);
        gap: var(--spacing-300);
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
        max-height: 90dvh;
        overflow-y: auto;
        background: var(--color-white);
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
        padding: 0 var(--spacing-300) calc(var(--spacing-300) + env(safe-area-inset-bottom, 0px));
        gap: var(--spacing-200);
    }

    /* ---- Drag handle ---- */

    .ce-drag-handle {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-100) 0 var(--spacing-200);
        cursor: grab;
        touch-action: none;
        position: relative;
    }

    .ce-drag-handle:active {
        cursor: grabbing;
    }

    .ce-drag-pill {
        width: 80px;
        height: var(--spacing-75);
        border-radius: var(--spacing-50);
        background: var(--color-gray-325);
    }

    /* ---- Title + Dropdown + Colors container ---- */

    .ce-title-dropdown-colors {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: var(--spacing-100);
        padding-bottom: var(--spacing-200);
        box-shadow: inset 0 -1px 0 0 var(--color-gray-300-variant);
    }

    /* ---- Header ---- */

    .ce-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .ce-title {
        font-family: var(--body-font-family);
        font-size: var(--body-font-size-m);
        font-weight: var(--ax-heading-weight);
        line-height: var(--Global-Typography-Line-height-Label-Label-L);
        letter-spacing: 0;
        color: var(--color-gray-950);
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
        flex-direction: row;
        align-items: center;
        gap: var(--spacing-75);
        font-family: var(--body-font-family);
        font-size: var(--body-font-size-s);
        font-weight: 500;
        line-height: var(--ax-detail-l-lh);
        letter-spacing: 0;
        color: var(--color-dark-gray);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
    }

    .ce-mode-trigger .ce-mode-chevron {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 14px;
        height: 14px;
    }

    .ce-mode-trigger .ce-mode-chevron img {
        display: block;
        width: 14px;
        height: 14px;
        object-fit: contain;
    }

    .ce-mode-wrap sp-theme {
        position: absolute;
        top: calc(100% - var(--spacing-50));
        right: var(--spacing-50);
        z-index: 10;
    }

    .ce-mode-wrap sp-menu {
        width: 114px;
        background-color: var(--color-white);
        box-shadow: var(--Alias-drop-shadow-ambient), var(--Alias-drop-shadow-transition), var(--Alias-drop-shadow-elevated-key);
        border-radius: var(--Corner-radius-corner-radius-100);
    }

    /* ---- Palette swatches ---- */

    .ce-palette-section {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: var(--spacing-75);
    }

    .ce-palette-section sp-theme {
        display: block;
        height: var(--spacing-400);
        min-height: 0;
    }

    .ce-palette-label {
        font-family: var(--body-font-family);
        font-size: var(--body-font-size-s);
        font-weight: var(--heading-font-weight-regular);
        line-height: var(--ax-detail-l-lh);
        letter-spacing: 0;
        color: var(--color-gray-950);
    }

    /* ---- HEX input ---- */

    .ce-hex-section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-75);
        width: 100%;
    }

    .ce-hex-label {
        font-family: var(--body-font-family);
        font-size: var(--body-font-size-s);
        font-weight: var(--heading-font-weight-regular);
        line-height: var(--ax-detail-l-lh);
        letter-spacing: 0;
        color: var(--color-dark-gray);
    }

    .ce-hex-section sp-theme {
        display: block;
        width: 100%;
    }

    .ce-hex-field {
        width: 100%;
        --mod-textfield-corner-radius: 9px;
        --mod-textfield-border-width: var(--border-width-2);
        --mod-textfield-border-color: var(--color-gray-300-variant);
        --mod-textfield-background-color: var(--color-white);
        --mod-textfield-icon-spacing-block-invalid: calc((var(--mod-textfield-height, var(--spectrum-textfield-height, 32px)) - var(--mod-textfield-icon-size-invalid, var(--spectrum-textfield-icon-size-invalid, 18px))) / 2);
    }

    .ce-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
        .ce-overlay {
            transition: none;
        }

        .ce-sheet {
            transition: none;
        }
    }

`;
