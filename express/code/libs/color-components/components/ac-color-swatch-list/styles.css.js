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

    sp-swatch {
        cursor: pointer;
        --spectrum-swatch-size: var(--color-swatch-width, 32px);
        --mod-swatch-border-radius: 4px;
        --mod-swatch-border-thickness: 1px;
        --mod-swatch-border-color: #00000082;
    }

    .header {
        font-size: 14px;
        line-height: 24px;
        color: #000B1D;
        font-weight: normal;
        margin: unset;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        margin-block: var(--color-swatch-list-margin-top,10px) var(--color-swatch-list-margin-bottom,10px);
    }
`;
