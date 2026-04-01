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


import { LitElement, html, nothing } from '../../../../deps/lit.js';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '../ac-color-swatch';
import analytics from '../../analytics';
import { SELECT_ADD_LIBRARY_ASSET, SELECT_APPLY_LIBRARY_ASSET } from '../../constants/AnalyticsEvents';
import type { SwatchGroup } from '@spectrum-web-components/swatch';
import { style } from './styles.css';
import { SELECTION_SOURCE } from '../../constants/Constants';
import { validateHEX } from '@adobecolor/color-utils';

interface SwatchList {
    id: string;
    color: string;
}

@customElement('ac-color-swatch-list')
class ColorSwatchList extends LitElement {

    static styles = [style];

    @property({ type: Array })
        swatchList: SwatchList[];

    @property({ type: Boolean })
        showAddIcon;

    @property({ type: Boolean, attribute: 'enable-add-button' })
        addButtonEnabled = false;

    @property({ type: String })
        relationship: string;

    @property({ type: String })
        headerText;

    @property({ type: String })
        isBrand = false;

    @property({ type: String })
        swatchAriaLabel = '';

    @property({ type: String })
        swatchAriaDescription = '';

    @property({ type: String })
        addButtonAriaLabel = '';

    @property({ type: String })
        addButtonAriaDescription = '';

    @property({ type: Boolean, attribute: 'hide-tooltip' })
        hideTooltip = false;

    @property({ type: String, attribute: 'selected-swatch' })
    public selectedSwatch = '';

    private _onAddSelected = () => {
        if(this.relationship) {
            const customEvent = new CustomEvent('ac-color-swatch-added', {
                bubbles: true,
                composed: true,
                detail: [{ type:this.isBrand?'brand':'library',priority: this.relationship }]
            });
            this.dispatchEvent(customEvent);
            analytics.track(SELECT_ADD_LIBRARY_ASSET(this.isBrand?'brand':'library', this.relationship), this);
        }
    };

    private _onSwatchSelected = (id, hex) => {
        this.dispatchEvent(
            new CustomEvent('ac-color-swatch-selected', {
                bubbles: true,
                composed: true,
                detail: { color: hex, 'selection_source': this.isBrand ? SELECTION_SOURCE.BRAND_COLOR : SELECTION_SOURCE.LIBRARY_COLOR, id: id }
            })
        );

        analytics.track(SELECT_APPLY_LIBRARY_ASSET(this.isBrand ? 'brand' : 'library', this.relationship), this);
    };

    headerTemplate = () => {
        if (this.headerText)
            return html`<h4 class="header" title=${this.headerText}>${this.headerText}</h4>`;
    };

    swatchAddTemplate = () => {
        if (this.showAddIcon)
            return html`<ac-color-swatch .variation=${'add'} ?enable-add-button=${this.addButtonEnabled} .ariaLabel=${this.addButtonAriaLabel} .ariaDescription=${this.addButtonAriaDescription} @ac-color-swatch-added=${this._onAddSelected}></ac-color-swatch>`;
    };

    colorSwatchTemplate = (swatch: SwatchList) => {
        const hex: Array<string> | null = validateHEX(swatch.color);

        if (hex) {
            const color = hex[0];
            return html`<overlay-trigger placement="bottom"><sp-swatch
                slot="trigger"
                color=${color}
                value=${swatch.id + color}
                @click=${() => this._onSwatchSelected(swatch.id, color)}
                aria-label='${color} ${this.swatchAriaLabel}'
                aria-description='${color} ${this.swatchAriaDescription}'
                ?selected=${swatch.id + color===this.selectedSwatch}></sp-swatch>
                ${when(!this.hideTooltip, () => html`<sp-tooltip slot="hover-content" delayed>
                    ${color.substr(0, 7).toUpperCase()}
                </sp-tooltip>`)}
            </overlay-trigger>`;
        }

        return nothing;

    };

    private _handleSelectedSwatchChange = (event: Event & { target: SwatchGroup }) => {
        event.preventDefault();
        this.dispatchEvent(
            new CustomEvent('ac-swatch-selected', {
                cancelable: true,
                bubbles: true,
                composed: true,
                detail: event.target.selected.pop()
            })
        );
    };

    render() {
        if (!(this.swatchList?.length > 0) && !this.showAddIcon)
            return nothing;
        return html`
                 ${this.headerTemplate()}
                <sp-swatch-group
                    size="m"
                    class="swatch-group"
                    selects="multiple"
                    selected=${this.selectedSwatch ? [this.selectedSwatch] : []}
                    density="spacious"
                    @change=${this._handleSelectedSwatchChange}
                >
                    ${this.swatchList?.map(swatch => this.colorSwatchTemplate(swatch))}
                    ${this.swatchAddTemplate()}
                </sp-swatch-group>
         `;
    }

}

export default ColorSwatchList;
