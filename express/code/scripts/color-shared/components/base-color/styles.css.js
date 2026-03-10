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
        font-weight: var(--Font-weight-medium);
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
        border: 1px solid var(--color-gray-300-variant);
        border-radius: var(--Corner-radius-corner-radius-100);
        padding: 0 var(--spacing-200);
        background-color: var(--color-white);
    }

    .bc-color-value-wrapper:focus-within {
        outline: 2px solid var(--color-blue-800);
        outline-offset: -1px;
        border-color: transparent;
    }

    .bc-color-swatch {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 1px solid var(--color-gray-300-variant);
        flex-shrink: 0;
    }

    .bc-color-value {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        padding: 0;
        font-family: var(--body-font-family);
        font-size: var(--body-font-size-m);
        color: var(--color-gray-800-variant);
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

    .bc-lock-button:focus-visible {
        outline: var(--spacing-50) solid var(--color-blue-800);
        outline-offset: var(--spacing-50);
        border-radius: var(--spacing-50);
    }

    .bc-lock-button img {
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
        height: var(--Spacing-Spacing-80);
        cursor: pointer;
    }

    /* ---- Channel sliders ---- */

    .bc-channel-row {
        display: flex;
        align-items: center;
        gap: var(--Spacing-Spacing-80);
        width: 100%;
    }

    .bc-channel-label {
        flex-shrink: 0;
        width: 20px;
        color: var(--color-dark-gray);
        font-family: var(--Font-family-Sans-serif);
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

    /* Locked state */

    :host([locked]) .bc-color-area-wrapper sp-color-area,
    :host([locked]) .bc-color-area-wrapper sp-color-slider,
    :host([locked]) .bc-slider-wrapper,
    :host([locked]) .bc-slider-wrapper color-channel-slider,
    :host([locked]) .bc-channel-input,
    :host([locked]) .bc-channel-row sp-textfield {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
        .bc-lock-button {
            transition: none;
        }
    }
`;
