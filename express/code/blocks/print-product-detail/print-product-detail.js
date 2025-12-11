import { getLibs } from '../../scripts/utils.js';
import fetchAPIData, { fetchUIStrings } from './fetchData/fetchProductDetails.js';
import { createEmptyDataObject, updateDataObjectProductDetails, updateDataObjectProductPrice, updateDataObjectProductShippingEstimates, updateDataObjectProductReviews, updateDataObjectProductRenditions, updateDataObjectUIStrings } from './utilities/data-formatting.js';
import createProductInfoHeadingSection from './createComponents/createProductInfoHeadingSection.js';
import createProductImagesContainer, { createProductThumbnailCarousel } from './createComponents/createProductImagesContainer.js';
import createCustomizationInputs from './createComponents/customizationInputs/createCustomizationInputs.js';
import createProductDetailsSection, { createCheckoutButton, createCheckoutButtonHref, createAssuranceLockup } from './createComponents/createProductDetailsSection.js';
import { createDrawer } from './createComponents/drawerContent/createDrawerContent.js';
import { addPrefetchLinks, formatDeliveryEstimateDateRange, formatLargeNumberToK, formatPriceZazzle, extractTemplateId, convertImageSize, createHeroImageSrcset } from './utilities/utility-functions.js';
import { populateStars } from './utilities/star-icon-utils.js';
import { getCanonicalUrl, upsertTitleAndDescriptionRespectingAuthored, getAuthoredOverrides, buildProductJsonLd, upsertLdJson, buildBreadcrumbsJsonLdFromDom } from './utilities/seo.js';

let createTag;
let getConfig;
let loadStyle;

async function createProductInfoContainer(productDetails, drawer) {
  const productInfoSectionContainer = createTag('div', { class: 'pdpx-product-info-section-container' });
  const productInfoSection = createTag('div', { class: 'pdpx-product-info-section', id: 'pdpx-product-info-section' });
  const checkoutButton = await createCheckoutButton(productDetails);
  productInfoSectionContainer.append(
    drawer,
    productInfoSection,
    checkoutButton,
  );
  return productInfoSectionContainer;
}

async function createGlobalContainer(productDetails) {
  const globalContainer = createTag('div', { class: 'pdpx-global-container', id: 'pdpx-global-container', 'data-template-id': productDetails.templateId });
  const productInfoHeadingSection = await createProductInfoHeadingSection(productDetails);
  const productImagesContainer = await createProductImagesContainer(
    productDetails.realViews,
    productDetails.heroImage,
  );
  const { curtain, drawer } = await createDrawer(productDetails);
  const productInfoSection = await createProductInfoContainer(productDetails, drawer);
  const productInfoWrapper = createTag('div', { class: 'pdpx-product-info-wrapper' });
  productInfoWrapper.append(productInfoHeadingSection, productInfoSection);
  globalContainer.append(productImagesContainer, productInfoWrapper);
  document.body.append(curtain);
  return globalContainer;
}

async function updatePageWithProductDetails(productDetails, globalContainer) {
  const productHeroImage = globalContainer.querySelector('#pdpx-product-hero-image');
  productHeroImage.srcset = createHeroImageSrcset(productDetails.heroImage);
  productHeroImage.src = convertImageSize(productDetails.heroImage, '500');
  productHeroImage.removeAttribute('data-skeleton');
  const productTitle = globalContainer.querySelector('#pdpx-product-title');
  productTitle.textContent = productDetails.productTitle;
  productTitle.removeAttribute('data-skeleton');
  const productInfoSection = globalContainer.querySelector('#pdpx-product-info-section');
  const customizationInputs = await createCustomizationInputs(productDetails);
  const productDetailsSection = await createProductDetailsSection(
    productDetails.productDescriptions,
  );
  productInfoSection.append(customizationInputs, productDetailsSection);
  const form = globalContainer.querySelector('#pdpx-customization-inputs-form');
  const formData = new FormData(form);
  const formDataObject = Object.fromEntries(formData.entries());
  const assuranceLockup = createAssuranceLockup();
  productInfoSection.append(assuranceLockup);
  const checkoutButton = globalContainer.querySelector('#pdpx-checkout-button');
  const checkoutButtonHref = createCheckoutButtonHref(
    productDetails.templateId,
    formDataObject,
    productDetails.productType,
  );
  if (checkoutButton) {
    checkoutButton.href = checkoutButtonHref;
  }
}

async function updatePageWithProductImages(productDetails) {
  const productImagesContainer = document.getElementById('pdpx-product-images-container');
  const imageThumbnailCarouselWrapper = productImagesContainer.querySelector('#pdpx-image-thumbnail-carousel-wrapper');
  const heroProductImage = productImagesContainer.querySelector('#pdpx-product-hero-image');
  const newImageThumbnailCarouselWrapper = await createProductThumbnailCarousel(
    productDetails.realViews,
    'Front',
    heroProductImage,
  );
  imageThumbnailCarouselWrapper.replaceWith(newImageThumbnailCarouselWrapper);
  const carouselItems = newImageThumbnailCarouselWrapper.querySelectorAll('.pdpx-image-thumbnail-carousel-item');
  carouselItems.forEach((item) => item.removeAttribute('data-skeleton'));
  return newImageThumbnailCarouselWrapper;
}

async function updatePageWithProductPrice(productDetails) {
  const priceInfoContainer = document.getElementById('pdpx-price-info-container');
  priceInfoContainer.querySelector('#pdpx-price-label').textContent = await formatPriceZazzle(productDetails.productPrice);
  priceInfoContainer.querySelector('#pdpx-compare-price-label').textContent = await formatPriceZazzle(productDetails.strikethroughPrice);
  priceInfoContainer.querySelector('#pdpx-savings-text').textContent = productDetails.discountString;
}

function updateStarRating(rating) {
  const starRatingsContainer = document.querySelector('#pdpx-product-ratings-lockup-container .pdpx-star-ratings');
  if (!starRatingsContainer) return;

  // Clear existing stars
  starRatingsContainer.innerHTML = '';

  // Calculate partial stars based on rating (rounded to nearest 0.5)
  const ratingValue = Math.round(rating * 10) / 10;
  const ratingRoundedHalf = Math.round(ratingValue * 2) / 2;
  const filledStars = Math.floor(ratingRoundedHalf);
  const halfStars = filledStars === ratingRoundedHalf ? 0 : 1;
  const emptyStars = halfStars === 1 ? 4 - filledStars : 5 - filledStars;

  // Populate stars with filled, half, and empty
  populateStars(filledStars, 'star', starRatingsContainer, createTag);
  populateStars(halfStars, 'star-half', starRatingsContainer, createTag);
  populateStars(emptyStars, 'star-empty', starRatingsContainer, createTag);
}

function updatePageWithProductReviews(productDetails) {
  const productRatingsLockupContainer = document.getElementById('pdpx-product-ratings-lockup-container');
  const ratingsNumberEl = productRatingsLockupContainer.querySelector('#pdpx-ratings-number');
  const ratingsAmountEl = productRatingsLockupContainer.querySelector('#pdpx-ratings-amount');
  const starRatingsEl = productRatingsLockupContainer.querySelector('.pdpx-star-ratings');

  const ratingValue = Math.round(productDetails.averageRating * 10) / 10;
  ratingsNumberEl.textContent = ratingValue;
  ratingsNumberEl.setAttribute('aria-label', `${ratingValue} out of 5`);

  ratingsAmountEl.textContent = `${formatLargeNumberToK(productDetails.totalReviews)} ratings`;
  ratingsAmountEl.setAttribute('aria-label', `${productDetails.totalReviews.toLocaleString()} ratings`);

  starRatingsEl.setAttribute('aria-label', `${ratingValue} out of 5 stars`);

  // Update stars with actual rating
  updateStarRating(productDetails.averageRating);
}

function updatePageWithProductShippingEstimates(productDetails) {
  const deliveryEstimateDateRange = formatDeliveryEstimateDateRange(
    productDetails.deliveryEstimateMinDate,
    productDetails.deliveryEstimateMaxDate,
  );
  const deliveryEstimatePillDate = document.getElementById('pdpx-delivery-estimate-pill-text');
  deliveryEstimatePillDate.textContent = `${productDetails.deliveryEstimateStringText} ${deliveryEstimateDateRange}`;
}

function updatePageWithUIStrings(productDetails) {
  document.getElementById('pdpx-delivery-estimate-pill-text').textContent = productDetails.deliveryEstimateStringText;
  document.getElementById('pdpx-compare-price-info-label').textContent = productDetails.compareValueInfoIconLabel;
  const compareValueTooltipContent = document.getElementById('pdpx-info-tooltip-content');
  compareValueTooltipContent.querySelector('#pdpx-info-tooltip-content-title').textContent = productDetails.compareValueTooltipTitle;
  compareValueTooltipContent.querySelector('#pdpx-info-tooltip-content-description-1').innerHTML = productDetails.compareValueTooltipDescription1;
  compareValueTooltipContent.querySelector('#pdpx-info-tooltip-content-description-2').innerHTML = productDetails.compareValueTooltipDescription2;
}

export default async function decorate(block) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`)]).then(([utils]) => {
    ({ createTag, getConfig, loadStyle } = utils);
  });
  const config = getConfig();
  await new Promise((resolve) => {
    loadStyle(`${config.codeRoot}/scripts/widgets/simple-carousel.css`, resolve);
  });
  const { ietf } = config.locale;
  addPrefetchLinks(ietf);
  const templateId = extractTemplateId(block);
  block.innerHTML = '';
  let dataObject = createEmptyDataObject(templateId, ietf);
  const globalContainer = await createGlobalContainer(dataObject);
  block.appendChild(globalContainer);
  const urlParams = new URLSearchParams(window.location.search);
  const productIdFromUrl = urlParams.get('productId');
  const productIdFinal = productIdFromUrl || templateId;
  const idTypeFinal = productIdFromUrl ? 'productId' : 'templateId';
  const endpoint = productIdFromUrl ? 'getproduct' : 'getproductfromtemplate';

  const productDetails = fetchAPIData(productIdFinal, null, endpoint, idTypeFinal);

  productDetails.then(async (productDetailsResponse) => {
    dataObject = await updateDataObjectProductDetails(dataObject, productDetailsResponse);
    try {
      const head = document.head || document.getElementsByTagName('head')[0];
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = convertImageSize(dataObject.heroImage, '750');
      link.fetchPriority = 'high';
      link.setAttribute('imagesrcset', createHeroImageSrcset(dataObject.heroImage));
      link.setAttribute('imagesizes', '(max-width: 600px) 100vw, 50vw');
      head.appendChild(link);
    } catch (e) {
      /* no-op */
    }
    updatePageWithProductDetails(dataObject, globalContainer);
    // SEO: title/description (respect authored), initial Product JSON-LD
    // (updated later when price arrives)
    const canonicalUrl = getCanonicalUrl();
    upsertTitleAndDescriptionRespectingAuthored(dataObject);
    const overrides = getAuthoredOverrides(document);
    const initialJsonLd = await buildProductJsonLd(dataObject, overrides, canonicalUrl);
    upsertLdJson('pdp-product-jsonld', initialJsonLd);
    const breadcrumbsLd = buildBreadcrumbsJsonLdFromDom();
    if (breadcrumbsLd) upsertLdJson('pdp-breadcrumbs-jsonld', breadcrumbsLd);
    const productId = productDetailsResponse.product.id;
    const productRenditions = fetchAPIData(productId, null, 'getproductrenditions');
    productRenditions.then(async (productRenditionsResponse) => {
      dataObject = updateDataObjectProductRenditions(dataObject, productRenditionsResponse);
      await updatePageWithProductImages(dataObject);
    });
    const quantity = 1;
    const productPrice = fetchAPIData(productId, null, 'getproductpricing');
    productPrice.then(async (productPriceResponse) => {
      dataObject = updateDataObjectProductPrice(dataObject, productPriceResponse, quantity);
      await updatePageWithProductPrice(dataObject);
      // SEO: Update Product JSON-LD with pricing/offer once available
      const canonicalUrlUpdated = getCanonicalUrl();
      const overridesUpdated = getAuthoredOverrides(document);
      const updatedJsonLd = await buildProductJsonLd(
        dataObject,
        overridesUpdated,
        canonicalUrlUpdated,
      );
      upsertLdJson('pdp-product-jsonld', updatedJsonLd);
    });
    const productReviews = fetchAPIData(productId, null, 'getreviews');
    productReviews.then((productReviewsResponse) => {
      dataObject = updateDataObjectProductReviews(dataObject, productReviewsResponse);
      updatePageWithProductReviews(dataObject);
    });

    const sampleShippingParameters = { qty: quantity };
    const productShippingEstimates = fetchAPIData(
      productId,
      sampleShippingParameters,
      'getshippingestimates',
    );
    productShippingEstimates.then((productShippingEstimatesResponse) => {
      dataObject = updateDataObjectProductShippingEstimates(
        dataObject,
        productShippingEstimatesResponse,
      );
      updatePageWithProductShippingEstimates(dataObject);
    });

    const UIStrings = fetchUIStrings();
    UIStrings.then((UIStringsResponse) => {
      dataObject = updateDataObjectUIStrings(dataObject, UIStringsResponse);
      updatePageWithUIStrings(dataObject);
    });
  });
}
