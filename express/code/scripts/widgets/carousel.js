import { getLibs } from '../utils.js';
import { throttle } from '../utils/hofs.js';

let createTag; let loadStyle;

function correctCenterAlignment(plat) {
  if (plat.parentElement.offsetWidth <= plat.offsetWidth) return;
  plat.parentElement.style.maxWidth = `${plat.offsetWidth}px`;
}

// "End" is the logical end of the content (last item), regardless of which
// physical side that lands on once `flex-direction: row` mirrors under RTL.
function isAtEndOfScroll(element, rtl) {
  if (rtl) return element.scrollLeft <= -(element.scrollWidth - element.clientWidth - 10);
  return element.scrollLeft + element.clientWidth >= element.scrollWidth - 10;
}

function initToggleTriggers(parent) {
  if (!parent) return;

  const isInHiddenSection = () => {
    // optimization to avoid flashing on tab switch
    const parentSection = parent.closest('.section');
    if (!parentSection) return false;
    // 2 tabs block: ax-panels and content-toggle
    if (parentSection.dataset.toggle && parentSection.style.display === 'none') {
      return true;
    }
    if (parentSection.getAttribute('data-ax-panel') && parentSection.classList.contains('hide')) {
      return true;
    }
    return false;
  };

  const leftControl = parent.querySelector('.carousel-fader-left');
  const rightControl = parent.querySelector('.carousel-fader-right');
  const leftTrigger = parent.querySelector('.carousel-left-trigger');
  const rightTrigger = parent.querySelector('.carousel-right-trigger');
  const platform = parent.querySelector('.carousel-platform');

  // Under `dir="rtl"`, `flex-direction: row` mirrors the platform's children:
  // the first item (adjacent to leftTrigger) renders on the physical right,
  // and the last item (adjacent to rightTrigger) renders on the physical
  // left. The fader/arrow controls stay pinned to their physical side, so
  // which trigger should drive which control needs to flip accordingly.
  const rtl = window.getComputedStyle(platform).direction === 'rtl';
  const startControl = rtl ? rightControl : leftControl;
  const endControl = rtl ? leftControl : rightControl;
  const startFaderClass = rtl ? 'right-fader' : 'left-fader';
  const endFaderClass = rtl ? 'left-fader' : 'right-fader';

  // If flex container has a gap, add negative margins to compensate
  const gap = window.getComputedStyle(platform, null).getPropertyValue('gap');
  if (gap !== 'normal') {
    const gapInt = parseInt(gap.replace('px', ''), 10);
    leftTrigger.style.marginInlineEnd = `-${gapInt + 1}px`;
    rightTrigger.style.marginInlineStart = `-${gapInt + 1}px`;
  }

  // intersection observer to toggle right arrow and gradient
  const onSlideIntersect = (entries) => {
    if (isInHiddenSection()) return;

    entries.forEach((entry) => {
      if (entry.target === leftTrigger) {
        if (entry.isIntersecting) {
          startControl.classList.add('arrow-hidden');
          platform.classList.remove(startFaderClass);
        } else {
          startControl.classList.remove('arrow-hidden');
          platform.classList.add(startFaderClass);
        }
      }

      if (entry.target === rightTrigger) {
        if (entry.isIntersecting || isAtEndOfScroll(platform, rtl)) {
          endControl.classList.add('arrow-hidden');
          platform.classList.remove(endFaderClass);
        } else {
          endControl.classList.remove('arrow-hidden');
          platform.classList.add(endFaderClass);
        }
      }
    });
  };

  // Also handle scroll events to ensure proper state updates
  const updateEndArrowState = () => {
    if (isAtEndOfScroll(platform, rtl)) {
      endControl.classList.add('arrow-hidden');
      platform.classList.remove(endFaderClass);
    } else {
      endControl.classList.remove('arrow-hidden');
      platform.classList.add(endFaderClass);
    }
  };

  platform.addEventListener('scroll', throttle(updateEndArrowState, 100));

  const options = { threshold: 0, root: parent };
  const slideObserver = new IntersectionObserver(onSlideIntersect, options);
  slideObserver.observe(leftTrigger);
  slideObserver.observe(rightTrigger);
  // todo: should unobserve triggers where/when appropriate...
}

function onCarouselCSSLoad(selector, parent, options) {
  const carouselContent = selector ? parent.querySelectorAll(selector) : parent.querySelectorAll(':scope > *');

  carouselContent.forEach((el) => el.classList.add('carousel-element'));

  const container = createTag('div', { class: 'carousel-container' });
  const platform = createTag('div', { class: 'carousel-platform' });

  const faderLeft = createTag('div', { class: 'carousel-fader-left arrow-hidden' });
  const faderRight = createTag('div', { class: 'carousel-fader-right arrow-hidden' });

  const arrowLeft = createTag('a', { class: 'button carousel-arrow carousel-arrow-left' });
  const arrowRight = createTag('a', { class: 'button carousel-arrow carousel-arrow-right' });
  arrowLeft.title = 'Carousel Left';
  arrowRight.title = 'Carousel Right';

  platform.append(...carouselContent);

  if (!options.infinityScrollEnabled) {
    const leftTrigger = createTag('div', { class: 'carousel-left-trigger' });
    const rightTrigger = createTag('div', { class: 'carousel-right-trigger' });

    platform.prepend(leftTrigger);
    platform.append(rightTrigger);
  }

  container.append(platform, faderLeft, faderRight);
  faderLeft.append(arrowLeft);
  faderRight.append(arrowRight);
  parent.append(container);

  // Right arrow visibility is now handled by the intersection observer and
  // scroll event in initToggleTriggers

  // Scroll the carousel by clicking on the controls
  const moveCarousel = (increment) => {
    platform.scrollLeft -= increment;
  };

  faderLeft.addEventListener('click', () => {
    const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
    moveCarousel(increment);
  });
  faderRight.addEventListener('click', () => {
    const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
    moveCarousel(-increment);
  });

  // Carousel loop functionality (if enabled)
  const stopScrolling = () => { // To prevent safari shakiness
    platform.style.overflowX = 'hidden';
    setTimeout(() => {
      platform.style.removeProperty('overflow-x');
    }, 20);
  };

  const moveToCenterIfNearTheEdge = (e = null) => {
    // Start at the center and snap back to center if the user scrolls to the edges
    const scrollPos = platform.scrollLeft;
    const maxScroll = platform.scrollWidth;
    if ((scrollPos > (maxScroll / 5) * 4) || scrollPos < 30) {
      if (e) e.preventDefault();
      stopScrolling();
      platform.scrollTo({
        left: ((maxScroll / 5) * 2),
        behavior: 'instant',
      });
    }
  };

  const infinityScroll = (children) => {
    const duplicateContent = () => {
      [...children].forEach((child) => {
        const duplicate = child.cloneNode(true);
        const duplicateLinks = duplicate.querySelectorAll('a');
        platform.append(duplicate);
        if (duplicate.tagName.toLowerCase() === 'a') {
          const linksPopulated = new CustomEvent('linkspopulated', { detail: [duplicate] });
          document.dispatchEvent(linksPopulated);
        }
        if (duplicateLinks) {
          const linksPopulated = new CustomEvent('linkspopulated', { detail: duplicateLinks });
          document.dispatchEvent(linksPopulated);
        }
      });
    };

    // Duplicate children to simulate smooth scrolling
    for (let i = 0; i < 4; i += 1) {
      duplicateContent();
    }

    platform.addEventListener('scroll', (e) => {
      moveToCenterIfNearTheEdge(e);
    }, { passive: false });
  };

  // set initial states
  const setInitialState = (scrollable, opts) => {
    if (opts.infinityScrollEnabled) {
      infinityScroll([...carouselContent]);
      faderLeft.classList.remove('arrow-hidden');
      faderRight.classList.remove('arrow-hidden');
      platform.classList.add('left-fader', 'right-fader');
    }

    const onIntersect = ([entry], observer) => {
      if (!entry.isIntersecting) return;

      if (opts.centerAlign) correctCenterAlignment(scrollable);
      if (opts.startPosition === 'right') moveCarousel(-scrollable.scrollWidth);
      if (!opts.infinityScrollEnabled) initToggleTriggers(container);

      observer.unobserve(scrollable);
    };

    const carouselObserver = new IntersectionObserver(onIntersect, { rootMargin: '1000px', threshold: 0 });
    carouselObserver.observe(scrollable);
  };

  setInitialState(platform, options);
}

export default async function buildCarousel(selector, parent, options = {}) {
  ({ createTag, loadStyle } = await import(`${getLibs()}/utils/utils.js`));
  // Load CSS then build carousel
  return new Promise((resolve) => {
    loadStyle('/express/code/scripts/widgets/carousel.css', () => {
      onCarouselCSSLoad(selector, parent, options);
      resolve();
    });
  });
}
