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
import '@spectrum-web-components/icon/sp-icon.js';
import { style } from './styles.css';
import intlStore from '../../utils/intl';
import { localeUrlMap } from './../../utils/locales';
import analytics from '../../analytics';
import { SELECT_CREATE_LIBRARY } from '../../constants/AnalyticsEvents';

@customElement('ac-add-brand-library')
class BrandLibraryAddComponent extends LitElement {

    static styles = [style];

    @property({ type: String })
        locale = 'en-US';

    @property({ type: Object })
        intl;

    @property({ type: String })
        panelCloseEvent = '';

    @property({ type: Boolean, attribute: 'is-mobile-view' })
        isMobileView = false;

    private _onCreateLibrary = () => {
        const createLibraryEvent = new CustomEvent('ac-on-create-library', {
            bubbles: true,
            composed: true,
            detail: {
                onSaveComplete: this._closeLibrarySelector
            }
        });
        this.dispatchEvent(createLibraryEvent);
        analytics.track(SELECT_CREATE_LIBRARY('library'), this);
    };

    private _onCreateBrand = () => {
        const createBrandEvent = new CustomEvent('ac-on-create-brand', {
            bubbles: true,
            composed: true,
            detail: {
                onSaveComplete: this._closeLibrarySelector
            }
        });
        this.dispatchEvent(createBrandEvent);
        analytics.track(SELECT_CREATE_LIBRARY('brand'), this);
    };

    private _closeLibrarySelector = () => {
        if (this.panelCloseEvent) {
            this.dispatchEvent(new Event(this.panelCloseEvent, { bubbles: true, composed: true }));
        } else {
            this.dispatchEvent(new Event('close', { bubbles: true, composed: true }));
        }
    };

    connectedCallback(): void {
        super.connectedCallback();
        if (!this.intl)
            this.initialiseLocales().catch(err => console.log(err));
    }

    initialiseLocales = async () => {
        this.intl = await new intlStore().init({
            localeUrlMap,
            locale: this.locale
        });
    };

    render() {
        return html`<div class='add-icon-container'>
            <sp-action-button
                quiet
                role="button"
                size=${this.isMobileView ? 's' : 'm'}
                aria-label=${this.intl?.formatMessage({ id: '@brandlibrary:newbrand', defaultMessage: 'New brand' })}
                aria-description=${this.intl?.formatMessage({ id: '@brandlibrary:newbranddesc', defaultMessage: 'Create a new brand' })}
                class='icon-button'
                @click=${this._onCreateBrand}
            >
                <x-icon-brand-add slot="icon"></x-icon-brand-add>
            </sp-action-button>
            <sp-action-button
                quiet
                role="button"
                size=${this.isMobileView ? 's' : 'm'}
                aria-label=${this.intl?.formatMessage({ id: '@brandlibrary:newlibrary', defaultMessage: 'New library' })}
                aria-description=${this.intl?.formatMessage({ id: '@brandlibrary:newlibrarydesc', defaultMessage: 'Create a new library' })}
                class='icon-button'
                @click=${this._onCreateLibrary}
            >
                <x-icon-cclibrary-add slot="icon"></x-icon-cclibrary-add>
            </sp-action-button>
        </div>`;
    }

}

export default BrandLibraryAddComponent;
