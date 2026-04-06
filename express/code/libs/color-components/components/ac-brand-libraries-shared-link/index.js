/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2024 Adobe
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

import { LitElement, html } from '../../../../deps/lit.js';
import { customElement, property } from 'lit/decorators.js';
import '@spectrum-web-components/link/sp-link.js';
import { style } from './styles.css';
import intlStore from '../../utils/intl';
import { localeUrlMap } from './../../utils/locales';
import analytics from '../../analytics';
import { SHARED_BRANDS_LIBRARIES_LINK_CLICK } from '../../constants/AnalyticsEvents';

@customElement('ac-brand-libraries-shared-link')
class BrandLibrariesSharedLinkComponent extends LitElement {
    static styles = [style];

    @property({ type: String })
        locale = 'en-US';

    @property({ type: Object })
        intl;

    @property({type: String})
        href;

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

    private _onClick() {
        analytics.track(SHARED_BRANDS_LIBRARIES_LINK_CLICK, this);
    }

    render() {
        return html`
            <sp-link
                href=${this.href}
                target="_blank"
                quiet
                rel="noopener referrer"
                @click=${() => { this._onClick(); }}
            >
                ${this.intl?.formatMessage({ id: '@brandlibrary:sharedBrandsAndLibraries', defaultMessage: 'Browse and add shared brands and libraries' })}
            </sp-link>
        `;
    }
}

export default BrandLibrariesSharedLinkComponent;
