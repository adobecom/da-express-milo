import { getLibs } from '../../../../scripts/utils.js';
import createSegmentedMiniPillOptionsSelector from './createSegmentedMiniPillOptionsSelector.js';
import createMiniPillOptionsSelector from './createMiniPillOptionsSelector.js';
import createStandardSelector from './createStandardSelector.js';
import createPillOptionsSelector from './createPillOptionsSelector.js';

let createTag;

async function createDynamicPillSelector(argumentObject) {
  const miniPillThreshold = 3;
  if (argumentObject.productDetails.productType === 'zazzle_shirt' && argumentObject.attributeName === 'size') {
    return createStandardSelector(argumentObject);
  }
  if (argumentObject.attributeName === 'qty') {
    return createStandardSelector(argumentObject);
  }
  if (argumentObject.customizationOptions.length > miniPillThreshold) {
    return createMiniPillOptionsSelector(argumentObject);
  }
  return createPillOptionsSelector(argumentObject);
}

export default async function createCustomizationInputs(
  productDetails,
  formDataObject = {},
) {
  if (Object.keys(formDataObject).length === 0) {
    for (const [key, values] of Object.entries(productDetails.attributes)) {
      formDataObject[key] = values[0].name;
    }
  }
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const customizationInputsContainer = createTag('div', {
    class: 'pdpx-customization-inputs-container',
    id: 'pdpx-customization-inputs-container',
  });
  const customizationInputsForm = createTag('form', {
    id: 'pdpx-customization-inputs-form',
  });
  const selectorContainers = [];
  const orderObject = {
    printquality: 'Print quality',
    cornerstyle: 'Corner style',
    qty: 'Quantity',
  };
  let CTALinkText = null;
  let drawerType = null;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < Object.keys(productDetails.attributes).length; i++) {
    const key = Object.keys(productDetails.attributes)[i];
    const labelText = orderObject[key] || key.charAt(0).toUpperCase() + key.slice(1);
    const isTriBlend = formDataObject.style === 'triblend_shortsleeve3413';
    if (productDetails.productType === 'zazzle_shirt') {
      if (key === 'color') {
        CTALinkText = 'Learn More';
        drawerType = 'printingProcess';
      }
      if (key === 'size' && isTriBlend) {
        CTALinkText = 'Size Chart';
        drawerType = 'sizeChart';
      }
    }
    if (productDetails.productType === 'zazzle_businesscard' && key === 'media') {
      CTALinkText = 'Compare Paper Types';
      drawerType = 'paperType';
    }
    const argumentObject = {
      customizationOptions: productDetails.attributes[key],
      labelText,
      attributeName: key,
      productDetails,
      defaultValue: formDataObject[key],
      CTALinkText,
      drawerType,
    };
    // eslint-disable-next-line no-continue
    if (key === 'qty' || key === 'addon') continue;
    const selectorContainer = await createDynamicPillSelector(argumentObject);
    selectorContainers.push(selectorContainer);
  }
  if (productDetails.attributes.qty) {
    const argumentObject = {
      customizationOptions: productDetails.attributes.qty,
      labelText: orderObject.qty,
      attributeName: 'qty',
      productDetails,
      defaultValue: formDataObject.qty,
      CTAText: null,
    };
    const quantitySelectorContainer = await createDynamicPillSelector(argumentObject);
    selectorContainers.push(quantitySelectorContainer);
  }
  customizationInputsForm.append(...selectorContainers);
  customizationInputsContainer.appendChild(customizationInputsForm);
  return customizationInputsContainer;
}
