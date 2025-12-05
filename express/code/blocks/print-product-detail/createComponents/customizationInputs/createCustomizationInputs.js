import { getLibs } from '../../../../scripts/utils.js';
import createSegmentedMiniPillOptionsSelector from './createSegmentedMiniPillOptionsSelector.js';
import createMiniPillOptionsSelector from './createMiniPillOptionsSelector.js';
import createStandardSelector from './createStandardSelector.js';
import createPillOptionsSelector from './createPillOptionsSelector.js';

let createTag;

async function createBusinessCardInputs(container, productDetails, formDataObject = {}) {
  const paperTypeSelectorContainer = await createMiniPillOptionsSelector(productDetails.attributes.media, 'Paper Type', 'media', 'Compare Paper Types', productDetails, formDataObject?.media, 'paperType');
  const cornerStyleSelectorContainer = await createPillOptionsSelector(productDetails.attributes.cornerstyle, 'Corner style', 'cornerstyle', productDetails.id, formDataObject?.cornerstyle);
  const sizeSelectorContainer = await createPillOptionsSelector(productDetails.attributes.style, 'Resize business card', 'style', productDetails.id, formDataObject?.style);
  const quantitySelectorContainer = await createStandardSelector(productDetails.attributes.qty, 'Quantity', 'qty', productDetails, formDataObject, null);
  container.append(
    paperTypeSelectorContainer,
    cornerStyleSelectorContainer,
    sizeSelectorContainer,
    quantitySelectorContainer,
  );
}

async function createTShirtInputs(container, productDetails, formDataObject = {}) {
  const styleSelectorContainer = await createPillOptionsSelector(productDetails.attributes.style, 'T-Shirt', 'style', productDetails.id, formDataObject?.style);
  const colorSelectorContainer = await createSegmentedMiniPillOptionsSelector(productDetails.attributes.color, 'Shirt color', 'color', 'Learn More', productDetails, formDataObject?.color, 'printingProcess');
  const quantitySelectorContainer = await createStandardSelector(productDetails.attributes.qty, 'Quantity', 'qty', productDetails, formDataObject, null);
  const sizeSelectorContainer = await createStandardSelector(productDetails.attributes.size, 'Size', 'size', productDetails, formDataObject, 'Size chart');
  const pickerGroup = createTag('div', { class: 'picker-group' });
  pickerGroup.append(quantitySelectorContainer, sizeSelectorContainer);
  container.append(
    styleSelectorContainer,
    colorSelectorContainer,
    pickerGroup,
  );
}

const MINI_PILL_THRESHOLD = 3;

async function createDynamicPillSelector(
  options,
  label,
  inputName,
  productDetails,
  defaultValue,
  CTALinkText = null,
  drawerType = null,
) {
  if (options.length > MINI_PILL_THRESHOLD) {
    return createMiniPillOptionsSelector(
      options,
      label,
      inputName,
      CTALinkText,
      productDetails,
      defaultValue,
      drawerType,
    );
  }
  return createPillOptionsSelector(
    options,
    label,
    inputName,
    productDetails.id,
    defaultValue,
  );
}

async function createDefaultInputs(container, productDetails, formDataObject = {}) {
  if (productDetails.attributes.printquality) {
    const printQualitySelectorContainer = await createDynamicPillSelector(
      productDetails.attributes.printquality,
      'Print quality',
      'printquality',
      productDetails,
      formDataObject?.printquality,
    );
    container.append(printQualitySelectorContainer);
  }
  if (productDetails.attributes.cornerstyle) {
    const cornerStyleSelectorContainer = await createDynamicPillSelector(
      productDetails.attributes.cornerstyle,
      'Corner style',
      'cornerstyle',
      productDetails,
      formDataObject?.cornerstyle,
    );
    container.append(cornerStyleSelectorContainer);
  }
  if (productDetails.attributes.format) {
    const formatSelectorContainer = await createDynamicPillSelector(
      productDetails.attributes.format,
      'Format',
      'format',
      productDetails,
      formDataObject?.format,
    );
    container.append(formatSelectorContainer);
  }
  if (productDetails.attributes.fabric) {
    const fabricSelectorContainer = await createDynamicPillSelector(
      productDetails.attributes.fabric,
      'Fabric',
      'fabric',
      productDetails,
      formDataObject?.fabric,
    );
    container.append(fabricSelectorContainer);
  }
  if (productDetails.attributes.media) {
    const mediaSelectorContainer = await createDynamicPillSelector(
      productDetails.attributes.media,
      'Media',
      'media',
      productDetails,
      formDataObject?.media,
    );
    container.append(mediaSelectorContainer);
  }
  if (productDetails.attributes.size) {
    const sizeSelectorContainer = await createDynamicPillSelector(
      productDetails.attributes.size,
      'Size',
      'size',
      productDetails,
      formDataObject?.size,
    );
    container.append(sizeSelectorContainer);
  }
  if (productDetails.attributes.style) {
    const styleSelectorContainer = await createDynamicPillSelector(
      productDetails.attributes.style,
      'Style',
      'style',
      productDetails,
      formDataObject?.style,
    );
    container.append(styleSelectorContainer);
  }
  if (productDetails.attributes.color) {
    const colorSelectorContainer = await createDynamicPillSelector(
      productDetails.attributes.color,
      'Color',
      'color',
      productDetails,
      formDataObject?.color,
    );
    container.append(colorSelectorContainer);
  }
  if (productDetails.attributes.qty) {
    const quantitySelectorContainer = await createStandardSelector(
      productDetails.attributes.qty,
      'Quantity',
      'qty',
      productDetails,
      formDataObject,
      null,
    );
    container.append(quantitySelectorContainer);
  }
}

export default async function createCustomizationInputs(productDetails, formDataObject = {}) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  if (Object.keys(formDataObject).length === 0) {
    for (const [key, values] of Object.entries(productDetails.attributes)) {
      formDataObject[key] = values[0].name;
    }
  }
  const customizationInputsContainer = createTag('div', { class: 'pdpx-customization-inputs-container', id: 'pdpx-customization-inputs-container' });
  const customizationInputsForm = createTag('form', {
    id: 'pdpx-customization-inputs-form',
  });
  customizationInputsContainer.appendChild(customizationInputsForm);
  const productTypeToInputsMap = new Map([
    ['zazzle_shirt', createTShirtInputs],
  ]);
  const createInputsFunction = productTypeToInputsMap.get(productDetails.productType);
  if (createInputsFunction) {
    await createInputsFunction(customizationInputsForm, productDetails, formDataObject);
  } else {
    await createDefaultInputs(customizationInputsForm, productDetails, formDataObject);
  }
  return customizationInputsContainer;
}
