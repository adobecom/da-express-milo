import { getLibs } from '../../../../scripts/utils.js';
import updateAllDynamicElements from '../../utilities/event-handlers.js';
import openDrawer from '../drawerContent/openDrawer.js';
import createSimpleCarousel from '../../../../scripts/widgets/simple-carousel.js';
import { trackPrintAddonInteraction } from '../../../../scripts/instrument.js';

let createTag;
function positionTooltip(target, tooltipText) {
  const pill = target.getBoundingClientRect();
  const pillTop = pill.top;
  const tooltipWidth = tooltipText.length * 3 + 12;
  const pillCenter = pill.left + pill.width / 2;
  target.style.setProperty('--tooltip-top', `${pillTop - 42}px`);
  target.style.setProperty('--tooltip-left', `${pillCenter - tooltipWidth}px`);
  target.style.setProperty('--arrow-top', `${pillTop - 6}px`);
  target.style.setProperty('--arrow-left', `${pillCenter}px`);
}

export default async function createSegmentedMiniPillOptionsSelector(
  argumentObject,
) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const {
    customizationOptions,
    labelText,
    attributeName,
    productDetails,
    defaultValue,
    CTALinkText,
  } = argumentObject;
  let filterProperty = null;
  let filterPropertyOptions = [];
  const filteredOptions = [];

  if (productDetails.productType === 'zazzle_shirt') {
    filterProperty = 'printingProcess';
    filterPropertyOptions = [
      {
        name: 'classic',
        title: 'Classic Printing: No Underbase',
        labelSuffix: '(no underbase)',
      },
      {
        name: 'vivid',
        title: 'Vivid Printing: White Underbase',
        labelSuffix: '(white underbase)',
      },
    ];
    for (let i = 0; i < filterPropertyOptions.length; i += 1) {
      filteredOptions.push(
        customizationOptions.filter(
          (option) => option[filterProperty] === filterPropertyOptions[i].name,
        ),
      );
    }
  }
  if (filteredOptions.length === 0) {
    filteredOptions.push(customizationOptions);
  }
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
  labelContainer.append(labelTextElement, labelValueElement);
  labelAndCTAContainer.appendChild(labelContainer);
  if (CTALinkText) {
    const CTALink = createTag(
      'button',
      { class: 'pdpx-pill-selector-label-compare-link', type: 'button' },
      CTALinkText,
    );
    CTALink.addEventListener('click', async () => {
      await openDrawer(argumentObject);
    });
    labelAndCTAContainer.appendChild(CTALink);
  }
  const sectionsContainer = createTag('div', {
    class: 'pdpx-mini-pill-sections-container',
  });
  const hiddenSelectInput = createTag('select', {
    class: 'pdpx-hidden-select-input hidden',
    name: attributeName,
    id: `pdpx-hidden-input-${attributeName}`,
  });
  for (let i = 0; i < filteredOptions.length; i += 1) {
    const sectionContainer = createTag('div', {
      class: 'pdpx-mini-pill-section-container',
    });
    const sectionOptionsContainer = createTag('div', {
      class: 'pdpx-mini-pill-section-options-container',
    });
    const sectionLabel = createTag(
      'span',
      {
        class: 'pdpx-pill-selector-section-label',
      },
      filterPropertyOptions[i].title,
    );
    sectionContainer.appendChild(sectionLabel);

    for (let j = 0; j < customizationOptions.length; j += 1) {
      if (customizationOptions[j][filterProperty] !== filterPropertyOptions[i].name) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const hiddenSelectInputOption = createTag(
        'option',
        { value: customizationOptions[j].name },
        customizationOptions[j].title,
      );
      hiddenSelectInput.appendChild(hiddenSelectInputOption);
      const isSelected = customizationOptions[j].name === defaultValue;
      if (isSelected) {
        hiddenSelectInput.value = customizationOptions[j].name;
        labelValueElement.textContent = `${customizationOptions[j].title} ${filterPropertyOptions[i].labelSuffix}`;
      }
      const miniPillContainer = createTag('div', {
        class: 'pdpx-mini-pill-container',
      });
      const miniPillButton = createTag('button', {
        class: `pdpx-mini-pill-image-container ${isSelected ? 'selected' : ''}`,
        'aria-current': isSelected ? 'true' : 'false',
        'aria-checked': isSelected ? 'true' : 'false',
        type: 'button',
        'data-name': customizationOptions[j].name,
        'aria-label': customizationOptions[j].title,
      });
      miniPillContainer.addEventListener('mouseenter', (event) => {
        positionTooltip(event.currentTarget, customizationOptions[j].title);
      });
      const miniPillImage = createTag('img', {
        class: 'pdpx-mini-pill-image',
        alt: customizationOptions[j].title,
        src: customizationOptions[j].thumbnail,
      });
      miniPillButton.appendChild(miniPillImage);
      miniPillButton.addEventListener('click', async () => {
        hiddenSelectInput.value = customizationOptions[j].name;
        // non-blocking analytics call for join metrics (includes optionName & optionId)
        trackPrintAddonInteraction({
          productId: productDetails.id,
          templateId: productDetails.templateId,
          productType: productDetails.productType,
          attributeName,
          optionName: customizationOptions[j].title,
          optionId: customizationOptions[j].name,
          interactionType: 'click',
        }).catch(() => {});
        await updateAllDynamicElements(productDetails.id);
      });
      const miniPillTextContainer = createTag('div', {
        class: 'pdpx-mini-pill-text-container',
      });
      const miniPillPrice = createTag(
        'span',
        { class: 'pdpx-mini-pill-price' },
        customizationOptions[j].priceAdjustment,
      );
      miniPillTextContainer.appendChild(miniPillPrice);
      miniPillContainer.append(miniPillButton, miniPillTextContainer);
      sectionOptionsContainer.appendChild(miniPillContainer);
    }
    sectionContainer.appendChild(sectionOptionsContainer);
    sectionsContainer.appendChild(sectionContainer);
    await createSimpleCarousel(
      '.pdpx-mini-pill-container',
      sectionOptionsContainer,
      {
        ariaLabel: `${labelText} options`,
        centerActive: true,
        activeClass: 'selected',
      },
    );
  }
  hiddenSelectInput.value = defaultValue;

  container.append(labelAndCTAContainer, sectionsContainer, hiddenSelectInput);
  return container;
}
