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

import { html, LitElement } from '../../../../deps/lit.js';
import { customElement, property } from 'lit/decorators.js';
import intlStore from '../../utils/intl';
import { localeUrlMap } from './../../utils/locales';

import { style } from './styles.css';

@customElement('no-search-results-message')
export class NoSearchResultsMessage extends LitElement {
    static styles = [style];

    @property()
        locale = 'en-US';

    @property({ type: Object })
        intl;

    @property({ type: String, attribute: 'no-search-heading-label' })
        noSearchResultsHeading;

    @property({ type: String, attribute: 'no-search-desc-label' })
        noSearchResultsDescription;

    connectedCallback(): void {
        super.connectedCallback();
        if(!this.intl)
            this.initialiseLocales().catch(err => console.log(err));
    }

    initialiseLocales = async () => {
        this.intl = await new intlStore().init({
            localeUrlMap,
            locale: this.locale
        });
    };

    render() {
        return html` <div class='no-search-results-message'>
                <h2 class="heading">${this.noSearchResultsHeading}</h2>
                <p class="description">${this.noSearchResultsDescription}</p>
        </div>`;
    }
}
