/** ***********************************************************************
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
 ************************************************************************* */

import { css } from '../../../deps/lit.js';

export const style = css`
    :host {
        font-family: adobe-clean, sans-serif;
    }

    :host * {
        box-sizing: border-box;
    }

    :host([variant="themes"]) .header {
        cursor: default;
    }

    .container > .header::marker,
    .container > .header::-webkit-details-marker /* Safari */ {
        display: none;
    }
    .container {
        margin-block: var(--brands-margin-block-start, 0) var(--brands-margin-block-end, 0);
        margin-inline: 0;
        position: relative;
    }

    .header {
        cursor: pointer;
        list-style: none;
        display: flex;
        align-items: center;
        user-select: none;
    }

    .icon {
        margin-inline: -4px 2px;
        width: 18px;
        height: 18px;
    }

    details[open] .icon {
        transform: rotate(90deg);
    }

    .swatch-list-array {
        margin-block-start: 12px;
    }

    .library-header-info {
        display: flex;
        align-items: center;
        flex-grow: 1;
        flex-shrink: 1;
        min-width: 0;
        column-gap: var(--header-column-gap, 8px);
        margin-inline-end: 26px;
    }

    .library-header-info.no-margin {
        margin-inline-end: 0;
    }

    .icon-button {
        color: #222222;
        background-color: transparent;
        border: none;
        display:flex;
        align-items: center;
        padding: 0;
        cursor: pointer;
        flex-shrink: 0;
    }

    .library-header-info > :first-child {
        /* column-gap is 8px for every library header element but it is 4px for icon. So reducing by -4px; */
        margin-inline-end: -4px;
    }

    .brand-header-text {
        margin: unset;
        font-size: 14px;
        font-weight: 800;
        color: #212121;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: var(--spectrum-workflow-icon-size-200);
    }

    .empty-view {
        margin-block-start: 8px;
    }

    .empty-view.closed {
        display: none;
    }

    .empty-text {
        margin: unset;
        line-height: 15px;
        font-size: 12px;
        font-weight: 500;
    }

    .brand-content {
        margin: 0 var(--brand-content-padding, 0);
        position: relative;
        height: 100%;
    }

    .icon-button-libraries {
        position: absolute;
        inset-block-start: 0;
        inset-inline-end: 0;
        z-index: 1;
    }

    .learnlink {
        cursor: pointer;
        color: #5C5CE0;
    }

    .swatch-list-array.closed{
        display: none;
    }
        
    brands-libraries-themes {
        display: block;
        margin-block-start: 15px;
    }

    .btn-cta {
        text-align: start;
        font-size: 12px;
        line-height: 22px;
        color: #5c5ce0;
        background-color: transparent;
        border: none;
        display: flex;
        align-items: center;
        padding: 0;
        cursor: pointer;
        white-space: nowrap;
        font-family: inherit;
    }

    .btn-cta > sp-icon-chevron-right {
        fill: #5d5de0;
    }

    .library-header-info > .align-right {
        margin-inline-start: auto;
    }

    .library-header-info > .align-right-with-library {
        margin-inline-start: auto;
        margin-inline-end: 36px; /* Leave space for the library selector icon */
    }

    .icon-button-libraries.align-right-secondary {
        position: absolute;
        inset-block-start: 0;
        inset-inline-end: 0;
        z-index: 1;
    }

    .icon-chevron-left {
        color: #000;
        font-size: 14px;
        font-weight: var(--pallete-list-label-weight, 700);
        transform: rotate(-180deg);
        margin-inline: -4px;
    }

    .icon-chevron-left > svg {
        transform: rotate(-180deg);
        fill: inherit;
    }

    .brand-palette-buttons {
        display: flex;
        flex-direction: column;
    }

    .more-less-cta {
        width: calc(var(--spectrum-spacing-500) - var(--spectrum-spacing-50));
        height: 40px;
        color: #444444;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        border:none;
        background:none;
    }
    
    .more-less-cta x-icon-menu-drop-down,
    .more-less-cta x-icon-brand-add,
    .more-less-cta x-icon-add {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background-color: #d5d5d5;
        padding:4px;
    }


    .more-less-cta > svg {
        width: 22px;
        height: 22px;
    }

    .container-inline {
        display: flex;
        height: 100%;
        align-items: center;
        column-gap: var(--spectrum-spacing-300);
    }
`;
