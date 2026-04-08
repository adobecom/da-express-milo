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


import { LitElement, html } from '../../../../deps/lit.js';
import { customElement, property } from 'lit/decorators.js';

import { style } from './styles.css';

@customElement('color-palette-icon-button')
class ColorPaletteIconButton extends LitElement {

    @property({ type: Boolean, attribute: 'active' })
        isActive = false;

    @property({ type: String, attribute: 'aria-label' })
        ariaLabel;

    static styles = [style];

    handleKeyDown = event => {
        if(event.keyCode === 13) {
            this.handleClick();
        }
    };

    handleClick = () => {
        if (this.isActive) {
            return false;
        }

        const event = new CustomEvent('ac-palette-icon-select', {
            bubbles: true,
            composed: true
        });

        this.dispatchEvent(event);
    };

    render() {
        return html`<div class="palette color-palette custom-outline" role="button" aria-label=${this.ariaLabel} @click=${this.handleClick} @click=${this.handleKeyDown}>
            <slot name="icon"></slot>
        </div>`;
    }

}

export default ColorPaletteIconButton;
