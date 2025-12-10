import { getLibs, getIconElementDeprecated } from '../../../../scripts/utils.js';
import createMiniPillOptionsSelector from '../customizationInputs/createMiniPillOptionsSelector.js';
import { createDrawerHead, closeDrawer } from './createDrawerContent.js';
import updateAllDynamicElements from '../../utilities/event-handlers.js';

let createTag;

export default async function createDrawerContentPaperType(
  customizationOptions,
  labelText,
  hiddenSelectInputName,
  productDetails,
  defaultValue,
  drawerType,
  drawerContainer,
) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const drawerHead = createDrawerHead('Select Paper Type');
  const drawerBody = createTag('div', { class: 'pdpx-drawer-body' });
  const defaultValueSafe = defaultValue || customizationOptions[0].name;

  const defaultValueOption = customizationOptions.find(
    (option) => option.name === defaultValueSafe,
  );
  const defaultValueImageSrc = new URL(defaultValueOption.thumbnail);
  defaultValueImageSrc.searchParams.set('max_dim', '1000');
  const defaultValueImageSrcLarge = defaultValueImageSrc.toString();
  const heroImageContainer = createTag('div', { class: 'pdpx-drawer-hero-image-container' });
  heroImageContainer.appendChild(
    createTag('img', { class: 'pdpx-drawer-hero-image', src: defaultValueImageSrcLarge, alt: defaultValueOption.title }),
  );
  const titleRow = createTag('div', { class: 'pdpx-drawer-title-row' });
  const drawerTitle = createTag('span', { class: 'pdpx-drawer-title' }, defaultValueOption.title);
  titleRow.appendChild(drawerTitle);
  const recommendedBadge = createTag('span', { class: 'pdpx-recommended-badge' }, 'Recommended');
  if (defaultValueSafe !== '175ptmatte') {
    recommendedBadge.style.visibility = 'hidden';
  }
  titleRow.appendChild(recommendedBadge);
  const pillsContainer = createTag('div', { class: 'pdpx-drawer-pills-container' });
  const specs = [
    defaultValueOption.thickness,
    defaultValueOption.weight,
    defaultValueOption.gsm,
  ].filter(Boolean);
  specs.forEach((spec) => {
    const pill = createTag('div', { class: 'pdpx-drawer-pill' });
    pill.append(
      getIconElementDeprecated('circle-check-mark'),
      createTag('span', { class: 'pdpx-drawer-pill-text' }, spec),
    );
    pillsContainer.appendChild(pill);
  });
  const argumentObject = {
    customizationOptions,
    labelText,
    hiddenSelectInputName,
    productDetails,
    defaultValue,
    drawerType,
  };
  const paperTypeSelectorContainer = await createMiniPillOptionsSelector(argumentObject);
  const description = createTag('div', { class: 'pdpx-drawer-description' });
  description.innerHTML = defaultValueOption.description;
  const infoContainer = createTag('div', { class: 'pdpx-drawer-foot-info-container' });
  const infoText = createTag('div', { class: 'pdpx-drawer-foot-info-text' });
  infoText.append(
    createTag('div', { class: 'pdpx-drawer-foot-info-name' }, defaultValueOption.title),
    createTag('div', { class: 'pdpx-drawer-foot-info-price' }, defaultValueOption.priceAdjustment),
  );
  infoContainer.append(
    createTag('img', { src: defaultValueOption.thumbnail, alt: defaultValueOption.title }),
    infoText,
  );
  const selectButton = createTag('button', { class: 'pdpx-drawer-foot-select-button' }, 'Select');
  selectButton.addEventListener('click', async () => {
    // Get the selected value from the drawer's hidden input
    const hiddenSelect = paperTypeSelectorContainer.querySelector('.pdpx-hidden-select-input');
    if (hiddenSelect && hiddenSelect.value) {
      const selectedValue = hiddenSelect.value;
      // Update the main form inputs (exclude drawer inputs)
      const form = document.querySelector('#pdpx-customization-inputs-form');
      if (form) {
        // Update all inputs with the same name (skip drawer inputs)
        const allInputs = form.querySelectorAll(`[name="${hiddenSelectInputName}"]`);
        allInputs.forEach((input) => {
          // Skip drawer inputs
          if (input.closest('#pdpx-drawer')) {
            return;
          }
          input.value = selectedValue;
          // Also update option selection for select elements
          if (input.tagName === 'SELECT') {
            // Ensure the selected option is set
            const optionToSelect = input.querySelector(`option[value="${selectedValue}"]`);
            if (optionToSelect) {
              optionToSelect.selected = true;
            }
            // Deselect all other options
            input.querySelectorAll('option').forEach((opt) => {
              if (opt.value !== selectedValue) {
                opt.selected = false;
              }
            });
          }
        });
        // Use requestAnimationFrame to ensure DOM updates are complete before reading form
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
        // Close drawer first so updateDrawerContent doesn't interfere
        closeDrawer();
        // Apply the selection to the page (after drawer is closed)
        await updateAllDynamicElements(productDetails.id);
      }
    }
  });
  const drawerFoot = createTag('div', { class: 'pdpx-drawer-foot' });
  drawerFoot.append(infoContainer, selectButton);

  // Function to update drawer content when a pill is clicked (without updating the page)
  const updateDrawerContentOnPillClick = (selectedOption) => {
    if (!selectedOption) return;
    const selectedImageSrc = new URL(selectedOption.thumbnail);
    selectedImageSrc.searchParams.set('max_dim', '1000');
    const selectedImageSrcLarge = selectedImageSrc.toString();

    // Update hero image
    const heroImg = drawerBody.querySelector('.pdpx-drawer-hero-image');
    if (heroImg) {
      heroImg.style.opacity = '0';
      heroImg.src = selectedImageSrcLarge;
      heroImg.alt = selectedOption.title;
      heroImg.onload = () => {
        heroImg.style.opacity = '1';
      };
    }

    // Update title
    const titleEl = drawerBody.querySelector('.pdpx-drawer-title');
    if (titleEl) {
      titleEl.textContent = selectedOption.title;
    }

    // Update recommended badge visibility
    const badge = drawerBody.querySelector('.pdpx-recommended-badge');
    if (badge) {
      badge.style.visibility = selectedOption.name === '175ptmatte' ? 'visible' : 'hidden';
    }

    // Update pills container
    const specsPillsContainer = drawerBody.querySelector('.pdpx-drawer-pills-container');
    if (specsPillsContainer) {
      specsPillsContainer.innerHTML = '';
      // eslint-disable-next-line max-len
      const drawerSpecs = [selectedOption.thickness, selectedOption.weight, selectedOption.gsm].filter(Boolean);
      drawerSpecs.forEach((spec) => {
        const pill = createTag('div', { class: 'pdpx-drawer-pill' });
        pill.append(
          getIconElementDeprecated('circle-check-mark'),
          createTag('span', { class: 'pdpx-drawer-pill-text' }, spec),
        );
        specsPillsContainer.appendChild(pill);
      });
    }

    // Update description
    const descEl = drawerBody.querySelector('.pdpx-drawer-description');
    if (descEl) {
      descEl.innerHTML = selectedOption.description;
    }

    // Update foot info
    const footInfoName = drawerFoot.querySelector('.pdpx-drawer-foot-info-name');
    const footInfoPrice = drawerFoot.querySelector('.pdpx-drawer-foot-info-price');
    const footInfoImage = drawerFoot.querySelector('.pdpx-drawer-foot-info-container img');
    if (footInfoName) footInfoName.textContent = selectedOption.title;
    if (footInfoPrice) footInfoPrice.textContent = selectedOption.priceAdjustment;
    if (footInfoImage) {
      footInfoImage.src = selectedOption.thumbnail;
      footInfoImage.alt = selectedOption.title;
    }
  };

  // Listen for pill clicks in the drawer and update drawer content
  paperTypeSelectorContainer.addEventListener('click', (e) => {
    const pillButton = e.target.closest('.pdpx-mini-pill-image-container');
    if (pillButton && pillButton.dataset.name) {
      // eslint-disable-next-line max-len
      const drawerSelectedOption = customizationOptions.find((opt) => opt.name === pillButton.dataset.name);
      if (drawerSelectedOption) {
        updateDrawerContentOnPillClick(drawerSelectedOption);
      }
    }
  });

  drawerBody.append(
    heroImageContainer,
    titleRow,
    pillsContainer,
    // paperTypeSelectorContainer,
    description,
  );
  drawerContainer.append(drawerHead, drawerBody, drawerFoot);
}
