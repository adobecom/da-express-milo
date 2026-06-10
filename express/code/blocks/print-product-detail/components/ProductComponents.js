import {
  html,
  useEffect,
  useRef,
  useState,
  Fragment,
  useCallback,
} from '../../../scripts/vendors/htm-preact.min.js';
import { useStore, useDrawer } from './Contexts.js';
import axAccordionDecorate from '../../ax-accordion/ax-accordion.js';
import { formatLargeNumberToK, sanitizeHtml } from '../utilities/utility-functions.js';
import createSimpleCarousel from '../../../scripts/widgets/simple-carousel.js';

function mapToAccordionFormat(descriptions) {
  if (!descriptions || !Array.isArray(descriptions)) {
    return [];
  }
  return descriptions.map((item) => ({
    title: item.attributeTitle,
    content: item.descriptionHTML,
  }));
}

export function ProductDetails() {
  const { state } = useStore();
  const accordionRef = useRef(null);
  const previousDescriptionsRef = useRef(null);
  useEffect(() => {
    if (!state || !accordionRef.current) {
      return;
    }
    const descriptions = state.descriptionComponents;
    if (!descriptions) {
      return;
    }
    const accordionData = mapToAccordionFormat(descriptions);
    if (!accordionRef.current.accordionData) {
      accordionRef.current.accordionData = accordionData;
      axAccordionDecorate(accordionRef.current);
    } else {
      const previousDescriptions = previousDescriptionsRef.current;
      if (previousDescriptions !== descriptions && accordionRef.current.updateAccordion) {
        let forceExpandTitle = null;
        if (previousDescriptions && Array.isArray(previousDescriptions)) {
          const prevTitles = previousDescriptions.map((entry) => entry.attributeTitle);
          const currentTitles = descriptions.map((entry) => entry.attributeTitle);
          const changedIndex = currentTitles
            .findIndex((title, index) => prevTitles[index] !== title);
          if (changedIndex >= 0) {
            forceExpandTitle = descriptions[changedIndex].attributeTitle;
          }
        }
        accordionRef.current.updateAccordion(accordionData, forceExpandTitle);
      }
    }
    previousDescriptionsRef.current = descriptions;
  }, [state]);

  if (!state) {
    return null;
  }

  return html`
    <div class="pdpx-product-details-section">
      <div class="pdpx-product-details-section-title-container">
        <span class="pdpx-product-details-section-title">Product Details</span>
      </div>
      <div ref=${accordionRef} class="ax-accordion pdpx-product-details-accordion"></div>
    </div>
  `;
}

export function ProductHeader() {
  const { state } = useStore();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const showTooltip = useCallback(() => setTooltipVisible(true), []);
  const hideTooltip = useCallback(() => setTooltipVisible(false), []);

  if (!state) {
    return null;
  }

  const { title, pricing, shippingEstimate, reviewsStats } = state;
  const reviewsCount = reviewsStats?.count || 0;
  const reviewsRating = reviewsStats?.rating || 0;
  const formattedRating = reviewsRating ? Math.round(reviewsRating * 10) / 10 : '';
  const formattedCount = reviewsCount ? formatLargeNumberToK(reviewsCount) : '';

  return html`
    <div class="pdpx-product-info-heading-section-wrapper">
      <div class="pdpx-product-info-heading-section-container">
        <div class="pdpx-title-and-ratings-container">
          <div class="pdpx-product-title-container">
            <h1 class="pdpx-product-title global-Typography-Size-Headings-Heading-L" id="pdpx-product-title">${title}</h1>
          </div>
          ${reviewsRating > 0 && html`
            <div class="pdpx-product-ratings-lockup-container">
              <div class="pdpx-star-ratings" role="img" aria-label="${formattedRating} out of 5 stars">
                ${Array.from({ length: 5 }).map(() => html`
                  <img class="pdpx-product-info-header-ratings-star" src="/express/code/icons/star-sharp.svg" alt="" aria-hidden="true" />
                `)}
              </div>
              <div class="pdpx-ratings-number-container">
                <span class="pdpx-ratings-number" id="pdpx-ratings-number" aria-hidden="true">${formattedRating}</span>
              </div>
              <div class="pdpx-ratings-amount-container">
                <span class="pdpx-ratings-amount" id="pdpx-ratings-amount" aria-label="${formattedCount} reviews">${formattedCount}</span>
              </div>
            </div>
          `}
        </div>
        <div class="pdpx-price-info-container">
          <div class="pdpx-price-info-row">
            <span class="pdpx-price-label" id="pdpx-price-label">${pricing.totalPrice}</span>
            ${pricing.originalTotalPrice !== pricing.totalPrice && html`
              <span class="pdpx-compare-price-label" id="pdpx-compare-price-label">${pricing.originalTotalPrice}</span>
            `}
            ${pricing.showCompValue && html`
              <span class="pdpx-compare-price-info-label">Comp. value</span>
              <div class="pdpx-compare-price-info-icon-container">
                <button
                  class="pdpx-compare-price-info-icon-button"
                  type="button"
                  aria-label="Compare value information"
                  aria-expanded="${tooltipVisible}"
                  aria-describedby="${tooltipVisible ? 'pdpx-info-tooltip-content' : undefined}"
                  onMouseEnter=${showTooltip}
                  onMouseLeave=${hideTooltip}
                  onClick=${showTooltip}
                >
                  <img class="pdpx-compare-price-info-icon" src="/express/code/icons/info.svg" alt="" aria-hidden="true" />
                </button>
                ${tooltipVisible && html`
                  <div class="pdpx-info-tooltip-content" id="pdpx-info-tooltip-content" role="tooltip" style="display: block;">
                    <h6 class="pdpx-info-tooltip-content-title" id="pdpx-info-tooltip-content-title">Compare Value</h6>
                    <p class="pdpx-info-tooltip-content-description" id="pdpx-info-tooltip-content-description-1">
                      The compare value is the estimated retail value of a similar product purchased elsewhere.
                    </p>
                    <p class="pdpx-info-tooltip-content-description" id="pdpx-info-tooltip-content-description-2">
                      Your price may vary based on the options you select.
                    </p>
                  </div>
                `}
              </div>
            `}
          </div>
          ${pricing.discountLabel && html`
            <span class="pdpx-savings-text" id="pdpx-savings-text">${pricing.discountLabel}</span>
          `}
        </div>
      </div>
      ${shippingEstimate && html`
        <div class="pdpx-delivery-estimate-pill">
          <img class="pdpx-delivery-estimate-pill-icon" src="/express/code/icons/delivery-truck.svg" alt="" aria-hidden="true" />
          <span class="pdpx-delivery-estimate-pill-text" id="pdpx-delivery-estimate-pill-text">Estimated Delivery</span>
          <span class="pdpx-delivery-estimate-pill-date" id="pdpx-delivery-estimate-pill-date">${shippingEstimate}</span>
        </div>
      `}
    </div>
  `;
}

function updateImageUrl(url, maxDim = 644) {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('max_dim', String(maxDim));
    return urlObj.toString();
  } catch {
    return url;
  }
}

export function ProductImages() {
  const { state, actions } = useStore();
  const containerRef = useRef(null);
  const carouselCleanupRef = useRef(null);
  const hasPreloadedRef = useRef(false);

  if (!state || !state.selectedRealview) {
    return null;
  }

  const { realviews = [], selectedRealview } = state;
  const heroImageUrl = updateImageUrl(selectedRealview.url, 644);

  // Preload the hero image on first render so the browser starts fetching immediately
  if (!hasPreloadedRef.current && heroImageUrl) {
    hasPreloadedRef.current = true;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = heroImageUrl;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
  }

  const handleThumbnailClick = (realview) => {
    actions.selectRealview(realview.id);
  };

  // Build thumbnails imperatively to work with createSimpleCarousel
  useEffect(() => {
    if (!containerRef.current || !realviews.length) return undefined;

    const container = containerRef.current;
    container.innerHTML = '';

    realviews.forEach((realview) => {
      const thumbnailUrl = updateImageUrl(realview.url, 76);
      const isSelected = realview.id === selectedRealview.id;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = `pdpx-image-thumbnail-carousel-item ${isSelected ? 'selected' : ''}`;
      button.setAttribute('data-image-type', realview.id);
      button.addEventListener('click', () => handleThumbnailClick(realview));

      const img = document.createElement('img');
      img.className = 'pdpx-image-thumbnail-carousel-item-image';
      img.src = thumbnailUrl;
      img.alt = realview.title;
      img.setAttribute('data-image-type', realview.id);
      button.appendChild(img);

      container.appendChild(button);
    });

    createSimpleCarousel('.pdpx-image-thumbnail-carousel-item', container, {
      ariaLabel: 'Product image thumbnails',
      centerActive: true,
      activeClass: 'selected',
    }).then((carousel) => {
      if (carousel) {
        carouselCleanupRef.current = carousel.cleanup;
      }
    });

    return () => {
      if (carouselCleanupRef.current) {
        carouselCleanupRef.current();
        carouselCleanupRef.current = null;
      }
    };
  }, [realviews.map((r) => `${r.id}:${r.url}`).join(',')]);

  // Update selected state when selection changes
  useEffect(() => {
    if (!containerRef.current) return;
    const buttons = containerRef.current.querySelectorAll('.pdpx-image-thumbnail-carousel-item');
    buttons.forEach((btn) => {
      const id = btn.getAttribute('data-image-type');
      const isSelected = id === selectedRealview.id;
      btn.classList.toggle('selected', isSelected);
    });
  }, [selectedRealview.id]);

  return html`
    <div class="pdpx-product-images-container" id="pdpx-product-images-container">
      <div class="pdpx-product-hero-image-container">
        <img
          class="pdpx-product-hero-image"
          id="pdpx-product-hero-image"
          src="${heroImageUrl}"
          alt="${selectedRealview.title}"
          fetchpriority="high"
          decoding="async"
          loading="eager"
          data-image-type="${selectedRealview.id}"
        />
      </div>
      <div
        class="pdpx-image-thumbnail-carousel-container"
        id="pdpx-image-thumbnail-carousel-container"
        ref=${containerRef}
      >
      </div>
    </div>
  `;
}

const TASK_ID_MAP = {
  zazzle_shirt: 'tshirt',
  zazzle_businesscard: 'businesscard',
};

function buildCheckoutUrl(templateId, expressProductSettings, productType) {
  const taskId = TASK_ID_MAP[productType] || '';
  const baseUrl = `https://new.express.adobe.com/design-remix/template/${templateId}`;
  const params = new URLSearchParams({
    category: 'templates',
    taskId,
    loadPrintAddon: 'true',
    print: 'true',
    action: 'customize-and-print-zazzle-iframe',
    source: 'a.com-print-and-deliver-seo',
    entryPoint: 'a.com-print-and-deliver-seo',
    mv: 'other',
    url: 'express/print',
  });
  const encodedProductSettings = encodeURIComponent(expressProductSettings);
  return `${baseUrl}?${params.toString()}&productSettings=${encodedProductSettings}`;
}

const VALID_COUNTRIES = ['us', 'gb'];
const OUT_OF_REGION_TEXT = 'Print with Adobe Express isn\u2019t available yet in your region. Check back soon!';

export function CheckoutButton({ templateId }) {
  const { state } = useStore();
  const [outOfRegion, setOutOfRegion] = useState(null);
  const promoBarRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let active = true;
    import('../../../scripts/utils/location-utils.js')
      .then(({ getCountry }) => getCountry())
      .then((country) => {
        if (active) setOutOfRegion(!VALID_COUNTRIES.includes(country));
      })
      .catch((err) => {
        window.lana?.log(`print-product-detail: country detection failed: ${err.message}`, { tags: 'print-product-detail', severity: 'warning' });
        if (active) setOutOfRegion(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!state || !containerRef.current) return undefined;
    const wrapper = document.querySelector('.pdpx-product-info-wrapper');
    const sentinel = document.getElementById('pdpx-checkout-button-sentinel-div');
    if (!wrapper || !sentinel) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          containerRef.current?.classList.add('hide-gradient');
        } else {
          containerRef.current?.classList.remove('hide-gradient');
        }
      },
      { root: wrapper, threshold: 1.0, rootMargin: '0px 0px -48px 0px' },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [state, outOfRegion]);

  useEffect(() => {
    if (!outOfRegion || !promoBarRef.current) return;
    const container = promoBarRef.current;

    const promoBar = document.createElement('div');
    promoBar.className = 'sticky-promo-bar rounded';

    const textWrapper = document.createElement('div');
    const textSpan = document.createElement('span');
    textSpan.className = 'pdpx-checkout-button-cta-text-container';
    textSpan.textContent = OUT_OF_REGION_TEXT;
    textWrapper.appendChild(textSpan);
    promoBar.appendChild(textWrapper);

    container.appendChild(promoBar);

    import('../../../scripts/utils.js').then(({ getLibs }) => import(`${getLibs()}/utils/utils.js`)).then(({ loadStyle, getConfig }) => {
      const { codeRoot } = getConfig();
      loadStyle(`${codeRoot}/blocks/sticky-promo-bar/sticky-promo-bar.css`, () => {
        import('../../sticky-promo-bar/sticky-promo-bar.js').then(({ default: stickyPromoBar }) => {
          stickyPromoBar(promoBar);
        });
      });
    }).catch((error) => {
      window.lana?.log(`Failed to load sticky-promo-bar: ${error}`, { tags: 'print-product-detail', severity: 'warning' });
    });
  }, [outOfRegion]);

  if (outOfRegion === null) return null;

  const defaultUrl = `https://new.express.adobe.com/design-remix/template/${templateId}`;
  const checkoutUrl = state?.expressProductSettings
    ? buildCheckoutUrl(templateId, state.expressProductSettings, state.productType)
    : defaultUrl;

  if (outOfRegion) {
    return html`
      <div class="pdpx-checkout-button-container pdpx-checkout-button-disabled" ref=${promoBarRef}>
      </div>
    `;
  }

  return html`
    <div class="pdpx-checkout-button-container" ref=${containerRef}>
      <a
        class="pdpx-checkout-button"
        id="pdpx-checkout-button"
        href="${checkoutUrl}"
      >
        <img class="pdpx-checkout-button-icon" src="/express/code/icons/print-icon.svg" alt="" aria-hidden="true" />
        <span class="pdpx-checkout-button-text">Customize and print it</span>
      </a>
      <div class="pdpx-checkout-button-subhead">
        <img class="pdpx-checkout-button-subhead-image" src="/express/code/icons/powered-by-zazzle.svg" alt="powered by zazzle" />
        <a class="pdpx-checkout-button-subhead-link" href="https://www.zazzle.com/returns">Returns guaranteed</a>
        <span class="pdpx-checkout-button-subhead-text">through 100% satisfaction promise.</span>
      </div>
    </div>
  `;
}

function SizeChartTable({ measurementTypes, attributeValues }) {
  if (!measurementTypes?.length || !attributeValues?.length) {
    return null;
  }

  const headerLabel = measurementTypes[0]?.key?.startsWith('garment')
    ? 'Garment (IN)' : 'Body (IN)';

  return html`
    <div class="size-chart-table-section">
      <table class="size-chart-table">
        <caption class="sr-only">${headerLabel} size chart</caption>
        <thead>
          <tr>
            <th class="size-chart-table-header" scope="col">${headerLabel}</th>
            ${measurementTypes.map((type) => html`
              <th key="${type.key}" scope="col">${type.label}</th>
            `)}
          </tr>
        </thead>
        <tbody>
          ${attributeValues.map((row) => html`
            <tr key="${row.attributeValueLabel}">
              <th scope="row">${row.attributeValueLabel}</th>
              ${measurementTypes.map((type) => {
    const measurement = row.measurements?.[type.key];
    return html`
                  <td key="${type.key}">${measurement?.imperial || '—'}</td>
                `;
  })}
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  `;
}

function SizeChartContent() {
  const { actions } = useStore();
  const [chart, setChart] = useState(null);
  const [error, setError] = useState(null);
  const { fetchSizeChart } = actions;
  useEffect(() => {
    let active = true;
    fetchSizeChart()
      .then((data) => {
        if (active) {
          setChart(data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err);
        }
        window.reportError?.(err);
      });
    return () => {
      active = false;
    };
  }, [fetchSizeChart]);

  if (error) {
    return html`<div class="pdpx-size-chart-error">Unable to load size chart. Please try again later.</div>`;
  }

  if (!chart) {
    return html`<div class="pdpx-size-chart-loading" data-skeleton="true" style="height: 200px;"></div>`;
  }

  const { measurementTypes = [], attributeValues = [] } = chart.sizeChart || {};
  const bodyTypes = measurementTypes.filter((t) => t.key.startsWith('body'));
  const garmentTypes = measurementTypes.filter((t) => !t.key.startsWith('body'));

  return html`
    <div class="pdpx-drawer-body pdpx-size-chart-container drawer-body--size-chart">
      <h2 class="size-chart-product-name">${chart.title || 'Size chart'}</h2>
      <div class="size-chart-table-container">
        <div class="size-chart-tables">
          ${bodyTypes.length > 0 && html`
            <${SizeChartTable}
              measurementTypes=${bodyTypes}
              attributeValues=${attributeValues}
            />
          `}
          ${garmentTypes.length > 0 && html`
            <${SizeChartTable}
              measurementTypes=${garmentTypes}
              attributeValues=${attributeValues}
            />
          `}
        </div>
      </div>
      <div class="size-chart-instructions">
        ${bodyTypes.length > 0 && html`
          <div class="size-chart-instruction-section">
            <h3>Body</h3>
            ${bodyTypes.map((type) => html`
              <p key="${type.key}" class="size-chart-instruction-text">
                ${type.extraDescription || type.label}
              </p>
            `)}
          </div>
        `}
        ${garmentTypes.length > 0 && html`
          <div class="size-chart-instruction-section">
            <h3>Garment</h3>
            ${garmentTypes.map((type) => html`
              <p key="${type.key}" class="size-chart-instruction-text">
                ${type.extraDescription || type.label}
              </p>
            `)}
          </div>
        `}
        ${chart.fitStyle && html`
          <div class="size-chart-instruction-section">
            <h3>Fit</h3>
            <p class="size-chart-instruction-text">${chart.fitStyle}</p>
          </div>
        `}
      </div>
    </div>
  `;
}

function PrintingProcessContent() {
  return html`
    <div class="pdpx-drawer-body">
      <div class="pdpx-printing-process-options-container">
        <div class="pdpx-printing-process-option-container">
          <div class="pdpx-printing-process-option-image-container">
            <img
              class="pdpx-printing-process-option-image"
              src="https://asset.zcache.com/assets/graphics/pd/productAttributeHelp/underbasePrintProcess/Classic.jpg"
              alt="Classic Printing"
            />
          </div>
          <div class="pdpx-printing-process-option-info-container">
            <span class="pdpx-printing-process-option-info-title">Classic printing: no underbase</span>
            <p class="pdpx-printing-process-option-info-description">
              Best for lighter colored garments. The design is printed directly onto the garment using CMYK inks only.
            </p>
            <div class="pdpx-printing-process-option-color-lockup">
              <img class="icon icon-cmyk_droplet_cyan" src="/express/code/icons/cmyk_droplet_cyan.svg" alt="cyan" />
              <img class="icon icon-cmyk_droplet_magenta" src="/express/code/icons/cmyk_droplet_magenta.svg" alt="magenta" />
              <img class="icon icon-cmyk_droplet_yellow" src="/express/code/icons/cmyk_droplet_yellow.svg" alt="yellow" />
              <img class="icon icon-cmyk_droplet_black" src="/express/code/icons/cmyk_droplet_black.svg" alt="black" />
              CMYK
            </div>
          </div>
        </div>
        <div class="pdpx-printing-process-option-container">
          <div class="pdpx-printing-process-option-image-container">
            <img
              class="pdpx-printing-process-option-image"
              src="https://asset.zcache.com/assets/graphics/pd/productAttributeHelp/underbasePrintProcess/Vivid.jpg"
              alt="Vivid Printing"
            />
          </div>
          <div class="pdpx-printing-process-option-info-container">
            <span class="pdpx-printing-process-option-info-title">Vivid printing: with underbase</span>
            <p class="pdpx-printing-process-option-info-description">
              Best for darker colored garments. A white underbase is printed first, then the design is printed on top using CMYK inks for vivid color reproduction.
            </p>
            <div class="pdpx-printing-process-option-color-lockup">
              <img class="icon icon-cmyk_droplet_cyan" src="/express/code/icons/cmyk_droplet_cyan.svg" alt="cyan" />
              <img class="icon icon-cmyk_droplet_magenta" src="/express/code/icons/cmyk_droplet_magenta.svg" alt="magenta" />
              <img class="icon icon-cmyk_droplet_yellow" src="/express/code/icons/cmyk_droplet_yellow.svg" alt="yellow" />
              <img class="icon icon-cmyk_droplet_black" src="/express/code/icons/cmyk_droplet_black.svg" alt="black" />
              <img class="icon icon-cmyk_droplet_white" src="/express/code/icons/cmyk_droplet_white.svg" alt="white" />
              CMYK + White
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function flattenOptionGroups(selector) {
  if (!selector?.optionGroups || !Array.isArray(selector.optionGroups)) {
    return [];
  }
  return selector.optionGroups.flatMap(
    (group) => (group.options || []).map((option) => ({ ...option, groupTitle: group.title })),
  );
}

function PaperTypeContent({ onClose }) {
  const { state, actions } = useStore();
  const { state: drawerState } = useDrawer();
  const pillContainerRef = useRef(null);
  const carouselCleanupRef = useRef(null);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const attrName = drawerState.payload?.attribute?.name;
  const attribute = (state?.attributes || []).find((a) => a.name === attrName);
  if (!attribute) return null;
  const { selector, selectedOptionValue } = attribute;
  const { preview } = selector;
  const allOptions = flattenOptionGroups(selector);
  const selectedOption = allOptions.find((o) => o.value === selectedOptionValue) || allOptions[0];
  const heroImageUrl = preview?.imageUrl ? updateImageUrl(preview.imageUrl, 1000) : '';
  const isRecommended = selectedOptionValue === '175ptmatte';

  // Build pills imperatively and initialize carousel (avoids Preact reconciliation conflict)
  useEffect(() => {
    if (!pillContainerRef.current || !allOptions.length) return undefined;

    const container = pillContainerRef.current;
    container.innerHTML = '';

    allOptions.forEach((option) => {
      const isSelected = option.value === selectedOptionValue;
      const thumbUrl = updateImageUrl(option.imageUrl, 48);

      const pillContainer = document.createElement('div');
      pillContainer.className = 'pdpx-mini-pill-container';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = `pdpx-mini-pill-image-container ${isSelected ? 'selected' : ''}`;
      button.setAttribute('data-name', option.value);
      button.setAttribute('data-title', option.title);
      button.setAttribute('aria-label', option.title);
      button.setAttribute('data-tooltip', option.title);
      button.setAttribute('aria-current', isSelected ? 'true' : 'false');
      button.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      button.addEventListener('click', () => {
        actionsRef.current.selectOption(attribute.name, option.value);
      });

      const img = document.createElement('img');
      img.className = 'pdpx-mini-pill-image';
      img.src = thumbUrl;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      button.appendChild(img);

      pillContainer.addEventListener('mouseenter', (event) => {
        const pill = event.currentTarget.getBoundingClientRect();
        const tooltipWidth = (option.title.length * 3) + 12;
        const pillCenter = pill.left + (pill.width / 2);
        const drawer = event.currentTarget.closest('.pdpx-drawer');
        const drawerOffsetLeft = drawer ? drawer.getBoundingClientRect().left : 0;
        event.currentTarget.style.setProperty('--tooltip-top', `${pill.top - 42}px`);
        event.currentTarget.style.setProperty('--tooltip-left', `${pillCenter - tooltipWidth - drawerOffsetLeft}px`);
        event.currentTarget.style.setProperty('--arrow-top', `${pill.top - 6}px`);
        event.currentTarget.style.setProperty('--arrow-left', `${pillCenter - drawerOffsetLeft}px`);
      });

      const textContainer = document.createElement('div');
      textContainer.className = 'pdpx-mini-pill-text-container';
      if (option.priceDelta) {
        const priceSpan = document.createElement('span');
        priceSpan.className = 'pdpx-mini-pill-price';
        priceSpan.textContent = option.priceDelta;
        textContainer.appendChild(priceSpan);
      }

      pillContainer.appendChild(button);
      pillContainer.appendChild(textContainer);
      container.appendChild(pillContainer);
    });

    createSimpleCarousel('.pdpx-mini-pill-container', container, {
      ariaLabel: `${attribute.title} options`,
      centerActive: true,
      activeClass: 'selected',
    }).then((carousel) => {
      if (carousel) {
        carouselCleanupRef.current = carousel.cleanup;
      }
    });

    return () => {
      if (carouselCleanupRef.current) {
        carouselCleanupRef.current();
        carouselCleanupRef.current = null;
      }
    };
  }, [attribute.name, attribute.title, allOptions.map((o) => o.value).join(',')]);

  // Update selected state when selection changes
  useEffect(() => {
    if (!pillContainerRef.current) return;
    const buttons = pillContainerRef.current.querySelectorAll('.pdpx-mini-pill-image-container');
    buttons.forEach((btn) => {
      const value = btn.getAttribute('data-name');
      const isSelected = value === selectedOptionValue;
      btn.classList.toggle('selected', isSelected);
      btn.setAttribute('aria-current', isSelected ? 'true' : 'false');
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });
  }, [selectedOptionValue]);

  return html`
    <${Fragment}>
      <div class="pdpx-drawer-body">
        ${heroImageUrl && html`
          <div class="pdpx-drawer-hero-image-container">
            <img class="pdpx-drawer-hero-image" src="${heroImageUrl}" alt="${selectedOption?.title || ''}" />
          </div>
        `}
        <div class="pdpx-drawer-title-row">
          <span class="pdpx-drawer-title">${selectedOption?.title || ''}</span>
          <span
            class="pdpx-recommended-badge"
            style="visibility: ${isRecommended ? 'visible' : 'hidden'}"
          >Recommended</span>
        </div>
        ${preview?.descriptionHTML && html`
          <div class="pdpx-drawer-pills-container">
            ${sanitizeHtml(preview.descriptionHTML)
    .split(/<br\s*\/?>/i)[0]
    .split('/')
    .filter(Boolean)
    .map((spec) => html` 
              <div class="pdpx-drawer-pill">
                <img class="icon icon-circle-check-mark" src="/express/code/icons/circle-check-mark.svg" alt="" aria-hidden="true" />
                <span class="pdpx-drawer-pill-text">${spec.trim()}</span>
              </div>
            `)}
          </div>
        `}
        <div class="pdpx-pill-selector-container">
          <div class="pdpx-pill-selector-label-container">
            <div class="pdpx-pill-selector-label-name-container">
              <span class="pdpx-pill-selector-label-label">${attribute.title}: </span>
              <span class="pdpx-pill-selector-label-name">${selectedOption?.title || ''}</span>
            </div>
          </div>
          <div
            ref=${pillContainerRef}
            class="pdpx-mini-pill-selector-options-container"
          />
        </div>
        ${state?.descriptionComponents?.[1]?.descriptionHTML && html`
          <div
            class="pdpx-drawer-description"
            dangerouslySetInnerHTML=${{ __html: sanitizeHtml(state.descriptionComponents[1].descriptionHTML) }}
          />
        `}
      </div>
      <div class="pdpx-drawer-foot">
        <div class="pdpx-drawer-foot-info-container">
          <img src="${updateImageUrl(selectedOption?.imageUrl, 48)}" alt="${selectedOption?.title || ''}" />
          <div class="pdpx-drawer-foot-info-text">
            <div class="pdpx-drawer-foot-info-name">${selectedOption?.title || ''}</div>
            ${selectedOption?.priceDelta && html`
              <div class="pdpx-drawer-foot-info-price">${selectedOption.priceDelta}</div>
            `}
          </div>
        </div>
        <button class="pdpx-drawer-foot-select-button" type="button" onClick=${onClose}>Select</button>
      </div>
    </${Fragment}>
  `;
}

export function AssuranceLockup() {
  const isEnUs = document.documentElement.lang?.toLowerCase() === 'en-us';
  return html`
    <div class="pdpx-assurance-lockup-container">
      <div class="pdpx-assurance-lockup-item">
        <img class="icon icon-shield_check_icon" src="/express/code/icons/shield_check_icon.svg" alt="" aria-hidden="true" />
        <span class="pdpx-assurance-lockup-item-text">100% satisfaction guarantee</span>
      </div>
      ${isEnUs && html`
        <div class="pdpx-assurance-lockup-item">
          <img class="icon icon-print_icon" src="/express/code/icons/print_icon.svg" alt="" aria-hidden="true" />
          <span class="pdpx-assurance-lockup-item-text">Made and printed in the USA</span>
        </div>
      `}
      <div id="pdpx-checkout-button-sentinel-div"></div>
    </div>
  `;
}

export function Drawer() {
  const { state, closeDrawer } = useDrawer();
  const drawerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!state.open) return undefined;

    // Capture the element that triggered the drawer so we can return focus
    triggerRef.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeDrawer();
        return;
      }
      // Focus trap: keep Tab within the drawer
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // Move focus into the drawer
    let active = true;
    setTimeout(() => {
      if (!active || !drawerRef.current) return;
      const firstFocusable = drawerRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) firstFocusable.focus();
    }, 0);

    return () => {
      active = false;
      document.removeEventListener('keydown', handleKeyDown);
      // Return focus to the triggering element
      if (triggerRef.current?.focus) {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    };
  }, [state.open, closeDrawer]);

  const drawerLabels = {
    sizeChart: state.payload?.helpLink?.label || 'Size Chart',
    paperType: 'Select Paper Type',
    printingProcess: 'Printing Process',
  };
  const drawerLabel = drawerLabels[state.type] || '';

  return html`
    <${Fragment}>
      <div
        class="pdpx-curtain ${state.open ? 'open' : ''}"
        onClick=${closeDrawer}
        role="presentation"
      ></div>
      <aside
        ref=${drawerRef}
        class="pdpx-drawer ${state.open ? 'open' : ''}"
        id="pdp-x-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="${drawerLabel}"
      >
        <div class="pdpx-drawer-head">
          <div class="pdpx-drawer-head-label">${drawerLabel}</div>
          <button type="button" aria-label="Close" onClick=${closeDrawer}>
          <img class="icon icon-close-black" src="/express/code/icons/close-black.svg" alt="" aria-hidden="true" />
          </button>
        </div>
        ${state.type === 'sizeChart' && html`<${SizeChartContent} onClose=${closeDrawer} />`}
        ${state.type === 'paperType' && html`<${PaperTypeContent} onClose=${closeDrawer} />`}
        ${state.type === 'printingProcess' && html`<${PrintingProcessContent} onClose=${closeDrawer} />`}
      </aside>
    </${Fragment}>
  `;
}
