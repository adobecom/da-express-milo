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
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import './../color-palette';
import { when } from 'lit/directives/when.js';

import { style } from './styles.css';

interface PaletteListType {
    name: string,
    palettes: []
}

@customElement('color-palette-list')
class ColorPaletteList extends LitElement {

    @property({ type: Object })
        palettelist: PaletteListType;

    @property({ type: Number })
        minVisiblePalettes = 3;

    @property({ type: Boolean })
        showAll = false;

    @property({ type: Boolean })
        isMobile = false;

    @property({ type: Boolean, attribute: 'hide-list-header' })
        hideListHeader = false;

    @property({ type: String, attribute: 'palette-aria-label' })
        paletteAriaLabel;

    @property({ type: String, attribute: 'search-results-label' })
        searchResultsLabel;

    @property({ type: String, attribute: 'more-label' })
        moreLabel = 'More';

    @property({ type: String, attribute: 'less-label' })
        lessLabel = 'Less';

    @property({ type: String, attribute: 'view-all-label' })
        viewAllLabel = 'View all';

    @property({ type: String })
        searchQuery = '';

    @state()
    private _showAllMobile = false;

    static styles = [style];

    showAllPalettes = () => {
        this.showAll = true;
        const event = new CustomEvent('ac-palette-view-all', {
            bubbles: true,
            composed: true,
            detail: {
                id: this.id
            }
        });

        this.dispatchEvent(event);
    };

    showDefaultPalettes = () => {
        this.showAll = false;
        const event = new CustomEvent('ac-show-default-palettes', {
            bubbles: true,
            composed: true,
            detail: {
                name: 'color-palette-list'
            }
        });

        this.dispatchEvent(event);
    };

    togglePalettes = () => {
        this._showAllMobile = !this._showAllMobile;
        const event = new CustomEvent('ac-view-all-palette-toggle', {
            bubbles: true,
            composed: true,
            detail: {
                showAllMobile : this._showAllMobile,
                id: this.id
            }
        });

        this.dispatchEvent(event);

    };

    private _paletteListHeaderTemplate = () => {
        return when(this.hideListHeader, () => nothing, () => html`<h4>${this.palettelist.name}</h4>`);
    };

    headerTemplate = () => {
        const headerClass = classMap({
            'header': true,
            'header-mobile': this.isMobile
        });

        if (this.showAll && this.isMobile && this.searchResultsLabel) {
            return html`<div class=${headerClass}>
                <h4>${this.searchResultsLabel}</h4>
            </div>`;
        }

        if(this.isMobile)
            return nothing;

        if (this.showAll) {
            return html`<div class=${headerClass}>
                <button class="btn-cta icon-chevron-left" @click=${this.showDefaultPalettes}><x-icon-chevron-left></x-icon-chevron-left> ${this.palettelist.name}</button>
            </div>`;
        }
        return html`<div class=${headerClass}>
            ${this._paletteListHeaderTemplate()}
            ${this.palettelist.palettes.length > this.minVisiblePalettes ?
                html`<button class="btn-cta" @click=${this.showAllPalettes}
                aria-label=${this.viewAllLabel}>${this.viewAllLabel}</button>`
                :
                nothing}
        </div>`;
    };

    palettesListTemplate = palettes => {
        const _palettes = (this.showAll || this._showAllMobile) ? palettes : palettes.slice(0, this.minVisiblePalettes);

        return _palettes.map(palette => html`<color-palette data-testid="color-palette" ?vertical=${this.isMobile} .palette=${palette} .searchQuery=${this.searchQuery} palette-aria-label=${this.paletteAriaLabel} selection-source=${this.searchQuery ? 'search-palette' : 'default-palette'}></color-palette>`);
    };

    renderMoreLessTemplate = () => {
        if (this.isMobile && this.showAll) {
            return nothing;
        } else if (!this.isMobile) {
            return nothing;
        }

        return html`
          <button class="more-less-cta" @click=${this.togglePalettes} aria-label=${this._showAllMobile ? this.lessLabel : this.moreLabel} >
            <x-icon-more></x-icon-more>
          </button>
        `;
    };

    render() {
        if (!this.palettelist.palettes || this.palettelist.palettes.length === 0) {
            return nothing;
        }

        return html`
            <section class="color-palette-section">
                ${this.headerTemplate()}
                <div class=${classMap({ 'color-palette-list': true, 'horizontal': this.isMobile })}>
                    ${this.palettesListTemplate(this.palettelist.palettes)}
                    ${this.renderMoreLessTemplate()}
                </div>
            </section>
        `;
    }

}

export default ColorPaletteList;
