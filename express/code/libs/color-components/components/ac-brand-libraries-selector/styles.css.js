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
        max-height: calc(100% - 87px);
    }
    
    :host([is-tablet]) {        
        max-height: calc(100% - 93px);
    }

    :host([is-mobile]) {
        display: block;
        --mod-menu-item-label-inline-edge-to-content: var(--spectrum-spacing-300, 16px);
        --mod-menu-item-selectable-edge-to-text-not-selected: var(--spectrum-spacing-600, 40px);
    }

    :host * {
        box-sizing: border-box;
    }

    .library-list-menu {
        max-height: 100%;
        width:100%;
    }

    .library-list-menu.mobileview {
        max-height: 100%;
        width: 100%;
    }

    .icon-button {
        width: 18px;
        height: 18px;
        background-color: transparent;
        border: none;
        display:flex;
        align-self: center;
        padding: 0;
        cursor: pointer;
    }

`;
