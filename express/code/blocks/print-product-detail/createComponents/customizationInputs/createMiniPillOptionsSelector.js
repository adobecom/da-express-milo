import { getLibs } from '../../../../scripts/utils.js';
import updateAllDynamicElements from '../../utilities/event-handlers.js';
import openDrawer from '../drawerContent/openDrawer.js';
import createSimpleCarousel from '../../../../scripts/widgets/simple-carousel.js';

let createTag;
function positionTooltip(target, tooltipText) {
  const pill = target.getBoundingClientRect();
  const pillTop = pill.top;
  const tooltipWidth = (tooltipText.length * 3) + 12;
  const pillCenter = pill.left + (pill.width / 2);
  target.style.setProperty('--tooltip-top', `${pillTop - 42}px`);
  target.style.setProperty('--tooltip-left', `${pillCenter - tooltipWidth}px`);
  target.style.setProperty('--arrow-top', `${pillTop - 6}px`);
  target.style.setProperty('--arrow-left', `${pillCenter}px`);
}

export default async function createMiniPillOptionsSelector(argumentObject) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const {
    customizationOptions,
    labelText,
    attributeName,
    productDetails,
    defaultValue,
    CTALinkText,
  } = argumentObject;

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
      await openDrawer(argumentObject);
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
    name: attributeName,
    id: `pdpx-hidden-input-${attributeName}`,
  });
  for (let i = 0; i < customizationOptions?.length; i += 1) {
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
    const miniPillContainer = createTag('div', {
      class: 'pdpx-mini-pill-container',
    });
    const miniPillButton = createTag('button', {
      class: `pdpx-mini-pill-image-container ${isSelected ? 'selected' : ''}`,
      'aria-current': isSelected ? 'true' : 'false',
      'aria-checked': isSelected ? 'true' : 'false',
      type: 'button',
      'data-name': customizationOptions[i].name,
      'aria-label': customizationOptions[i].title,
    });
    miniPillContainer.addEventListener('mouseenter', (event) => {
      positionTooltip(event.currentTarget, customizationOptions[i].title);
    });
    const miniPillImage = createTag('img', {
      class: 'pdpx-mini-pill-image',
      alt: customizationOptions[i].title,
      src: customizationOptions[i].thumbnail,
    });
    miniPillButton.appendChild(miniPillImage);
    const miniPillTextContainer = createTag('div', {
      class: 'pdpx-mini-pill-text-container',
    });
    const miniPillPrice = createTag(
      'span',
      { class: 'pdpx-mini-pill-price' },
      customizationOptions[i].priceAdjustment,
    );
    miniPillButton.addEventListener('click', async () => {
      hiddenSelectInput.value = customizationOptions[i].name;
      await updateAllDynamicElements(productDetails.id);
    });
    miniPillTextContainer.appendChild(miniPillPrice);
    miniPillContainer.append(
      miniPillButton,
      miniPillTextContainer,
    );
    pillOptionsContainer.appendChild(miniPillContainer);
  }
  hiddenSelectInput.value = defaultValue;

  await createSimpleCarousel(
    '.pdpx-mini-pill-container',
    pillOptionsContainer,
    {
      ariaLabel: `${labelText} options`,
      centerActive: true,
      activeClass: 'selected',
    },
  );

  container.append(
    labelAndCTAContainer,
    pillOptionsContainer,
    hiddenSelectInput,
  );
  return container;
}
