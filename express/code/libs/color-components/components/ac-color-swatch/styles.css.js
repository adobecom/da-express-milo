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
        display: inline-flex;
    }

    :host * {
        box-sizing: border-box;
    }

    sp-swatch {
        cursor: pointer;
        --spectrum-swatch-size: var(--color-swatch-width, 32px);
        --mod-swatch-border-radius: 4px;
        --mod-swatch-border-thickness: 1px;
        --mod-swatch-border-color: #00000082;
    }

    .swatch {
        width: var(--mod-swatch-size, 36px);
        height: var(--mod-swatch-size, 36px);
        border: var(--mod-swatch-border-thickness, 1px) solid var(--swatch-border-color, #00000082);
        border-radius: var(--mod-swatch-border-radius, 4px);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
    }

    .swatch:hover, .swatch:active, .swatch:focus {
        border-color: #262727;
        outline-color: #262727;
    }

    .swatch.add{
        border: var(--add-swatch-border-width, 1px) solid var(--add-swatch-border-color, #00000082);
        background-color: var(--add-swatch-background-color, #FFFFFF);
        color: #484848;
    }

    .swatch.drop{
        border: var(--add-swatch-border-width, 2px) dashed var(--add-swatch-border-color, #D6D6D6);
        background-color: var(--add-swatch-background-color, #FFFFFF);
    }
`;
