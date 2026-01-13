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
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import '@spectrum-web-components/divider/sp-divider.js';
import '../ac-color-swatch-list';
import '../ac-brand-libraries-selector';
import '../ac-add-brand-library';
import './brands-themes-list';
import '../color-palette-list';
import '../ac-brand-libraries-shared-link';
import '@spectrum-web-components/icon/sp-icon.js';
import '@spectrum-web-components/overlay/overlay-trigger.js';
import '@spectrum-web-components/popover/sp-popover.js';
import '@spectrum-web-components/action-button/sp-action-button.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-chevron-right.js';
import { when } from 'lit/directives/when.js';
import { choose } from 'lit/directives/choose.js';
import { style } from './styles.css';
import intlStore from '../../utils/intl';
import { localeUrlMap } from './../../utils/locales';
import analytics from '../../analytics';
import { EXPAND_BRAND_COLORS , COLLAPSE_BRAND_COLORS } from '../../constants/AnalyticsEvents';

enum VARIANT {
    SWATCHES= 'swatches',
    THEMES= 'themes',
    THEMES_MOBILE= 'themes-mobile',
    ALL= 'all'
}

export enum UseContext {
    others = 'others',
    libraryThemeEdit = 'library-theme-edit'
}

export const MIN_VISIBLE_PALETTES = 3;

@customElement('ac-brand-libraries-color-picker')
class BrandLibrariesPicker extends LitElement {

    static styles = [style];

    @property({ type: String, attribute: 'selected-library-id' })
        selectedLibraryId = '';

    @property({ type: Boolean, attribute: 'is-mobile' })
        isMobile = false;

    @property({ type: Boolean, attribute: 'is-tablet-view' })
        isTablet = false;

    @property({ type: String })
        locale = 'en-US';

    @property({ type: Object })
        intl;

    @property({ type: Object })
        libraries = [];

    @property({ type: String, attribute: 'variant' })
        variant = VARIANT.SWATCHES;

    @property({ type: String, attribute: 'use-context' })
        useContext: UseContext = UseContext.others;

    @property({ type: Boolean, attribute: 'is-sync-complete' })
        isSyncComplete = false;

    @property({ type: Boolean, attribute: 'hide-add-button' })
        hideAddButton = false;

    @property({ type: Boolean, attribute: 'disable-library-switch' })
        disableLibrarySwitch = false;

    @property({ type: Boolean, attribute: 'disable-accordion' })
        disableAccordion = false;

    @property({ type: Array })
        swatches = [];

    @property({ type: Array })
        themes = [];

    @property({ type: Object, attribute: 'selected-library' })
        selectedLibrary;

    @property({ type: String, attribute: 'selected-swatch' })
    public selectedSwatch = '';

    @property({ type: String, attribute: 'shared-brand-libraries-href' })
        sharedBrandLibrariesHref;

    @property({ type: Boolean, attribute: 'show-shared-brand-libraries' })
        showSharedBrandLibraries = false;

    @state()
        accordionOpen = true;

    @state()
        showAllThemes = false;

    @query('sp-icon[role="button"]')
    private _accordionButton?: HTMLElement;

    @query('button[role="menu"]')
    private _librariesButton?: HTMLButtonElement;

    private toggleAccordion = () => {
        this.accordionOpen = !this.accordionOpen;
        this.accordionOpen ? analytics.track(EXPAND_BRAND_COLORS, this) : analytics.track(COLLAPSE_BRAND_COLORS, this);
    };

    // Event are re-triggered as events from Overlay is not passed to parent component.
    private _handleAnalytics = (event :CustomEvent) => {
        event?.stopPropagation();
        analytics.sendAnalytics(event.detail,this);
    };


    private _onCreateLibrary = (event: CustomEvent) => {
        event.stopPropagation();
        const createLibraryEvent = new CustomEvent('ac-on-create-library', {
            bubbles: true,
            composed: true,
            detail: {
                onSaveComplete: event.detail?.onSaveComplete
            }
        });
        this.dispatchEvent(createLibraryEvent);
    };

    private _onCreateBrand = (event: CustomEvent) => {
        event?.stopPropagation();
        const createBrandEvent = new CustomEvent('ac-on-create-brand', {
            bubbles: true,
            composed: true,
            detail: {
                onSaveComplete: event.detail?.onSaveComplete
            }
        });
        this.dispatchEvent(createBrandEvent);
    };

    private _getCreateBrandText() {
        return html`<a class="learnlink" @click=${this._onCreateBrand}>
            ${this.intl?.formatMessage({ id: '@brandlibrary:createbrand', defaultMessage: 'Create a Brand' })}
        </a>`;
    }

    private _getEmptyBodyView = () => {
        const classes = {
                closed: !this.accordionOpen,
                mobile: this.isMobile
            },
            emptyInfoText = this.intl?.formatMessage(
                { id:'@brandlibrary:emptyinfo', defaultMessage:'Add colors to your brand to access them quickly in the future.' }
            );
        return html`<div class="empty-view ${classMap(classes)}">
            <h4 class="empty-text">
                ${emptyInfoText} ${this._getCreateBrandText()}
            </h4>
        </div>`;
    };

    private _getReadOnlyEmptyBodyView = () => {
        const classes = {
                closed: !this.accordionOpen,
                mobile: this.isMobile
            },
            readOnlyEmptyText = this.intl?.formatMessage(
                { id:'@brandlibrary:readonlyemptyinfo', defaultMessage:'This is a read-only library and currently has no color swatches to display.' }
            );
        return html`<div class="empty-view ${classMap(classes)}">
            <h4 class="empty-text">
                ${readOnlyEmptyText} ${this._getCreateBrandText()}
            </h4>
        </div>`;
    };

    private _getLibrarySelectorHeader = () => {
        return html`<div style="display:flex; align-items:center; padding: 12px 16px;">
            <h4 style="margin: unset; line-height: 24px; font-size: 14px; flex-grow: 1; font-weight: 700;">
                ${this.intl?.formatMessage({id:'@brandlibrary:libraryselectortitle',defaultMessage:'Brand and Libraries'})}
            </h4>
            ${when(this.useContext !== UseContext.libraryThemeEdit, () => html`<ac-add-brand-library
                @ac-on-create-brand=${this._onCreateBrand}
                @ac-on-create-library=${this._onCreateLibrary}
                @color-picker-analytics=${this._handleAnalytics}
            ></ac-add-brand-library>`)}
         </div>`;
    };

    private _getLibraryTypeIcon = (library) => {
        if (!library)
            return nothing;
        if (!library?.isWritable)
            return html`<sp-icon class="icon-button" size="m">
                <x-icon-no-edit></x-icon-no-edit>
            </sp-icon>`;
        if (library?.roles?.[0]?.type === 'brand')
            return html`<sp-icon
                role="icon"
                label=${this.intl?.formatMessage({id:'@brandlibrary:brandlibrary', defaultMessage:'Brand library'})}
                aria-description=${this.intl?.formatMessage({id:'@brandlibrary:brandlibrary', defaultMessage:'Brand library'})}
                class="icon-button"
                size="m"
            >
                <x-icon-brand></x-icon-brand>
            </sp-icon>`;
    };

    private _getUserTypeIcon = () => {
        return html`<slot name="badge"></slot>`;
    };

    private _handleCreateNewTheme = (event: CustomEvent) => {
        event?.stopPropagation();

        const createNewThemeEvent = new CustomEvent('ac-create-new-theme', {
            bubbles: true,
            composed: true,
            detail: {
                library: this.selectedLibraryId
            }
        });
        this.dispatchEvent(createNewThemeEvent);
    };

    private _onLibrarySelectorClickMobile = (event: CustomEvent) => {
        event?.stopPropagation();

        this.dispatchEvent(
            new CustomEvent('ac-trigger-library-selector-mobile', {
                bubbles: true,
                composed: true,
                detail: {
                    title: this.intl?.formatMessage({ id:'@brandlibrary:libraryselectortitle', defaultMessage:'Brand and Libraries' })
                }
            })
        );
    };

    private _renderSharedBrandLibrariesLink() {
        if(this.showSharedBrandLibraries) {
            return html`<ac-brand-libraries-shared-link
                style="padding: 6px 16px 8px; font-size: 12px;"
                .locale=${this.locale}
                .intl=${this.intl}
                .href=${this.sharedBrandLibrariesHref}>
            </ac-brand-libraries-shared-link>`;
        }
        return nothing;
    }

    private _getLibrarySelectorIcon = () => {
        if (this.disableLibrarySwitch || this._isLibrariesArrayEmpty() || this.showAllThemes) {
            return nothing;
        }

        const librarySelectorLabel = this.intl?.formatMessage({ id:'@brandlibrary:libraryselectorlabel', defaultMessage:'Select library' });
        const librarySelectorDescription = this.intl?.formatMessage({ id:'@brandlibrary:libraryselectordescription', defaultMessage:'Select a library' });

        // Check if both library selector and viewAll button will be visible
        const bothButtonsVisible = this._shouldShowViewAllButton();

        if (this.isMobile) {
            if (this.useContext === UseContext.libraryThemeEdit) {
                return nothing;
            }

            return html`<button
                role="menu"
                class="icon-button icon-button-libraries"
                aria-label=${librarySelectorLabel}
                aria-description=${librarySelectorDescription}
                tabindex="0"
                @click=${this._onLibrarySelectorClickMobile}
            >
                <x-icon-menu-drop-down></x-icon-menu-drop-down>
            </button>`;
        }

        return html`<overlay-trigger
            id="trigger"
            placement="bottom-start"
            offset="6"
            @sp-closed=${(event: Event) => {event.stopPropagation();}}
        >
            <button
                role="menu"
                class="${classMap({
        'icon-button': true,
        'icon-button-libraries': true,
        'align-right': this.variant === VARIANT.SWATCHES || (this.variant === VARIANT.THEMES && !bothButtonsVisible),
        'align-right-secondary': this.variant === VARIANT.THEMES && bothButtonsVisible
    })}"
                slot="trigger"
                aria-label=${librarySelectorLabel}
                aria-description=${librarySelectorDescription}
                tabindex="0"
            >
                <x-icon-menu-drop-down></x-icon-menu-drop-down>
            </button>
            <sp-popover
                id="libraries-list-popover"
                slot="click-content"
                direction="bottom-start"
                size="s"
            >
                <!--
                    These styles need to be a style tag as the popover gets moved into a different DOM context when
                    it is open and the styles from the component CSS don't apply.
                -->
                <style>
                    #libraries-list-popover {
                        padding: 0px;
                        max-width: 275px;
                        min-width: 275px;
                        min-height: 320px;
                    }
                </style>
                ${this._getLibrarySelectorHeader()}
                <ac-brand-libraries-selector
                    @ac-library-select=${this._handleLibraryChange}
                    .libraries=${this.libraries}
                    .selectedLibraryId=${this.selectedLibraryId}
                    ?is-tablet=${this.isTablet}
                ></ac-brand-libraries-selector>
                ${this._renderSharedBrandLibrariesLink()}
            </sp-popover>
        </overlay-trigger>`;
    };

    private _getIsLibraryWriteable = () => {
        return this.selectedLibrary ? this.selectedLibrary.isWritable : false ;
    };

    private _getIsBrand = () => {
        if (this.selectedLibrary?.roles?.[0]?.type === 'brand')
            return true;
        return false;
    };

    private _getBrandLibraryColorPickerColorSwatchListView = () => {
        const classes = {
            closed: !this.accordionOpen
        };
        if (!this.isSyncComplete && (this._isLibrariesArrayEmpty() || !this.swatches.length)) {
            return nothing;
        }
        if (this._isLibrariesArrayEmpty()) {
            return this._getEmptyBodyView();
        }

        if(!this.swatches.length && !this._getIsLibraryWriteable() && this.variant !== VARIANT.ALL) {
            return this._getReadOnlyEmptyBodyView();
        }

        if (!this.swatches.length && this.variant === VARIANT.ALL) {
            return nothing;
        }

        const libraryTypeLabel = this._getIsBrand() ?
            this.intl?.formatMessage({ id:'@brandlibrary:brand', defaultMessage:'Brand' })
            :
            this.intl?.formatMessage({id:'@brandlibrary:library',defaultMessage:'Library'});

        const swatchTypeLabel = this.intl?.formatMessage({ id:'@brandlibrary:additionalcolors', defaultMessage:'Your colors' });

        return html`<div class='swatch-list-array ${classMap(classes)}' >
            <ac-color-swatch-list
                ?enable-add-button=${this.isSyncComplete}
                ?hide-tooltip=${this.isMobile || this.useContext === UseContext.libraryThemeEdit}
                .selectedSwatch=${this.selectedSwatch}
                .relationship=${'primary'}
                .isBrand=${this._getIsBrand()}
                .headerText=${swatchTypeLabel}
                .swatchAriaLabel=${this.intl?.formatMessage({ id:'@brandlibrary:swatchlabel', defaultMessage:' {swatchType} {libraryType} color' }, { swatchType: swatchTypeLabel, libraryType: libraryTypeLabel })}
                .swatchAriaDescription=${this.intl?.formatMessage({id:'@brandlibrary:swatchdesc',defaultMessage:' {swatchType} {libraryType} color swatch'}, { swatchType: swatchTypeLabel, libraryType: libraryTypeLabel })}
                .addButtonAriaLabel=${this.intl?.formatMessage({id:'@brandlibrary:addlabel',defaultMessage:'Add {swatchType} {libraryType} color'}, { swatchType: swatchTypeLabel, libraryType: libraryTypeLabel })}
                .addButtonAriaDescription=${this.intl?.formatMessage({id:'@brandlibrary:adddesc',defaultMessage:'Add {swatchType} color to your {libraryType}'}, { swatchType: swatchTypeLabel, libraryType: libraryTypeLabel })}
                .showAddIcon=${!this.hideAddButton && this._getIsLibraryWriteable() && this.useContext !== UseContext.libraryThemeEdit}
                .swatchList=${this.swatches}>
            </ac-color-swatch-list>
        </div>`;
    };

    private _isLibrariesArrayEmpty = (): boolean => {
        return !(this.libraries && this.libraries.length > 0);
    };

    private _getLoadingIndicator = (size = 's') => {
        return when(!this.isSyncComplete, () => {
            html `<sp-progress-circle
                label="${this.intl?.formatMessage({id:'@brandlibrary:loadingLibraries',defaultMessage:'Loading libraries'})}"
                indeterminate
                size=${size}>
            </sp-progress-circle>`;
        });
    };

    private _getHeaderText = () => {
        return when(this._isLibrariesArrayEmpty() || !this.selectedLibraryId,
            () => html`<h4 class="brand-header-text">${this.intl?.formatMessage({id:'@brandlibrary:emptyheader',defaultMessage:'Your Brands'})}</h4>`,
            () => html`<h4 class="brand-header-text">${this.selectedLibrary?.name}</h4>`);
    };

    private _handleViewAllClick = () => {
        this.showAllThemes = !this.showAllThemes;

        const themesViewAllEvent = new CustomEvent('ac-theme-view-all', {
            bubbles: true,
            composed: true,
            detail: this.showAllThemes
        });

        this.dispatchEvent(themesViewAllEvent);
    };

    private _shouldShowLibrarySelector = (): boolean => {
        return this.variant === VARIANT.THEMES &&
               !this.disableLibrarySwitch &&
               !this._isLibrariesArrayEmpty() &&
               !this.showAllThemes;
    };

    private _shouldShowViewAllButton = (): boolean => {
        return this.variant === VARIANT.THEMES &&
               this.themes.length > MIN_VISIBLE_PALETTES &&
               !this.showAllThemes;
    };

    private _getHeader = () => {
        const showLibrarySelector = this._shouldShowLibrarySelector();
        const showViewAllButton = this._shouldShowViewAllButton();
        const bothButtonsVisible = showLibrarySelector && showViewAllButton;

        return html`<div
            @click=${this.toggleAccordion}
            class=${classMap({'library-header-info': true, 'no-margin': this.variant === VARIANT.THEMES})}
        >
            ${when(this.variant === VARIANT.THEMES && this.showAllThemes, () => html`
                <button
                    class="btn-cta icon-chevron-left"
                    @click=${this._handleViewAllClick}
                >
                    <sp-icon-chevron-right></sp-icon-chevron-right>
                </button>`)}
            ${this._getLibraryTypeIcon(this.selectedLibrary)}
            ${this._getLoadingIndicator()}
            ${this._getHeaderText()}
            ${this._getUserTypeIcon()}
            ${when(showLibrarySelector, () => this._getLibrarySelectorIcon())}
            ${when(showViewAllButton, () => html`
                <button
                    class="${classMap({'btn-cta': true, 'align-right': !bothButtonsVisible, 'align-right-with-library': bothButtonsVisible})}"
                    @click=${this._handleViewAllClick}
                >
                    ${this.intl?.formatMessage({ id: '@globaltheme:viewall', defaultMessage: 'View all' })} <sp-icon-chevron-right></sp-icon-chevron-right>
                </button>`)}
        </div>`;
    };

    connectedCallback(): void {
        super.connectedCallback();
        if(!this.intl) {
            this.initialiseLocales().catch(err => console.log(err));
        }
    }

    initialiseLocales = async () => {
        this.intl = await new intlStore().init({
            localeUrlMap,
            locale: this.locale
        });
    };

    private _handleLibraryChange = (event: CustomEvent) => {
        event.stopPropagation();

        const libraryChangeEvent = new CustomEvent('ac-library-select', {
            bubbles: true,
            composed: true,
            detail: {
                libraryID: event.detail.libraryID
            }
        });
        this.dispatchEvent(libraryChangeEvent);
    };

    private _getThemesView = () => {
        if (!this.isSyncComplete && (this._isLibrariesArrayEmpty() || !this.themes.length)) {
            return nothing;
        }
        if (this._isLibrariesArrayEmpty() && this.variant !== VARIANT.ALL) {
            return this._getEmptyBodyView();
        } else if (this._isLibrariesArrayEmpty() && this.variant === VARIANT.ALL) {
            return nothing;
        }

        // Do not allow adding theme and colors to a library for this context and show an empty message when library is empty
        if (this.useContext === UseContext.libraryThemeEdit) {
            if (this.variant === VARIANT.ALL && this.isSyncComplete && this.swatches.length === 0 && this.themes.length === 0) {
                return html`<div class="empty-view">
                    ${this.intl?.formatMessage(
        {
            id: '@brandlibrary:theme.nocolors',
            defaultMessage: 'This {library} currently has no color swatches to display.'
        },
        { library: this._getIsBrand() ?
            this.intl?.formatMessage({ id:'@brandlibrary:brand', defaultMessage:'Brand' })
            :
            this.intl?.formatMessage({ id:'@brandlibrary:library', defaultMessage:'Library' }) })}
                </div>`;
            }
        }

        return html`<brands-libraries-themes
            use-context=${this.useContext}
            ?expand=${this.showAllThemes || this.variant === VARIANT.ALL}
            ?is-brand=${this._getIsBrand()}
            ?is-library-read-only=${!this._getIsLibraryWriteable()}
            ?is-sync-complete=${this.isSyncComplete}
            ?is-mobile=${this.isMobile}
            ?no-libraries=${this._isLibrariesArrayEmpty()}
            .intl=${this.intl}
            .selectedLibraryId=${this.selectedLibraryId}
            .selectedSwatch=${this.selectedSwatch}
            .themes=${this.themes}
            .view=${this.variant === VARIANT.ALL ? 'swatch-group' : 'palettes'}
        >
        </brands-libraries-themes>`;
    };

    private _getBrandPalettesMobile = () => {
        if (!this.isSyncComplete && (this._isLibrariesArrayEmpty() || !this.themes.length)) {
            return this._getLoadingIndicator('m');
        }

        const moreLabel = this.intl?.formatMessage({ id: '@globaltheme:more', defaultMessage: 'More' }),
            lessLabel = this.intl?.formatMessage({ id: '@globaltheme:less', defaultMessage: 'Less' }),
            selectLibraryLabel = this.intl?.formatMessage({ id: '@brandlibrary:switch', defaultMessage: 'Switch' }),
            createBrandLabel = this.intl?.formatMessage({ id: '@brandlibrary:create.brand', defaultMessage: 'Create Brand' }),
            createThemeLabel = this.intl?.formatMessage({ id: '@brandlibrary:add', defaultMessage: 'Add' });

        return html`${when(this.themes?.length > 0, () => html`<color-palette-list
                ?showAll=${this.themes?.length <= 3}
                .isMobile=${true}
                .palettelist=${{palettes: this.themes}}
                less-label=${lessLabel}
                more-label=${moreLabel}
            ></color-palette-list>`, () => nothing)}
            <div class='brand-palette-buttons'>
            ${when(!this._isLibrariesArrayEmpty() && this.themes.length === 0,
        () => html`<button class='more-less-cta' @click=${this._handleCreateNewTheme} aria-label=${createThemeLabel}>
                        <x-icon-add></x-icon-add>
                    </div>`)}
            ${when(this._isLibrariesArrayEmpty(),
        () => html`<button class='more-less-cta' @click=${this._onCreateBrand} aria-label=${createBrandLabel}>
                    <x-icon-brand-add></x-icon-brand-add>
                </div>`,
        () => html`<button class='more-less-cta' @click=${this._onLibrarySelectorClickMobile} aria-label=${selectLibraryLabel}>
                    <x-icon-menu-drop-down></x-icon-menu-drop-down>
                </div>`)}
            </div>
            `;
    };

    render() {
        const accordionAriaLabel = this.accordionOpen ?
            this.intl?.formatMessage({ id: '@brandlibrary:hidelabel', defaultMessage: 'Hide library' })
            :
            this.intl?.formatMessage({ id: '@brandlibrary:showlabel', defaultMessage: 'Show library' });
        const accordionAriaDescription = this.accordionOpen ?
            this.intl?.formatMessage({ id: '@brandlibrary:hidelabeldescription', defaultMessage: 'Hide library contents' })
            :
            this.intl?.formatMessage({ id: '@brandlibrary:showlabeldescription', defaultMessage: 'Show library contents' });

        return html`
            <div class="brand-content">
                ${choose(this.variant, [
        [VARIANT.SWATCHES, () => html`${this._getLibrarySelectorIcon()}
                        ${when(!this.disableAccordion, () => html`<details open class="container">
                            <summary class="header" tabindex="-1">
                                <sp-icon
                                    @click=${this.toggleAccordion}
                                    class="icon"
                                    role="button"
                                    tabindex="0"
                                    size="m"
                                    label=${accordionAriaLabel}
                                    aria-label=${accordionAriaLabel}
                                    aria-description=${accordionAriaDescription}
                                >
                                    <sp-icon-chevron-right></sp-icon-chevron-right>
                                </sp-icon>
                                ${this._getHeader()}
                            </summary>
                            ${this._getBrandLibraryColorPickerColorSwatchListView()}
                        </details>`, () => html`
                        <section class="container">
                            <div class="header">
                                ${this._getHeader()}
                            </div>
                            ${this._getBrandLibraryColorPickerColorSwatchListView()}
                        </section>`)}`,
        ],
        [VARIANT.THEMES, () => html`<section class="container">
                            <div class="header">
                                ${this._getHeader()}
                            </div>
                            ${this._getThemesView()}
                        </section>`],
        [VARIANT.THEMES_MOBILE, () => html`<section class="container container-inline">
                            ${this._getBrandPalettesMobile()}
                    </section>`],
        [VARIANT.ALL, () => html`${this._getLibrarySelectorIcon()}
                        ${when(!this.disableAccordion, () => html`<details open class="container">
                            <summary class="header" tabindex="-1">
                                <sp-icon
                                    @click=${this.toggleAccordion}
                                    class="icon"
                                    role="button"
                                    tabindex="0"
                                    size="m"
                                    label=${accordionAriaLabel}
                                    aria-label=${accordionAriaLabel}
                                    aria-description=${accordionAriaDescription}
                                >
                                    <sp-icon-chevron-right></sp-icon-chevron-right>
                                </sp-icon>
                                ${this._getHeader()}
                            </summary>
                            ${this._getThemesView()}
                            ${this._getBrandLibraryColorPickerColorSwatchListView()}
                        </details>`, () => html`
                        <section class="container">
                            <div class="header">
                                ${this._getHeader()}
                            </div>
                            ${this._getThemesView()}
                            ${this._getBrandLibraryColorPickerColorSwatchListView()}
                        </section>`)}`]
    ]
    )}
            </div>
        `;
    }

    public override focus(focusOptions: FocusOptions = {}): void {
        super.focus(focusOptions);
        this.forwardFocus();
    }

    private forwardFocus = (): void => {
        if (this._librariesButton) {
            this._librariesButton.focus();
            return;
        }
        if (this._accordionButton) {
            this._accordionButton.focus();
        }
    };

}

export default BrandLibrariesPicker;
