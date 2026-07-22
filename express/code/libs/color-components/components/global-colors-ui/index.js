/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2022 Adobe
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
 **************************************************************************/


import { html, LitElement, nothing, TemplateResult } from '../../../../deps/lit.js';
import { customElement, property, state } from 'lit/decorators.js';
import intlStore from '../../utils/intl';
import { localeUrlMap } from './../../utils/locales';
import { DOCUMENT_TYPE, FETCH_REQUEST_ABORTED, PRE_DEFINED_RULES_RECOLOR_DOCUMENTS } from '../../constants/Constants';
import './theme-panel-mobile';
import '../color-palette-list';
import '../color-search';
import '../color-suggested-search';
import '../progress-circle';
import '../no-search-results-message';

import { style } from './styles.css';

import { generateErrorEvent, getDefaultColorPalettes } from '../../utils';
import { setConfig } from '../../utils/config';
import { when } from 'lit/directives/when.js';

@customElement('global-colors-ui')
class GlobalColorsUI extends LitElement {

    static styles = [style];

    @property({ type: Array })
        palettes: [] = [];

    @property({ type: String })
        locale = 'en-US';

    @property({ type: String })
        env = 'prod';

    @property({ type: DOCUMENT_TYPE })
        documentType = DOCUMENT_TYPE.OTHERS;

    @property({ type: Boolean })
        isFetching = true;

    @property({ type: Boolean })
        isMobile = false;

    @property({ type: Boolean })
        showPaletteSearch = false;

    @property({ type: Boolean, attribute: 'show-active-palette' })
        showActivePalette = false;

    @property({ type: Boolean, attribute: 'show-brand-themes' })
        showBrandThemes = false;

    @property({ type: Object })
        intl;

    @state()
        defaultPalettes = [];

    @state()
        expandedCategory = -1;

    @state()
        isShowingDefaultPalettes = false;

    private searchQuery = '';

    protected minVisiblePalettes = 3;

    protected fetchController: AbortController;

    initialiseLocales = async () => {
        this.intl = await new intlStore().init({
            localeUrlMap,
            locale: this.locale
        });
    };

    handleError = error => {
        generateErrorEvent(this, {message: 'Failed to fetch pre-defined color palettes', error});
    };

    handleViewAllClick = (event: CustomEvent) => {
        const paletteID = +event.detail.id;

        this.expandedCategory = paletteID;
        this.isShowingDefaultPalettes = this.expandedCategory < 0;
    };

    updateResultsFetching = flag => {
        this.isFetching = flag;
    };

    showDefaultPalettes = event => {
        this.palettes = [];
        this.expandedCategory = -1;
        this.isShowingDefaultPalettes = true;

        const detail = event.detail;

        if (detail) {
            const _event = new CustomEvent('ac-reset-search-from', {
                bubbles: true,
                composed: true
            });

            this.dispatchEvent(_event);
        }

        this.searchQuery = '';
    };

    connectedCallback() : void {
        super.connectedCallback();

        if (typeof this.intl === 'undefined') {
            this.initialiseLocales().catch(err => console.log(err));
        }

        setConfig('environment', this.env);
        if (this.palettes.length === 0) {
            const _defaultSearchBeginEvent = new CustomEvent('ac-themes-default-search-begin', {
                bubbles: true,
                composed: true
            });

            const _defaultSearchEndEvent = new CustomEvent('ac-themes-default-search-end', {
                bubbles: true,
                composed: true
            });

            this.dispatchEvent(_defaultSearchBeginEvent);
            this.fetchController = new AbortController();
            getDefaultColorPalettes(this.locale, this.fetchController.signal, this.documentType)
                .then(response => {
                    this.defaultPalettes = response;
                })
                .catch(error => {
                    // Do not send error events when manually aborted the fetch call.
                    if (error?.message !== FETCH_REQUEST_ABORTED) {
                        this.handleError(error);
                    }
                    return import('../../constants/FallbackPalettes').then(response => {
                        // update category label with localised label
                        response.palettes.forEach(palette => {
                            const localisedLabel = palette.localisedName[this.locale] ?? palette.localisedName['en-US'];

                            palette.name = localisedLabel;
                        });

                        this.defaultPalettes = response.palettes;
                    });
                })
                .finally(() => {
                    this.isShowingDefaultPalettes = true;
                    this.isFetching = false;
                    this.dispatchEvent(_defaultSearchEndEvent);
                });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        // Abort the palette fetch request when component is no longer visible and unmounted.
        this.fetchController?.abort(FETCH_REQUEST_ABORTED);
    }

    showSearchPalettes = (event: CustomEvent) => {
        const palettes = event.detail.palettes;

        if (palettes.length === 0) {
            this.expandedCategory = -1;
            this.isShowingDefaultPalettes = true;
        } else {
            this.expandedCategory = 0;
            this.isShowingDefaultPalettes = false;
        }

        this.palettes = event.detail.palettes;
        this.searchQuery = event.detail.searchQuery;
    };

    // When showPaletteSearch is set to false, hide SearchInputBox and show default color palettes.
    willUpdate(changedProperties) {
        if (changedProperties.has('showPaletteSearch') && this.showPaletteSearch === false && this.defaultPalettes.length && this.isMobile) {
            this.palettes = [];
            this.expandedCategory = -1;
            this.isShowingDefaultPalettes = true;
        }
    }

    _colorPaletteListTemplate = (_palettes, _showAll, _index): TemplateResult => {
        const viewAllLabel = this.intl?.formatMessage({ id: '@globaltheme:viewall', defaultMessage: 'View all' }),
            noSearchResultsHeading = this.intl?.formatMessage({ id: '@globaltheme:noresultsheading', defaultMessage: 'Sorry, no color themes were found' }),
            noSearchResultsDesc = this.intl?.formatMessage({ id: '@globaltheme:noresultsdescription', defaultMessage: 'Please check your spelling or try different keywords' }),
            paletteAriaLabel = this.intl?.formatMessage({id: '@globaltheme:colorpalletearialabel', defaultMessage: 'The {hex} value of swatch {index}'});


        if (_palettes.palettes.length === 0) {
            return html`<no-search-results-message
                no-search-heading-label=${noSearchResultsHeading}
                no-search-desc-label=${noSearchResultsDesc}
            ></no-search-results-message>`;
        }

        return html`<color-palette-list
            id=${_index}
            data-testid=${`themes-panel-color-palette-list`}
            .palettelist=${_palettes}
            .searchQuery=${this.searchQuery}
            .minVisiblePalettes=${PRE_DEFINED_RULES_RECOLOR_DOCUMENTS.includes(this.documentType) ? Infinity : this.minVisiblePalettes}
            .showAll=${_showAll}
            @ac-show-default-palettes=${this.showDefaultPalettes}
            @ac-palette-view-all=${this.handleViewAllClick}
            view-all-label=${viewAllLabel}
            palette-aria-label=${paletteAriaLabel}
        ></color-palette-list>`;
    };

    render() {
        if(typeof this.intl === 'undefined') {
            return nothing;
        }

        let palettes = [];

        if (this.palettes.length) {
            palettes = this.palettes;
        } else {
            palettes = this.defaultPalettes;
        }

        return html`
            <div class="global-colors-body">
                ${when(!this.isMobile && !PRE_DEFINED_RULES_RECOLOR_DOCUMENTS.includes(this.documentType), () => html`<color-suggested-search
                    .isFetching=${this.isFetching}
                    .updateResultsFetching=${this.updateResultsFetching}
                    @ac-palette-fetch=${this.showSearchPalettes}
                    @ac-color-search-reset=${this.showDefaultPalettes}
                    aria-search-placeholder=${this.intl.formatMessage({ id: '@globaltheme:search.placeholder', defaultMessage: 'Search color themes' })}
                >
                    <slot name="color-theme-search-slot" slot="color-theme-search-slot"></slot>
                </color-suggested-search>`)}
                ${when(this.showPaletteSearch && this.isMobile, () =>
        html`<color-search
                            .isFetching=${this.isFetching}
                            .updateResultsFetching=${this.updateResultsFetching}
                            @ac-palette-fetch=${this.showSearchPalettes}
                            @ac-color-search-reset=${this.showDefaultPalettes}
                            aria-search-placeholder=${this.intl.formatMessage({ id: '@globaltheme:search.placeholder', defaultMessage: 'Search color themes' })}
                        ></color-search>` )}
                ${this.isMobile ?
                    html`<global-colors-ui-mobile
                        .palettes=${palettes}
                        search-query=${this.searchQuery}
                        .intl=${this.intl}
                        ?isFetching=${this.isFetching}
                        ?show-all-curated-palettes=${PRE_DEFINED_RULES_RECOLOR_DOCUMENTS.includes(this.documentType)}
                        ?isShowingDefaultPalettes=${this.isShowingDefaultPalettes}
                        ?show-active-palette=${this.showActivePalette}
                        ?show-brand-themes=${this.showBrandThemes}
                        ?show-category-label=${!this.showPaletteSearch}
                    >
                        <slot name="active-palette" slot="active-palette"></slot>
                        <slot name="brand-themes" slot="brand-themes"></slot>
                    </global-colors-ui-mobile>`
                    :
                    this.isFetching ?
                        html`<progress-circle></progress-circle>`
                        :
                        this.isShowingDefaultPalettes ?
                            palettes.map((palettelist, index) => this._colorPaletteListTemplate(palettelist, false, index))
                            :
                            this._colorPaletteListTemplate(palettes[this.expandedCategory], true, this.expandedCategory)}
            </div>
        `;
    }

}

export default GlobalColorsUI;
