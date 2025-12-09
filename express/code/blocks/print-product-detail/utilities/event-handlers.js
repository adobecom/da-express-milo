import fetchAPIData, {
  fetchUIStrings,
} from '../fetchData/fetchProductDetails.js';
import { formatDeliveryEstimateDateRange } from './utility-functions.js';
import { normalizeProductDetailObject } from './data-formatting.js';
import createProductImagesContainer from '../createComponents/createProductImagesContainer.js';
import createCustomizationInputs from '../createComponents/customizationInputs/createCustomizationInputs.js';
import BlockMediator from '../../../scripts/block-mediator.min.js';
import createDrawerContentPaperType from '../createComponents/drawerContent/createDrawerContentPaperType.js';
import { createCheckoutButtonHref } from '../createComponents/createProductDetailsSection.js';
import { createPriceLockup } from '../createComponents/createProductInfoHeadingSection.js';

function formatProductOptionsToAPIParameters(formDataObject) {
  const parameters = {};
  for (const [key, value] of Object.entries(formDataObject)) {
    if (key !== 'qty') {
      parameters[key] = value;
    }
  }
  parameters.productOptions = Object.entries(parameters)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  parameters.qty = formDataObject.qty;
  const finalParameters = {};
  finalParameters.productOptions = encodeURIComponent(
    parameters.productOptions,
  );
  finalParameters.qty = parameters.qty;
  return finalParameters;
}

async function updateProductPrice(productDetails) {
  const priceInfoContainer = document.getElementById(
    'pdpx-price-info-container',
  );
  const newPriceLockup = await createPriceLockup(productDetails);
  priceInfoContainer.replaceWith(newPriceLockup);
}

async function updateProductImages(productDetails) {
  const heroImg = document.getElementById('pdpx-product-hero-image');
  const firstImageType = Object.keys(productDetails.realViews)[0];
  let imageType;
  if (productDetails.realViews[heroImg.dataset.imageType]) {
    imageType = heroImg.dataset.imageType;
  } else {
    imageType = firstImageType;
  }
  const newHeroImgSrc = productDetails.realViews[imageType];
  const newProductImagesContainer = await createProductImagesContainer(
    productDetails.realViews,
    newHeroImgSrc,
    imageType,
  );
  document
    .getElementById('pdpx-product-images-container')
    .replaceWith(newProductImagesContainer);
  newProductImagesContainer.querySelector(
    '#pdpx-image-thumbnail-carousel-wrapper',
  ).dataset.skeleton = 'false';
}

async function updateProductDeliveryEstimate(productDetails) {
  const deliveryEstimateDateRange = formatDeliveryEstimateDateRange(
    productDetails.deliveryEstimateMinDate,
    productDetails.deliveryEstimateMaxDate,
  );
  document.getElementById('pdpx-delivery-estimate-pill-text').textContent = `${productDetails.deliveryEstimateStringText} ${deliveryEstimateDateRange}`;
}

async function updateCustomizationOptions(productDetails, formDataObject) {
  const newCustomizationInputs = await createCustomizationInputs(
    productDetails,
    formDataObject,
  );
  document
    .getElementById('pdpx-customization-inputs-container')
    .replaceWith(newCustomizationInputs);
}

async function updateCheckoutButton(productDetails, formDataObject) {
  const checkoutButton = document.getElementById('pdpx-checkout-button');
  const url = createCheckoutButtonHref(
    productDetails.templateId,
    formDataObject,
    productDetails.productType,
  );
  checkoutButton.href = url;
}

async function updateDrawerContent(productDetails, formDataObject) {
  const drawer = document.querySelector('#pdpx-drawer');
  if (drawer.classList.contains('hidden')) {
    return;
  }
  if (productDetails.productType === 'zazzle_businesscard') {
    const mediaValue = productDetails.attributes.media.find(
      (v) => v.name === formDataObject.media,
    );
    drawer.innerHTML = '';
    await createDrawerContentPaperType(
      productDetails.attributes.media,
      'Paper Type',
      'media',
      null,
      productDetails,
      mediaValue.name,
      'paperType',
      drawer,
    );
  }
}

function createUpdatedSelectedValuesObject(
  updatedConfigurationOptions,
  formDataObject,
  quantity,
) {
  const selectedValuesObject = {};
  for (const [key, value] of Object.entries(
    updatedConfigurationOptions.product.attributes,
  )) {
    const valueName = value.values.find((v) => v.name === formDataObject[key]);
    if (valueName) {
      selectedValuesObject[key] = valueName.name;
    } else {
      selectedValuesObject[key] = value.values[0].name;
    }
  }
  selectedValuesObject.qty = quantity;
  return selectedValuesObject;
}

export default async function updateAllDynamicElements(productId) {
  const { templateId } = document.querySelector(
    '.pdpx-global-container',
  ).dataset;
  const form = document.querySelector('#pdpx-customization-inputs-form');
  const formData = new FormData(form);
  const formDataObject = Object.fromEntries(formData.entries());
  const quantity = formDataObject.qty;
  const parameters = formatProductOptionsToAPIParameters(formDataObject);
  const updatedConfigurationOptions = await fetchAPIData(
    productId,
    parameters,
    'changeoptions',
  );
  const updatedSelectedValuesObject = createUpdatedSelectedValuesObject(
    updatedConfigurationOptions,
    formDataObject,
    quantity,
  );
  const updatedParameters = formatProductOptionsToAPIParameters(
    updatedSelectedValuesObject,
  );
  const [
    productDetails,
    productPrice,
    productReviews,
    productRenditions,
    productShippingEstimates,
    UIStrings,
  ] = await Promise.all([
    fetchAPIData(productId, updatedParameters, 'getproduct'),
    fetchAPIData(productId, updatedParameters, 'getproductpricing'),
    fetchAPIData(productId, null, 'getreviews'),
    fetchAPIData(productId, updatedParameters, 'getproductrenditions'),
    fetchAPIData(productId, updatedParameters, 'getshippingestimates'),
    fetchUIStrings(),
  ]);
  const normalizeProductDetailsParametersObject = {
    productDetails: updatedConfigurationOptions,
    productPrice,
    productReviews,
    productRenditions,
    productShippingEstimates,
    quantity,
    templateId,
    UIStrings,
  };

  const normalizedProductDetails = await normalizeProductDetailObject(
    normalizeProductDetailsParametersObject,
  );
  for (const [key, value] of Object.entries(formDataObject)) {
    if (
      !normalizedProductDetails.attributes[key].some(
        (v) => v.name.toString() === value.toString(),
      )
    ) {
      formDataObject[key] = normalizedProductDetails.attributes[key][0].name;
    }
  }
  await updateCheckoutButton(normalizedProductDetails, formDataObject);
  await updateProductImages(normalizedProductDetails);
  await updateCustomizationOptions(normalizedProductDetails, formDataObject);
  await updateProductPrice(normalizedProductDetails);
  await updateProductDeliveryEstimate(normalizedProductDetails);
  await updateDrawerContent(normalizedProductDetails, formDataObject);
  // Publish to BlockMediator to trigger accordion updates
  BlockMediator.set('product:updated', {
    productDetails,
    formData: formDataObject,
  });
}
