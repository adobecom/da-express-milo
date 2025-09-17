import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import {
  extractTemplateMetadata,
  extractApiParamsFromRecipe,
  getBlockStylingConfig,
  determineTemplateRouting,
  fetchDirectFromApiUrl,
} from './template-x-promo-utils.js';

let createTag;
let getConfig;
let replaceKey;

async function createDirectCarousel(block, templates, createTagFn) {
  const templateCount = templates.length;
  let currentIndex = 0;
  let isAnimating = false;

  const wrapper = createTagFn('div', { class: 'promo-carousel-wrapper' });
  const skipLink = createTagFn('a', {
    href: '#carousel-content',
    class: 'carousel-skip-link sr-only',
    textContent: 'Skip to carousel content',
  });
  const viewport = createTagFn('div', { class: 'promo-carousel-viewport' });
  const track = createTagFn('div', {
    class: 'promo-carousel-track',
    id: 'carousel-content',
    tabindex: '0',
    role: 'region',
    'aria-label': 'Template carousel',
  });
  const carouselId = `carousel-status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const status = createTagFn('div', {
    id: carouselId,
    class: 'sr-only',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  });

  const navControls = createTagFn('div', { class: 'promo-nav-controls' });
  const prevBtn = createTagFn('button', {
    class: 'promo-nav-btn promo-prev-btn',
    'aria-label': 'Previous templates',
    'aria-describedby': carouselId,
  });
  const nextBtn = createTagFn('button', {
    class: 'promo-nav-btn promo-next-btn',
    'aria-label': 'Next templates',
    'aria-describedby': carouselId,
  });

  prevBtn.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false" role="img">
      <circle cx="16" cy="16" r="16" fill="#FFFFFF"></circle>
      <path d="M17.3984 21.1996L12.5984 16.3996L17.3984 11.5996" stroke="#292929" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  `;
  nextBtn.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false" role="img">
      <circle cx="16" cy="16" r="16" fill="#FFFFFF"></circle>
      <path d="M14.6016 21.1996L19.4016 16.3996L14.6016 11.5996" stroke="#292929" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  `;

  navControls.append(prevBtn, nextBtn);

  const updateDisplay = () => {
    if (isAnimating) {
      return;
    }

    track.innerHTML = '';

    const prevIndex = currentIndex === 0 ? templateCount - 1 : currentIndex - 1;
    const nextIndex = currentIndex === templateCount - 1 ? 0 : currentIndex + 1;

    const prevTemplate = templates[prevIndex];
    prevTemplate.dataset.templateIndex = prevIndex.toString();
    prevTemplate.className = 'template prev-template';
    prevTemplate.setAttribute('tabindex', '0');
    track.append(prevTemplate);

    const currentTemplate = templates[currentIndex];
    currentTemplate.dataset.templateIndex = currentIndex.toString();
    currentTemplate.className = 'template current-template';
    currentTemplate.setAttribute('tabindex', '0');
    track.append(currentTemplate);

    const nextTemplate = templates[nextIndex];
    nextTemplate.dataset.templateIndex = nextIndex.toString();
    nextTemplate.className = 'template next-template';
    nextTemplate.setAttribute('tabindex', '0');
    track.append(nextTemplate);

    status.textContent = `Carousel item ${currentIndex + 1} of ${templateCount}`;
  };

  const handleNext = () => {
    if (isAnimating) {
      return;
    }
    currentIndex = (currentIndex + 1) % templateCount;
    updateDisplay();
    isAnimating = true;
    setTimeout(() => {
      isAnimating = false;
    }, 300);
  };

  const handlePrev = () => {
    if (isAnimating) {
      return;
    }
    currentIndex = (currentIndex - 1 + templateCount) % templateCount;
    updateDisplay();
    isAnimating = true;
    setTimeout(() => {
      isAnimating = false;
    }, 300);
  };

  nextBtn.addEventListener('click', () => {
    handleNext();
  });
  prevBtn.addEventListener('click', () => {
    handlePrev();
  });

  const handleKeyboard = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNext();
    }
  };
  track.addEventListener('keydown', handleKeyboard);

  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let isSwipeGesture = false;

  const handleTouchStart = (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    isSwipeGesture = false;
  };

  const handleTouchMove = (event) => {
    if (!touchStartX || !touchStartY) return;

    touchEndX = event.touches[0].clientX;
    touchEndY = event.touches[0].clientY;

    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      isSwipeGesture = true;
      event.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipeGesture || !touchStartX || !touchEndX) return;

    const deltaX = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
    isSwipeGesture = false;
  };

  track.addEventListener('touchstart', handleTouchStart, { passive: false });
  track.addEventListener('touchmove', handleTouchMove, { passive: false });
  track.addEventListener('touchend', handleTouchEnd, { passive: false });

  viewport.append(track);
  wrapper.append(skipLink, viewport, navControls, status);

  block.parentElement.classList.add('multiple-up');
  block.classList.add('custom-promo-carousel');
  block.append(wrapper);

  updateDisplay();

  return {
    currentIndex: () => currentIndex,
    templateCount: () => templateCount,
    destroy: () => {
      nextBtn.removeEventListener('click', handleNext);
      prevBtn.removeEventListener('click', handlePrev);
      track.removeEventListener('keydown', handleKeyboard);
      track.removeEventListener('touchstart', handleTouchStart);
      track.removeEventListener('touchmove', handleTouchMove);
      track.removeEventListener('touchend', handleTouchEnd);
    },
  };
}

async function handleOneUpFromApiData(block, templateData) {
  const parent = block.parentElement;
  parent.classList.add('one-up');
  block.innerHTML = '';

  const metadata = extractTemplateMetadata(templateData);

  let { imageUrl } = metadata;
  if (imageUrl && imageUrl.includes('{&')) {
    imageUrl = imageUrl.replace('{&page,size,type,fragment}', '');
  }

  if (!imageUrl || imageUrl.includes('{') || imageUrl.includes('undefined')) {
    throw new Error('Invalid template image URL');
  }

  const img = createTag('img', {
    src: imageUrl,
    alt: metadata.title,
    loading: 'lazy',
  });

  const imgWrapper = createTag('div', { class: 'image-wrapper' });
  imgWrapper.append(img);

  // Add free tag or premium icon based on template data
  if (metadata.isFree) {
    const freeTag = createTag('span', { class: 'free-tag' });
    freeTag.textContent = 'Free';
    imgWrapper.append(freeTag);
  } else if (metadata.isPremium) {
    const premiumIcon = getIconElementDeprecated('premium');
    imgWrapper.append(premiumIcon);
  }

  block.append(imgWrapper);

  const editThisTemplate = await replaceKey('edit-this-template', getConfig()) ?? 'Edit this template';
  const editTemplateButton = createTag('a', {
    href: metadata.editUrl,
    class: 'button accent small',
    title: `${editThisTemplate} ${metadata.title}`,
    'aria-label': `${editThisTemplate} ${metadata.title}`,
    target: '_self',
  });
  editTemplateButton.textContent = editThisTemplate;

  const buttonContainer = createTag('section', { class: 'button-container' });
  buttonContainer.append(editTemplateButton);

  parent.append(buttonContainer);
}

async function createTemplateElementForCarousel(templateData) {
  const { default: renderTemplate } = await import('../template-x/template-rendering.js');

  const singlePageTemplate = {
    ...templateData,
    pages: templateData.pages ? [templateData.pages[0]] : [],
  };

  const templateEl = await renderTemplate(singlePageTemplate, [], {});

  templateEl.classList.add('template');

  return templateEl;
}

async function createDesktopLayout(block, templates) {
  try {
    const templateElements = await Promise.all(
      templates.map((template) => createTemplateElementForCarousel(template)),
    );

    const parent = block.parentElement;
    parent.classList.add('multiple-up');

    const templateCount = templates.length;
    if (templateCount === 2) {
      parent.classList.add('two-up');
    } else if (templateCount === 3) {
      parent.classList.add('three-up');
    } else if (templateCount >= 4) {
      parent.classList.add('four-up');
    }

    templateElements.forEach((template) => {
      parent.append(template);
    });

    return {
      currentIndex: () => 0,
      templateCount: () => templateElements.length,
      destroy: () => {
      },
    };
  } catch (e) {
    block.textContent = `Error loading templates: ${e.message}`;
    return null;
  }
}

export async function createCustomCarousel(block, templates) {
  try {
    const templateElements = await Promise.all(
      templates.map((template) => createTemplateElementForCarousel(template)),
    );

    const parent = block.parentElement;
    parent.classList.add('multiple-up');

    const templateCount = templates.length;
    if (templateCount === 2) {
      parent.classList.add('two-up');
    } else if (templateCount === 3) {
      parent.classList.add('three-up');
    } else if (templateCount >= 4) {
      parent.classList.add('four-up');
    }

    const carousel = await createDirectCarousel(block, templateElements, createTag);

    // eslint-disable-next-line no-underscore-dangle
    block._carousel = carousel;

    return carousel;
  } catch (e) {
    block.textContent = `Error loading templates: ${e.message}`;
    return null;
  }
}

const initializeUtilities = async () => {
  const libsPath = getLibs() || '../../scripts';
  try {
    const [utils, placeholders] = await Promise.all([
      import(`${libsPath}/utils.js`),
      import(`${libsPath}/features/placeholders.js`),
    ]);

    return {
      createTag: utils.createTag,
      getConfig: utils.getConfig,
      replaceKey: placeholders.replaceKey,
    };
  } catch (utilsError) {
    return {
      createTag: window.createTag || ((tag, attrs) => {
        const el = document.createElement(tag);
        if (attrs) {
          Object.keys(attrs).forEach((key) => {
            if (key === 'class') el.className = attrs[key];
            else el.setAttribute(key, attrs[key]);
          });
        }
        return el;
      }),
      getConfig: window.getConfig || (() => ({})),
      replaceKey: window.replaceKey || (async () => null),
    };
  }
};

const routeTemplates = async (block, templates) => {
  const routingDecision = determineTemplateRouting(templates);

  switch (routingDecision.strategy) {
    case 'none':
      return;
    case 'one-up':
      await handleOneUpFromApiData(block, routingDecision.template);
      break;
    case 'carousel': {
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      if (isMobile) {
        await createCustomCarousel(block, routingDecision.templates);
      } else {
        await createDesktopLayout(block, routingDecision.templates);
      }
      break;
    }
    default:
      break;
  }
};

const handleApiDrivenTemplates = async (block, apiUrl, cachedTemplates = null) => {
  try {
    let templates;
    if (cachedTemplates) {
      templates = cachedTemplates;
    } else {
      const response = await fetchDirectFromApiUrl(apiUrl);
      templates = response.templates;
      // eslint-disable-next-line no-underscore-dangle
      block._cachedTemplates = templates;
    }

    block.innerHTML = '';

    const parent = block.parentElement;
    const existingTemplates = parent.querySelectorAll('.template');
    existingTemplates.forEach((template) => template.remove());

    await routeTemplates(block, templates);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in handleApiDrivenTemplates:', error);
  }
};

export default async function decorate(block) {
  if (block.hasAttribute('data-decorated')) {
    return;
  }

  block.setAttribute('data-decorated', 'true');
  const utilities = await initializeUtilities();
  createTag = utilities.createTag;
  getConfig = utilities.getConfig;
  replaceKey = utilities.replaceKey;
  const stylingConfig = getBlockStylingConfig(block);
  if (stylingConfig.shouldApply) {
    block.parentElement.classList.add(...stylingConfig.parentClasses);
  }
  const apiUrl = extractApiParamsFromRecipe(block);
  if (apiUrl) {
    await handleApiDrivenTemplates(block, apiUrl);

    let lastResponsiveCheck = 0;
    const RESPONSIVE_THROTTLE_MS = 100;

    const selectors = {
      carousel: '.promo-carousel-wrapper',
      desktop: '.template:not(.prev-template):not(.next-template):not(.current-template)',
    };
    const handleResponsiveChange = () => {
      const now = Date.now();
      if (now - lastResponsiveCheck < RESPONSIVE_THROTTLE_MS) {
        return;
      }
      lastResponsiveCheck = now;

      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      const hasCarousel = block.querySelector(selectors.carousel);
      const hasDesktopLayout = block.parentElement?.querySelector(selectors.desktop);

      if (hasCarousel && !isMobile) {
        // eslint-disable-next-line no-underscore-dangle
        if (block._carousel && block._carousel.destroy) {
          // eslint-disable-next-line no-underscore-dangle
          block._carousel.destroy();
          // eslint-disable-next-line no-underscore-dangle
          block._carousel = null;
        }

        block.innerHTML = '';

        // eslint-disable-next-line no-underscore-dangle
        handleApiDrivenTemplates(block, apiUrl, block._cachedTemplates);
      } else if (hasDesktopLayout && isMobile) {
        const parent = block.parentElement;
        const existingTemplates = parent.querySelectorAll('.template');
        existingTemplates.forEach((template) => template.remove());

        // eslint-disable-next-line no-underscore-dangle
        handleApiDrivenTemplates(block, apiUrl, block._cachedTemplates);
      }
    };

    const handleResponsiveOrientationChange = async () => {
      const now = Date.now();
      if (now - lastResponsiveCheck < RESPONSIVE_THROTTLE_MS) {
        return;
      }
      lastResponsiveCheck = now;

      const isMobile = window.screen.width <= 767;
      const hasCarousel = block.querySelector(selectors.carousel);
      const hasDesktopLayout = block.parentElement?.querySelector(selectors.desktop);

      if (hasCarousel && !isMobile) {
        // eslint-disable-next-line no-underscore-dangle
        if (block._carousel && block._carousel.destroy) {
          // eslint-disable-next-line no-underscore-dangle
          block._carousel.destroy();
          // eslint-disable-next-line no-underscore-dangle
          block._carousel = null;
        }

        block.innerHTML = '';

        // eslint-disable-next-line no-underscore-dangle
        let templates = block._cachedTemplates;
        if (!templates) {
          const response = await fetchDirectFromApiUrl(apiUrl);
          templates = response.templates;
          // eslint-disable-next-line no-underscore-dangle
          block._cachedTemplates = templates;
        }
        await createDesktopLayout(block, templates);
      } else if (hasDesktopLayout && isMobile) {
        const parent = block.parentElement;
        const existingTemplates = parent.querySelectorAll('.template');
        existingTemplates.forEach((template) => template.remove());

        // eslint-disable-next-line no-underscore-dangle
        let templates = block._cachedTemplates;
        if (!templates) {
          const response = await fetchDirectFromApiUrl(apiUrl);
          templates = response.templates;
          // eslint-disable-next-line no-underscore-dangle
          block._cachedTemplates = templates;
        }
        await createCustomCarousel(block, templates);
      }
    };

    window.addEventListener('resize', handleResponsiveChange);
    window.addEventListener('orientationchange', handleResponsiveOrientationChange);

    // eslint-disable-next-line no-underscore-dangle
    block._cleanup = () => {
      window.removeEventListener('resize', handleResponsiveChange);
      window.removeEventListener('orientationchange', handleResponsiveOrientationChange);
      // eslint-disable-next-line no-underscore-dangle
      if (block._carousel && block._carousel.destroy) {
        // eslint-disable-next-line no-underscore-dangle
        block._carousel.destroy();
      }
    };
  }
}
