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


import { LitElement, PropertyValueMap, html, nothing } from '../../../../deps/lit.js';
import { customElement, property, state } from 'lit/decorators.js';

import './../../components/color-palette';
import { MIN_VISIBLE_PALETTES, UseContext } from './index';

import { style } from './brands-themes-list.css';

@customElement('brands-libraries-themes')
export default class BrandsLibrariesThemes extends LitElement {
    static styles = [style];

    @property({ type: Array })
        themes;

    @property({ type: String })
        selectedLibraryId = '';

    @property({type: Boolean, attribute: 'expand'})
        expand = false;

    @property({type: Boolean, attribute: 'is-library-read-only'})
        isLibraryReadOnly = false;

    @property({type: Boolean, attribute: 'is-brand'})
        isBrand = false;

    @property({type: Boolean, attribute: 'is-sync-complete'})
        isSyncComplete = false;

    @property({type: String, attribute: 'use-context'})
        useContext = '';

    @property({type: Number})
        minVisible = MIN_VISIBLE_PALETTES;

    @property({type: Object})
        intl;

    @property({ type: String, attribute: 'view' })
        view = 'palettes';

    @property({ type: String, attribute: 'selected-swatch' })
    public selectedSwatch = '';

    @property({type: Number, attribute: 'max-theme-colors'})
        maxThemeColors = 20;

    @property({type: Boolean, attribute: 'no-libraries'})
        noLibraryExists = false;

    @property({type: Boolean, attribute: 'is-mobile'})
        isMobile = false;

    @state()
        _themes = [];

    private themesDisplayed = 0;

    private requestAnimationFrameId: number;

    private _handleCreateNewTheme = () => {
        const createNewThemeEvent = new CustomEvent('ac-create-new-theme', {
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(createNewThemeEvent);
    };

    private _handleAddElement = (e: Event, palette) => {
        e.stopPropagation();
        const createNewThemeEvent = new CustomEvent('ac-update-theme', {
            bubbles: true,
            composed: true,
            detail: {
                elementID: palette.id,
                themeName: palette.name,
                colorsCount: palette.colors.length
            }
        });
        this.dispatchEvent(createNewThemeEvent);
    };

    private _displayThemes = () => {
        if (this.themes.length > this.themesDisplayed) {
            this._themes = [...this._themes, this.themes[this.themesDisplayed]];
            this.themesDisplayed++;
            this.requestAnimationFrameId = requestAnimationFrame(this._displayThemes);
        }
    };

    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        if (_changedProperties.has('selectedLibraryId') && _changedProperties.has('themes')) {
            if (this.requestAnimationFrameId) cancelAnimationFrame(this.requestAnimationFrameId);
            this._themes = [];
            this.themesDisplayed = 0;
            this._displayThemes();
        } else if (_changedProperties.has('themes') && this.themes.length) {
            this._themes = this.themes;
        }
    }

    disconnectedCallback() {
        if (this.requestAnimationFrameId) cancelAnimationFrame(this.requestAnimationFrameId);
        super.disconnectedCallback();
    }

    render() {
        if (this.isSyncComplete && this.themes.length === 0) {
            if (this.useContext === UseContext.libraryThemeEdit) {
                return nothing;
            }

            if (this.isLibraryReadOnly) {
                return html`<div class="no-elements">${this.intl?.formatMessage({ id: '@brandlibrary:readOnlyLibrary', defaultMessage: 'This is a read-only {libraryType} and currently has no color themes to display.' }, {libraryType: this.isBrand ? 'brand': 'library'})}</div>`;
            }

            if (this.view === 'swatch-group') {
                return html`<div class="no-elements"><button @click=${this._handleCreateNewTheme}>${this.intl?.formatMessage({ id: '@brandlibrary:create.theme', defaultMessage: 'Create a color theme' })}</button> ${this.intl?.formatMessage({ id: '@brandlibrary:create.theme.empty', defaultMessage: 'to save colors for easy reuse.' })}</div>`;
            }

            return html`<div class="no-elements"><button @click=${this._handleCreateNewTheme}>${this.intl?.formatMessage({ id: '@brandlibrary:create.theme', defaultMessage: 'Create a color theme' })}</button> ${this.intl?.formatMessage({ id: '@brandlibrary:transform.files', defaultMessage: 'and transform files with just a click.' })}</div>`;
        }

        const palettes = this.expand ? this.themes : this.themes.slice(0, this.minVisible);

        if (this.view === 'swatch-group') {
            let libraryAriaText = '';
            if (this.isBrand) {
                libraryAriaText = this.intl?.formatMessage({ id: '@brandlibrary:brand', defaultMessage: 'Brand' });
            } else {
                libraryAriaText = this.intl?.formatMessage({ id: '@brandlibrary:library', defaultMessage: 'Library' });
            }

            return palettes.map(palette => {
                return html`<ac-color-swatch-list
                    ?enable-add-button=${this.isSyncComplete}
                    ?hide-tooltip=${this.isMobile || this.useContext === UseContext.libraryThemeEdit}
                    .relationship=${'primary'}
                    .selectedSwatch=${this.selectedSwatch}
                    .isBrand=${this.isBrand}
                    .headerText=${palette.name}
                    .swatchAriaLabel=${this.intl?.formatMessage({id:'@brandlibrary:swatchlabel',defaultMessage:' {swatchType} {libraryType} color'}, {swatchType:this.intl?.formatMessage({id:'@brandlibrary:additionalcolors',defaultMessage:'Your colors'}), libraryType:libraryAriaText})}
                    .swatchAriaDescription=${this.intl?.formatMessage({id:'@brandlibrary:swatchdesc',defaultMessage:' {swatchType} {libraryType} color swatch'}, {swatchType:this.intl?.formatMessage({id:'@brandlibrary:additionalcolors',defaultMessage:'Your colors'}), libraryType:libraryAriaText})}
                    .addButtonAriaLabel=${this.intl?.formatMessage({id:'@brandlibrary:addlabel',defaultMessage:'Add {swatchType} {libraryType} color'}, {swatchType:this.intl?.formatMessage({id:'@brandlibrary:additionalcolors',defaultMessage:'Your colors'}), libraryType:libraryAriaText})}
                    .addButtonAriaDescription=${this.intl?.formatMessage({id:'@brandlibrary:adddesc',defaultMessage:'Add {swatchType} color to your {libraryType}'}, {swatchType:this.intl?.formatMessage({id:'@brandlibrary:additionalcolors',defaultMessage:'Your colors'}), libraryType:libraryAriaText})}
                    .showAddIcon=${
    // !this.isLibraryReadOnly && palette.colors.length < this.maxThemeColors && this.useContext !== UseContext.libraryThemeEdit
    // Removing the add button temporarily (CCEX-102989)
    false
}
                    .swatchList=${palette.colors.map(color => { return {id: palette.id, color }; })}
                    @ac-color-swatch-added=${(e: Event) => this._handleAddElement(e, palette)}>
                </ac-color-swatch-list>`;
            });
        }

        return palettes.map(palette => html`<color-palette .palette=${palette} show-name-tooltip selection-source=${this.isBrand ? 'brands-palette' : 'libraries-palette'}></color-palette>`);
    }
}
