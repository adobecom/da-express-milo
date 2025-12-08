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
    });
    const miniPillOptionImageContainer = createTag('button', {
      class: `pdpx-mini-pill-image-container ${isSelected ? 'selected' : ''}`,
      'aria-current': isSelected ? 'true' : 'false',
      'aria-checked': isSelected ? 'true' : 'false',
      type: 'button',
      'data-name': customizationOptions[i].name,
      'aria-label': customizationOptions[i].title,
    });
    miniPillOptionImageContainer.addEventListener('mouseenter', () => {
      const rect = miniPillOptionImageContainer.getBoundingClientRect();
      const containerRect = pillOptionsContainer.getBoundingClientRect();
      const elementLeft = rect.left - containerRect.left;
      const tooltipText = customizationOptions[i].title;
      const tooltipWidth = (tooltipText.length * 3) + 22;
      const buttonWidth = rect.width;

      if (elementLeft === 0) {
        miniPillOptionImageContainer.style.setProperty('--tooltip-position', `${tooltipWidth}px`);
        miniPillOptionImageContainer.style.setProperty('--tooltip-arrow-position', `${buttonWidth / 2}px`);
      }
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

  /*
  await createSimpleCarousel(
    '.pdpx-mini-pill-container',
    pillOptionsContainer,
    {
      ariaLabel: `${labelText} options`,
      centerActive: true,
      activeClass: 'selected',
    },
  );
  */

  container.append(
    labelAndCTAContainer,
    pillOptionsContainer,
    hiddenSelectInput,
  );
  return container;
}
