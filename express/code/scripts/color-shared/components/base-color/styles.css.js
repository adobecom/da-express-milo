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

    .base-color-panel {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-100);
        width: 100%;
    }

    /* ---- Header ---- */

    .bc-header {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-100);
    }

    .bc-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .bc-title {
        font-family: var(--body-font-family);
        font-size: var(--body-font-size-m);
        font-weight: var(--heading-font-weight-regular);
        line-height: var(--Global-Typography-Line-height-Label-Label-L);
        letter-spacing: 0;
        color: var(--color-dark-gray);
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

    .bc-mode-trigger .bc-mode-chevron {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 14px;
        height: 14px;
    }

    .bc-mode-trigger .bc-mode-chevron img {
        display: block;
        width: 14px;
        height: 14px;
        object-fit: contain;
    }

    .bc-mode-wrap sp-theme {
        position: absolute;
        top: calc(100% - var(--spacing-50));
        right: var(--spacing-50);
        z-index: 10;
    }

    .bc-mode-wrap sp-menu {
        width: 114px;
        background-color: var(--color-white);
        box-shadow: var(--Alias-drop-shadow-ambient), var(--Alias-drop-shadow-transition), var(--Alias-drop-shadow-elevated-key);
        border-radius: var(--Corner-radius-corner-radius-100);
    }

    /* ---- Color value input ---- */

    .bc-color-value-wrapper {
        display: flex;
        align-items: center;
        gap: var(--spacing-100);
        width: 100%;
        min-height: var(--spacing-600);
        border: var(--border-width-2) solid var(--color-gray-300-variant);
        border-radius: 9px;
        padding: 0 var(--spacing-200);
        background-color: var(--color-white);
    }

    .bc-color-value-wrapper:focus-within {
        outline: 2px solid var(--color-blue-800);
        outline-offset: -1px;
        border-color: transparent;
    }

    .bc-color-value-wrapper.has-error {
        border-color: var(--color-error-red);
    }

    .bc-color-value-wrapper.has-error:focus-within {
        outline-color: var(--color-error-red);
        border-color: transparent;
    }

    .bc-color-swatch {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 1px solid #1F1F1F4D;
        flex-shrink: 0;
    }

    .bc-color-value-wrapper sp-theme {
        flex: 1;
        display: flex;
    }

    .bc-hex-field {
        flex: 1;
        --mod-textfield-border-width: 0;
        --mod-textfield-background-color: transparent;
        --mod-textfield-focus-indicator-width: 0;
        --spectrum-textfield-border-width: 0;
        --mod-textfield-icon-spacing-block-invalid: calc((var(--mod-textfield-height, var(--spectrum-textfield-height, 32px)) - var(--mod-textfield-icon-size-invalid, var(--spectrum-textfield-icon-size-invalid, 18px))) / 2);
    }

    .bc-lock-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        opacity: 0.6;
    }

    .bc-lock-icon img {
        display: block;
    }

    /* ---- Color control section ---- */

    .bc-color-control {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-100);
        width: 100%;
    }

    .bc-color-area-wrapper {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .bc-color-area-wrapper.has-sliders {
        padding-bottom: var(--spacing-200);
    }

    .bc-color-area-wrapper sp-theme {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-200);
        width: 100%;
    }

    .bc-color-area-wrapper sp-color-area {
        width: 100%;
        height: 156px;
        cursor: pointer;
    }

    .bc-color-area-wrapper sp-color-slider {
        width: 100%;
        height: var(--spacing-80);
        cursor: pointer;
    }

    /* ---- Channel sliders ---- */

    .bc-channel-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-80);
        width: 100%;
    }

    .bc-channel-label {
        flex-shrink: 0;
        width: 20px;
        color: var(--color-dark-gray);
        font-family: var(--body-font-family);
        font-size: var(--body-font-size-m);
        font-style: normal;
        font-weight: 400;
        line-height: var(--ax-detail-l-lh);
        letter-spacing: 0;
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

    .bc-slider-wrapper color-channel-slider {
        width: 100%;
    }

    .bc-channel-row sp-theme {
        flex-shrink: 0;
        line-height: var(--ax-detail-l-lh);
    }

    .bc-channel-input {
        width: var(--spacing-600);
        --mod-textfield-corner-radius: 7px;
        --mod-textfield-border-width: var(--spacing-50);
        --mod-textfield-height: var(--spacing-400);
        --mod-textfield-border-color: var(--color-gray-300-variant);
        --mod-textfield-background-color: var(--color-white);
        border-radius: 7px;
    }

    /* Visually hidden – accessible to screen readers only */

    .bc-sr-only {
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
        /* placeholder for future animated elements */
    }
`;
