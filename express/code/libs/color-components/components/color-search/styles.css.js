/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2022 Adobe
 *  All Rights Reserved.
 *
 *  NOTICE:  All information contained herein is, and remains
 *  the property of Adobe and its suppliers, if any. The intellectual
 *  and technical concepts contained herein are proprietary to Adobe
 *  and its suppliers and are protected by all applicable intellectual
 *  property laws, including trade secret and copyright laws.
 *  Dissemination of this information or reproduction of this material
 *  is strictly forbidden unless prior written permission is obtained
 *  from Adobe.
 **************************************************************************/


import { css } from '../../../deps/lit.js';

export const style = css`
    :host {
        font-family: adobe-clean, sans-serif;
    }

    .color-search {
        margin: 0 var(--themes-mobile-content-start-gutter, 0) 7px;
        position: relative;
    }

    .color-search::after {
        content: "";
        border-color: transparent;
        border-radius: var(--search-input-border-radius, 30px);
        inset: 0;
        margin: -2px;
        pointer-events: none;
        position: absolute;
    }

    .color-search:focus-within::after {
        box-shadow: 0 0 0 2px rgb(20, 122, 243);
    }

    .color-search > input {
        border: var(--search-input-border-width, 2px) solid var(--search-input-border-color, #E8E8E8);
        height: calc(var(--spectrum-spacing-500) - var(--spectrum-spacing-50));
        font-size: 15px;
        line-height: 19px;
        color: #000;
        width: 100%;
        border-radius: var(--search-input-border-radius, 30px);
        padding: 8px calc(var(--spectrum-spacing-500) + var(--spectrum-spacing-50)) 7px;
        box-sizing: border-box;
        font-family: adobe-clean, sans-serif;
    }

    .color-search > input:focus, .color-search > input:focus-visible .color-search > input.focus {
        border-color: #444444;
        outline-color: #444;
    }

    .color-search > button {
        position: absolute;
        inset-block: 0;
        margin: auto 0;
        background-color: transparent;
        border: 0;
        padding: 0;
    }

    .icon-search {
        width: 18px;
        height: 18px;
        inset-inline-start: 14px;
        cursor: pointer;
    }

    .icon-search > label {
        cursor: pointer;
    }

    .icon-search-logo {
        width: var(--spectrum-spacing-300);
        height: var(--spectrum-spacing-300);
        color: #464646;
    }

    .icon-close {
        cursor: pointer;
        inset-inline-end: 14px;
        width: 18px;
        height: 18px;
        transform: rotate(45deg);
    }

    .icon-close > span {
        width: 15px;
        height: 2px;
        background-color: #464646;
        position: absolute;
        inset: 0;
        margin: auto;
    }

    .icon-close > span:last-child {
        transform: rotate(90deg);
    }
`;
