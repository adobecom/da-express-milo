import { getLibs } from '../utils.js';

const smalLViewport = 600;
let createTag; let loadStyle;
let getConfig;

function initializeCarousel(selector, parent) {
  let autoPlayInterval = null;
  let isPlaying = false;

  const carouselContent = selector
    ? parent.querySelectorAll(selector)
    : parent.querySelectorAll(':scope > *');

  const isGridLayout = parent.closest('.template-x.basic-carousel.grid') !== null;

  // Create platform and other elements
  const platform = createTag('div', { class: 'basic-carousel-platform' });
  let ariaLabel;
  if (parent.closest('.template-x')) {
    ariaLabel = 'Template-X Carousel';
  } else if (parent.closest('.template-list')) {
    ariaLabel = 'Template List Carousel';
  } else {
    ariaLabel = 'Blog Carousel';
  }
  const container = createTag('div', {
    class: 'basic-carousel-container',
    role: 'region',
    'aria-label': ariaLabel,
  });

  // Assign grid areas for grid layout
  if (isGridLayout && window.innerWidth <= smalLViewport) {
    const totalTemplates = carouselContent.length;
    const midPoint = Math.ceil(totalTemplates / 2);
    carouselContent.forEach((template, index) => {
      if (index < midPoint) {
        template.style.gridArea = `1 / ${index + 1}`;
      } else {
        template.style.gridArea = `2 / ${index - midPoint + 1}`;
      }
    });
  }

  carouselContent.forEach((el, index) => {
    el.classList.add('basic-carousel-element');
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', `Item ${index + 1} of ${carouselContent.length}`);

    el.addEventListener('mouseleave', () => {
      if (window.innerWidth > smalLViewport) {
        const isHover = el.querySelector('.button-container.singleton-hover');
        if (isHover) {
          isHover.classList.remove('singleton-hover');
          isHover.classList.remove('hovering');
        }
      }
    });
  });

  const faderLeft = createTag('div', { class: 'basic-carousel-fader-left arrow-hidden' });
  const faderRight = createTag('div', { class: 'basic-carousel-fader-right arrow-hidden' });

  const arrowLeft = createTag('a', {
    class: 'button basic-carousel-arrow basic-carousel-arrow-left',
    'aria-label': 'Scroll carousel left',
    tabindex: '0',
  });
  const arrowRight = createTag('a', {
    class: 'button basic-carousel-arrow basic-carousel-arrow-right',
    'aria-label': 'Scroll carousel right',
    tabindex: '0',
  });

  platform.append(...carouselContent);

  // Add trigger elements for intersection observer
  const leftTrigger = createTag('div', { class: 'basic-carousel-left-trigger' });
  const rightTrigger = createTag('div', { class: 'basic-carousel-right-trigger' });
  platform.prepend(leftTrigger);
  platform.append(rightTrigger);

  // Set up intersection observer for arrow visibility
  const onSlideIntersect = (entries) => {
    entries.forEach((entry) => {
      if (entry.target === leftTrigger) {
        faderLeft.classList.toggle('arrow-hidden', entry.isIntersecting);
      }
      if (entry.target === rightTrigger) {
        faderRight.classList.toggle('arrow-hidden', entry.isIntersecting);
      }
    });
  };

  const options = { threshold: 0, root: container };
  const slideObserver = new IntersectionObserver(onSlideIntersect, options);
  slideObserver.observe(leftTrigger);
  slideObserver.observe(rightTrigger);

  if (isGridLayout) {
    platform.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  // Create a wrapper for all controls
  const controlsWrapper = createTag('div', { class: 'basic-carousel-controls-wrapper' });

  container.append(platform, controlsWrapper);

  // Create play/pause control first if the carousel-play-pause class is present
  let playPauseControl;
  let playPauseButton;
  const hasPlayPause = parent.closest('.carousel-play-pause');

  if (hasPlayPause) {
    playPauseControl = createTag('div', { class: 'basic-carousel-play-pause' });
    playPauseButton = createTag('a', {
      class: 'button basic-carousel-control basic-carousel-play-pause-button paused',
      'aria-label': 'Play carousel',
      'daa-ll': 'Play carousel',
      tabindex: '0',
    });
    playPauseControl.appendChild(playPauseButton);
    // Add pla/pause button first
    controlsWrapper.appendChild(playPauseControl);
  }

  // Then add arrow controls
  controlsWrapper.append(faderLeft, faderRight);
  faderLeft.append(arrowLeft);
  faderRight.append(arrowRight);
  parent.append(container);

  const elements = platform.querySelectorAll('.template.basic-carousel-element');

  // Simple scroll function from carousel.js
  const moveCarousel = (increment) => {
    platform.scrollLeft -= increment;
  };

  // Function to start auto-play
  const startAutoPlay = () => {
    if (!hasPlayPause || autoPlayInterval) return;
    isPlaying = true;
    playPauseButton.classList.add('playing');
    playPauseButton.classList.remove('paused');
    playPauseButton.setAttribute('aria-label', 'Pause carousel');
    playPauseButton.setAttribute('daa-ll', 'Pause carousel');

    const moveNext = () => {
      const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
      moveCarousel(-increment);
    };

    autoPlayInterval = setInterval(moveNext, 3000);
  };

  // Function to stop auto-play
  const stopAutoPlay = () => {
    if (!hasPlayPause || !autoPlayInterval) return;
    isPlaying = false;
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
    playPauseButton.classList.remove('playing');
    playPauseButton.classList.add('paused');
    playPauseButton.setAttribute('aria-label', 'Play carousel');
    playPauseButton.setAttribute('daa-ll', 'Play carousel');
  };

  if (hasPlayPause) {
    // Toggle play/pause on button click
    playPauseButton.addEventListener('click', () => {
      if (isPlaying) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });
  }

  // Pause on user interaction with arrows
  const pauseOnUserInteraction = () => {
    if (hasPlayPause && isPlaying) {
      stopAutoPlay();
    }
  };

  // Add event listeners for user interaction
  faderLeft.addEventListener('click', pauseOnUserInteraction);
  faderRight.addEventListener('click', pauseOnUserInteraction);
  platform.addEventListener('touchstart', pauseOnUserInteraction);

  // Simple click handlers from carousel.js
  faderLeft.addEventListener('click', () => {
    const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
    moveCarousel(increment);
  });

  faderRight.addEventListener('click', () => {
    const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
    moveCarousel(-increment);
  });

  // Keyboard event handlers for accessibility
  arrowLeft.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pauseOnUserInteraction();
      const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
      moveCarousel(increment);
    }
  });

  arrowRight.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pauseOnUserInteraction();
      const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
      moveCarousel(-increment);
    }
  });

  if (hasPlayPause) {
    playPauseButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isPlaying) {
          stopAutoPlay();
        } else {
          startAutoPlay();
        }
      }
    });
  }

  // Touch handling
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;

  platform.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchEndX = touchStartX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  platform.addEventListener('touchmove', (e) => {
    touchEndX = e.touches[0].clientX;
  }, { passive: true });

  platform.addEventListener('touchmove', (e) => {
    const touchEndY = e.touches[0].clientY;
    const deltaX = Math.abs(touchEndX - touchStartX);
    const deltaY = Math.abs(touchEndY - touchStartY);
    const isHorizontalMovement = deltaX > deltaY && deltaX > 10;
    const allowVerticalScroll = isGridLayout && window.innerWidth <= smalLViewport;
    if (isHorizontalMovement && !allowVerticalScroll) {
      e.preventDefault();
    }
  }, { passive: false });

  platform.addEventListener('touchend', (e) => {
    if (isGridLayout && window.innerWidth <= smalLViewport) {
      const tappedElement = document.elementFromPoint(
        e.changedTouches[0].clientX,
        e.changedTouches[0].clientY,
      );
      const isCard = tappedElement?.closest('.template.basic-carousel-element');
      if (isCard) {
        const editButton = isCard.querySelector('.button-container a[title="Edit this template"]');
        if (editButton?.href) {
          window.location.href = editButton.href;
        }
      }
      return;
    }

    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) > 50) {
      const increment = Math.max((platform.offsetWidth / 4) * 3, 300);
      if (swipeDistance > 0) {
        moveCarousel(increment);
      } else {
        moveCarousel(-increment);
      }
      return;
    }

    const tappedElement = document.elementFromPoint(
      e.changedTouches[0].clientX,
      e.changedTouches[0].clientY,
    );
    const isBtn = tappedElement.querySelector('.button-container.singleton-hover');
    const isCard = tappedElement.closest('.template.basic-carousel-element');
    if (tappedElement) {
      const shareIconWrapper = tappedElement.closest('.share-icon-wrapper');
      const linkHref = isCard?.querySelector('a')?.href || isBtn?.querySelector('a')?.href;
      if (linkHref && shareIconWrapper) {
        e.stopPropagation();
        navigator.clipboard.writeText(linkHref).then(() => {
          const tooltip = shareIconWrapper.querySelector('.shared-tooltip');
          if (tooltip) {
            tooltip.classList.add('display-tooltip');
            setTimeout(() => tooltip.classList.remove('display-tooltip'), 2000);
          }
        }).catch((err) => {
          window.lana?.log('Failed to copy link:', err);
        });
        return;
      }
      if (isCard && linkHref) {
        const isHoverActive = isCard?.querySelector('.button-container.singleton-hover');
        if (isHoverActive && linkHref) {
          window.location.href = linkHref;
        }
        const tappedIndex = Array.from(elements).indexOf(isCard);
        if (tappedIndex !== -1) {
          // Center the tapped card
          const elementWidth = elements[0].offsetWidth;
          const platformWidth = platform.offsetWidth;
          const targetScrollPos = tappedIndex * elementWidth - (platformWidth - elementWidth) / 2;
          platform.scrollTo({
            left: Math.max(0, targetScrollPos),
            behavior: 'smooth',
          });
        }
      } else if (isBtn && linkHref) {
        window.location.href = linkHref;
      }
    }
  });
}

export async function onBasicCarouselCSSLoad(selector, parent) {
  const config = getConfig();
  const stylesheetHref = `${config.codeRoot}/scripts/widgets/basic-carousel.css`;

  await new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = stylesheetHref;
    link.onload = resolve;
    link.onerror = () => reject(new Error(`Failed to load ${stylesheetHref}`));
    document.head.appendChild(link);
  });

  initializeCarousel(selector, parent);
}

export default async function buildBasicCarousel(selector, parent, options = {}) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`)]).then(([utils]) => {
    ({ createTag, getConfig, loadStyle } = utils);
  });
  const config = getConfig();
  return new Promise((resolve) => {
    loadStyle(`${config.codeRoot}/scripts/widgets/basic-carousel.css`, () => {
      onBasicCarouselCSSLoad(selector, parent, options);
      resolve();
    });
  });
}
