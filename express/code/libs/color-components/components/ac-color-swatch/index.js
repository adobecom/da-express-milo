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


import { LitElement, html } from '../../../../deps/lit.js';
import { customElement, property } from 'lit/decorators.js';
import '@spectrum-web-components/tooltip/sp-tooltip.js';
import '@spectrum-web-components/overlay/overlay-trigger.js';

import { style } from './styles.css';
import { SELECTION_SOURCE } from '../../constants/Constants';

@customElement('ac-color-swatch')
class ColorSwatch extends LitElement {

    static styles = [style];

    @property({ type: String })
        swatch;

    @property({ type: String })
        swatchRelationship = '';

    @property({ type: String })
        variation;

    @property({ type: String })
        ariaLabel = '';

    @property({ type: String })
        ariaDescription = '';

    @property({ type: Boolean })
        isDraggable = false;

    @property({ type: Boolean, attribute: 'enable-add-button' })
        addButtonEnabled = false;

    private _onSwatchSelected = () => {
        if(this.swatch) {
            this.dispatchEvent(
                new CustomEvent('ac-color-swatch-selected', {
                    bubbles: true,
                    composed: true,
                    detail: { color: this.validateHex(this.swatch), 'selection_source': SELECTION_SOURCE.BRAND_COLOR }
                })
            );
        }
    };

    private _onAddSelected = () => {
        const customEvent = new CustomEvent('ac-color-swatch-added');
        this.dispatchEvent(customEvent);
    };

    private _onDragStart = (event) => {
        event.dataTransfer.setData('color', this.validateHex(this.swatch));
        const customEvent = new CustomEvent('ac-on-drag-start', {
            bubbles: true,
            composed: true,
            detail: event
        });
        this.dispatchEvent(customEvent);
    };

    private _onDragEnd = () => {
        const customEvent = new CustomEvent('ac-on-drag-end');
        this.dispatchEvent(customEvent);
    };

    private validateHex = swatchValue => swatchValue?.includes('#') ? swatchValue : `#${swatchValue}`;

    colorSwatchTemplate = () => {
        if(this.swatch) {
            const hex = this.validateHex(this.swatch);
            return html`<overlay-trigger placement="bottom">
                <sp-swatch
                    slot="trigger"
                    draggable=${this.isDraggable}
                    @dragstart=${this._onDragStart}
                    @dragend=${this._onDragEnd}
                    color=${hex}
                    @click=${this._onSwatchSelected}
                    aria-label='${hex} ${this.ariaLabel}'
                    aria-description='${hex} ${this.ariaDescription}'>
                </sp-swatch>
                <sp-tooltip slot="hover-content" delayed>
                    ${hex}
                </sp-tooltip>
            </overlay-trigger>
            `;
        }
    };

    addSwatchTemplate = () => {
        return html`<button
            class="swatch add"
            @click=${this._onAddSelected}
            tabindex='0'
            ?disabled=${!this.addButtonEnabled}
            aria-label=${this.ariaLabel}
            aria-description=${this.ariaDescription}
        >
            <x-icon-add></x-icon-add>
        </button>`;
    };

    dropSwatchTemplate = () => {
        return html`<button class="swatch drop"
            tabindex='0'
            aria-label=${this.ariaLabel}
            aria-description=${this.ariaDescription}>
        </button>`;
    };

    render() {
        return html`${this.variation === 'add' ? this.addSwatchTemplate() : this.variation === 'drop' ? this.dropSwatchTemplate() : this.colorSwatchTemplate()}`;
    }

}

export default ColorSwatch;
