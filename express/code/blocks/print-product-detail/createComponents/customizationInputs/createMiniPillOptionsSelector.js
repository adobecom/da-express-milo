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
  const productId = productDetails.id;
  let selectedValueExists = false;
  const hiddenSelectInputId = `pdpx-hidden-input-${hiddenSelectInputName}`;
  const miniPillSelectorContainer = createTag('div', { class: 'pdpx-pill-selector-container' });
  const miniPillSelectorLabelContainer = createTag('div', { class: 'pdpx-pill-selector-label-container' });
  const miniPillSelectorLabelNameContainer = createTag('div', { class: 'pdpx-pill-selector-label-name-container' });
  const miniPillSelectorLabel = createTag('span', { class: 'pdpx-pill-selector-label-label' }, `${labelText}: `);
  miniPillSelectorLabelNameContainer.appendChild(miniPillSelectorLabel);
  miniPillSelectorLabelContainer.appendChild(miniPillSelectorLabelNameContainer);
  if (CTALinkText) {
    const miniPillSelectorLabelCompareLink = createTag('button', { class: 'pdpx-pill-selector-label-compare-link', type: 'button' }, CTALinkText);
    miniPillSelectorLabelCompareLink.addEventListener('click', async () => {
      const form = document.querySelector('#pdpx-customization-inputs-form');
      const currentValue = form ? new FormData(form).get(hiddenSelectInputName)
      || defaultValue : defaultValue;
      await openDrawer(
        customizationOptions,
        labelText,
        hiddenSelectInputName,
        productDetails,
        currentValue,
        drawerType,
      );
    });
    miniPillSelectorLabelContainer.appendChild(miniPillSelectorLabelCompareLink);
  }
  miniPillSelectorContainer.appendChild(miniPillSelectorLabelContainer);
  const miniPillSelectorOptionsWrapper = createTag('div', { class: 'pdpx-mini-pill-selector-options-wrapper' });
  const miniPillSelectorOptionsContainer = createTag('div', { class: 'pdpx-mini-pill-selector-options-container' });
  const hiddenSelectInput = createTag('select', { class: 'pdpx-hidden-select-input hidden', name: hiddenSelectInputName, id: hiddenSelectInputId });
  const miniPillSelectorLabelName = createTag('span', { class: 'pdpx-pill-selector-label-name' });

  let isCarouselActive = false;
  const mediaQuery = window.matchMedia('(max-width: 767px)');
  const tooltipMap = new Map();
  let cachedAllPills = null;
  let cachedAllInputs = null;

  const hideJSTooltip = (tooltip) => {
    const arrow = tooltip.querySelector('.pdpx-js-tooltip-arrow');

    tooltip.style.transition = 'var(--standard-transition-hover-out-opacity)';
    tooltip.style.opacity = '0';
    if (arrow) {
      arrow.style.transition = 'var(--standard-transition-hover-out-opacity)';
      arrow.style.opacity = '0';
    }
    setTimeout(() => {
      tooltip.style.visibility = 'hidden';
      if (arrow) {
        arrow.style.visibility = 'hidden';
      }
    }, 300);
  };

  const createMiniPillClickHandler = (
    currentHiddenSelectInput,
    currentMiniPillSelectorOptionsWrapper,
    currentMiniPillSelectorLabelName,
    currentMiniPillSelectorContainer,
    currentProductId,
    currentHiddenSelectInputName,
  ) => async (element) => {
    tooltipMap.forEach((tooltip) => {
      hideJSTooltip(tooltip);
    });
    if (!cachedAllPills) {
      cachedAllPills = currentMiniPillSelectorOptionsWrapper.querySelectorAll('.pdpx-mini-pill-image-container');
    }
    const clickedPill = element.currentTarget;
    cachedAllPills.forEach((pill) => {
      pill.classList.remove('selected');
      pill.removeAttribute('aria-current');
      pill.setAttribute('aria-checked', 'false');
      pill.classList.remove('tooltip-left-edge', 'tooltip-right-edge');
    });
    clickedPill.classList.add('selected');
    clickedPill.setAttribute('aria-current', 'true');
    clickedPill.setAttribute('aria-checked', 'true');
    currentMiniPillSelectorLabelName.textContent = clickedPill.getAttribute('data-title');
    const pillName = clickedPill.getAttribute('data-name');
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
    currentHiddenSelectInput.value = pillName;
    const optionToSelect = currentHiddenSelectInput.querySelector(`option[value="${pillName}"]`);
    if (optionToSelect) {
      optionToSelect.selected = true;
    }
    if (!cachedAllInputs) {
      cachedAllInputs = document.querySelectorAll(`[name=${currentHiddenSelectInputName}]`);
    }
    cachedAllInputs.forEach((input) => {
      input.value = pillName;
      if (input.tagName === 'SELECT') {
        const selectOption = input.querySelector(`option[value="${pillName}"]`);
        if (selectOption) {
          selectOption.selected = true;
        }
      }
    });
    const isInDrawer = currentMiniPillSelectorContainer.closest('#pdpx-drawer');
    if (!isInDrawer) {
      updateAllDynamicElements(currentProductId);
    }
  };

  for (let i = 0; i < customizationOptions.length; i += 1) {
    const option = createTag('option', { value: customizationOptions[i].name }, customizationOptions[i].title);
    if (customizationOptions[i].name === defaultValue) {
      selectedValueExists = customizationOptions[i].name;
    }
    hiddenSelectInput.appendChild(option);
    const miniPillOption = createTag('div', { class: 'pdpx-mini-pill-container', 'data-tooltip': customizationOptions[i].title });
    const miniPillOptionImageContainer = createTag('button', { class: 'pdpx-mini-pill-image-container', type: 'button', 'data-name': customizationOptions[i].name, 'data-title': customizationOptions[i].title });
    const miniPillOptionImage = createTag('img', { class: 'pdpx-mini-pill-image', alt: customizationOptions[i].title, src: customizationOptions[i].thumbnail });
    miniPillOptionImageContainer.appendChild(miniPillOptionImage);
    const miniPillOptionTextContainer = createTag('div', { class: 'pdpx-mini-pill-text-container' });
    const miniPillOptionPrice = createTag('span', { class: 'pdpx-mini-pill-price' }, customizationOptions[i].priceAdjustment);
    miniPillOptionImageContainer.addEventListener('click', createMiniPillClickHandler(
      hiddenSelectInput,
      miniPillSelectorOptionsWrapper,
      miniPillSelectorLabelName,
      miniPillSelectorContainer,
      productId,
      hiddenSelectInputName,
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
    miniPillOption.appendChild(miniPillOptionImageContainer, miniPillOptionTextContainer);
    miniPillSelectorOptionsContainer.appendChild(miniPillOption);
  }
  hiddenSelectInput.value = selectedValueExists || customizationOptions[0].name;
  const selectedMiniPillOptionImageContainer = miniPillSelectorOptionsContainer.querySelector(`.pdpx-mini-pill-image-container[data-name="${hiddenSelectInput.value}"]`);
  selectedMiniPillOptionImageContainer.classList.add('selected');
  selectedMiniPillOptionImageContainer.setAttribute('aria-current', 'true');
  selectedMiniPillOptionImageContainer.setAttribute('aria-checked', 'true');
  miniPillSelectorLabelName.textContent = selectedMiniPillOptionImageContainer.dataset.title;
  miniPillSelectorLabelNameContainer.appendChild(miniPillSelectorLabelName);
  miniPillSelectorOptionsWrapper.appendChild(miniPillSelectorOptionsContainer);
  cachedAllPills = miniPillSelectorOptionsWrapper.querySelectorAll('.pdpx-mini-pill-image-container');
  cachedAllInputs = document.querySelectorAll(`[name=${hiddenSelectInputName}]`);

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

  const showJSTooltip = (button, tooltip) => {
    const rect = button.getBoundingClientRect();
    const arrow = tooltip.querySelector('.pdpx-js-tooltip-arrow');
    const tooltipRect = tooltip.getBoundingClientRect();
    const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    const top = rect.top - tooltipRect.height - 8;
    tooltip.style.left = `${Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8))}px`;
    tooltip.style.top = `${top}px`;

    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '0';
    if (arrow) {
      arrow.style.visibility = 'visible';
      arrow.style.opacity = '0';
    }

    tooltip.style.transition = 'var(--standard-transition-hover-in-opacity)';
    if (arrow) {
      arrow.style.transition = 'var(--standard-transition-hover-in-opacity)';
    }

    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
      if (arrow) {
        arrow.style.opacity = '1';
      }
    });
  };

  const setupCarouselTooltips = () => {
    const carouselItems = miniPillSelectorOptionsWrapper.querySelectorAll('.simple-carousel-item .pdpx-mini-pill-image-container');
    carouselItems.forEach((button) => {
      const tooltipText = button.getAttribute('data-title');
      if (tooltipText) {
        const tooltip = createJSTooltip(button, tooltipText);
        tooltipMap.set(button, tooltip);

        const showTooltip = () => showJSTooltip(button, tooltip);
        const hideTooltip = () => hideJSTooltip(tooltip);

        let touchTimeout;
        button.addEventListener('mouseenter', showTooltip);
        button.addEventListener('mouseleave', hideTooltip);
        button.addEventListener('touchstart', () => {
          touchTimeout = setTimeout(() => {
            showTooltip();
          }, 500);
        });
        button.addEventListener('touchend', () => {
          clearTimeout(touchTimeout);
        });
        button.addEventListener('touchmove', () => {
          clearTimeout(touchTimeout);
          hideTooltip();
        });
        button.addEventListener('click', () => {
          tooltipMap.forEach((tooltipEl) => {
            hideJSTooltip(tooltipEl);
          });
        });
      }
    });
  };

  const initCarousel = async () => {
    if (miniPillSelectorOptionsContainer.children.length > 0 && !isCarouselActive) {
      await createSimpleCarousel('.pdpx-mini-pill-container', miniPillSelectorOptionsWrapper, {
        ariaLabel: `${labelText} options`,
        centerActive: true,
        activeClass: 'selected',
      });
      const platform = miniPillSelectorOptionsWrapper.querySelector('.simple-carousel-platform');
      if (platform) {
        platform.style.overflowY = 'visible';
      }
      const carouselItems = miniPillSelectorOptionsWrapper.querySelectorAll('.pdpx-mini-pill-container.simple-carousel-item');
      carouselItems.forEach((item) => {
        const focusableChild = item.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableChild) {
          item.removeAttribute('tabindex');
        }
      });
      requestAnimationFrame(() => {
        setupCarouselTooltips();
      });
      isCarouselActive = true;
    }
  };

  const cleanupCarouselTooltips = () => {
    tooltipMap.forEach((tooltipEl) => {
      tooltipEl.remove();
    });
    tooltipMap.clear();
  };

  const destroyCarousel = () => {
    if (isCarouselActive) {
      cleanupCarouselTooltips();
      const carouselContainer = miniPillSelectorOptionsWrapper.querySelector('.simple-carousel-container');
      const faderLeft = miniPillSelectorOptionsWrapper.querySelector('.simple-carousel-fader-left');
      const faderRight = miniPillSelectorOptionsWrapper.querySelector('.simple-carousel-fader-right');

      if (carouselContainer) {
        const platform = carouselContainer.querySelector('.simple-carousel-platform');
        if (platform) {
          const pills = Array.from(platform.querySelectorAll('.pdpx-mini-pill-container'));
          pills.forEach((pill) => {
            pill.classList.remove('simple-carousel-item');
            pill.removeAttribute('tabindex');
            pill.removeAttribute('role');
            pill.removeAttribute('aria-label');
            miniPillSelectorOptionsContainer.appendChild(pill);
          });
        }
        carouselContainer.remove();
      }
      if (faderLeft) faderLeft.remove();
      if (faderRight) faderRight.remove();
      isCarouselActive = false;
    }
  };

  const handleResize = async () => {
    if (mediaQuery.matches && !isCarouselActive) {
      await initCarousel();
    } else if (!mediaQuery.matches && isCarouselActive) {
      destroyCarousel();
    }
  };

  if (mediaQuery.matches) {
    await initCarousel();
  }

  mediaQuery.addEventListener('change', handleResize);
  window.addEventListener('orientationchange', handleResize);

  miniPillSelectorContainer.cleanupCarousel = () => {
    mediaQuery.removeEventListener('change', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    cleanupCarouselTooltips();
    destroyCarousel();
  };

  miniPillSelectorContainer.append(miniPillSelectorOptionsWrapper, hiddenSelectInput);
  return miniPillSelectorContainer;
}
