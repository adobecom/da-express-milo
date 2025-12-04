import { getLibs } from '../../../../scripts/utils.js';
import updateAllDynamicElements from '../../utilities/event-handlers.js';
import openDrawer from '../drawerContent/openDrawer.js';
import createSegmentedMiniPillOptionsSelector from './createSegmentedMiniPillOptionsSelector.js';
import createMiniPillOptionsSelector from './createMiniPillOptionsSelector.js';
import { createPicker } from '../../../../scripts/widgets/picker.js';

let createTag;

async function createStandardSelector(
  customizationOptions,
  labelText,
  hiddenSelectInputName,
  productDetails,
  formDataObject,
  CTAText,
) {
  const options = customizationOptions.map((option) => ({
    value: option.name,
    text: option.title,
  }));
  const defaultValue = formDataObject[hiddenSelectInputName] || customizationOptions[0].name;
  const pickerContainer = await createPicker({
    id: `pdpx-picker-${hiddenSelectInputName}`,
    name: hiddenSelectInputName,
    label: labelText,
    labelPosition: 'side',
    options,
    defaultValue,
    onChange: () => {
      updateAllDynamicElements(productDetails.id);
    },
  });
  let isTriBlend = false;
  if (productDetails.productType === 'zazzle_shirt') {
    isTriBlend = formDataObject.style === 'triblend_shortsleeve3413';
  }
  if (CTAText && isTriBlend) {
    const wrapper = createTag('div', { class: 'picker-with-link' });
    wrapper.appendChild(pickerContainer);
    const standardSelectorCTA = createTag('button', { class: 'picker-link', type: 'button' }, CTAText);
    standardSelectorCTA.addEventListener('click', async () => {
      await openDrawer(customizationOptions, labelText, hiddenSelectInputName, productDetails, defaultValue, 'sizeChart');
    });
    wrapper.appendChild(standardSelectorCTA);
    return wrapper;
  }
  return pickerContainer;
}

function createPillOptionsSelector(
  customizationOptions,
  labelText,
  hiddenSelectInputName,
  productId,
  defaultValue,
) {
  const pillSelectorContainer = createTag('div', { class: 'pdpx-pill-selector-container' });
  const pillSelectorContainerLabel = createTag('span', { class: 'pdpx-pill-selector-label' }, labelText);
  pillSelectorContainer.appendChild(pillSelectorContainerLabel);
  const pillSelectorOptionsContainer = createTag('div', { class: 'pdpx-pill-selector-options-container' });
  const hiddenSelectInput = createTag('select', {
    class: 'pdpx-hidden-select-input hidden',
    name: hiddenSelectInputName,
    id: `pdpx-hidden-input-${hiddenSelectInputName}`,
    value: defaultValue,
    'aria-hidden': 'true',
  });
  let cachedAllPillContainers = null;
  // eslint-disable-next-line max-len
  const createPillClickHandler = (currentHiddenSelectInput, currentPillSelectorOptionsContainer, currentProductId, currentHiddenSelectInputName) => async (element) => {
    if (!cachedAllPillContainers) {
      cachedAllPillContainers = currentPillSelectorOptionsContainer.querySelectorAll('.pdpx-pill-container');
    }
    const clickedPill = element.currentTarget;
    cachedAllPillContainers.forEach((p) => {
      p.classList.remove('selected');
      p.removeAttribute('aria-current');
      p.setAttribute('aria-checked', 'false');
      p.classList.remove('tooltip-left-edge', 'tooltip-right-edge');
    });
    clickedPill.classList.add('selected');
    clickedPill.setAttribute('aria-current', 'true');
    clickedPill.setAttribute('aria-checked', 'true');
    const clickedRect = clickedPill.getBoundingClientRect();
    const clickedContainer = clickedPill.closest('.pdpx-customization-inputs-container') || document.body;
    const clickedContainerRect = clickedContainer.getBoundingClientRect();
    const threshold = 150;
    clickedPill.classList.remove('tooltip-left-edge', 'tooltip-right-edge');
    if (clickedRect.left - clickedContainerRect.left < threshold) {
      clickedPill.classList.add('tooltip-left-edge');
    } else if (clickedContainerRect.right - clickedRect.right < threshold) {
      clickedPill.classList.add('tooltip-right-edge');
    }
    const pillName = clickedPill.getAttribute('data-name');
    currentHiddenSelectInput.querySelectorAll('option').forEach((opt) => {
      opt.selected = false;
    });
    const optionToSelect = currentHiddenSelectInput.querySelector(`option[value="${pillName}"]`);
    if (optionToSelect) {
      optionToSelect.selected = true;
      currentHiddenSelectInput.value = pillName;
    } else {
      currentHiddenSelectInput.value = pillName;
    }
    const allInputs = document.querySelectorAll(`[name="${currentHiddenSelectInputName}"]`);
    allInputs.forEach((input) => {
      if (input.closest('#pdpx-drawer')) {
        return;
      }
      input.value = pillName;
      if (input.tagName === 'SELECT') {
        input.querySelectorAll('option').forEach((opt) => {
          opt.selected = false;
        });
        const selectOption = input.querySelector(`option[value="${pillName}"]`);
        if (selectOption) {
          selectOption.selected = true;
        }
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
    await updateAllDynamicElements(currentProductId);
  };
  const createPillMouseEnterHandler = () => (e) => {
    const btn = e.currentTarget;
    const btnRect = btn.getBoundingClientRect();
    const container = btn.closest('.pdpx-customization-inputs-container') || document.body;
    const containerRect = container.getBoundingClientRect();
    const threshold = 150;
    btn.classList.remove('tooltip-left-edge', 'tooltip-right-edge');
    if (btnRect.left - containerRect.left < threshold) {
      btn.classList.add('tooltip-left-edge');
    } else if (containerRect.right - btnRect.right < threshold) {
      btn.classList.add('tooltip-right-edge');
    }
  };
  for (let i = 0; i < customizationOptions.length; i += 1) {
    const option = createTag('option', { value: customizationOptions[i].name }, customizationOptions[i].title);
    const isSelected = customizationOptions[i].name === defaultValue;
    hiddenSelectInput.appendChild(option);
    const ariaChecked = isSelected ? 'true' : 'false';
    const pillContainer = createTag('button', {
      class: `pdpx-pill-container ${isSelected ? 'selected' : ''}`,
      type: 'button',
      'data-name': customizationOptions[i].name,
      'data-title': customizationOptions[i].title,
      role: 'radio',
      'aria-label': customizationOptions[i].title,
      'aria-checked': ariaChecked,
    });
    const inputPillImageContainer = createTag('div', { class: 'pdpx-pill-image-container' });
    const inputPillImage = createTag('img', {
      class: 'pdpx-pill-image',
      src: customizationOptions[i].thumbnail,
      width: '54',
      height: '54',
      alt: `${labelText}: ${customizationOptions[i].title}`,
      decoding: 'async',
      'aria-hidden': 'true',
    });
    inputPillImageContainer.appendChild(inputPillImage);
    const inputPillTextContainer = createTag('div', { class: 'pdpx-pill-text-container' });
    inputPillTextContainer.append(
      createTag('span', { class: 'pdpx-pill-text-name' }, customizationOptions[i].title),
      createTag('span', { class: 'pdpx-pill-text-price' }, customizationOptions[i].priceAdjustment),
    );
    pillContainer.append(inputPillImageContainer, inputPillTextContainer);
    pillSelectorOptionsContainer.appendChild(pillContainer);
    pillContainer.addEventListener('click', createPillClickHandler(hiddenSelectInput, pillSelectorOptionsContainer, productId, hiddenSelectInputName));
    pillContainer.addEventListener('mouseenter', createPillMouseEnterHandler());
  }
  hiddenSelectInput.value = defaultValue;
  const selectedPill = pillSelectorOptionsContainer.querySelector(`.pdpx-pill-container[data-name="${defaultValue}"]`);
  if (selectedPill) {
    selectedPill.setAttribute('aria-current', 'true');
    selectedPill.setAttribute('aria-checked', 'true');
  }
  // Cache DOM query after all pills are added
  cachedAllPillContainers = pillSelectorOptionsContainer.querySelectorAll('.pdpx-pill-container');
  pillSelectorContainer.append(pillSelectorOptionsContainer, hiddenSelectInput);
  return pillSelectorContainer;
}

export async function createBusinessCardInputs(container, productDetails, formDataObject = {}) {
  const paperTypeSelectorContainer = await createMiniPillOptionsSelector(productDetails.attributes.media, 'Paper Type', 'media', 'Compare Paper Types', productDetails, formDataObject?.media, 'paperType');
  const cornerStyleSelectorContainer = createPillOptionsSelector(productDetails.attributes.cornerstyle, 'Corner style', 'cornerstyle', productDetails.id, formDataObject?.cornerstyle);
  const sizeSelectorContainer = createPillOptionsSelector(productDetails.attributes.style, 'Resize business card', 'style', productDetails.id, formDataObject?.style);
  const quantitySelectorContainer = await createStandardSelector(productDetails.attributes.qty, 'Quantity', 'qty', productDetails, formDataObject, null);
  container.append(
    paperTypeSelectorContainer,
    cornerStyleSelectorContainer,
    sizeSelectorContainer,
    quantitySelectorContainer,
  );
}

export async function createTShirtInputs(container, productDetails, formDataObject = {}) {
  const styleSelectorContainer = createPillOptionsSelector(productDetails.attributes.style, 'T-Shirt', 'style', productDetails.id, formDataObject?.style);
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

export default async function createCustomizationInputs(productDetails, formDataObject = {}) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  if (Object.keys(formDataObject).length === 0) {
    for (const [key, values] of Object.entries(productDetails.attributes)) {
      formDataObject[key] = values[0].name;
    }
  }
  const customizationInputsContainer = createTag('div', { class: 'pdpx-customization-inputs-container', id: 'pdpx-customization-inputs-container' });
  const attributeKeys = Object.keys(productDetails.attributes || {}).sort().join(',');
  const customizationInputsForm = createTag('form', {
    id: 'pdpx-customization-inputs-form',
    'data-attribute-keys': attributeKeys,
  });
  customizationInputsContainer.appendChild(customizationInputsForm);
  const productTypeToInputsMap = new Map([
    ['zazzle_businesscard', createBusinessCardInputs],
    ['zazzle_shirt', createTShirtInputs],
  ]);
  const createInputsFunction = productTypeToInputsMap.get(productDetails.productType);
  await createInputsFunction(customizationInputsForm, productDetails, formDataObject);
  return customizationInputsContainer;
}
