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

import { css } from '../../../../deps/lit.js';

export const style = css`
    :host {
        font-family: adobe-clean, sans-serif;
        max-width: 100%;
        --vertical-color-palette-min-height: 80px;
    }

    .palettes-list-content {
        display: flex;
    }

    .scroll-area-content {
        overflow: auto hidden;
        display: grid;
        row-gap: calc(var(--spectrum-spacing-400) - var(--spectrum-spacing-50));
        padding-block-start: 10px;
    }

    .scroll-area {
        margin-block-start: 12px;
        width: 100%;
        display: flex;
        overflow: auto hidden;
        column-gap: var(--spectrum-spacing-300);
        scrollbar-width: none; /* Hide scrollbar on firefox */
        box-sizing: border-box;
        padding-inline-start: var(--spectrum-spacing-500);
    }

    .scroll-area > :last-child {
        padding-inline-end: var(--themes-mobile-content-end-gutter, 0);
    }

    .scroll-area-categories {
        margin-block: var(--spectrum-spacing-200);
        padding-inline-start: var(--spectrum-spacing-300);
    } 

    .category-label {
        font-size: 14px;
        line-height: 20px;
        color: #464646;
        white-space: nowrap;
        padding: var(--spectrum-component-top-to-text-75) var(--spectrum-spacing-300) var(--spectrum-component-bottom-to-text-50);
        display: inline-flex;
    }

    .category-label.active {
        background-color: var(--spectrum-gray-200, #E6E6E6);
        border-radius: 14px;
        color: #464646;
        font-weight: var(--theme-active-category-label-weight, 400);
    }

    .scroll-area::-webkit-scrollbar {
        display: none; /* Hide scrollbar on chromium & safari */
    }

    .property-group {
        display: flex;
        column-gap: var(--spectrum-spacing-200);
        position: relative;
    }

    .property-group::before {
        content: '';
        inset-block: 0;
        height: var(--vertical-color-palette-min-height, 90px);
        margin: 4px 0;
        width: 1px;
        background-color: #D4D4D4;
    }

    .property-group:first-child::before {
        display: none;
    }
    
`;
