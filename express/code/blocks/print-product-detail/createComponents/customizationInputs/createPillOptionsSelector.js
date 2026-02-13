import { getLibs } from '../../../../scripts/utils.js';
import updateAllDynamicElements from '../../utilities/event-handlers.js';
import { trackPrintAddonInteraction } from '../../../../scripts/instrument.js';

let createTag;

export default async function createPillOptionsSelector(argumentObject) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const {
    customizationOptions,
    labelText,
    attributeName,
    productDetails,
    defaultValue,
  } = argumentObject;
  const container = createTag('div', { class: 'pdpx-pill-selector-container' });
  const labelElement = createTag(
    'span',
    { class: 'pdpx-pill-selector-label' },
    labelText,
  );
  const pillOptionsContainer = createTag('div', {
    class: 'pdpx-pill-selector-options-container',
  });
  const hiddenSelectInput = createTag('select', {
    class: 'pdpx-hidden-select-input hidden',
    name: attributeName,
    id: `pdpx-hidden-input-${attributeName}`,
    value: defaultValue,
    'aria-hidden': 'true',
  });
  for (let i = 0; i < customizationOptions.length; i += 1) {
    const option = createTag(
      'option',
      { value: customizationOptions[i].name },
      customizationOptions[i].title,
    );
    const isSelected = customizationOptions[i].name === defaultValue;

    hiddenSelectInput.appendChild(option);
    const optionPill = createTag('button', {
      class: `pdpx-pill-container ${isSelected ? 'selected' : ''}`,
      type: 'button',
      'data-name': customizationOptions[i].name,
      'data-title': customizationOptions[i].title,
      role: 'radio',
      'aria-label': customizationOptions[i].title,
      'aria-checked': isSelected ? 'true' : 'false',
      'aria-current': isSelected ? 'true' : 'false',
      'aria-pressed': isSelected ? 'true' : 'false',
    });
    const optionPillImageContainer = createTag('div', {
      class: 'pdpx-pill-image-container',
    });
    const optionPillImage = createTag('img', {
      class: 'pdpx-pill-image',
      src: customizationOptions[i].thumbnail,
      width: '54',
      height: '54',
      alt: `${labelText}: ${customizationOptions[i].title}`,
      decoding: 'async',
      'aria-hidden': 'true',
    });
    optionPillImageContainer.appendChild(optionPillImage);
    const inputPillTextContainer = createTag('div', {
      class: 'pdpx-pill-text-container',
    });
    inputPillTextContainer.append(
      createTag(
        'span',
        { class: 'pdpx-pill-text-name' },
        customizationOptions[i].title,
      ),
      createTag(
        'span',
        { class: 'pdpx-pill-text-price' },
        customizationOptions[i].priceAdjustment,
      ),
    );
    optionPill.addEventListener('click', async () => {
      hiddenSelectInput.value = customizationOptions[i].name;
      await updateAllDynamicElements(productDetails.id);
      trackPrintAddonInteraction({
        action_type: 'button',
        productId: productDetails.id,
        templateId: productDetails.templateId,
        productType: productDetails.productType,
        attributeName,
        optionName: customizationOptions[i].title,
        optionId: customizationOptions[i].name,
        interactionType: 'click',
      }).catch(() => {});
    });
    optionPill.append(optionPillImageContainer, inputPillTextContainer);
    pillOptionsContainer.appendChild(optionPill);
  }
  hiddenSelectInput.value = defaultValue;
  container.append(
    labelElement,
    pillOptionsContainer,
    hiddenSelectInput,
  );
  return container;
}
