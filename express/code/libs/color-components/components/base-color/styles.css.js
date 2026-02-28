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
        gap: var(--Spacing-Spacing-100);
        width: 100%;
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
        font-size: var(--Font-size-200);
        font-weight: var(--Font-weight-regular);
        line-height: var(--Global-Typography-Line-height-Label-Label-L);
        letter-spacing: 0;
        color: var(--Alias-content-neutral-subdued-default);
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

    .bc-color-value-wrapper {
        display: flex;
        align-items: center;
        gap: var(--Spacing-Spacing-100);
        width: 100%;
        min-height: 40px;
        border: 1px solid var(--Palette-gray-300);
        border-radius: 9px;
        padding: 0 var(--Spacing-Spacing-200);
        background-color: var(--Palette-white);
    }

    .bc-color-value-wrapper:focus-within {
        outline: 2px solid var(--Alias-focus-indicator-default);
        outline-offset: -1px;
        border-color: transparent;
    }

    .bc-color-swatch {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 1px solid var(--S2A-Color-border-secondary-default);
        flex-shrink: 0;
    }

    .bc-color-value {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        padding: 0;
        font-family: var(--Family-font-family-label);
        font-size: var(--Font-size-200);
        color: var(--Alias-content-neutral-default);
    }

    .bc-lock-button {
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        flex-shrink: 0;
        opacity: 0.6;
        transition: opacity 0.2s ease;
    }

    .bc-lock-button:hover {
        opacity: 1;
    }

    .bc-lock-button:focus {
        outline: 2px solid var(--Alias-focus-indicator-default);
        outline-offset: 2px;
        border-radius: 2px;
    }

    .bc-lock-button img {
        display: block;
    }

    /* ---- Color control section ---- */

    .bc-color-control {
        display: flex;
        flex-direction: column;
        gap: var(--Spacing-Spacing-200);
        width: 100%;
    }

    .bc-color-area-wrapper {
        display: flex;
        flex-direction: column;
        width: 100%;
        padding-bottom: var(--Spacing-Spacing-200);
        border-bottom: 1px solid var(--Full-Pricing-Cards-Border-Border-Color-1);
    }

    .bc-color-area-wrapper sp-theme {
        display: flex;
        flex-direction: column;
        gap: var(--Spacing-Spacing-300);
        width: 100%;
    }

    .bc-color-area-wrapper sp-color-area {
        width: 100%;
        height: auto;
        aspect-ratio: 4 / 3;
        min-height: 180px;
        cursor: pointer;
    }

    .bc-color-area-wrapper sp-color-slider {
        width: 100%;
        height: 6px;
        cursor: pointer;
    }

    /* ---- Channel sliders ---- */

    .bc-channel-row {
        display: flex;
        align-items: center;
        gap: var(--Spacing-Spacing-100);
        width: 100%;
    }

    .bc-channel-label {
        flex-shrink: 0;
        width: 24px;
        font-family: var(--Family-font-family-label);
        font-size: var(--Font-size-200);
        font-weight: var(--Font-weight-regular);
        color: var(--Alias-content-neutral-default);
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .bc-channel-label.is-icon {
        width: 20px;
    }

    .bc-channel-label img {
        display: block;
        width: 20px;
        height: 20px;
        opacity: 0.7;
    }

    .bc-slider-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
    }

    .bc-slider-wrapper sp-theme {
        display: flex;
        align-items: center;
        width: 100%;
    }

    .bc-slider-wrapper sp-slider {
        width: 100%;
        --mod-slider-track-fill-thickness: 24px;
        --mod-slider-track-corner-radius: 12px;
    }

    .bc-channel-input {
        flex-shrink: 0;
        width: 48px;
        height: 32px;
        padding: 0 var(--Spacing-Spacing-100);
        border: 1px solid var(--Palette-gray-300);
        border-radius: 4px;
        background-color: var(--Palette-white);
        font-family: var(--Family-font-family-label);
        font-size: var(--Font-size-200);
        color: var(--Alias-content-neutral-default);
        text-align: center;
    }

    .bc-channel-input:focus {
        outline: 2px solid var(--Alias-focus-indicator-default);
        outline-offset: -1px;
        border-color: transparent;
    }

    /* Remove spinner buttons from number input */
    .bc-channel-input::-webkit-outer-spin-button,
    .bc-channel-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .bc-channel-input[type=number] {
        -moz-appearance: textfield;
    }

    /* Locked state */

    :host([locked]) .bc-color-area-wrapper sp-color-area,
    :host([locked]) .bc-color-area-wrapper sp-color-slider,
    :host([locked]) .bc-slider-wrapper,
    :host([locked]) .bc-slider-wrapper sp-slider,
    :host([locked]) .bc-channel-input {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }
`;
