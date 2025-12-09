import { getLibs, getIconElementDeprecated } from '../utils.js';

let createTag;

function initializeSimpleCarousel(selector, parent, options = {}) {
  const {
    ariaLabel = 'Carousel',
    centerActive = false,
    activeClass = 'active',
  } = options;

  const carouselContent = selector
    ? parent.querySelectorAll(selector)
    : parent.querySelectorAll(':scope > *');

  if (carouselContent.length === 0) return undefined;
  const platform = createTag('div', { class: 'simple-carousel-platform' });

  const faderLeft = createTag('div', { class: 'simple-carousel-fader-left arrow-hidden' });
  const faderRight = createTag('div', { class: 'simple-carousel-fader-right arrow-hidden' });

  const arrowLeft = createTag('button', {
    class: 'button simple-carousel-arrow simple-carousel-arrow-left',
    'aria-label': 'Scroll left',
    type: 'button',
  });
  const arrowLeftIcon = getIconElementDeprecated('s2-chevron-left', 18, '', 'simple-carousel-arrow-icon');
  arrowLeftIcon.setAttribute('width', '18');
  arrowLeftIcon.setAttribute('height', '18');
  arrowLeftIcon.setAttribute('alt', '');
  arrowLeftIcon.setAttribute('aria-hidden', 'true');
  arrowLeft.appendChild(arrowLeftIcon);

  const arrowRight = createTag('button', {
    class: 'button simple-carousel-arrow simple-carousel-arrow-right',
    'aria-label': 'Scroll right',
    type: 'button',
  });
  const arrowRightIcon = getIconElementDeprecated('s2-chevron-right', 18, '', 'simple-carousel-arrow-icon');
  arrowRightIcon.setAttribute('width', '18');
  arrowRightIcon.setAttribute('height', '18');
  arrowRightIcon.setAttribute('alt', '');
  arrowRightIcon.setAttribute('aria-hidden', 'true');
  arrowRight.appendChild(arrowRightIcon);

  carouselContent.forEach((el, index) => {
    el.classList.add('simple-carousel-item');
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', `Item ${index + 1} of ${carouselContent.length}`);
    if (el.classList.contains(activeClass)) {
      el.setAttribute('aria-current', 'true');
    }
  });

  platform.append(...carouselContent);

  const updateArrowVisibility = () => {
    const hasOverflow = platform.scrollWidth > platform.clientWidth;
    if (!hasOverflow) {
      faderLeft.classList.add('arrow-hidden');
      faderRight.classList.add('arrow-hidden');
      return;
    }
    const isAtStart = platform.scrollLeft <= 1;
    const isAtEnd = platform.scrollLeft >= (platform.scrollWidth - platform.clientWidth - 1);
    faderLeft.classList.toggle('arrow-hidden', isAtStart);
    faderRight.classList.toggle('arrow-hidden', isAtEnd);
  };

  let scrollTimeout;
  const throttledUpdate = () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      updateArrowVisibility();
      scrollTimeout = null;
    }, 50);
  };
  faderLeft.append(arrowLeft);
  faderRight.append(arrowRight);
  parent.append(platform, faderLeft, faderRight);

  platform.addEventListener('scroll', throttledUpdate, { passive: true });
  // window.addEventListener('resize', throttledUpdate, { passive: true });

  requestAnimationFrame(() => {
    setTimeout(() => {
      updateArrowVisibility();
    }, 150);
  });

  let isManualScroll = false;

  const moveCarousel = (direction) => {
    isManualScroll = true;
    const scrollAmount = platform.offsetWidth * 0.75;
    platform.scrollLeft += direction === 'right' ? scrollAmount : -scrollAmount;
    setTimeout(() => {
      isManualScroll = false;
    }, 350);
  };

  arrowLeft.addEventListener('click', (e) => {
    e.preventDefault();
    moveCarousel('left');
  });

  arrowRight.addEventListener('click', (e) => {
    e.preventDefault();
    moveCarousel('right');
  });

  [arrowLeft, arrowRight].forEach((arrow) => {
    arrow.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        arrow.click();
      }
    });
  });

  let activeObserver;
  if (centerActive) {
    let isScrolling = false;
    let lastScrollTo = null;

    const centerActiveItem = () => {
      if (isScrolling || isManualScroll) return;
      requestAnimationFrame(() => {
        const activeElement = platform.querySelector(`.${activeClass}`);
        if (activeElement) {
          const activeItem = activeElement.closest('.simple-carousel-item') || activeElement;
          const itemLeft = activeItem.offsetLeft;
          const itemWidth = activeItem.offsetWidth;
          const containerWidth = platform.offsetWidth;
          const maxScroll = platform.scrollWidth - containerWidth;

          let scrollTo = itemLeft - (containerWidth / 2) + (itemWidth / 2);
          scrollTo = Math.max(0, Math.min(scrollTo, maxScroll));

          if (lastScrollTo === scrollTo) {
            return;
          }

          const { scrollLeft: currentScroll } = platform;
          if (Math.abs(currentScroll - scrollTo) < 5) {
            return;
          }

          lastScrollTo = scrollTo;
          isScrolling = true;
          platform.scrollTo({ left: scrollTo, behavior: 'smooth' });

          setTimeout(() => {
            isScrolling = false;
            lastScrollTo = null;
          }, 300);
        }
      });
    };

    activeObserver = new MutationObserver((mutations) => {
      const hasSelectedChange = mutations.some((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const { target } = mutation;
          const oldClasses = mutation.oldValue || '';
          const newClasses = target.className || '';
          const hadSelected = oldClasses.includes(activeClass);
          const hasSelected = newClasses.includes(activeClass);
          return hadSelected !== hasSelected;
        }
        return false;
      });
      if (hasSelectedChange) {
        centerActiveItem();
      }
    });
    activeObserver.observe(platform, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
      attributeOldValue: true,
    });

    requestAnimationFrame(() => {
      const activeElement = platform.querySelector(`.${activeClass}`);
      if (activeElement) {
        centerActiveItem();
      }
    });
  }

  platform.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const focusedItem = document.activeElement;
      if (focusedItem.classList.contains('simple-carousel-item')) {
        const items = Array.from(carouselContent);
        const currentIndex = items.indexOf(focusedItem);
        const nextIndex = e.key === 'ArrowLeft'
          ? Math.max(0, currentIndex - 1)
          : Math.min(items.length - 1, currentIndex + 1);
        items[nextIndex].focus();
      }
    }
  });

  const cleanup = () => {
    platform.removeEventListener('scroll', throttledUpdate);
    window.removeEventListener('resize', throttledUpdate);
    if (centerActive && activeObserver) {
      activeObserver.disconnect();
    }
  };

  return {
    platform,
    items: carouselContent,
    cleanup,
    scrollTo: (index) => {
      if (index >= 0 && index < carouselContent.length) {
        carouselContent[index].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    },
  };
}

export default async function createSimpleCarousel(selector, parent, options) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const miloLibs = getLibs();
  const base = miloLibs?.replace('/libs', '');
  const cssLoaded = new Promise((resolve) => {
    (async () => {
      const { loadStyle } = await import(`${miloLibs}/utils/utils.js`);
      await loadStyle(`${base}/express/code/scripts/widgets/simple-carousel.css`);
      resolve();
    })();
  });

  await cssLoaded;
  return initializeSimpleCarousel(selector, parent, options);
}
