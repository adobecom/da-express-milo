import { getLibs } from '../../../../scripts/utils.js';
import createSegmentedMiniPillOptionsSelector from './createSegmentedMiniPillOptionsSelector.js';
import createMiniPillOptionsSelector from './createMiniPillOptionsSelector.js';
import createStandardSelector from './createStandardSelector.js';
import createPillOptionsSelector from './createPillOptionsSelector.js';

let createTag;

async function createDynamicPillSelector(argumentObject) {
  const miniPillThreshold = 3;
  if (
    argumentObject.productDetails.productType === 'zazzle_shirt'
    && argumentObject.attributeName === 'size'
  ) {
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
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  if (Object.keys(formDataObject).length === 0) {
    for (const [key, values] of Object.entries(productDetails.attributes)) {
      formDataObject[key] = values[0].name;
    }
  }
  const customizationInputsContainer = createTag('div', {
    class: 'pdpx-customization-inputs-container',
    id: 'pdpx-customization-inputs-container',
  });
  const customizationInputsForm = createTag('form', {
    id: 'pdpx-customization-inputs-form',
  });
  const selectorContainers = [];
  const defaultAttributes = Object.keys(productDetails.attributes);
  const qtyIndex = defaultAttributes.indexOf('qty');
  if (qtyIndex !== -1) {
    defaultAttributes.push(defaultAttributes.splice(qtyIndex, 1)[0]);
  }

  const attributesObject = {
    zazzle_businesscard: ['style', 'cornerstyle', 'media', 'qty'],
    zazzle_shirt: ['style', 'color', 'size', 'qty'],
    default: defaultAttributes,
  };
  const orderObject = {
    printquality: 'Print quality',
    cornerstyle: 'Corner style',
    qty: 'Quantity',
  };
  const attributesObjectOrDefault = attributesObject[productDetails.productType]
  || attributesObject.default;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < attributesObjectOrDefault.length; i++) {
    const key = attributesObjectOrDefault[i];
    const labelText = orderObject[key] || key.charAt(0).toUpperCase() + key.slice(1);
    const isTriBlend = formDataObject.style === 'triblend_shortsleeve3413';
    const isBusinessCard = productDetails.productType === 'zazzle_businesscard';
    let CTALinkText = null;
    let drawerType = null;
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
    if (
      isBusinessCard
      && key === 'media'
    ) {
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
    if (key !== 'addon') {
      const selectorContainer = await createDynamicPillSelector(argumentObject);
      selectorContainers.push(selectorContainer);
    }
  }
  customizationInputsForm.append(...selectorContainers);
  customizationInputsContainer.appendChild(customizationInputsForm);
  return customizationInputsContainer;
}
