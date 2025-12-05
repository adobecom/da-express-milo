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

async function createMugInputs(container, productDetails, formDataObject = {}) {
  const sizeSelectorContainer = await createPillOptionsSelector(productDetails.attributes.size, 'Size', 'size', productDetails.id, formDataObject?.size);
  const styleSelectorContainer = await createMiniPillOptionsSelector(productDetails.attributes.style, 'Style', 'style', null, productDetails, formDataObject?.style, null);
  const colorSelectorContainer = await createMiniPillOptionsSelector(productDetails.attributes.color, 'Color', 'color', null, productDetails, formDataObject?.color, null);
  const quantitySelectorContainer = await createStandardSelector(productDetails.attributes.qty, 'Quantity', 'qty', productDetails, formDataObject, null);
  container.append(
    sizeSelectorContainer,
    styleSelectorContainer,
    colorSelectorContainer,
    quantitySelectorContainer,
  );
}

async function createDefaultInputs(container, productDetails, formDataObject = {}) {
  let sizeSelectorContainer = null;
  let styleSelectorContainer = null;
  let colorSelectorContainer = null;
  let quantitySelectorContainer = null;
  if (productDetails.attributes.media) {
    sizeSelectorContainer = await createPillOptionsSelector(productDetails.attributes.media, 'Media', 'media', productDetails.id, formDataObject?.media);
    container.append(sizeSelectorContainer);
  }

  if (productDetails.attributes.size) {
    sizeSelectorContainer = await createPillOptionsSelector(productDetails.attributes.size, 'Size', 'size', productDetails.id, formDataObject?.size);
    container.append(sizeSelectorContainer);
  }
  if (productDetails.attributes.style) {
    styleSelectorContainer = await createMiniPillOptionsSelector(productDetails.attributes.style, 'Style', 'style', null, productDetails, formDataObject?.style, null);
    container.append(styleSelectorContainer);
  }
  if (productDetails.attributes.color) {
    colorSelectorContainer = await createMiniPillOptionsSelector(productDetails.attributes.color, 'Color', 'color', null, productDetails, formDataObject?.color, null);
    container.append(colorSelectorContainer);
  }
  if (productDetails.attributes.qty) {
    quantitySelectorContainer = await createStandardSelector(productDetails.attributes.qty, 'Quantity', 'qty', productDetails, formDataObject, null);
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
    ['zazzle_businesscard', createBusinessCardInputs],
    ['zazzle_shirt', createTShirtInputs],
    ['zazzle_mug', createMugInputs],
  ]);
  const createInputsFunction = productTypeToInputsMap.get(productDetails.productType);
  if (createInputsFunction) {
    await createInputsFunction(customizationInputsForm, productDetails, formDataObject);
  } else {
    await createDefaultInputs(customizationInputsForm, productDetails, formDataObject);
  }
  return customizationInputsContainer;
}
