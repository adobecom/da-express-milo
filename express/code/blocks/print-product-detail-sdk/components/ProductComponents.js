import {
  html,
  useEffect,
  useRef,
  useState,
  Fragment,
  useCallback,
} from '../../../scripts/vendors/htm-preact.js';
import { useStore, useDrawer } from './Contexts.js';
import axAccordionDecorate from '../../ax-accordion/ax-accordion.js';
import { formatLargeNumberToK } from '../utilities/utility-functions.js';
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
              <div class="pdpx-star-ratings">
                ${Array.from({ length: 5 }).map(() => html`
                  <img class="pdpx-product-info-header-ratings-star" src="/express/code/icons/star-sharp.svg" alt="star" />
                `)}
              </div>
              <div class="pdpx-ratings-number-container">
                <span class="pdpx-ratings-number" id="pdpx-ratings-number">${formattedRating}</span>
              </div>
              <div class="pdpx-ratings-amount-container">
                <button class="pdpx-ratings-amount" id="pdpx-ratings-amount" type="button">${formattedCount}</button>
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
                  onMouseEnter=${showTooltip}
                  onMouseLeave=${hideTooltip}
                  onClick=${showTooltip}
                >
                  <img class="pdpx-compare-price-info-icon" src="/express/code/icons/info.svg" alt="info" />
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
          <img class="pdpx-delivery-estimate-pill-icon" src="/express/code/icons/delivery-truck.svg" alt="delivery" />
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

  if (!state || !state.selectedRealview) {
    return null;
  }

  const { realviews = [], selectedRealview } = state;
  const heroImageUrl = updateImageUrl(selectedRealview.url, 644);

  const handleThumbnailClick = (realview) => {
    if (realview.id !== selectedRealview.id) {
      actions.selectRealview(realview.id);
    }
  };

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
      ${realviews.length > 0 && html`
        <div class="pdpx-image-thumbnail-carousel-container" id="pdpx-image-thumbnail-carousel-container">
          ${realviews.map((realview) => {
    const thumbnailUrl = updateImageUrl(realview.url, 76);
    const isSelected = realview.id === selectedRealview.id;
    return html`
              <button
                key="${realview.id}"
                class="pdpx-image-thumbnail-carousel-item ${isSelected ? 'selected' : ''}"
                type="button"
                data-image-type="${realview.id}"
                onClick=${() => handleThumbnailClick(realview)}
              >
                <img
                  class="pdpx-image-thumbnail-carousel-item-image"
                  src="${thumbnailUrl}"
                  alt="${realview.title}"
                  data-image-type="${realview.id}"
                />
              </button>
            `;
  })}
        </div>
      `}
    </div>
  `;
}

const TASK_ID_MAP = {
  zazzle_shirt: 'tshirt',
  zazzle_businesscard: 'businesscard',
};

function buildCheckoutUrl(templateId, expressProductSettings, productType) {
  const taskId = TASK_ID_MAP[productType] || '';
  const baseUrl = `https://new.express.adobe.com/design/template/${templateId}`;
  const params = new URLSearchParams({
    productSettings: expressProductSettings,
    category: 'templates',
    taskId,
    loadPrintAddon: 'true',
    print: 'true',
    action: 'pdp-cta',
    source: 'a.com-print-and-deliver-seo',
    mv: 'other',
    url: 'express/print',
  });
  return `${baseUrl}?${params.toString()}`;
}

export function CheckoutButton({ templateId }) {
  const { state } = useStore();

  const checkoutUrl = state?.expressProductSettings
    ? buildCheckoutUrl(templateId, state.expressProductSettings, state.productType)
    : '#';

  return html`
    <div class="pdpx-checkout-button-container">
      <a
        class="pdpx-checkout-button"
        id="pdpx-checkout-button"
        href="${checkoutUrl}"
      >
        <img class="pdpx-checkout-button-icon" src="/express/code/icons/print-icon.svg" alt="print" />
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

function SizeChartTable({ sizeChart }) {
  if (!sizeChart?.sizeChart) {
    return html`<p class="pdpx-size-chart-empty">Size chart information is unavailable.</p>`;
  }

  const { measurementTypes = [], attributeValues = [] } = sizeChart.sizeChart;

  const rows = attributeValues.map((row) => html`
    <tr key="${row.attributeValueId}">
      <td>${row.attributeValueLabel}</td>
      ${measurementTypes.map((type) => {
    const measurement = row.measurements?.find((entry) => entry.key === type.key);
    return html`<td key="${type.key}">${measurement?.displayValue || '—'}</td>`;
  })}
    </tr>
`);

  return html`
    <table class="pdpx-size-chart-table">
      <thead>
        <tr>
          <th class="size-chart-table-header">${sizeChart.title || 'Size'}</th>
          ${measurementTypes.map((type) => html`<th key="${type.key}">${type.label}</th>`)}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function SizeChartContent({ onClose }) {
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

  return html`
    <div class="pdpx-drawer-body pdpx-size-chart-container drawer-body--size-chart">
      ${chart.imageRealViewUrl && html`
        <div class="pdpx-drawer-hero-image-container">
          <img class="pdpx-drawer-hero-image" src="${chart.imageRealViewUrl}" alt="Size chart preview" />
        </div>
      `}
      <${SizeChartTable} sizeChart=${chart} />
      ${chart.modelInfo?.length && html`
        <div class="pdpx-size-chart-model-info">
          ${chart.modelInfo.map((info, index) => html`
            <div key="model-${index}" class="pdpx-size-chart-model">
              <h3>Model ${index + 1}</h3>
              <ul>
                ${(info.bodyMeasurements || []).map((measurement) => html`
                  <li key="body-${measurement.key}">${measurement.label}: ${measurement.displayValue}</li>
                `)}
              </ul>
            </div>
          `)}
        </div>
      `}
      ${chart.fitStyle && html`<p class="pdpx-size-chart-fit-style">Fit: ${chart.fitStyle}</p>`}
      <button class="pdpx-drawer-foot-select-button" type="button" onClick=${onClose}>Close</button>
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
      button.setAttribute('aria-current', isSelected ? 'true' : 'false');
      button.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      button.addEventListener('click', () => {
        if (option.value !== selectedOptionValue) {
          actions.selectOption(attribute.name, option.value);
        }
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
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
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
            ${preview.descriptionHTML
    .split(/<br\s*\/?>/i)[0]
    .replace(/<[^>]*>/g, '')
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
            dangerouslySetInnerHTML=${{ __html: state.descriptionComponents[1].descriptionHTML }}
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

export function Drawer() {
  const { state, closeDrawer } = useDrawer();

  useEffect(() => {
    if (!state.open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.open, closeDrawer]);

  const drawerLabels = {
    sizeChart: state.payload?.helpLink?.label || 'Size Chart',
    paperType: 'Select Paper Type',
  };
  const drawerLabel = drawerLabels[state.type] || '';

  return html`
    <${Fragment}>
      <div
        class="pdpx-curtain ${state.open ? '' : 'hidden'}"
        onClick=${closeDrawer}
        role="presentation"
      ></div>
      <aside class="pdpx-drawer ${state.open ? '' : 'hidden'}" id="pdp-x-drawer">
        <div class="pdpx-drawer-head">
          <div class="pdpx-drawer-head-label">${drawerLabel}</div>
          <button type="button" aria-label="Close" onClick=${closeDrawer}>
          <img class="icon icon-close-black" src="/express/code/icons/close-black.svg" alt="close-black" />
          </button>
        </div>
        ${state.type === 'sizeChart' && html`<${SizeChartContent} onClose=${closeDrawer} />`}
        ${state.type === 'paperType' && html`<${PaperTypeContent} onClose=${closeDrawer} />`}
      </aside>
    </${Fragment}>
  `;
}
