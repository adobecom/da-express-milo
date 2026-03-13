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

    .bc-mode-wrap sp-menu {
        position: absolute;
        top: calc(100% - var(--spacing-50));
        right: var(--spacing-50);
        z-index: 10;
        width: 114px;
        background-color: var(--color-white);
        box-shadow: var(--Alias-drop-shadow-ambient), var(--Alias-drop-shadow-transition), var(--Alias-drop-shadow-elevated-key);
        border-radius: var(--Corner-radius-corner-radius-100);
    }

    /* ---- Color value input ---- */

    .bc-color-value-group {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 0;
    }

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
    
    .bc-color-value-wrapper:hover {
        border-color: var(--color-gray-400-variant);
    }

    .bc-color-value-wrapper:focus-within {
        outline: var(--border-width-2) solid var(--color-blue-800);
        outline-offset: var(--border-width-2);
        border-color: var(--color-gray-800-variant);
    }

    .bc-color-value-wrapper.has-error {
        border-color: var(--spectrum-negative-border-color-default);
    }

    .bc-color-value-wrapper.has-error:hover {
        border-color: var(--spectrum-negative-border-color-hover);
    }

    .bc-color-value-wrapper.has-error:active {
        border-color: var(--spectrum-negative-border-color-down);
    }

    .bc-color-value-wrapper.has-error:focus-within {
        outline: var(--border-width-2) solid var(--color-blue-800);
        outline-offset: var(--border-width-2);
        border-color: var(--spectrum-negative-border-color-focus);
    }

    .bc-color-value-wrapper.has-error:focus-within:hover {
        border-color: var(--spectrum-negative-border-color-focus-hover);
    }

    .bc-color-value-wrapper.has-error:focus-visible {
        border-color: var(--spectrum-negative-border-color-key-focus);
    }

    .bc-hex-error-text {
        display: block;
        padding-block: 7px;
        font-size: var(--ax-heading-xxs-size);
        line-height: var(--ax-heading-xxs-lh);
        color: var(--spectrum-negative-text-color, var(--spectrum-semantic-negative-color-default));
    }

    .bc-color-swatch {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 1px solid #1F1F1F4D;
        flex-shrink: 0;
    }

    .bc-hex-field {
        flex: 1;
        min-width: 0;
        --mod-textfield-border-width: 0;
        --mod-textfield-background-color: transparent;
        --mod-textfield-focus-indicator-width: 0;
        --spectrum-textfield-border-width: 0;
        --mod-textfield-height: 40px;
        --mod-textfield-icon-spacing-block-invalid: calc((var(--mod-textfield-height, var(--spectrum-textfield-height)) - var(--mod-textfield-icon-size-invalid, var(--spectrum-textfield-icon-size-invalid))) / 2);
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

    .bc-color-area-wrapper {
        gap: var(--spacing-200);
    }

    .bc-color-area-container {
        position: relative;
        overflow: hidden;
        border-radius: var(--Corner-radius-corner-radius-100);
    }

    .bc-color-area-wrapper sp-color-area {
        width: 100%;
        height: 156px;
        cursor: pointer;
    }

    .bc-original-dot {
        position: absolute;
        width: var(--spacing-80);
        height: var(--spacing-80);
        border-radius: 50%;
        background-color: var(--color-white);
        border: 1px solid rgba(31, 31, 31, 0.3);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 1;
        left: clamp(calc(var(--spacing-80) / 2), var(--dot-x, 50%), calc(100% - var(--spacing-80) / 2));
        top: clamp(calc(var(--spacing-80) / 2), var(--dot-y, 50%), calc(100% - var(--spacing-80) / 2));
    }

    .bc-color-slider-container {
        position: relative;
    }

    .bc-color-slider-container sp-color-slider {
        width: 100%;
        height: var(--spacing-80);
        cursor: pointer;
    }

    .bc-original-slider-dot {
        position: absolute;
        width: var(--spacing-80);
        height: var(--spacing-80);
        border-radius: 50%;
        background-color: var(--color-white);
        border: 1px solid rgba(31, 31, 31, 0.3);
        top: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 10;
        left: clamp(calc(var(--spacing-80) / 2), var(--dot-x, 50%), calc(100% - var(--spacing-80) / 2));
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

    .bc-channel-input {
        flex-shrink: 0;
        line-height: var(--ax-detail-l-lh);
        width: var(--spacing-600);
        --mod-textfield-corner-radius: 7px;
        --mod-textfield-border-width: var(--spacing-50);
        --mod-textfield-height: var(--spacing-400);
        --mod-textfield-border-color: var(--color-gray-300-variant);
        --mod-textfield-background-color: var(--color-white);
        border-radius: 7px;
    }
    
    .bc-channel-input:hover {
        --mod-textfield-border-color: var(--color-gray-400-variant);
        --mod-textfield-border-color-hover: var(--color-gray-400-variant);
    }
    
    .bc-channel-input:focus-within {
        outline: var(--border-width-2) solid var(--color-blue-800);
        outline-offset: var(--border-width-2);
        --mod-textfield-border-color: var(--color-gray-800-variant);
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
