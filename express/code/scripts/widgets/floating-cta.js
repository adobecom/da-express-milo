import { getLibs, getLottie, lazyLoadLottiePlayer, createTag, getMobileOperatingSystem, getIconElementDeprecated } from '../utils.js';
import BlockMediator from '../block-mediator.min.js';

export const hideScrollArrow = (floatButtonWrapper, lottieScrollButton) => {
  floatButtonWrapper.classList.add('floating-button--scrolled');
  if (lottieScrollButton) {
    if (document.activeElement === lottieScrollButton) lottieScrollButton.blur();
    lottieScrollButton.tabIndex = -1;
  }
};

export const showScrollArrow = (floatButtonWrapper, lottieScrollButton) => {
  floatButtonWrapper.classList.remove('floating-button--scrolled');
  if (lottieScrollButton) lottieScrollButton.removeAttribute('tabIndex');
};

export function openToolBox(wrapper, lottie, data) {
  const toolbox = wrapper.querySelector('.toolbox');
  const button = wrapper.querySelector('.floating-button');

  const scrollAnchor = document.querySelector('.section:not(:nth-child(1)):not(:nth-child(2)) .template-list, .section:not(:nth-child(1)):not(:nth-child(2)) .layouts, .section:not(:nth-child(1)):not(:nth-child(2)) .steps-highlight-container') ?? document.querySelector('.section:nth-child(3)');
  if (data.scrollState === 'withLottie' && scrollAnchor) {
    showScrollArrow(wrapper, lottie);
  }
  wrapper.classList.remove('toolbox-opened');
  setTimeout(() => {
    if (!wrapper.classList.contains('toolbox-opened')) {
      toolbox.classList.add('hidden');
      wrapper.classList.remove('clamped');
      button.classList.remove('toolbox-opened');
    }
  }, 500);
}

export function closeToolBox(wrapper, lottie) {
  const toolbox = wrapper.querySelector('.toolbox');
  const button = wrapper.querySelector('.floating-button');

  toolbox.classList.remove('hidden');
  wrapper.classList.add('clamped');
  button.classList.add('toolbox-opened');
  hideScrollArrow(wrapper, lottie);

  setTimeout(() => {
    wrapper.classList.add('toolbox-opened');
  }, 10);
}

export function initLottieArrow(lottieScrollButton, floatButtonWrapper, scrollAnchor, data) {
  let clicked = false;
  lottieScrollButton.addEventListener('click', () => {
    clicked = true;
    floatButtonWrapper.classList.add('floating-button--clicked');
    window.scrollTo({
      top: scrollAnchor.offsetTop,
      behavior: 'smooth',
    });
    const checkIfScrollToIsFinished = setInterval(() => {
      if (scrollAnchor.offsetTop <= window.scrollY) {
        clicked = false;
        floatButtonWrapper.classList.remove('floating-button--clicked');
        clearInterval(checkIfScrollToIsFinished);
      }
    }, 200);
    hideScrollArrow(floatButtonWrapper, lottieScrollButton);
  });

  window.addEventListener('scroll', () => {
    data.scrollState = floatButtonWrapper.classList.contains('floating-button--scrolled') ? 'withoutLottie' : 'withLottie';
    const multiFunctionButtonOpened = floatButtonWrapper.classList.contains('toolbox-opened');
    if (clicked) return;
    if (scrollAnchor.getBoundingClientRect().top < 100) {
      hideScrollArrow(floatButtonWrapper, lottieScrollButton);
    } else if (!multiFunctionButtonOpened) {
      showScrollArrow(floatButtonWrapper, lottieScrollButton);
    }
  }, { passive: true });
}

/* istanbul ignore next */
function makeCTAFromSheet(block, data) {
  const audience = block.querySelector(':scope > div').textContent.trim();
  const audienceSpecificUrl = audience && ['desktop', 'mobile'].includes(audience) ? data.mainCta[`${audience}Href`] : null;
  const audienceSpecificText = audience && ['desktop', 'mobile'].includes(audience) ? data.mainCta[`${audience}Text`] : null;
  const buttonContainer = createTag('div', { class: 'button-container' });
  const ctaFromSheet = createTag('a', { href: audienceSpecificUrl || data.mainCta.href, title: audienceSpecificText || data.mainCta.text });
  ctaFromSheet.textContent = audienceSpecificText || data.mainCta.text;
  buttonContainer.append(ctaFromSheet);
  block.append(buttonContainer);

  return ctaFromSheet;
}

/* istanbul ignore next */
async function buildLottieArrow(wrapper, floatingBtn, data) {
  const lottieScrollButton = createTag(
    'button',
    { class: 'floating-button-lottie' },
    getLottie('purple-arrows', '/express/code/icons/purple-arrows.json'),
  );

  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`)]).then(async ([utils, placeholders]) => {
    const seeMore = await placeholders.replaceKey('see-more', utils.getConfig());
    lottieScrollButton.setAttribute('aria-label', seeMore);
  });

  floatingBtn.append(lottieScrollButton);

  // Floating button scroll/click events
  lazyLoadLottiePlayer();
  const scrollAnchor = document.querySelector('.section:not(:nth-child(1)):not(:nth-child(2)) .template-list, .section:not(:nth-child(1)):not(:nth-child(2)) .layouts, .section:not(:nth-child(1)):not(:nth-child(2)) .steps-highlight-container') ?? document.querySelector('.section:nth-child(3)');
  if (!scrollAnchor) {
    hideScrollArrow(wrapper, lottieScrollButton);
  } else {
    initLottieArrow(lottieScrollButton, wrapper, scrollAnchor, data);
  }

  return lottieScrollButton;
}

/* istanbul ignore next */
export async function createFloatingButton(block, audience, data) {
  const { loadStyle, decorateLinks } = await import(`${getLibs()}/utils/utils.js`);
  const aTag = makeCTAFromSheet(block, data);
  const main = document.querySelector('main');
  loadStyle('/express/code/scripts/widgets/floating-cta.css');

  // Floating button html
  const floatButtonLink = aTag.cloneNode(true);
  floatButtonLink.className = '';
  floatButtonLink.classList.add('button', 'gradient', 'xlarge');

  // Change font size when text is too long
  function outputsize() {
    const floatButtonLinkStyle = window.getComputedStyle(floatButtonLink);
    const lineHeight = floatButtonLinkStyle.getPropertyValue('line-height');
    const lineHeightInt = +lineHeight.replace('px', '');

    // To figure out the available vertical space for text
    const paddingTop = floatButtonLinkStyle.getPropertyValue('padding-top');
    const paddingTopInt = +paddingTop.replace('px', '');
    const paddingBottom = floatButtonLinkStyle.getPropertyValue('padding-bottom');
    const paddingBottomInt = +paddingBottom.replace('px', '');
    const availableHeight = floatButtonLink.offsetHeight - paddingTopInt - paddingBottomInt;

    const numberOfLines = availableHeight / lineHeightInt;
    if (numberOfLines >= 2) {
      floatButtonLink.style.fontSize = '0.8rem';
      floatButtonLink.style.paddingLeft = '0.8rem';
      floatButtonLink.style.paddingRight = '0.8rem';
    }
  }

  new ResizeObserver(outputsize).observe(floatButtonLink);

  // Hide CTAs with same url & text as the Floating CTA && is NOT a Floating CTA (in mobile/tablet)
  const aTagURL = new URL(aTag.href);
  const sameUrlCTAs = Array.from(main.querySelectorAll('a.button:any-link, a.con-button:any-link'))
    .filter((a) => (
      a.textContent.trim() === aTag.textContent.trim()
        || (new URL(a.href).pathname === aTagURL.pathname && new URL(a.href).hash === aTagURL.hash))
        && !a.parentElement.parentElement.classList.contains('floating-button'));
  sameUrlCTAs.forEach((cta) => {
    cta.classList.add('same-fcta');
  });

  const floatButtonWrapperOld = aTag.closest('.floating-button-wrapper');
  const floatButtonWrapper = createTag('div', { class: 'section floating-button-wrapper' });
  const floatButton = createTag('div', {
    class: 'floating-button block',
    'data-block-name': 'floating-button',
    'data-block-status': 'loaded',
    'data-block': '',
  });
  [...block.classList].filter((c) => c === 'closed').forEach((c) => floatButtonWrapper.classList.add(c));
  const floatButtonInnerWrapper = createTag('div', { class: 'floating-button-inner-wrapper' });

  // Pre-apply suppressed state on mobile when suppression gating is enabled
  // to avoid initial visibility flicker before observers attach.
  if (audience === 'mobile' && data.enableSuppressGating) {
    const hasSuppressTargets = !!document.querySelector('.suppress-until-not-visible');
    if (hasSuppressTargets) {
      floatButtonWrapper.classList.add('floating-button--suppressed');
    }
  }

  if (audience) {
    floatButtonWrapper.dataset.audience = audience;
    floatButtonWrapper.dataset.sectionStatus = 'loaded';
  }

  floatButtonInnerWrapper.append(floatButtonLink);
  floatButton.append(floatButtonInnerWrapper);
  floatButtonWrapper.append(floatButton);
  main.append(floatButtonWrapper);
  if (floatButtonWrapperOld) {
    const parent = floatButtonWrapperOld.parentElement;
    if (parent && parent.children.length === 1) {
      parent.remove();
    } else {
      floatButtonWrapperOld.remove();
    }
  }

  const promoBar = BlockMediator.get('promobar');
  const currentBottom = parseInt(floatButtonWrapper.style.bottom, 10);
  let promoBarHeight;
  if (promoBar) {
    const promoBarMargin = parseInt(window.getComputedStyle(promoBar.block).marginBottom, 10);
    promoBarHeight = promoBarMargin + promoBar.block.offsetHeight;
  }

  if (promoBar && promoBar.rendered && floatButtonWrapper.dataset.audience !== 'desktop') {
    floatButton.style.bottom = currentBottom ? `${currentBottom + promoBarHeight}px` : `${promoBarHeight}px`;
  } else {
    floatButton.style.removeProperty('bottom');
  }

  BlockMediator.subscribe('promobar', (e) => {
    if (!e.newValue.rendered && floatButtonWrapper.dataset.audience !== 'desktop') {
      floatButton.style.bottom = currentBottom ? `${currentBottom - promoBarHeight}px` : '';
    } else {
      floatButton.style.removeProperty('bottom');
    }
  });

  // Intersection observer - hide button when scrolled to footer
  const footer = document.querySelector('footer');
  if (footer) {
    const hideButtonWhenFooter = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.intersectionRatio > 0 || entry.isIntersecting) {
        // Visually and accessibly hide the floating CTA when the footer is in view
        floatButtonWrapper.classList.add('floating-button--hidden');
        floatButtonWrapper.setAttribute('aria-hidden', 'true');
        // Prevent focus and remove from the accessibility tree in supporting browsers
        floatButtonWrapper.setAttribute('inert', '');
        floatButton.style.bottom = '0px';
      } else {
        // Restore visibility and accessibility when the footer is not in view
        floatButtonWrapper.classList.remove('floating-button--hidden');
        floatButtonWrapper.removeAttribute('aria-hidden');
        floatButtonWrapper.removeAttribute('inert');
        if (promoBar && promoBar.block) {
          floatButton.style.bottom = currentBottom ? `${currentBottom + promoBarHeight}px` : `${promoBarHeight}px`;
        } else if (currentBottom) {
          floatButton.style.bottom = currentBottom;
        }
      }
    }, {
      root: null,
      rootMargin: '32px',
      threshold: 0,
    });

    if (document.readyState === 'complete') {
      hideButtonWhenFooter.observe(footer);
    } else {
      window.addEventListener('load', () => {
        hideButtonWhenFooter.observe(footer);
      });
    }
  }

  document.dispatchEvent(new CustomEvent('floatingbuttonloaded', { detail: { block: floatButtonWrapper } }));

  const heroCTA = document.querySelector('a.button.same-fcta, a.con-button.same-fcta');
  if (heroCTA) {
    const hideButtonWhenIntersecting = new IntersectionObserver(([e]) => {
      if (e.boundingClientRect.top > window.innerHeight - 40 || e.boundingClientRect.top === 0) {
        floatButtonWrapper.classList.remove('floating-button--below-the-fold');
        floatButtonWrapper.classList.add('floating-button--above-the-fold');
      } else {
        floatButtonWrapper.classList.add('floating-button--below-the-fold');
        floatButtonWrapper.classList.remove('floating-button--above-the-fold');
      }
      if (e.intersectionRatio > 0 || e.isIntersecting) {
        floatButtonWrapper.classList.add('floating-button--intersecting');
        floatButton.style.bottom = '0px';
      } else {
        floatButtonWrapper.classList.remove('floating-button--intersecting');
        if (promoBar && promoBar.block) {
          floatButton.style.bottom = currentBottom ? `${currentBottom + promoBarHeight}px` : `${promoBarHeight}px`;
        } else if (currentBottom) {
          floatButton.style.bottom = currentBottom;
        }
      }
    }, {
      root: null,
      rootMargin: '-40px 0px',
      threshold: 0,
    });
    if (document.readyState === 'complete') {
      hideButtonWhenIntersecting.observe(heroCTA);
    } else {
      window.addEventListener('load', () => {
        hideButtonWhenIntersecting.observe(heroCTA);
      });
    }
  } else {
    floatButtonWrapper.classList.add('floating-button--above-the-fold');
  }

  // Mobile-only: hide floating CTA while any element with class
  // "suppress-until-not-visible" is in view; show only when all are out of view.
  if (floatButtonWrapper.dataset.audience === 'mobile' && data.enableSuppressGating) {
    const suppressTargets = Array.from(document.querySelectorAll('.suppress-until-not-visible'));
    if (suppressTargets.length) {
      const updateSuppressedState = (anyVisible) => {
        if (anyVisible) {
          floatButtonWrapper.classList.add('floating-button--suppressed');
          // Keep CTA pinned to bottom visually when suppressed
          floatButton.style.bottom = '0px';
        } else {
          floatButtonWrapper.classList.remove('floating-button--suppressed');
          if (promoBar && promoBar.block) {
            floatButton.style.bottom = currentBottom ? `${currentBottom + promoBarHeight}px` : `${promoBarHeight}px`;
          } else if (currentBottom) {
            floatButton.style.bottom = currentBottom;
          } else {
            floatButton.style.removeProperty('bottom');
          }
        }
      };

      const suppressObserver = new IntersectionObserver((entries) => {
        const anyVisible = entries.some((e) => e.intersectionRatio > 0 || e.isIntersecting);
        updateSuppressedState(anyVisible);
      }, {
        root: null,
        rootMargin: '-40px 0px',
        threshold: 0,
      });

      const startObserving = () => suppressTargets.forEach((el) => suppressObserver.observe(el));
      if (document.readyState === 'complete') {
        startObserving();
      } else {
        window.addEventListener('load', startObserving);
      }
    }
  }

  if (data.useLottieArrow) {
    const lottieScrollButton = buildLottieArrow(floatButtonWrapper, floatButton, data);
    document.dispatchEvent(new CustomEvent('linkspopulated', { detail: [floatButtonLink, lottieScrollButton] }));
  } else {
    data.scrollState = 'withoutLottie';
    floatButtonWrapper.classList.add('floating-button--scrolled');
    document.dispatchEvent(new CustomEvent('linkspopulated', { detail: [floatButtonLink] }));
  }

  decorateLinks(floatButtonWrapper);
  return floatButtonWrapper;
}

const CTA_ICON_COUNT = 7;
export function collectFloatingButtonData() {
  const metadataMap = Array.from(document.head.querySelectorAll('meta')).reduce((acc, meta) => {
    if (meta?.name && !meta.property) acc[meta.name] = meta.content || '';
    return acc;
  }, {});
  const getMetadata = (key) => metadataMap[key]; // customized getMetadata to reduce dom queries
  const data = {
    scrollState: 'withLottie',
    showAppStoreBadge: ['yes', 'y', 'true', 'on'].includes(getMetadata('show-floating-cta-app-store-badge')?.toLowerCase()),
    toolsToStash: getMetadata('ctas-above-divider'),
    useLottieArrow: ['yes', 'y', 'true', 'on'].includes(getMetadata('use-floating-cta-lottie-arrow')?.toLowerCase()),
    delay: getMetadata('floating-cta-drawer-delay') || 0,
    enableSuppressGating: ['yes', 'y', 'true', 'on'].includes(getMetadata('floating-cta-suppress-until-not-visible')?.toLowerCase()),
    tools: [],
    mainCta: {
      desktopHref: getMetadata('desktop-floating-cta-link'),
      desktopText: getMetadata('desktop-floating-cta-text'),
      mobileHref: getMetadata('mobile-floating-cta-link'),
      mobileText: getMetadata('mobile-floating-cta-text'),
      href: getMetadata('main-cta-link'),
      text: getMetadata('main-cta-text'),
    },
    bubbleSheet: getMetadata('floating-cta-bubble-sheet'),
    live: getMetadata('floating-cta-live'),
  };

  for (let i = 1; i < CTA_ICON_COUNT; i += 1) {
    const iconMetadata = getMetadata(`cta-${i}-icon`);
    if (!iconMetadata) break;
    const completeSet = {
      href: getMetadata(`cta-${i}-link`),
      text: getMetadata(`cta-${i}-text`),
      icon: getIconElementDeprecated(iconMetadata),
    };

    if (Object.values(completeSet).every((val) => !!val)) {
      const {
        href, text, icon,
      } = completeSet;
      const aTag = createTag('a', { title: text, href });
      aTag.textContent = text;
      data.tools.push({
        icon,
        anchor: aTag,
      });
    }
  }

  return data;
}

export function decorateBadge() {
  const anchor = createTag('a');
  const OS = getMobileOperatingSystem();

  if (anchor) {
    anchor.textContent = '';
    anchor.classList.add('badge');

    if (OS === 'iOS') {
      anchor.append(getIconElementDeprecated('apple-store'));
    } else {
      anchor.append(getIconElementDeprecated('google-store'));
    }
  }

  return anchor;
}

/* istanbul ignore next */
export function buildToolBoxStructure(wrapper, data) {
  lazyLoadLottiePlayer();
  const toolBox = createTag('div', { class: 'toolbox' });
  const toolBoxWrapper = createTag('div', { class: 'toolbox-inner-wrapper' });
  const notch = createTag('a', { class: 'notch' });
  const notchPill = createTag('div', { class: 'notch-pill' });

  const background = createTag('div', { class: 'toolbox-background' });
  const toggleButton = createTag('a', { class: 'toggle-button' });
  const toggleIcon = getIconElementDeprecated('plus-icon-22');
  const boxTop = createTag('div', { class: 'toolbox-top' });
  const boxBottom = createTag('div', { class: 'toolbox-bottom' });

  const floatingButton = wrapper.querySelector('.floating-button');

  toggleButton.innerHTML = getLottie('plus-animation', '/express/code/icons/plus-animation.json');
  toolBoxWrapper.append(boxTop, boxBottom);
  toolBox.append(toolBoxWrapper);
  toggleButton.append(toggleIcon);
  floatingButton.append(toggleButton);
  notch.append(notchPill);
  toolBox.append(notch);
  wrapper.append(toolBox, background);

  if (data.showAppStoreBadge) {
    const appStoreBadge = decorateBadge();
    toolBox.append(appStoreBadge);
    appStoreBadge.href = data.tools[0].anchor.href;
  }
}

/* istanbul ignore next */
export function initToolBox(wrapper, data, toggleFunction) {
  const floatingButton = wrapper.querySelector('.floating-button');
  const cta = floatingButton.querySelector('a');
  const toggleButton = wrapper.querySelector('.toggle-button');
  const lottie = wrapper.querySelector('.floating-button-lottie');
  const notch = wrapper.querySelector('.notch');
  const background = wrapper.querySelector('.toolbox-background');

  cta.addEventListener('click', (e) => {
    if (!wrapper.classList.contains('toolbox-opened')) {
      e.preventDefault();
      e.stopPropagation();
      toggleFunction(wrapper, lottie, data);
    }
  });

  [toggleButton, notch, background].forEach((element) => {
    if (element) {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFunction(wrapper, lottie, data);
      });
    }
  });
}
