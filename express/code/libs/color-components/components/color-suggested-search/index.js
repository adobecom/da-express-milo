/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2024 Adobe
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


import { html, LitElement } from '../../../../deps/lit.js';
import { customElement, state, query, property } from 'lit/decorators.js';
import { FETCH_REQUEST_ABORTED } from '../../constants/Constants';
import { generateErrorEvent, searchPalettes } from '../../utils';

import { style } from './styles.css';

/**
 * @typedef {Object} EventOptions
 * @property {boolean} bubbles
 * @property {boolean} composed
 * @property {Object} [detail]
 */

/**
 * @typedef {Object} PaletteList
 * @property {string} name
 * @property {string[]} palettes
 */

@customElement('color-suggested-search')
class ColorSuggestedSearch extends LitElement {

    @state()
        query = '';

    @query('#palette-search')
        searchInputEle;

    @property({type: Boolean})
        isFetching;

    @property({ type: String, attribute: 'aria-search-placeholder' })
        searchPlaceholder = 'Search color themes';

    @property({type: Function})
        updateResultsFetching;

    static styles = [style];

    private searchQuery = '';

    createAndDispatchEvent = (name, payload) => {
        const options = {
            bubbles: true,
            composed: true
        };

        if (payload) {
            options.detail = payload;
        }

        const event = new CustomEvent(name, options);

        this.dispatchEvent(event);
    };

    fetchPalettes = (event: CustomEvent) => {
        const query = event.detail.q;

        this.query = query;

        /**
         * Fetch Color Palettes on press of Enter key. Do not fetch color palettes against same search query.
         * Make sure to send only one search request at a time.
        */
        this.createAndDispatchEvent('ac-themes-query-search-begin');
        this.updateResultsFetching(true);
        this.createAndDispatchEvent('ac-global-themes-analytics', {
            eventName: 'search-color-theme',
            props: { 'ui.search_keyword': query }
        });
        const controller = new AbortController();
        searchPalettes(query, null, null, controller.signal, true)
            .then((response) => {
                this.updateResultsFetching(false);
                this.createAndDispatchEvent('ac-palette-fetch', {
                    palettes: [response[0]],
                    searchQuery: query
                });
                this.createAndDispatchEvent('ac-global-themes-analytics', {
                    eventName: 'result-color-theme',
                    props: {
                        'ui.search_keyword': query,
                        'custom.search.result_count': response[0].palettes?.length ?? 0
                    }
                });
                this.searchQuery = query;
                this.createAndDispatchEvent('ac-themes-query-search-end');
                this.resetForm(null, this.searchQuery);
            })
            .catch(error => {
                // Do not send error events when manually aborted the fetch call
                if (error?.message !== FETCH_REQUEST_ABORTED) {
                    this.handleError(error);
                }
                this.resetForm(null, this.searchQuery);
                this.updateResultsFetching(false);
            });
    };

    handleError = error => {
        generateErrorEvent(this, {message: `Failed to fetch color palettes for a specific search query`, error});
    };

    resetForm = (_event?: CustomEvent, value = '') => {
        this.query = value;
        this.searchQuery = value;
        if (this.searchInputEle) {
            this.searchInputEle.value = value;
        }
    };

    connectedCallback(): void {
        super.connectedCallback();
        document.addEventListener('ac-reset-search-from', this.resetForm);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener('ac-reset-search-from', this.resetForm);
    }

    resetResults = () => {
        this.resetForm();
        this.createAndDispatchEvent('ac-color-search-reset');
    };

    render() {
        return html`<div class="color-search">
            <slot
                name="color-theme-search-slot"
                @x-search-submit=${this.fetchPalettes}
                @x-search-clear=${this.resetResults}
            ></slot>
        </div>`;
    }

}

export default ColorSuggestedSearch;
