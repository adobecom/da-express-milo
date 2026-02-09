/** ***********************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2024 Adobe
 *  All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 ************************************************************************* */

import { css } from '../../../deps/lit.js';

export const style = css`
    :host {
        font-family: adobe-clean, sans-serif;
    }

    :host([is-mobile]) sp-link {
        font-size: var(--spectrum-text-to-visual-300, 13px);
        line-height: 1.3;
        display: block;
        text-align: center;
    }

    sp-link {
        text-decoration: none;
    }
`;
