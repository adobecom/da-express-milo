/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2023 Adobe
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
        font-size: 24px;
    }

    .color-palette {
        min-width: var(--color-palette-min-width, 272px);
        min-height: var(--color-palette-min-height, 40px);
        margin-block-end: var(--color-palette-margin-bottom, 20px);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .custom-outline {
        position: relative;
        border-radius: var(--color-palette-border-radius, 8px);
    }

    .custom-outline::after {
        content: '';
        position: absolute;
        inset: 0;
        border: var(--color-palette-border-width, 2px) solid var(--color-palette-border-color, #0000001A);
        border-radius: var(--color-palette-border-radius, 8px);
    }

    .custom-outline:is(:hover, :focus)::after {
        border-color: var(--color-palette-active-border-color, #000);
    }

    .palette {
        flex-basis: 100%;
        min-width: 0;
    }

    :host([active]) .custom-outline::after {
        border-color: var(--color-palette-active-border-color, #000);
        cursor: default; /* Since the color picker is inactive */
    }

    :host([vertical]) .color-palette {
        width: var(--vertical-color-palette-min-width, 48px);
        height: var(--vertical-color-palette-min-height, 90px);
        min-width: var(--vertical-color-palette-min-width, 48px);
        min-height: var(--vertical-color-palette-min-height, 90px);
        flex-wrap: wrap;
        margin: var(--vertical-color-palette-margin, 4px);
    }

    :host([active][vertical]) .custom-outline::after, :host([vertical]) .custom-outline:is(:hover, :focus)::after {
        border-color: var(--color-palette-vertical-border-color, #242C33);
        border-radius: var(--color-palette-vertical-border-radius, 12px);
        inset: calc(var(--vertical-color-palette-border-width, 2px) * -2);
    }
`;
