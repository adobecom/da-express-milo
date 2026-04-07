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


import { html, LitElement, nothing } from '../../../../deps/lit.js';
import { customElement, property, state, queryAll, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';

import { style } from './theme-panel-mobile.css';

interface Palettes {
    length?: number;
    name: string;
    palettes: []
}

const scrollBehavior: ScrollBehavior = 'smooth';

/**
 * @summary Render list of palette along with the ActivePalette. List of palette are horizontally scrollable
 * and will scroll category labels with respect to the direction of user scroll.
 * @tag global-colors-ui-mobile
 * @props palettes - List of palettes. It can be default palettes or search results
 * @props isShowingDefaultPalettes - Control UI of some elements depending upon whether default palettes or search palettes are visible.
 * @props isFetching - Control visibility of progress loader
 * @slot active-palette - Slot for the active palette to display at the start of the List
 */
@customElement('global-colors-ui-mobile')
class GlobalColorsUIMobile extends LitElement {
    static styles = [style];
    protected minVisiblePalettes = 3;
    scrollTimeout: null | ReturnType<typeof setTimeout> | number = null;

    @property({ type: Array })
        palettes: (Palettes[] | []) = [];

    @property({ type: Object })
        intl;

    @property({ type: Boolean, attribute: 'show-category-label' })
        showCategoryLabel = false;

    @property({ type: Boolean })
        isShowingDefaultPalettes;

    @property({ type: Boolean, attribute: 'show-active-palette' })
        showActivePalette = false;

    @property({ type: Boolean, attribute: 'show-brand-themes' })
        showBrandThemes = false;

    @property({ type: Boolean, attribute: 'show-all-curated-palettes' })
        showAllCuratedPalettes = false;

    @property({ type: Boolean })
        isFetching = false;

    private shouldScrollLabels = false;

    @property({ type: String, attribute: 'search-query' })
        searchQuery = '';

    @queryAll('.property-group')
    private _groupContainerEls!: HTMLDivElement[];

    @queryAll('.category-label')
    private _groupButtonEls!: HTMLDivElement[];

    @query('#scroll-area-container')
    private _scrollAreaContainer!: HTMLElement;

    @state()
    private _activeGroupIndex = 0;

    @state()
        isScrolling = false;

    private _handleGroupButtonClick(index: number) {
        this._activeGroupIndex = index;
        this.isScrolling = true;
        clearTimeout(this.scrollTimeout);
        this._groupContainerEls[index].scrollIntoView({
            behavior: scrollBehavior,
            block: 'nearest',
            inline: 'start'
        });

        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, 2000);
    }

    private _handleScroll = (event: CustomEvent) => {
        if(this._scrollAreaContainer)
            this.isScrolling = true;
        clearTimeout(this.scrollTimeout);
        if(event.detail.showAllMobile) {
            this._scrollAreaContainer.scrollTo({
                behavior: scrollBehavior,
                left: this._scrollAreaContainer.scrollLeft + 30
            });
        } else {
            this._groupContainerEls[event.detail.id].scrollIntoView({
                behavior: scrollBehavior,
                block: 'nearest',
                inline: 'start'
            });
        }
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, 2000);
    };


    _getCategoryLabelCarousel = () => {
        if (!this.isShowingDefaultPalettes || !this.showCategoryLabel) {
            return nothing;
        }
        const startIndex = this.isShowingDefaultPalettes ? Number(this.showActivePalette) + Number(this.showBrandThemes) : 0;

        return html`<div class="scroll-area scroll-area-categories" id="label-scroll-area">
            ${when(this.showActivePalette, () => html`<div
                        class=${classMap({ 'category-label': true, 'active': this._activeGroupIndex === 0 })}
                        @click=${() => this._handleGroupButtonClick(0)}
                    >
                        ${this.intl?.formatMessage({ id: '@globaltheme:pagetheme', defaultMessage: 'Page theme' })}
                </div>`)}
            ${when(this.showBrandThemes, () => html`<div
                        class=${classMap({ 'category-label': true, 'active': this._activeGroupIndex === startIndex - 1 })}
                        @click=${() => this._handleGroupButtonClick(startIndex - 1)}
                    >
                        ${this.intl?.formatMessage({ id: '@brandlibrary:brandslibraries', defaultMessage: 'Brands & Libraries' })}
                </div>`)}
            ${this.palettes.map((palette, index: number) => html`<div>
                    <div
                        class=${classMap({ 'category-label': true, 'active': this._activeGroupIndex === index + startIndex })}
                        @click=${() => this._handleGroupButtonClick(index + startIndex)}
                    >
                        ${palette.name}
                    </div>
            </div>` )}
        </div>`;
    };

    handleIntersection = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const visibleIndex = Number(entry.target.getAttribute('data-index'));
                    //@description - everytime the default palettes are rendered for the first time,
                    //the categor-labels should not scroll, they should only scroll when new palettes enter the viewport
                    //@jira - CCEX-114780
                    if(!this.isScrolling && this.isShowingDefaultPalettes && this.shouldScrollLabels) {
                        this._activeGroupIndex = visibleIndex;

                        this._groupButtonEls[visibleIndex].scrollIntoView({
                            behavior: 'auto',
                            block: 'nearest',
                            inline: 'center'
                        });
                    }
                    this.shouldScrollLabels = true;
                }
            });
        }, { root: this._scrollAreaContainer, threshold: 0, rootMargin: '0px -50%' });

        this._groupContainerEls.forEach(groupNodeEle => {
            observer.observe(groupNodeEle);
        });
    };

    protected updated(changedProperties): void {
        changedProperties.forEach((_oldValue, propName) => {
            if (propName === 'isShowingDefaultPalettes' && this.isShowingDefaultPalettes !== undefined) {
                //@description - everytime the default palettes are rendered for the first time,
                //the categor-labels should not scroll, they should only scroll when new palettes enter the viewport
                //@jira - CCEX-114780
                if(this.isShowingDefaultPalettes === true) {
                    this.shouldScrollLabels = false;
                }
                this.handleIntersection();
            }
        });
    }

    render() {
        if (this.isFetching) {
            return html`<progress-circle></progress-circle>`;
        }

        const moreLabel = this.intl?.formatMessage({ id: '@globaltheme:more', defaultMessage: 'More' }),
            lessLabel = this.intl?.formatMessage({ id: '@globaltheme:less', defaultMessage: 'less' });

        if (!this.isShowingDefaultPalettes && this.palettes[0].palettes.length === 0) {
            const noSearchResultsHeading = this.intl?.formatMessage({ id: '@globaltheme:noresultsheading', defaultMessage: 'Sorry, no color themes were found' }),
                noSearchResultsDesc = this.intl?.formatMessage({ id: '@globaltheme:noresultsdescription', defaultMessage: 'Please check your spelling or try different keywords' });

            return html`<no-search-results-message
                no-search-heading-label=${noSearchResultsHeading}
                no-search-desc-label=${noSearchResultsDesc}
                ?mobile=${true}
            ></no-search-results-message>`;
        }
        const startIndex = this.isShowingDefaultPalettes ? Number(this.showActivePalette) + Number(this.showBrandThemes) : 0;

        return html`
            <div class="palettes-list-content">
                <section class="scroll-area-content">
                    <section id="scroll-area-container" class='scroll-area'>
                        ${this.isShowingDefaultPalettes && this.showActivePalette ? html`<slot class="property-group" data-index=${0} name="active-palette"></slot>` : nothing}
                        ${this.isShowingDefaultPalettes && this.showBrandThemes ? html`<slot @ac-view-all-palette-toggle = ${this._handleScroll} class="property-group" data-index=${startIndex - 1} name="brand-themes"></slot>` : nothing}
                        ${this.palettes.map((palettelist, index: number) => html`
                            <div class="property-group" data-index=${index+startIndex}>
                                <color-palette-list
                                    data-testid=${`themes-panel-color-palette-list`}
                                    ?showAll=${!this.isShowingDefaultPalettes || this.showAllCuratedPalettes}
                                    .isMobile=${true}
                                    .palettelist=${palettelist}
                                    .minVisiblePalettes=${this.minVisiblePalettes}
                                    .searchQuery=${this.searchQuery}
                                    id=${index+startIndex}
                                    ?hide-list-header=${true}
                                    @ac-view-all-palette-toggle = ${this._handleScroll}
                                    less-label=${lessLabel}
                                    more-label=${moreLabel}
                                    search-results-label=${this.showAllCuratedPalettes ? '' : this.intl?.formatMessage({ id: '@globaltheme:search.results', defaultMessage: `${palettelist.palettes.length} results for ${palettelist.name}` }, { count: palettelist.palettes.length, label: palettelist.name })}
                                ></color-palette-list>
                            </div>
                        `)}
                    </section>
                    ${this._getCategoryLabelCarousel()}
                </section>
            </div>
        `;
    }

}

export default GlobalColorsUIMobile;
