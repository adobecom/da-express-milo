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
        --margin-top: 27vh;
        --translate-y: -50%;
    }

    .no-search-results-message {
        text-align: center;
        margin-block-start: var(--margin-top);
        transform: translateY(var(--translate-y));
        padding-inline: 30px;
    }

    .heading {
        margin: 24px 0 12px;
        font-weight: 900;
    }

    .description {
        margin: 0;
    }

    :host([mobile]) {
        --margin-top: 15px;
        --translate-y: 0;
    }
`;
