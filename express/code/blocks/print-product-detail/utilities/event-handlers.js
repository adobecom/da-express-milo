import fetchAPIData, { fetchUIStrings } from '../fetchData/fetchProductDetails.js';
import { formatDeliveryEstimateDateRange, convertImageSize, createHeroImageSrcset } from './utility-functions.js';
import { normalizeProductDetailObject } from './data-formatting.js';
import createCustomizationInputs from '../createComponents/customizationInputs/createCustomizationInputs.js';
import BlockMediator from '../../../scripts/block-mediator.min.js';
import { createCheckoutButtonHref } from '../createComponents/createProductDetailsSection.js';
import { createPriceLockup } from '../createComponents/createProductInfoHeadingSection.js';
import { createProductThumbnailCarousel } from '../createComponents/createProductImagesContainer.js';

function formatProductOptionsToAPIParameters(formDataObject) {
  const parameters = {};
  for (const [key, value] of Object.entries(formDataObject)) {
    if (key !== 'qty') {
      parameters[key] = value;
    }
  }
  parameters.productOptions = Object.entries(parameters).map(([key, value]) => `${key}=${value}`).join('&');
  parameters.qty = formDataObject.qty;
  const finalParameters = {};
  finalParameters.productOptions = encodeURIComponent(parameters.productOptions);
  finalParameters.qty = parameters.qty;
  return finalParameters;
}

async function updateProductPrice(productDetails) {
  const priceInfoContainer = document.getElementById('pdpx-price-info-container');
  const newPriceLockup = await createPriceLockup(productDetails);
  priceInfoContainer.replaceWith(newPriceLockup);
}

async function updateProductImages(productDetails) {
  if (!productDetails?.realViews || Object.keys(productDetails.realViews).length === 0) {
    return;
  }

  const heroImg = document.getElementById('pdpx-product-hero-image');
  if (!heroImg) return;

  const firstImageType = Object.keys(productDetails.realViews)[0];
  let imageType;
  if (heroImg.dataset.imageType && productDetails.realViews[heroImg.dataset.imageType]) {
    imageType = heroImg.dataset.imageType;
  } else {
    imageType = firstImageType;
  }
  const newHeroImgSrc = productDetails.realViews[imageType];

  if (newHeroImgSrc) {
    const newSrc = convertImageSize(newHeroImgSrc, '500');
    const newSrcset = createHeroImageSrcset(newHeroImgSrc);

    // Always update to ensure images refresh (URLs may have query params that change)
    heroImg.srcset = newSrcset;
    heroImg.src = newSrc;
    heroImg.dataset.imageType = imageType;
  }

  // Replace entire carousel to handle adding/removing items
  const imageThumbnailCarouselWrapper = document.getElementById('pdpx-image-thumbnail-carousel-wrapper');
  if (imageThumbnailCarouselWrapper) {
    const newImageThumbnailCarouselWrapper = await createProductThumbnailCarousel(
      productDetails.realViews,
      imageType,
      heroImg,
    );
    const carouselItems = newImageThumbnailCarouselWrapper.querySelectorAll('.pdpx-image-thumbnail-carousel-item');
    carouselItems.forEach((item) => item.removeAttribute('data-skeleton'));
    imageThumbnailCarouselWrapper.replaceWith(newImageThumbnailCarouselWrapper);
  }
}

async function updateProductDeliveryEstimate(productDetails) {
  const dateElement = document.getElementById('pdpx-delivery-estimate-pill-date');
  if (dateElement) {
    dateElement.textContent = formatDeliveryEstimateDateRange(
      productDetails.deliveryEstimateMinDate,
      productDetails.deliveryEstimateMaxDate,
    );
  }
}

async function updateCustomizationOptions(productDetails, formDataObject) {
  const oldContainer = document.getElementById('pdpx-customization-inputs-container');
  const { activeElement } = document;
  const isActiveInContainer = oldContainer && activeElement && oldContainer.contains(activeElement);

  let focusTarget = null;
  if (isActiveInContainer) {
    const elementName = activeElement.name || activeElement.getAttribute('name');
    const elementDataName = activeElement.getAttribute('data-name');
    if (elementName) {
      focusTarget = { type: 'name', value: elementName };
    } else if (elementDataName) {
      const container = activeElement.closest('.pdpx-pill-selector-container, .pdpx-mini-pill-selector-container');
      const parentInput = container?.querySelector('.pdpx-hidden-select-input[name]');
      focusTarget = { type: 'data-name', value: elementDataName, parentName: parentInput?.name || null };
    }
  }

  const oldPickers = oldContainer?.querySelectorAll('.picker-container');
  if (oldPickers) {
    oldPickers.forEach((picker) => {
      if (picker.destroy && typeof picker.destroy === 'function') {
        picker.destroy();
      }
    });
  }
  const newCustomizationInputs = await createCustomizationInputs(productDetails, formDataObject);
  oldContainer.replaceWith(newCustomizationInputs);

  if (focusTarget) {
    const restoreFocus = () => {
      let elementToFocus = null;
      if (focusTarget.type === 'name') {
        elementToFocus = newCustomizationInputs.querySelector(`[name="${focusTarget.value}"]`);
      } else if (focusTarget.type === 'data-name') {
        if (focusTarget.parentName) {
          const parentInput = newCustomizationInputs.querySelector(`[name="${focusTarget.parentName}"]`);
          if (parentInput) {
            const container = parentInput.closest('.pdpx-pill-selector-container, .pdpx-mini-pill-selector-container');
            if (container) {
              elementToFocus = container.querySelector(`[data-name="${focusTarget.value}"]`);
            }
          }
        }
        if (!elementToFocus) {
          elementToFocus = newCustomizationInputs.querySelector(`[data-name="${focusTarget.value}"]`);
        }
      }

      if (elementToFocus && (elementToFocus.tagName === 'BUTTON' || elementToFocus.tagName === 'SELECT' || elementToFocus.type === 'text')) {
        elementToFocus.focus();
        return true;
      }
      return false;
    };

    if (!restoreFocus()) {
      const focusObserver = new MutationObserver(() => {
        if (restoreFocus()) {
          focusObserver.disconnect();
        }
      });
      focusObserver.observe(newCustomizationInputs, { childList: true, subtree: true });
      setTimeout(() => {
        focusObserver.disconnect();
      }, 1000);
    }
  }
}

async function updatePillTextValues(productDetails) {
  const form = document.querySelector('#pdpx-customization-inputs-form');
  const formData = new FormData(form);
  const formDataObject = Object.fromEntries(formData.entries());
  // Query for all pills including drawer pills (which may be in carousel wrappers)
  const pillButtons = document.querySelectorAll(
    '.pdpx-pill-container[data-name], .pdpx-mini-pill-image-container[data-name]',
  );

  // Create lookup map for O(1) attribute access instead of O(n*m) nested loops
  const attributeMap = new Map();
  Object.values(productDetails.attributes || {}).forEach((options) => {
    options.forEach((opt) => {
      attributeMap.set(opt.name, opt);
    });
  });

  const pillSelectorContainers = new Set();
  pillButtons.forEach((pill) => {
    const pillSelectorContainer = pill.closest('.pdpx-pill-selector-container');
    if (pillSelectorContainer) {
      pillSelectorContainers.add(pillSelectorContainer);
    }
  });

  pillSelectorContainers.forEach((pillSelectorContainer) => {
    const hiddenSelectInput = pillSelectorContainer.querySelector('.pdpx-hidden-select-input');
    if (!hiddenSelectInput) return;
    const inputName = hiddenSelectInput.name;
    const selectedValue = formDataObject[inputName] || hiddenSelectInput.value;
    // Check both regular pill container and mini-pill container (for drawer)
    const pillContainer = pillSelectorContainer.querySelector('.pdpx-pill-selector-options-container')
      || pillSelectorContainer.querySelector('.pdpx-mini-pill-selector-options-container')
      || pillSelectorContainer.querySelector('.pdpx-mini-pill-selector-options-wrapper');

    if (pillContainer && selectedValue) {
      const allPills = pillContainer.querySelectorAll('.pdpx-pill-container, .pdpx-mini-pill-image-container');
      allPills.forEach((p) => {
        p.classList.remove('selected');
        p.removeAttribute('aria-current');
        p.setAttribute('aria-checked', 'false');
      });

      const selectedPill = pillContainer.querySelector(`[data-name="${selectedValue}"]`);
      if (selectedPill) {
        selectedPill.classList.add('selected');
        selectedPill.setAttribute('aria-current', 'true');
        selectedPill.setAttribute('aria-checked', 'true');
      }
    }
  });

  // Cache DOM queries per pill to avoid repeated querySelector calls
  pillButtons.forEach((pill) => {
    const pillName = pill.dataset.name;
    const matchingOption = attributeMap.get(pillName);

    if (matchingOption) {
      const nameSpan = pill.querySelector('.pdpx-pill-text-name');
      const priceSpan = pill.querySelector('.pdpx-pill-text-price, .pdpx-mini-pill-price');
      const imgElement = pill.querySelector('.pdpx-pill-image, .pdpx-mini-pill-image');

      if (nameSpan) nameSpan.textContent = matchingOption.title || matchingOption.name;
      if (priceSpan) priceSpan.textContent = matchingOption.priceAdjustment || '+US$0.00';
      if (imgElement && matchingOption.thumbnail) imgElement.src = matchingOption.thumbnail;
    }
  });

  const selectedPills = document.querySelectorAll('.pdpx-pill-container.selected[data-name], .pdpx-mini-pill-image-container.selected[data-name]');
  selectedPills.forEach((selectedPill) => {
    const { title: pillTitle } = selectedPill.dataset;

    const pillSelectorContainer = selectedPill.closest('.pdpx-pill-selector-container');
    if (pillSelectorContainer) {
      const labelNameElement = pillSelectorContainer.querySelector('.pdpx-pill-selector-label-name');
      if (labelNameElement && pillTitle) {
        labelNameElement.textContent = pillTitle;
      }
    }
  });
}

async function updateCheckoutButton(productDetails, formDataObject) {
  const checkoutButton = document.getElementById('pdpx-checkout-button');
  const url = createCheckoutButtonHref(
    productDetails.templateId,
    formDataObject,
    productDetails.productType,
  );
  if (checkoutButton) {
    checkoutButton.href = url;
  }
}

async function updateDrawerContent(productDetails, formDataObject) {
  const drawer = document.querySelector('#pdpx-drawer');
  if (drawer.classList.contains('hidden')) {
    return;
  }
  if (productDetails.productType === 'zazzle_businesscard') {
    const mediaValue = productDetails.attributes.media.find((v) => v.name === formDataObject.media);
    const mediaOptions = productDetails.attributes.media;

    if (!mediaValue) return;

    const {
      thumbnail,
      title,
      name,
      description: descText,
      priceAdjustment,
      thickness,
      weight,
      gsm,
    } = mediaValue;

    const heroImage = drawer.querySelector('.pdpx-drawer-hero-image');
    const drawerTitle = drawer.querySelector('.pdpx-drawer-title');
    const pillsContainer = drawer.querySelector('.pdpx-drawer-pills-container');
    const description = drawer.querySelector('.pdpx-drawer-description');
    const footInfoName = drawer.querySelector('.pdpx-drawer-foot-info-name'); // eslint-disable-line prefer-destructuring
    const footInfoPrice = drawer.querySelector('.pdpx-drawer-foot-info-price');
    const footInfoImage = drawer.querySelector('.pdpx-drawer-foot-info-container img');
    const paperTypeSelector = drawer.querySelector('.pdpx-pill-selector-container');

    if (heroImage) {
      heroImage.style.opacity = '0';
      const defaultValueImageSrc = new URL(thumbnail);
      defaultValueImageSrc.searchParams.set('max_dim', '1000');
      const newSrc = defaultValueImageSrc.toString();
      heroImage.src = newSrc;
      heroImage.alt = title;
      heroImage.onload = () => {
        heroImage.style.opacity = '1';
      };
    }

    if (drawerTitle) {
      drawerTitle.textContent = title;
      const titleRow = drawerTitle.parentElement;
      const existingBadge = titleRow.querySelector('.pdpx-recommended-badge');
      if (existingBadge) {
        if (name === '175ptmatte') {
          existingBadge.style.visibility = 'visible';
        } else {
          existingBadge.style.visibility = 'hidden';
        }
      }
    }

    if (pillsContainer) {
      pillsContainer.innerHTML = '';
      const specs = [thickness, weight, gsm].filter(Boolean);
      const { getLibs, getIconElementDeprecated } = await import('../../../scripts/utils.js');
      const { createTag } = await import(`${getLibs()}/utils/utils.js`);
      specs.forEach((spec) => {
        const pill = createTag('div', { class: 'pdpx-drawer-pill' });
        pill.append(
          getIconElementDeprecated('circle-check-mark'),
          createTag('span', { class: 'pdpx-drawer-pill-text' }, spec),
        );
        pillsContainer.appendChild(pill);
      });
    }

    if (description) {
      description.innerHTML = descText;
    }

    if (footInfoName) {
      footInfoName.textContent = title;
    }

    if (footInfoPrice) {
      footInfoPrice.textContent = priceAdjustment;
    }

    if (footInfoImage) {
      footInfoImage.src = thumbnail;
      footInfoImage.alt = title;
    }

    if (paperTypeSelector) {
      // Query for pill buttons directly to handle both carousel and non-carousel states
      const pillButtons = paperTypeSelector.querySelectorAll('.pdpx-mini-pill-image-container[data-name]');
      const hiddenSelect = paperTypeSelector.querySelector('.pdpx-hidden-select-input');

      if (hiddenSelect) {
        hiddenSelect.value = name;
      }

      // Create lookup map for O(1) access instead of O(n) find per pill
      const mediaOptionsMap = new Map();
      mediaOptions.forEach((opt) => {
        mediaOptionsMap.set(opt.name, opt);
      });

      const labelName = paperTypeSelector.querySelector('.pdpx-pill-selector-label-name');

      pillButtons.forEach((pillButton) => {
        const pillContainer = pillButton.closest('.pdpx-mini-pill-container');
        const pillImage = pillButton.querySelector('.pdpx-mini-pill-image');
        const pillPrice = pillContainer ? pillContainer.querySelector('.pdpx-mini-pill-price') : null;

        if (pillButton.dataset.name === name) {
          pillButton.classList.add('selected');
          pillButton.setAttribute('aria-current', 'true');
          pillButton.setAttribute('aria-checked', 'true');
          if (labelName) {
            labelName.textContent = title;
          }
        } else {
          pillButton.classList.remove('selected');
          pillButton.removeAttribute('aria-current');
          pillButton.setAttribute('aria-checked', 'false');
        }

        const matchingOption = mediaOptionsMap.get(pillButton.dataset.name);
        if (matchingOption) {
          if (pillImage && pillImage.src !== matchingOption.thumbnail) {
            pillImage.src = matchingOption.thumbnail;
            pillImage.alt = matchingOption.title;
          }
          if (pillPrice && pillPrice.textContent !== matchingOption.priceAdjustment) {
            pillPrice.textContent = matchingOption.priceAdjustment;
          }
          if (pillButton.dataset.title !== matchingOption.title) {
            pillButton.dataset.title = matchingOption.title;
            pillButton.setAttribute('data-title', matchingOption.title);
          }
        }
      });
    }
  }
}

function createUpdatedSelectedValuesObject(updatedConfigurationOptions, formDataObject, quantity) {
  const selectedValuesObject = {};
  for (const [key, value] of Object.entries(updatedConfigurationOptions.product.attributes)) {
    const valueName = value.values.find((v) => v.name === formDataObject[key]);
    if (valueName) {
      selectedValuesObject[key] = valueName.name;
    } else {
      selectedValuesObject[key] = value.values[0].name;
    }
  }
  selectedValuesObject.qty = quantity;
  return selectedValuesObject;
}

function hasStyleChanged(existingForm, currentStyle) {
  if (!existingForm || !currentStyle) return false;
  const styleInput = existingForm.querySelector('[name="style"]');
  if (!styleInput) return false;
  const existingStyle = styleInput.tagName === 'SELECT'
    ? styleInput.value
    : styleInput.parentElement?.querySelector('.pdpx-pill-selector-options-container .pdpx-pill-container.selected[data-name]')?.dataset.name;
  return existingStyle && existingStyle !== currentStyle;
}

function getExistingOptionNames(existingForm, attributeName) {
  const hiddenInput = existingForm?.querySelector(`[name="${attributeName}"]`);
  if (!hiddenInput) return new Set();

  const optionNames = new Set();
  const container = hiddenInput.closest('.pdpx-pill-selector-container, .pdpx-mini-pill-selector-container');
  if (container) {
    container.querySelectorAll('[data-name]').forEach((pill) => {
      if (pill.dataset.name) optionNames.add(pill.dataset.name);
    });
  }
  if (hiddenInput.tagName === 'SELECT') {
    hiddenInput.querySelectorAll('option').forEach((option) => {
      if (option.value) optionNames.add(option.value);
    });
  }
  return optionNames;
}

function hasOptionsChanged(existingForm, currentAttributes) {
  if (!existingForm) return false;
  return Object.keys(currentAttributes || {}).some((key) => {
    const currentOptionNames = new Set(currentAttributes[key].map((opt) => opt.name));
    const existingOptionNames = getExistingOptionNames(existingForm, key);
    return existingOptionNames.size !== currentOptionNames.size
      || ![...currentOptionNames].every((name) => existingOptionNames.has(name));
  });
}

export default async function updateAllDynamicElements(productId) {
  const { templateId } = document.querySelector('.pdpx-global-container').dataset;
  const form = document.querySelector('#pdpx-customization-inputs-form');

  // Read form values directly from inputs to ensure we get the latest values
  // FormData can sometimes read stale values, especially for select elements
  const formDataObject = {};
  const formInputs = form.querySelectorAll('input, select');
  formInputs.forEach((input) => {
    // Skip drawer inputs
    if (input.closest('#pdpx-drawer')) {
      return;
    }
    if (input.type === 'radio' || input.type === 'checkbox') {
      if (input.checked) {
        formDataObject[input.name] = input.value;
      }
    } else if (input.tagName === 'SELECT') {
      // For select elements, read the value directly
      formDataObject[input.name] = input.value;
    } else {
      formDataObject[input.name] = input.value;
    }
  });
  const quantity = formDataObject.qty;
  const parameters = formatProductOptionsToAPIParameters(formDataObject);
  const updatedConfigurationOptions = await fetchAPIData(productId, parameters, 'changeoptions');
  const updatedSelectedValuesObject = createUpdatedSelectedValuesObject(
    updatedConfigurationOptions,
    formDataObject,
    quantity,
  );
  const updatedParameters = formatProductOptionsToAPIParameters(updatedSelectedValuesObject);
  const [
    productPrice,
    productReviews,
    productRenditions,
    productShippingEstimates,
    UIStrings,
  ] = await Promise.all([
    fetchAPIData(productId, updatedParameters, 'getproductpricing'),
    fetchAPIData(productId, null, 'getreviews'),
    fetchAPIData(productId, updatedParameters, 'getproductrenditions'),
    fetchAPIData(productId, updatedParameters, 'getshippingestimates'),
    fetchUIStrings(),
  ]);
  const normalizeProductDetailsParametersObject = {
    productDetails: updatedConfigurationOptions,
    productPrice,
    productReviews,
    productRenditions,
    productShippingEstimates,
    quantity,
    templateId,
    UIStrings,
  };

  const normalizedProductDetails = await normalizeProductDetailObject(
    normalizeProductDetailsParametersObject,
  );
  for (const [key, value] of Object.entries(formDataObject)) {
    if (normalizedProductDetails.attributes[key]) {
      const valueExists = normalizedProductDetails.attributes[key].some(
        (v) => String(v.name) === String(value) || v.name === value,
      );

      if (!valueExists) {
        // eslint-disable-next-line no-console
        console.warn(`Value "${value}" for "${key}" not found in options, resetting to first option`);
        const correctedValue = normalizedProductDetails.attributes[key][0].name;
        formDataObject[key] = correctedValue;
        // Update the actual form inputs to match the corrected value
        const correctedInputs = form.querySelectorAll(`[name="${key}"]`);
        correctedInputs.forEach((input) => {
          input.value = correctedValue;
        });
      }
    }
  }
  await updateCheckoutButton(normalizedProductDetails, formDataObject);
  await updateProductImages(normalizedProductDetails);

  const currentAttributeKeys = Object.keys(normalizedProductDetails.attributes || {}).sort().join(',');
  const existingForm = document.querySelector('#pdpx-customization-inputs-form');
  const existingAttributeKeys = existingForm ? existingForm.dataset.attributeKeys || '' : '';
  const sameAttributeKeys = currentAttributeKeys === existingAttributeKeys;

  const shouldRecreateInputs = !sameAttributeKeys
    || hasStyleChanged(existingForm, formDataObject.style)
    || (sameAttributeKeys && hasOptionsChanged(existingForm, normalizedProductDetails.attributes));

  if (shouldRecreateInputs) {
    await updateCustomizationOptions(normalizedProductDetails, formDataObject);
  } else {
    await updatePillTextValues(normalizedProductDetails);
  }

  await updateProductPrice(normalizedProductDetails);
  await updateProductDeliveryEstimate(normalizedProductDetails);
  await updateDrawerContent(normalizedProductDetails, formDataObject);
  BlockMediator.set('product:updated', {
    attributes: updatedConfigurationOptions.product.attributes,
    formData: formDataObject,
  });
}
