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

export const WRAP_COLORS_IN_ROW = 5;
export const style = css`
    :host {
        font-family: adobe-clean, sans-serif;
    }

    .color-palette {
        min-width: var(--color-palette-min-width);
        min-height: var(--color-palette-min-height);
        margin-block-end: var(--color-palette-margin-bottom);
        display: flex;
        cursor: pointer;
    }

    .color-palette .palette:first-of-type {
        border-start-start-radius: var(--color-palette-border-radius);
        border-end-start-radius: var(--color-palette-border-radius);
    }

    .color-palette .palette:last-of-type {
        border-start-end-radius: var(--color-palette-border-radius);
        border-end-end-radius: var(--color-palette-border-radius);
    }

    .color-palette.wrap {
        flex-wrap: wrap;
    }

    .custom-outline {
        position: relative;
        border-radius: var(--color-palette-border-radius);
    }

    .custom-outline::after {
        content: '';
        position: absolute;
        inset: 0;
        border: var(--color-palette-border-width) solid var(--color-palette-border-color);
        border-radius: var(--color-palette-border-radius);
    }

    .custom-outline:is(:hover, :focus)::after {
        border-color: var(--color-palette-active-border-color);
    }

    :host([focusable="false"]) .custom-outline:focus::after {
        border-color: var(--color-palette-border-color);
    }

    .palette {
        flex-basis: 100%;
        min-width: 0;
    }

    .color-palette.wrap > .palette{
        /* stylelint-disable csstree/validator -- need to use this variable */
        flex: 0 0 ${100 / WRAP_COLORS_IN_ROW}%;
        /* stylelint-enable */
        height: var(--color-palette-height);
    }

    :host([active]) .custom-outline::after {
        border-color: var(--color-palette-active-border-color);
        cursor: default; /* Since the color picker is inactive */
    }

    .btn-slot {
        visibility: hidden;
    }

    .palette:hover .btn-slot {
        visibility: visible;
    }

    :host([vertical]) .color-palette {
        width: var(--vertical-color-palette-min-width);
        height: var(--vertical-color-palette-min-height);
        min-width: var(--vertical-color-palette-min-width);
        min-height: var(--vertical-color-palette-min-height);
        flex-wrap: wrap;
        margin: var(--vertical-color-palette-margin);
    }

    :host([vertical]) .color-palette .palette:first-of-type {
        border-start-end-radius: var(--color-palette-border-radius);
        border-end-start-radius: 0;
    }

    :host([vertical]) .color-palette .palette:last-of-type {
        border-end-start-radius: var(--color-palette-border-radius);
        border-start-end-radius: 0;
    }

    :host([vertical]) .color-palette .palette:first-of-type:last-of-type  {
        border-start-end-radius: var(--color-palette-border-radius);
        border-end-start-radius: var(--color-palette-border-radius);
    }

    :host([active][vertical]) .custom-outline::after, :host([vertical]) .custom-outline:is(:hover, :focus)::after {
        border-color: var(--color-palette-vertical-border-color);
        border-radius: var(--color-palette-vertical-border-radius);
        inset: calc(var(--vertical-color-palette-border-width) * -2);
    }
`;

