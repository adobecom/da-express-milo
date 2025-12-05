import { getLibs } from '../../../../scripts/utils.js';
import updateAllDynamicElements from '../../utilities/event-handlers.js';
import openDrawer from '../drawerContent/openDrawer.js';
import createSimpleCarousel from '../../../../scripts/widgets/simple-carousel.js';

let createTag;

export default async function createMiniPillOptionsSelector(
  customizationOptions,
  labelText,
  hiddenSelectInputName,
  CTALinkText,
  productDetails,
  defaultValue,
  drawerType,
) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const container = createTag('div', {
    class: 'pdpx-pill-selector-container',
  });
  const labelAndCTAContainer = createTag('div', {
    class: 'pdpx-pill-selector-label-container',
  });
  const labelContainer = createTag('div', {
    class: 'pdpx-pill-selector-label-name-container',
  });
  const labelTextElement = createTag(
    'span',
    { class: 'pdpx-pill-selector-label-label' },
    `${labelText}: `,
  );
  const labelValueElement = createTag('span', {
    class: 'pdpx-pill-selector-label-name',
  });
  labelContainer.append(
    labelTextElement,
    labelValueElement,
  );
  labelAndCTAContainer.appendChild(
    labelContainer,
  );
  if (CTALinkText) {
    const CTALink = createTag(
      'button',
      { class: 'pdpx-pill-selector-label-compare-link', type: 'button' },
      CTALinkText,
    );
    CTALink.addEventListener('click', async () => {
      await openDrawer(
        customizationOptions,
        labelText,
        hiddenSelectInputName,
        productDetails,
        defaultValue,
        drawerType,
      );
    });
    labelAndCTAContainer.appendChild(
      CTALink,
    );
  }
  const pillOptionsContainer = createTag('div', {
    class: 'pdpx-mini-pill-selector-options-container',
  });
  const hiddenSelectInput = createTag('select', {
    class: 'pdpx-hidden-select-input hidden',
    name: hiddenSelectInputName,
    id: `pdpx-hidden-input-${hiddenSelectInputName}`,
  });
  for (let i = 0; i < customizationOptions.length; i += 1) {
    const hiddenSelectInputOption = createTag(
      'option',
      { value: customizationOptions[i].name },
      customizationOptions[i].title,
    );
    hiddenSelectInput.appendChild(hiddenSelectInputOption);
    const isSelected = customizationOptions[i].name === defaultValue;
    if (isSelected) {
      hiddenSelectInput.value = customizationOptions[i].name;
      labelValueElement.textContent = customizationOptions[i].title;
    }
    const miniPillOption = createTag('div', {
      class: 'pdpx-mini-pill-container',
      'data-tooltip': customizationOptions[i].title,
    });
    const miniPillOptionImageContainer = createTag('button', {
      class: `pdpx-mini-pill-image-container ${isSelected ? 'selected' : ''}`,
      'aria-current': isSelected ? 'true' : 'false',
      'aria-checked': isSelected ? 'true' : 'false',
      type: 'button',
      'data-name': customizationOptions[i].name,
      'data-title': customizationOptions[i].title,
    });
    const miniPillOptionImage = createTag('img', {
      class: 'pdpx-mini-pill-image',
      alt: customizationOptions[i].title,
      src: customizationOptions[i].thumbnail,
    });
    miniPillOptionImageContainer.appendChild(miniPillOptionImage);
    const miniPillOptionTextContainer = createTag('div', {
      class: 'pdpx-mini-pill-text-container',
    });
    const miniPillOptionPrice = createTag(
      'span',
      { class: 'pdpx-mini-pill-price' },
      customizationOptions[i].priceAdjustment,
    );
    miniPillOptionImageContainer.addEventListener('click', async () => {
      hiddenSelectInput.value = customizationOptions[i].name;
      await updateAllDynamicElements(productDetails.id);
    });
    miniPillOptionTextContainer.appendChild(miniPillOptionPrice);
    miniPillOption.append(
      miniPillOptionImageContainer,
      miniPillOptionTextContainer,
    );
    pillOptionsContainer.appendChild(miniPillOption);
  }
  hiddenSelectInput.value = defaultValue;
  container.append(
    labelAndCTAContainer,
    pillOptionsContainer,
    hiddenSelectInput,
  );
  return container;
}
