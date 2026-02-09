/** ***********************************************************************
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
 ************************************************************************* */

import { css } from '../../../../deps/lit.js';

export const style = css`
    :host {
        font-family: adobe-clean, sans-serif;
    }

    .no-elements {
        font-size: 12px;
        color: #222222;
        font-weight: 500;
    }

    .no-elements > button {
        color: #5C5CE0;
        background-color: transparent;
        border: 0;
        padding: 0;
        font-size: inherit;
        cursor: pointer;
        font-family: inherit;
    }
`;
