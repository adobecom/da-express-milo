import { getLibs } from '../../../scripts/utils.js';
import {
  formatDeliveryEstimateDateRange,
  formatLargeNumberToK,
  formatPriceZazzle,
} from '../utilities/utility-functions.js';
import { populateStars } from '../utilities/star-icon-utils.js';

let createTag;

function createProductRatingsLockup(productDetails) {
  const productRatingsLockupContainer = createTag('div', {
    class: 'pdpx-product-ratings-lockup-container',
    id: 'pdpx-product-ratings-lockup-container',
    role: 'group',
    'aria-label': 'Product ratings',
  });
  const starRatings = createTag('div', {
    class: 'pdpx-star-ratings',
    role: 'img',
    'aria-label': `${
      Math.round(productDetails.averageRating * 10) / 10
    } out of 5 stars`,
  });

  const rating = productDetails.averageRating || 5;
  const ratingValue = Math.round(rating * 10) / 10;
  const ratingRoundedHalf = Math.round(ratingValue * 2) / 2;
  const filledStars = Math.floor(ratingRoundedHalf);
  const halfStars = filledStars === ratingRoundedHalf ? 0 : 1;
  const emptyStars = halfStars === 1 ? 4 - filledStars : 5 - filledStars;

  populateStars(filledStars, 'star', starRatings, createTag);
  populateStars(halfStars, 'star-half', starRatings, createTag);
  populateStars(emptyStars, 'star-empty', starRatings, createTag);

  const ratingsNumberContainer = createTag('div', {
    class: 'pdpx-ratings-number-container',
  });
  const ratingsNumber = createTag(
    'span',
    {
      class: 'pdpx-ratings-number',
      id: 'pdpx-ratings-number',
      'aria-label': `${ratingValue} out of 5`,
    },
    ratingValue,
  );
  const ratingsAmountContainer = createTag('div', {
    class: 'pdpx-ratings-amount-container',
  });
  const ratingsAmount = createTag(
    'span',
    {
      class: 'pdpx-ratings-amount',
      id: 'pdpx-ratings-amount',
      'aria-label': `${productDetails.totalReviews.toLocaleString()} ratings`,
    },
    `${formatLargeNumberToK(productDetails.totalReviews)} ratings`,
  );
  ratingsNumberContainer.append(ratingsNumber);
  ratingsAmountContainer.appendChild(ratingsAmount);
  productRatingsLockupContainer.append(
    starRatings,
    ratingsNumberContainer,
    ratingsAmountContainer,
  );
  return productRatingsLockupContainer;
}

function createProductTitleAndRatingsContainer(productDetails) {
  const productTitleAndRatingsContainer = createTag('div', {
    class: 'pdpx-title-and-ratings-container',
  });
  const productTitleContainer = createTag('div', {
    class: 'pdpx-product-title-container',
  });
  const productTitle = createTag(
    'h1',
    {
      class: 'pdpx-product-title',
      id: 'pdpx-product-title',
      'data-skeleton': 'true',
    },
    productDetails.productTitle,
  );
  productTitleContainer.appendChild(productTitle);
  const productRatingsLockup = createProductRatingsLockup(productDetails);
  productTitleAndRatingsContainer.append(
    productTitleContainer,
    productRatingsLockup,
  );
  return productTitleAndRatingsContainer;
}

function createInfoTooltipContent(productDetails) {
  const infoTooltipContent = createTag('div', {
    class: 'pdpx-info-tooltip-content',
    id: 'pdpx-info-tooltip-content',
    role: 'tooltip',
  });
  const infoTooltipContentTitle = createTag(
    'h6',
    {
      class: 'pdpx-info-tooltip-content-title',
      id: 'pdpx-info-tooltip-content-title',
    },
    productDetails.compareValueTooltipTitle,
  );
  const infoTooltipContentDescription1 = createTag(
    'p',
    {
      class: 'pdpx-info-tooltip-content-description',
      id: 'pdpx-info-tooltip-content-description-1',
    },
    productDetails.compareValueTooltipDescription1,
  );
  const infoTooltipContentDescription2 = createTag(
    'p',
    {
      class: 'pdpx-info-tooltip-content-description',
      id: 'pdpx-info-tooltip-content-description-2',
    },
    productDetails.compareValueTooltipDescription2,
  );
  infoTooltipContent.append(
    infoTooltipContentTitle,
    infoTooltipContentDescription1,
    infoTooltipContentDescription2,
  );
  return infoTooltipContent;
}

const showTooltip = (target, infoTooltipContent) => {
  target.setAttribute('aria-expanded', 'true');
  infoTooltipContent.style.display = 'block';
};
const hideTooltip = (target, infoTooltipContent) => {
  target.setAttribute('aria-expanded', 'false');
  infoTooltipContent.style.display = 'none';
};

function toggleTooltip(event, infoTooltipContent) {
  const target = event.currentTarget;
  const isTooltipVisible = target.getAttribute('aria-expanded') === 'true';

  if (event.type === 'click') {
    if (isTooltipVisible) {
      hideTooltip(target, infoTooltipContent);
    } else {
      showTooltip(target, infoTooltipContent);
    }
    return;
  }
  if (event.type === 'focus' || event.type === 'mouseenter') {
    showTooltip(target, infoTooltipContent);
    return;
  }
  if (event.type === 'blur' || event.type === 'mouseleave') {
    hideTooltip(target, infoTooltipContent);
  }
}

export async function createPriceLockup(productDetails) {
  const priceInfoContainer = createTag('div', {
    class: 'pdpx-price-info-container',
    id: 'pdpx-price-info-container',
  });
  const priceInfoRow = createTag('div', {
    class: 'pdpx-price-info-row',
    id: 'pdpx-price-info-row',
  });
  const priceContainer = createTag(
    'span',
    { class: 'pdpx-price-label', id: 'pdpx-price-label' },
    await formatPriceZazzle(productDetails.productPrice),
  );
  const comparePrice = createTag(
    'span',
    { class: 'pdpx-compare-price-label', id: 'pdpx-compare-price-label' },
    await formatPriceZazzle(productDetails.strikethroughPrice),
  );
  const comparePriceInfoLabel = createTag(
    'span',
    {
      class: 'pdpx-compare-price-info-label',
      id: 'pdpx-compare-price-info-label',
    },
    productDetails.compareValueInfoIconLabel,
  );
  const comparePriceInfoIconContainer = createTag('div', {
    class: 'pdpx-compare-price-info-icon-container',
  });
  const comparePriceInfoIconButton = createTag('button', {
    class: 'pdpx-compare-price-info-icon-button',
    type: 'button',
    'aria-label': productDetails.compareValueTooltipTitle,
    'aria-expanded': 'false',
  });
  const infoTooltipContent = createInfoTooltipContent(productDetails);
  const savingsText = createTag(
    'span',
    { class: 'pdpx-savings-text', id: 'pdpx-savings-text' },
    productDetails.discountString,
  );
  ['blur', 'focus', 'mouseleave', 'mouseenter', 'click'].forEach(
    (eventType) => {
      comparePriceInfoIconButton.addEventListener(eventType, (event) => {
        toggleTooltip(event, infoTooltipContent);
      });
    },
  );
  comparePriceInfoIconButton.appendChild(
    createTag('img', {
      class: 'pdpx-compare-price-info-icon',
      src: '/express/code/icons/info.svg',
      width: '12',
      height: '12',
      alt: 'Compare Value Info icon',
    }),
  );
  comparePriceInfoIconContainer.append(
    comparePriceInfoIconButton,
    infoTooltipContent,
  );
  priceInfoRow.append(
    priceContainer,
    comparePrice,
    comparePriceInfoLabel,
    comparePriceInfoIconContainer,
  );
  priceInfoContainer.append(priceInfoRow, savingsText);
  return priceInfoContainer;
}

export function createDeliveryEstimatePill(productDetails) {
  const deliveryEstimateDateRange = formatDeliveryEstimateDateRange(
    productDetails.deliveryEstimateMinDate,
    productDetails.deliveryEstimateMaxDate,
  );
  const deliveryEstimatePillContainer = createTag('div', {
    class: 'pdpx-delivery-estimate-pill',
  });
  const deliveryEstimatePillIcon = createTag('img', {
    class: 'pdpx-delivery-estimate-pill-icon',
    src: '/express/code/icons/delivery-truck.svg',
    alt: 'Delivery Estimate Shipping Icon',
    width: '32',
    height: '17',
  });
  const deliveryEstimatePillText = createTag(
    'span',
    {
      class: 'pdpx-delivery-estimate-pill-text',
      id: 'pdpx-delivery-estimate-pill-text',
    },
    `${productDetails.deliveryEstimateStringText} ${deliveryEstimateDateRange}`,
  );
  deliveryEstimatePillContainer.append(
    deliveryEstimatePillIcon,
    deliveryEstimatePillText,
  );
  return deliveryEstimatePillContainer;
}

export default async function createProductInfoHeadingSection(productDetails) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const productInfoHeadingSectionWrapper = createTag('div', {
    class: 'pdpx-product-info-heading-section-wrapper',
  });
  const productInfoHeadingSectionContainer = createTag('div', {
    class: 'pdpx-product-info-heading-section-container',
  });
  const productTitleAndRatingsContainer = createProductTitleAndRatingsContainer(productDetails);
  const priceInfoContainer = await createPriceLockup(productDetails);
  const deliveryEstimatePill = createDeliveryEstimatePill(productDetails);
  productInfoHeadingSectionContainer.append(
    productTitleAndRatingsContainer,
    priceInfoContainer,
  );
  productInfoHeadingSectionWrapper.append(
    productInfoHeadingSectionContainer,
    deliveryEstimatePill,
  );
  return productInfoHeadingSectionWrapper;
}
