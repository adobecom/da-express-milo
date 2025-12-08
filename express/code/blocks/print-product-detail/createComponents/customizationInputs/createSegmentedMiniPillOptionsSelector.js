import { getLibs } from '../../../../scripts/utils.js';
import updateAllDynamicElements from '../../utilities/event-handlers.js';
import openDrawer from '../drawerContent/openDrawer.js';
import createSimpleCarousel from '../../../../scripts/widgets/simple-carousel.js';

let createTag;

export default async function createSegmentedMiniPillOptionsSelector(
  customizationOptions,
  labelText,
  hiddenSelectInputName,
  CTALinkText,
  productDetails,
  defaultValue,
  drawerType,
) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const productId = productDetails.id;
  const hiddenSelectInputId = `pdpx-hidden-input-${hiddenSelectInputName}`;
  let selectedValue = false;
  const classicOptions = customizationOptions.filter((option) => option.printingProcess === 'classic');
  const vividOptions = customizationOptions.filter((option) => option.printingProcess === 'vivid');

  const miniPillSelectorContainer = createTag('div', { class: 'pdpx-pill-selector-container' });
  const miniPillSelectorLabelContainer = createTag('div', { class: 'pdpx-pill-selector-label-container' });
  const miniPillSelectorLabelNameContainer = createTag('div', { class: 'pdpx-pill-selector-label-name-container' });
  const miniPillSelectorLabel = createTag('span', { class: 'pdpx-pill-selector-label-label' }, `${labelText}: `);
  miniPillSelectorLabelNameContainer.appendChild(miniPillSelectorLabel);
  miniPillSelectorLabelContainer.appendChild(miniPillSelectorLabelNameContainer);

  miniPillSelectorContainer.appendChild(miniPillSelectorLabelContainer);
  const containerWrapper = createTag('div', {
    class: 'pdpx-mini-pill-selector-options-container-wrapper',
  });
  const classicSection = createTag('div', { class: 'pdpx-mini-pill-options-section-container' });
  const vividSection = createTag('div', { class: 'pdpx-mini-pill-options-section-container' });
  const classicWrapper = createTag('div', { class: 'pdpx-mini-pill-selector-options-wrapper' });
  if (classicOptions.length > 0) {
    classicSection.appendChild(
      createTag('span', { class: 'pdpx-pill-selector-section-label' }, 'Classic Printing: No Underbase'),
    );
  }
  const vividWrapper = createTag('div', { class: 'pdpx-mini-pill-selector-options-wrapper' });
  if (vividOptions.length > 0) {
    vividSection.appendChild(
      createTag('span', { class: 'pdpx-pill-selector-section-label' }, 'Vivid Printing: White Underbase'),
    );
  }
  classicSection.append(classicWrapper);
  vividSection.append(vividWrapper);
  containerWrapper.append(classicSection, vividSection);
  const hiddenSelectInput = createTag('select', { class: 'pdpx-hidden-select-input hidden', name: hiddenSelectInputName, id: hiddenSelectInputId });

  let isClassicCarouselActive = false;
  let isVividCarouselActive = false;
  const mediaQuery = window.matchMedia('(max-width: 767px)');
  const tooltipMap = new Map();
  let cachedAllPills = null;
  let cachedLabelNameElement = null;

  const hideJSTooltip = (tooltipEl) => {
    const arrow = tooltipEl.querySelector('.pdpx-js-tooltip-arrow');

    tooltipEl.style.transition = 'var(--standard-transition-hover-out-opacity)';
    tooltipEl.style.opacity = '0';
    if (arrow) {
      arrow.style.transition = 'var(--standard-transition-hover-out-opacity)';
      arrow.style.opacity = '0';
    }
    setTimeout(() => {
      tooltipEl.style.visibility = 'hidden';
      if (arrow) {
        arrow.style.visibility = 'hidden';
      }
    }, 300);
  };

  const createSegmentedMiniPillClickHandler = (
    currentContainerWrapper,
    currentMiniPillSelectorContainer,
    currentHiddenSelectInputName,
    currentProductId,
    currentHiddenSelectInput,
  ) => async (element) => {
    tooltipMap.forEach((tooltipEl) => {
      hideJSTooltip(tooltipEl);
    });
    if (!cachedAllPills) {
      cachedAllPills = currentContainerWrapper.querySelectorAll('.pdpx-mini-pill-image-container');
    }
    const clickedPill = element.currentTarget;
    cachedAllPills.forEach((pill) => {
      pill.classList.remove('selected');
      pill.removeAttribute('aria-current');
      pill.classList.remove('tooltip-left-edge', 'tooltip-right-edge');
    });
    clickedPill.classList.add('selected');
    clickedPill.setAttribute('aria-current', 'true');
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
    if (!cachedLabelNameElement) {
      cachedLabelNameElement = currentMiniPillSelectorContainer.querySelector('.pdpx-pill-selector-label-name');
    }
    if (cachedLabelNameElement) {
      cachedLabelNameElement.textContent = clickedPill.getAttribute('data-title');
    }
    const pillName = clickedPill.getAttribute('data-name');
    if (currentHiddenSelectInput) {
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

  for (let i = 0; i < customizationOptions.length; i += 1) {
    const wrapper = customizationOptions[i].printingProcess === 'classic' ? classicWrapper : vividWrapper;
    const option = createTag('option', { value: customizationOptions[i].name }, customizationOptions[i].title);
    if (customizationOptions[i].name === defaultValue) {
      selectedValue = customizationOptions[i].name;
    }
    hiddenSelectInput.appendChild(option);
    const miniPillOption = createTag('div', { class: 'pdpx-mini-pill-container' });
    const miniPillOptionImageContainer = createTag('button', { class: 'pdpx-mini-pill-image-container', type: 'button', 'data-name': customizationOptions[i].name, 'data-title': customizationOptions[i].title });
    const altTextMiniPill = `${labelText} Option Image Thumbnail: ${customizationOptions[i].title}`;
    const miniPillOptionImage = createTag('img', { class: 'pdpx-mini-pill-image', alt: altTextMiniPill, src: customizationOptions[i].thumbnail });
    miniPillOptionImageContainer.appendChild(miniPillOptionImage);
    const miniPillOptionTextContainer = createTag('div', { class: 'pdpx-mini-pill-text-container' });
    const miniPillOptionPrice = createTag('span', { class: 'pdpx-mini-pill-price' }, customizationOptions[i].priceAdjustment);
    miniPillOptionImageContainer.addEventListener('click', createSegmentedMiniPillClickHandler(
      containerWrapper,
      miniPillSelectorContainer,
      hiddenSelectInputName,
      productId,
      hiddenSelectInput,
    ));
    miniPillOptionImageContainer.addEventListener('mouseenter', (e) => {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const container = btn.closest('.pdpx-customization-inputs-container') || document.body;
      const containerRect = container.getBoundingClientRect();
      const threshold = 150;
      btn.classList.remove('tooltip-left-edge', 'tooltip-right-edge');
      if (rect.left - containerRect.left < threshold) {
        btn.classList.add('tooltip-left-edge');
      } else if (containerRect.right - rect.right < threshold) {
        btn.classList.add('tooltip-right-edge');
      }
    });
    miniPillOptionTextContainer.appendChild(miniPillOptionPrice);
    miniPillOption.append(miniPillOptionImageContainer, miniPillOptionTextContainer);
    wrapper.appendChild(miniPillOption);
  }
  hiddenSelectInput.value = selectedValue || customizationOptions[0].name;
  const selectedContainer = containerWrapper.querySelector(`.pdpx-mini-pill-image-container[data-name="${hiddenSelectInput.value}"]`);
  selectedContainer.classList.add('selected');
  selectedContainer.setAttribute('aria-current', 'true');
  const miniPillSelectorLabelName = createTag('span', { class: 'pdpx-pill-selector-label-name' }, selectedContainer.dataset.title);
  // Cache DOM queries after all pills are added
  cachedAllPills = containerWrapper.querySelectorAll('.pdpx-mini-pill-image-container');
  cachedLabelNameElement = miniPillSelectorContainer.querySelector('.pdpx-pill-selector-label-name');
  if (CTALinkText) {
    const compareLink = createTag('button', { class: 'pdpx-pill-selector-label-compare-link', type: 'button', 'data-drawer-type': drawerType }, CTALinkText);
    compareLink.addEventListener('click', async () => {
      await openDrawer(
        customizationOptions,
        labelText,
        hiddenSelectInputName,
        productDetails,
        defaultValue,
        drawerType,
      );
    });
    miniPillSelectorLabelContainer.appendChild(compareLink);
  }
  miniPillSelectorLabelNameContainer.appendChild(miniPillSelectorLabelName);

  const createJSTooltip = (button, tooltipText) => {
    const tempRef = createTag('button', { class: 'pdpx-mini-pill-image-container' });
    tempRef.setAttribute('data-title', tooltipText);
    tempRef.style.cssText = 'position: absolute; left: -9999px; pointer-events: none;';
    document.body.appendChild(tempRef);

    const tempStyle = createTag('style');
    const styleText = '.pdpx-mini-pill-image-container::after { opacity: 1 !important; visibility: visible !important; }';
    tempStyle.textContent = styleText;
    document.head.appendChild(tempStyle);

    tempRef.offsetHeight;

    const tooltip = createTag('div', { class: 'pdpx-js-tooltip' });
    tooltip.textContent = tooltipText;

    const refAfter = window.getComputedStyle(tempRef, '::after');
    const refHeight = refAfter.height;
    const refFontSize = refAfter.fontSize;
    const refFontFamily = refAfter.fontFamily;
    const refFontWeight = refAfter.fontWeight;
    const refLineHeight = refAfter.lineHeight;
    const refPaddingTop = refAfter.paddingTop;
    const refPaddingBottom = refAfter.paddingBottom;
    const refPaddingLeft = refAfter.paddingLeft;
    const refPaddingRight = refAfter.paddingRight;
    const refBackgroundColor = refAfter.backgroundColor;
    const refColor = refAfter.color;
    const smoothingProp = '-webkit-font-smoothing';
    const refFontSmoothing = refAfter.webkitFontSmoothing
      || refAfter.getPropertyValue(smoothingProp);
    const refTextRendering = refAfter.textRendering;

    tempStyle.remove();
    tempRef.remove();

    const tooltipStyles = `position: fixed; background: ${refBackgroundColor}; color: ${refColor}; padding: ${refPaddingTop} ${refPaddingRight} ${refPaddingBottom} ${refPaddingLeft}; border-radius: 6px; font-size: ${refFontSize}; font-family: ${refFontFamily}; font-weight: ${refFontWeight}; line-height: ${refLineHeight}; white-space: nowrap; pointer-events: none; opacity: 0; visibility: hidden; transition: var(--standard-transition-hover-out-opacity); z-index: 200; height: ${refHeight}; -webkit-font-smoothing: ${refFontSmoothing}; text-rendering: ${refTextRendering};`;
    tooltip.style.cssText = tooltipStyles;

    const arrow = createTag('div', { class: 'pdpx-js-tooltip-arrow' });
    const arrowStyles = `position: absolute; bottom: -4px; left: 50%; transform: translate(-50%, 0) rotate(45deg); width: 8px; height: 8px; background: ${refBackgroundColor}; pointer-events: none; opacity: 0; visibility: hidden; transition: var(--standard-transition-hover-out-opacity); z-index: -1;`;
    arrow.style.cssText = arrowStyles;
    tooltip.insertBefore(arrow, tooltip.firstChild);
    document.body.appendChild(tooltip);
    return tooltip;
  };

  const showJSTooltip = (button, tooltipEl) => {
    const rect = button.getBoundingClientRect();
    const arrow = tooltipEl.querySelector('.pdpx-js-tooltip-arrow');
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    const top = rect.top - tooltipRect.height - 8;
    const maxLeft = window.innerWidth - tooltipRect.width - 8;
    tooltipEl.style.left = `${Math.max(8, Math.min(left, maxLeft))}px`;
    tooltipEl.style.top = `${top}px`;

    tooltipEl.style.visibility = 'visible';
    tooltipEl.style.opacity = '0';
    if (arrow) {
      arrow.style.visibility = 'visible';
      arrow.style.opacity = '0';
    }

    tooltipEl.style.transition = 'var(--standard-transition-hover-in-opacity)';
    if (arrow) {
      arrow.style.transition = 'var(--standard-transition-hover-in-opacity)';
    }

    requestAnimationFrame(() => {
      tooltipEl.style.opacity = '1';
      if (arrow) {
        arrow.style.opacity = '1';
      }
    });
  };

  const setupCarouselTooltips = (wrapper) => {
    const carouselItems = wrapper.querySelectorAll('.simple-carousel-item .pdpx-mini-pill-image-container');
    carouselItems.forEach((btn) => {
      const tooltipText = btn.getAttribute('data-title');
      if (tooltipText) {
        const tooltipEl = createJSTooltip(btn, tooltipText);
        tooltipMap.set(btn, tooltipEl);

        const showTooltip = () => showJSTooltip(btn, tooltipEl);
        const hideTooltip = () => hideJSTooltip(tooltipEl);

        let touchTimeout;
        btn.addEventListener('mouseenter', showTooltip);
        btn.addEventListener('mouseleave', hideTooltip);
        btn.addEventListener('touchstart', () => {
          touchTimeout = setTimeout(() => {
            showTooltip();
          }, 500);
        });
        btn.addEventListener('touchend', () => {
          clearTimeout(touchTimeout);
        });
        btn.addEventListener('touchmove', () => {
          clearTimeout(touchTimeout);
          hideTooltip();
        });
        btn.addEventListener('click', () => {
          hideTooltip();
        });
      }
    });
  };

  const cleanupCarouselTooltips = () => {
    tooltipMap.forEach((tooltipEl) => {
      tooltipEl.remove();
    });
    tooltipMap.clear();
  };

  const initCarousels = async () => {
    if (classicOptions.length > 0
      && classicWrapper.children.length > 0
      && !isClassicCarouselActive) {
      await createSimpleCarousel('.pdpx-mini-pill-container', classicWrapper, {
        ariaLabel: 'Classic printing color options',
        centerActive: true,
        activeClass: 'selected',
      });
      const platformClassic = classicWrapper.querySelector('.simple-carousel-platform');
      if (platformClassic) {
        platformClassic.style.overflowY = 'visible';
      }
      const classicCarouselItems = classicWrapper.querySelectorAll('.pdpx-mini-pill-container.simple-carousel-item');
      classicCarouselItems.forEach((item) => {
        const focusableChild = item.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableChild) {
          item.removeAttribute('tabindex');
        }
      });
      requestAnimationFrame(() => {
        setupCarouselTooltips(classicWrapper);
      });
      isClassicCarouselActive = true;
    }

    if (vividOptions.length > 0
      && vividWrapper.children.length > 0
      && !isVividCarouselActive) {
      await createSimpleCarousel('.pdpx-mini-pill-container', vividWrapper, {
        ariaLabel: 'Vivid printing color options',
        centerActive: true,
        activeClass: 'selected',
      });
      const platformVivid = vividWrapper.querySelector('.simple-carousel-platform');
      if (platformVivid) {
        platformVivid.style.overflowY = 'visible';
      }
      const vividCarouselItems = vividWrapper.querySelectorAll('.pdpx-mini-pill-container.simple-carousel-item');
      vividCarouselItems.forEach((item) => {
        const focusableChild = item.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableChild) {
          item.removeAttribute('tabindex');
        }
      });
      requestAnimationFrame(() => {
        setupCarouselTooltips(vividWrapper);
      });
      isVividCarouselActive = true;
    }
  };

  const destroyCarousel = (wrapper, isActive) => {
    if (isActive) {
      const carouselItems = wrapper.querySelectorAll('.simple-carousel-item .pdpx-mini-pill-image-container');
      carouselItems.forEach((btn) => {
        const tooltipEl = tooltipMap.get(btn);
        if (tooltipEl) {
          tooltipEl.remove();
          tooltipMap.delete(btn);
        }
      });
      const carouselContainer = wrapper.querySelector('.simple-carousel-container');
      const faderLeft = wrapper.querySelector('.simple-carousel-fader-left');
      const faderRight = wrapper.querySelector('.simple-carousel-fader-right');

      if (carouselContainer) {
        const platform = carouselContainer.querySelector('.simple-carousel-platform');
        if (platform) {
          const pills = Array.from(platform.querySelectorAll('.pdpx-mini-pill-container'));
          pills.forEach((pill) => {
            pill.classList.remove('simple-carousel-item');
            pill.removeAttribute('tabindex');
            pill.removeAttribute('role');
            pill.removeAttribute('aria-label');
            wrapper.appendChild(pill);
          });
        }
        carouselContainer.remove();
      }
      if (faderLeft) faderLeft.remove();
      if (faderRight) faderRight.remove();
    }
    return false;
  };

  const destroyCarousels = () => {
    isClassicCarouselActive = destroyCarousel(classicWrapper, isClassicCarouselActive);
    isVividCarouselActive = destroyCarousel(vividWrapper, isVividCarouselActive);
  };

  const handleResize = async () => {
    if (mediaQuery.matches && !isClassicCarouselActive && !isVividCarouselActive) {
      await initCarousels();
    } else if (!mediaQuery.matches && (isClassicCarouselActive || isVividCarouselActive)) {
      destroyCarousels();
    }
  };

  if (mediaQuery.matches) {
    await initCarousels();
  }

  mediaQuery.addEventListener('change', handleResize);
  window.addEventListener('orientationchange', handleResize);

  miniPillSelectorContainer.cleanupCarousel = () => {
    mediaQuery.removeEventListener('change', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    cleanupCarouselTooltips();
    destroyCarousels();
  };

  miniPillSelectorContainer.append(containerWrapper, hiddenSelectInput);
  return miniPillSelectorContainer;
}
