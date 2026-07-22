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
import { classMap } from 'lit/directives/class-map.js';
import { Menu } from '@spectrum-web-components/menu';
import '@spectrum-web-components/menu/sp-menu.js';
import '@spectrum-web-components/menu/sp-menu-item.js';
import '@spectrum-web-components/icon/sp-icon.js';
import { style } from './styles.css';

import intlStore from '../../utils/intl';
import { localeUrlMap } from './../../utils/locales';

@customElement('ac-brand-libraries-selector')
class BrandLibrariesSelector extends LitElement {

    static styles = [style];

    @property()
        locale = 'en-US';

    @property({ type: Object })
        intl;

    @property({ type: Object })
        libraries;

    @property({ type: String })
        selectedLibraryId = '';

    @property({ type: Boolean, attribute: 'is-mobile' })
        isMobileView = false;

    @property({type: String})
        panelCloseEvent = '';

    private _closeLibrarySelector() {
        if(this.panelCloseEvent) {
            this.dispatchEvent(new CustomEvent(this.panelCloseEvent, {bubbles: true, composed: true}));
        } else {
            this.dispatchEvent(new Event('close', {bubbles: true, composed: true}));
        }
    }

    private _onSelectionChange = (event: Event) => {
        const picker = event.target as Menu;
        // analytics.track(SELECT_SWAP_LIBRARY(this._getIsBrand(picker.value)?'brand':'library'), this);
        // TODO: Add the above analytics call to hz repo
        const libraryChangeEvent = new CustomEvent('ac-library-select', {
            bubbles: true,
            composed: true,
            detail: {
                libraryID: picker.value
            }
        });
        this.dispatchEvent(libraryChangeEvent);
        this._closeLibrarySelector();
    };

    _getLibraryTypeIcon = (library) => {
        if(!library?.isWritable)
            return html`<sp-icon
                role="icon"
                label=${this.intl?.formatMessage({ id: '@brandlibrary:readonlylibrary', defaultMessage: 'Read-only library' })}
                aria-description=${this.intl?.formatMessage({ id: '@brandlibrary:readonlylibrary', defaultMessage: 'Read-only library' })}
                class="icon-button"
                size="m"
                slot="icon">
                    <x-icon-no-edit></x-icon-no-edit>
                </sp-icon>`;
        if (library?.roles?.[0]?.type === 'brand')
            return html`<sp-icon
                role="icon"
                label=${this.intl?.formatMessage({ id: '@brandlibrary:brandlibrary', defaultMessage: 'Brand library' })}
                aria-description=${this.intl?.formatMessage({ id: '@brandlibrary:brandlibrary', defaultMessage: 'Brand library' })}
                class="icon-button"
                size="m"
                slot="icon"
            >
                <x-icon-brand></x-icon-brand>
            </sp-icon>`;
        else
            return html`<sp-icon
                role="icon"
                label=${this.intl?.formatMessage({ id: '@brandlibrary:library', defaultMessage: 'Library' })}
                aria-description=${this.intl?.formatMessage({ id: '@brandlibrary:library', defaultMessage: 'Brand library' })}
                class="icon-button"
                size="m"
                slot="icon"
            >
                <x-icon-cclibrary></x-icon-cclibrary>
            </sp-icon>`;
    };

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
        if(this.libraries?.length < 1)
            return nothing;
        const classes = {
            mobileview: this.isMobileView
        };
        return html`<sp-menu
            @change=${this._onSelectionChange}
            selects="single"
            class="library-list-menu ${classMap(classes)}"
        >
            ${this.libraries?.map(
        library => {
            return html`<sp-menu-item
                value=${library.id}
                no-wrap
                .selected=${library.id === this.selectedLibraryId}
            >
                ${this._getLibraryTypeIcon(library)}${library.name}
            </sp-menu-item>`;
        })}
        </sp-menu>`;
    }

}

export default BrandLibrariesSelector;
