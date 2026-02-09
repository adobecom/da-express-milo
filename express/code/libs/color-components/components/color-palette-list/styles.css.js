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

    .header {
        padding: 10px 0;
        align-items: center;
        display: flex;
        justify-content: space-between;
        word-break: break-all;
    }

    h4 {
        margin: 0;
    }

    .header > h4 {
        font-size: 14px;
        line-height: 20px;
        color: var(--pallete-list-label-color, #000);
        font-weight: var(--pallete-list-label-weight, 700);
    }

    .header-mobile > .btn-cta {
        display: none;
    }

    .header-mobile > h4 {
        font-size: 12px;
        line-height: 15px;
        font-weight: 400;
        color: #323232;
    }

    .header-mobile {
        padding-block-start: 0;
    }

    .btn-cta {
        text-align: start;
        font-size: 11px;
        line-height: 14px;
        color: #5258E4;
        background-color: transparent;
        border: none;
        display: flex;
        align-items: center;
        padding: 0;
        cursor: pointer;
        font-family: adobe-clean, sans-serif;
        padding-inline: 6px;
        font-weight: 700;
    }

    .btn-cta:hover {
        text-decoration: underline;
    }
    

    .btn-cta > svg {
        width: 18px;
        height: 18px;
        fill: #5c5ce0;
    }

    .icon-chevron-left {
        color: #000;
        font-size: 14px;
        font-weight: var(--pallete-list-label-weight, 700);
    }

    .icon-chevron-left > svg {
        transform: rotate(-180deg);
        fill: inherit;
    }

    .color-palette-list.horizontal {
        display: flex;
        column-gap: var(--spectrum-spacing-200);
    }

    .more-less-cta {
        width: calc(var(--spectrum-spacing-500) - var(--spectrum-spacing-50));
        height: calc(var(--spectrum-spacing-500) - var(--spectrum-spacing-50));
        color: #444444;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        border:none;
        border-radius: var(--spectrum-spacing-100);
        background-color: #d5d5d5;
        align-self: center;
        margin-inline-start: var(--spectrum-spacing-75);
    }

    .more-less-cta > svg {
        width: 22px;
        height: 22px;
    }

    .more-less-cta > h4 {
        font-size: 12px;
        line-height: 15px;
        font-weight: normal;
        text-align: center;
    }
`;
