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
        display: flex;
    }

    :host * {
        box-sizing: border-box;
    }

    .icon-button {
        color: #222222;
        background-color: transparent;
        border: none;
        display: flex;
        align-items: center;
        padding: 0;
        cursor: pointer;
    }

    .add-icon-container {
        display:flex;
        align-items:center;
        column-gap: 16px;
    }

    :host([is-mobile-view]) .add-icon-container {
        column-gap: 0;
    }

    :host([is-mobile-view]) x-icon-brand-add, :host([is-mobile-view]) x-icon-cclibrary-add  {
        width: var(--spectrum-workflow-icon-size-75, 20px);
        height: var(--spectrum-workflow-icon-size-75, 20px);
    }
`;
