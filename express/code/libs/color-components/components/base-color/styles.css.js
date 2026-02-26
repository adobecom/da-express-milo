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

    .base-color-panel {
        display: flex;
        flex-direction: column;
        background: var(--Alias-background-app-frame-elevated);
        border-radius: var(--Corner-radius-corner-radius-100);
        padding: var(--Spacing-Spacing-300);
        gap: var(--Spacing-Spacing-300);
        width: 280px;
    }

    :host(:not([mobile])) .base-color-panel {
        box-shadow: var(--Alias-drop-shadow-ambient), var(--Alias-drop-shadow-transition), var(--Alias-drop-shadow-elevated-key);
    }

    /* ---- Bottom-sheet overlay (mobile) ---- */

    .bc-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0);
        pointer-events: none;
        transition: background 0.3s ease;
    }

    .bc-overlay.open {
        background: var(--Alias-overlay-curtain);
        pointer-events: auto;
    }

    .bc-sheet {
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

    .bc-sheet.open {
        transform: translateY(0);
    }

    .bc-sheet .base-color-panel {
        max-width: none;
        border-radius: 0;
        box-shadow: none;
    }

    /* ---- Header ---- */

    .bc-header {
        display: flex;
        flex-direction: column;
        gap: var(--Spacing-Spacing-100);
    }

    .bc-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .bc-title {
        font-family: var(--Family-font-family-label);
        font-size: var(--Global-Typography-Size-Label-Label-L);
        font-weight: var(--Font-weight-bold);
        line-height: var(--Global-Typography-Line-height-Label-Label-L);
        letter-spacing: 0;
        color: var(--Alias-content-typography-Title);
    }

    /* ---- Mode dropdown ---- */

    .bc-mode-wrap {
        display: flex;
        flex: 1;
        justify-content: flex-end;
        position: relative;
    }

    .bc-mode-trigger {
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

    .bc-mode-trigger img {
        flex-shrink: 0;
    }

    .bc-mode-wrap sp-theme {
        position: absolute;
        top: calc(100% - 2px);
        right: 2px;
        z-index: 10;
    }

    .bc-mode-wrap sp-menu {
        width: 114px;
        background-color: var(--Palette-white);
        box-shadow: var(--Alias-drop-shadow-ambient), var(--Alias-drop-shadow-transition), var(--Alias-drop-shadow-elevated-key);
        border-radius: var(--Corner-radius-corner-radius-100);
    }

    /* ---- Color value input ---- */

    .bc-color-value {
        width: 100%;
        height: 36px;
        border: 1px solid var(--S2A-Color-border-secondary-default);
        border-radius: var(--Corner-radius-corner-radius-100);
        padding: 0 var(--Spacing-Spacing-200);
        font-family: var(--Family-font-family-label);
        font-size: var(--Global-Typography-Size-Label-Label-M);
        color: var(--Alias-content-typography-Body);
    }

    .bc-color-value:focus {
        outline: 2px solid var(--Alias-focus-indicator-default);
        outline-offset: -1px;
        border-color: transparent;
    }

    /* ---- Color picker section ---- */

    .bc-picker-section {
        display: flex;
        flex-direction: column;
        gap: var(--Spacing-Spacing-300);
        width: 100%;
    }

    .bc-picker-section sp-theme {
        display: flex;
        flex-direction: column;
        gap: var(--Spacing-Spacing-300);
        width: 100%;
    }

    .bc-picker-section sp-color-area {
        width: 100%;
        height: auto;
        aspect-ratio: 4 / 3;
        min-height: 180px;
        cursor: pointer;
    }

    .bc-picker-section sp-color-slider {
        width: 100%;
        cursor: pointer;
    }
`;
