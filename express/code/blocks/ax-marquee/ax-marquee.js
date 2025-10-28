import { getLibs, toClassName, getIconElementDeprecated, addTempWrapperDeprecated, decorateButtonsDeprecated } from '../../scripts/utils.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { addHeaderSizing } from '../../scripts/utils/location-utils.js';
import {
  fetchPlanOnePlans,
  formatDynamicCartLink,
} from '../../scripts/utils/pricing.js';
import { displayVideoModal, isVideoLink } from '../../scripts/widgets/video.js';

let getMetadata; let createTag;
let getConfig;

const DEFAULT_BREAKPOINT = {
  typeHint: 'default',
  minWidth: 0,
};

const MOBILE_BREAKPOINT = {
  typeHint: 'mobile',
  minWidth: 0,
};

const DESKTOP_BREAKPOINT = {
  typeHint: 'desktop',
  minWidth: 400,
};

const HD_BREAKPOINT = {
  typeHint: 'hd',
  minWidth: 1440,
};

const breakpointConfig = [
  DEFAULT_BREAKPOINT, MOBILE_BREAKPOINT, DESKTOP_BREAKPOINT, HD_BREAKPOINT,
];

// Transforms a {{pricing}} tag into human readable format.
async function handlePrice(block, tokenType = '((pricing))', responseFieldName = 'formatted') {
  const priceEls = [...block.querySelectorAll(':scope a')].filter((a) => a.textContent.includes(`${tokenType}`));
  if (!priceEls.length) return null;
  const priceEl = priceEls[0];
  const newContainer = createTag('span');
  priceEl.closest('p')?.classList.remove('button-container');
  priceEl.after(newContainer);
  priceEl.remove();
  try {
    const response = await fetchPlanOnePlans(priceEl?.href);
    newContainer.innerHTML = response[responseFieldName];
  } catch (error) {
    window.lana.log('Failed to fetch prices for page plan');
    window.lana.log(error);
  }
  return newContainer;
}

// FIXME: Not fulfilling requirement. Re-think of a way to allow subtext to contain link.
function handleSubCTAText(buttonContainer) {
  const elAfterBtn = buttonContainer.nextElementSibling;
  if (!elAfterBtn || elAfterBtn?.tagName !== 'BLOCKQUOTE') return;

  const subText = elAfterBtn.querySelector('p');
  if (subText) {
    subText.classList.add('cta-sub-text');
    buttonContainer.append(subText);
  }
  elAfterBtn.remove();
}

function getBreakpoint(animations) {
  let breakpoint = 'default';
  breakpointConfig.forEach((bp) => {
    if (window.innerWidth > bp.minWidth && animations[bp.typeHint]) breakpoint = bp.typeHint;
  });
  return breakpoint;
}

export function handleMediaQuery(block, mediaQuery) {
  localStorage.setItem('reduceMotion', mediaQuery.matches ? 'on' : 'off');

  mediaQuery.addEventListener('change', (e) => {
    const browserValue = localStorage.getItem('reduceMotion') === 'on';
    if (browserValue === e.matches) return;

    if (e.matches) {
      block.classList.add('reduce-motion');
      block.querySelector('video')?.pause();
    } else {
      block.classList.remove('reduce-motion');
      const playPromise = block.querySelector('video')?.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // ignore
        });
      }
    }

    localStorage.setItem('reduceMotion', e.matches ? 'on' : 'off');
  });
}

export async function decorateToggleContext(ct) {
  const reduceMotionIconWrapper = ct;
  const reduceMotionTextExist = reduceMotionIconWrapper.querySelector('.play-animation-text')
      && reduceMotionIconWrapper.querySelector('.pause-animation-text');

  if (!reduceMotionTextExist) {
    const { replaceKeyArray } = await import(`${getLibs()}/features/placeholders.js`);
    const [playAnimation, pauseAnimation] = await replaceKeyArray(['play-animation', 'pause-animation'], getConfig());
    const play = createTag('span', { class: 'play-animation-text' });
    const pause = createTag('span', { class: 'pause-animation-text' });
    play.textContent = playAnimation;
    pause.textContent = pauseAnimation;
    reduceMotionIconWrapper.prepend(play, pause);
  }
}

function handlePause(block, ct) {
  localStorage.setItem(
    'reduceMotion',
    localStorage.getItem('reduceMotion') === 'on' ? 'off' : 'on',
  );

  if (localStorage.getItem('reduceMotion') === 'on') {
    block.classList.add('reduce-motion');
    block.querySelector('video')?.pause();
    ct.setAttribute('aria-pressed', 'true');
  } else {
    block.classList.remove('reduce-motion');
    const playPromise = block.querySelector('video')?.play();
    ct.setAttribute('aria-pressed', 'false');
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // ignore
      });
    }
  }
}
async function buildReduceMotionSwitch(block, marqueeForeground) {
  if (!block.querySelector('.reduce-motion-wrapper')) {
    const reduceMotionIconWrapper = createTag('div', {
      class: 'reduce-motion-wrapper',
      tabIndex: '0',
      role: 'button',
      'aria-pressed': 'false',
    });
    const videoWrapper = block.querySelector('.background-wrapper');
    const video = videoWrapper.querySelector('video');

    if (block.classList.contains('dark')) {
      reduceMotionIconWrapper.append(
        getIconElementDeprecated('play-video-light'),
        getIconElementDeprecated('pause-video-light'),
      );
    } else {
      reduceMotionIconWrapper.append(
        getIconElementDeprecated('play-video'),
        getIconElementDeprecated('pause-video'),
      );
    }
    if (window.innerWidth <= 925) {
      videoWrapper.append(reduceMotionIconWrapper);
    } else {
      marqueeForeground.append(reduceMotionIconWrapper);
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    handleMediaQuery(block, mediaQuery);

    const initialValue = localStorage.getItem('reduceMotion') === 'on';

    if (video) {
      if (initialValue) {
        block.classList.add('reduce-motion');
        video.currentTime = Math.floor(video.duration) / 2 || 0;
        video.pause();
      } else {
        video.muted = true;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // ignore
          });
        }
      }
    }
    // Initialize toggle content for accessibility
    decorateToggleContext(reduceMotionIconWrapper);

    reduceMotionIconWrapper.addEventListener(
      'keydown',
      async (e) => {
        if (!e.target.isEqualNode(document.activeElement)) return;
        if (e.code === 'Escape') reduceMotionIconWrapper.blur();
        if (e.code !== 'Space' && e.code !== 'Enter') return;
        e.preventDefault();
        handlePause(block, e.currentTarget);
      },
    );

    reduceMotionIconWrapper.addEventListener(
      'click',
      async (e) => {
        handlePause(block, e.currentTarget);
      },
      { passive: true },
    );
  }
}

function createAnimation(animations) {
  const attribs = {
    class: 'marquee-background',
    playsinline: '',
    autoplay: '',
    muted: '',
  };

  Object.keys(animations).forEach((k) => {
    animations[k].active = false;
  });

  const breakpoint = getBreakpoint(animations);
  const animation = animations[breakpoint];

  if (animation === undefined) return null;

  if (animation.params.loop) {
    attribs.loop = '';
  }
  attribs.poster = animation.poster;
  attribs.title = animation.title;
  const { source } = animation;
  animation.active = true;

  // replace anchor with video element
  const video = createTag('video', attribs);
  video.setAttribute('preload', 'auto');
  if (source) {
    video.innerHTML = `<source src="${source}" type="video/mp4">`;
  }
  return video;
}

function adjustLayout(animations, parent) {
  const breakpoint = getBreakpoint(animations);
  const animation = animations[breakpoint];

  if (animation && !animation.active) {
    const newVideo = createAnimation(animations);
    if (newVideo) {
      parent.replaceChild(newVideo, parent.querySelector('video'));
      newVideo.addEventListener('canplay', () => {
        if (localStorage.getItem('reduceMotion') !== 'on') {
          newVideo.muted = true;
          const playPromise = newVideo.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // ignore
            });
          }
        }
      });
    }
  }
}

export function transformToVideoLink(cell, a) {
  a.setAttribute('rel', 'nofollow');
  a.classList.add('video-link');
  const title = a.textContent.trim();

  // gather video urls from all links in cell
  const vidUrls = [];
  [...cell.querySelectorAll(':scope a')]
    .filter((link) => isVideoLink(link.href))
    .forEach((link) => {
      vidUrls.push(link.href);
      if (link !== a) {
        if (link.classList.contains('button')) {
          // remove button with container
          link.closest('.button-container').remove();
        } else {
          // remove link only
          link.remove();
        }
      }
    });
  a.addEventListener('click', (e) => {
    e.preventDefault();
    displayVideoModal(vidUrls, title);
  });

  a.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      displayVideoModal(vidUrls, title);
    }
  });

  // autoplay if hash matches title
  if (toClassName(title) === window.location.hash.substring(1)) {
    displayVideoModal(vidUrls, title);
  }
}

async function handleAnimation(div, typeHint, block, animations) {
  if (typeHint !== 'default') block.classList.add(`has-${typeHint}-animation`);
  let source;
  let videoParameters = {};
  const a = div.querySelector('a');
  const poster = div.querySelector('img');
  if (a) {
    const url = new URL(a.href);
    const params = new URLSearchParams(url.search);
    videoParameters = { loop: params.get('loop') !== 'false' };
    const id = (url.hostname.includes('hlx.blob.core') || url.hostname.includes('aem.blob.core'))
      ? url.pathname.split('/')[2]
      : url.pathname.split('media_')[1].split('.')[0];
    source = `./media_${id}.mp4`;
  }
  let optimizedPosterSrc;
  if (poster) {
    const srcURL = new URL(poster.src);
    const srcUSP = new URLSearchParams(srcURL.search);
    srcUSP.set('format', 'webply');
    srcUSP.set('width', 750);
    srcUSP.set('width', window.innerWidth <= 750 ? 750 : 4080);
    optimizedPosterSrc = `${srcURL.pathname}?${srcUSP.toString()}`;
  }

  animations[typeHint] = {
    source,
    poster: optimizedPosterSrc || '',
    title: (poster && poster.getAttribute('alt')) || '',
    params: videoParameters,
  };

  div.remove();
}

const LOGO = 'adobe-express-logo';
const LOGO_WHITE = 'adobe-express-logo-white';
function injectExpressLogo(block, wrapper) {
  if (block.classList.contains('entitled')) return;
  if (!['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) return;
  const mediaQuery = window.matchMedia('(min-width: 900px)');
  const logo = getIconElementDeprecated(block.classList.contains('dark') && mediaQuery.matches ? LOGO_WHITE : LOGO);
  mediaQuery.addEventListener('change', (e) => {
    if (!block.classList.contains('dark')) return;
    if (e.matches) {
      logo.src = logo.src.replace(`${LOGO}.svg`, `${LOGO_WHITE}.svg`);
      logo.alt = logo.alt.replace(LOGO, LOGO_WHITE);
    } else {
      logo.src = logo.src.replace(`${LOGO_WHITE}.svg`, `${LOGO}.svg`);
      logo.alt = logo.alt.replace(LOGO_WHITE, LOGO);
    }
  });
  logo.classList.add('express-logo');
  if (wrapper.firstElementChild?.tagName === 'H2') {
    logo.classList.add('eyebrow-margin');
  }
  wrapper.prepend(logo);
}

function decorateEntitled(contentWrapper) {
  const eyebrowText = contentWrapper.querySelector('h3');
  const eyebrowIcon = contentWrapper.querySelector('p > img.icon');
  const legalCopy = contentWrapper.querySelector('p.legal-copy');

  if (eyebrowIcon && eyebrowText) {
    const oldIconWrapper = eyebrowIcon.parentElement;
    const eyebrowWrapper = createTag('div', { class: 'eyebrow-wrapper' });
    eyebrowWrapper.append(eyebrowIcon, eyebrowText);
    contentWrapper.prepend(eyebrowWrapper);

    if (!oldIconWrapper.children.length) {
      oldIconWrapper.remove();
    }
  }

  if (legalCopy && legalCopy.previousElementSibling?.classList.contains('buttons-wrapper')) {
    const btnContainer = legalCopy.previousElementSibling;
    const legalText = createTag('span', {}, legalCopy.textContent.replace('**', '').trim());
    legalCopy.innerHTML = '';
    legalCopy.append(getIconElementDeprecated('checkmark-green'), legalText);
    legalCopy.className = 'entitled-cta-tag';
    btnContainer.append(legalCopy);
    btnContainer.classList.add('with-legal-copy');
  }
}

async function handleContent(div, block, animations) {
  const videoWrapper = createTag('div', { class: 'background-wrapper' });
  const video = createAnimation(animations);
  let bg;
  if (video) {
    bg = videoWrapper;
    videoWrapper.append(video);
    div.prepend(videoWrapper);

    window.addEventListener(
      'resize',
      () => {
        adjustLayout(animations, videoWrapper);
      },
      { passive: true },
    );
    adjustLayout(animations, videoWrapper);
  } else {
    bg = createTag('div');
    bg.classList.add('marquee-background');
    div.prepend(bg);
  }

  const marqueeForeground = createTag('div', { class: 'marquee-foreground' });
  const contentWrapper = bg.nextElementSibling;
  contentWrapper.classList.add('content-wrapper');
  marqueeForeground.append(contentWrapper);
  injectExpressLogo(block, contentWrapper);
  div.append(marqueeForeground);

  if (video) {
    video.addEventListener('canplay', () => {
      buildReduceMotionSwitch(block, marqueeForeground);
    });
  }

  div.querySelectorAll(':scope p:empty').forEach((p) => {
    if (p.innerHTML.trim() === '') {
      p.remove();
    }
  });

  // check for video link
  // eslint-disable-next-line no-await-in-loop
  const videoLink = [...div.querySelectorAll('a')].find((a) => isVideoLink(a.href));
  if (videoLink) {
    transformToVideoLink(div, videoLink);
  }

  const contentButtons = [...div.querySelectorAll('a.button.accent')].filter(
    (a) => !a.textContent.includes('(('),
  );
  if (contentButtons.length) {
    const primaryBtn = contentButtons[0];
    const secondaryButton = contentButtons[1];
    const buttonAsLink = contentButtons[2];
    buttonAsLink?.classList.remove('button');
    primaryBtn?.classList.add('primaryCTA');

    formatDynamicCartLink(primaryBtn);

    BlockMediator.set('primaryCtaUrl', primaryBtn?.href);
    secondaryButton?.classList.add('secondary');
    const buttonContainers = [...div.querySelectorAll('p.button-container')];
    const buttonsWrapper = createTag('div', { class: 'buttons-wrapper' });
    buttonContainers[0]?.before(buttonsWrapper);
    buttonContainers.forEach((btnContainer) => {
      handleSubCTAText(btnContainer);
      btnContainer.classList.add('button-inline');
      btnContainer.querySelector('a.button')?.classList.add('xlarge');
      buttonsWrapper.append(btnContainer);
    });
  } else if (block.classList.contains('legal')) {
    // Only promote a final-paragraph link to a CTA when it is the sole
    // content of that paragraph to avoid converting legal copy into CTAs.
    const lastParagraph = div.querySelector('p:last-of-type');
    const candidateLink = lastParagraph?.querySelector(':scope > a:not(.button.accent)');
    const shouldPromote = !!(candidateLink
      && lastParagraph.childElementCount === 1
      && lastParagraph.textContent.trim() === candidateLink.textContent.trim());

    if (shouldPromote) {
      const primaryCta = candidateLink;
      formatDynamicCartLink(primaryCta);
      primaryCta.classList.add('button', 'accent', 'primaryCTA', 'xlarge');
      BlockMediator.set('primaryCtaUrl', primaryCta.href);
      lastParagraph.classList.add('buttons-wrapper', 'with-inline-ctas');
    }
  } else {
    const primaryCta = div.querySelector('p:last-of-type > a:not(.button.accent)');
    if (primaryCta) {
      formatDynamicCartLink(primaryCta);
      primaryCta.classList.add('button', 'accent', 'primaryCTA', 'xlarge');
      BlockMediator.set('primaryCtaUrl', primaryCta.href);
      primaryCta.parentElement.classList.add(
        'buttons-wrapper',
        'with-inline-ctas',
      );
    }
  }

  if (block.classList.contains('entitled')) {
    decorateEntitled(contentWrapper);
  }
}

async function handleOptions(div, typeHint, block) {
  if (typeHint === 'shadow') {
    const shadow = div.querySelector('picture')
      ? div.querySelector('picture')
      : createTag('img', { src: '/express/code/blocks/marquee/shadow.png' });
    div.innerHTML = '';
    div.appendChild(shadow);
    div.classList.add('hero-shadow');
  }
  if (typeHint === 'background') {
    const color = div.children[1].textContent.trim().toLowerCase();
    if (color) block.style.background = color;
    const lightness = (parseInt(color.substring(1, 2), 16)
            + parseInt(color.substring(3, 2), 16)
            + parseInt(color.substring(5, 2), 16))
        / 3;
    if (lightness < 200) block.classList.add('white-text');
    div.remove();
  }
}
export default async function decorate(block) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`)]).then(([utils]) => {
    ({ getMetadata, createTag, getConfig } = utils);
  });
  addTempWrapperDeprecated(block, 'ax-marquee');
  handlePrice(block);
  handlePrice(block, '[[savePercentage]]', 'savePer');
  handlePrice(block, '[[base-pricing-token]]', 'formattedBP');
  await decorateButtonsDeprecated(block);

  const possibleBreakpoints = breakpointConfig.map((bp) => bp.typeHint);
  const possibleOptions = ['shadow', 'background'];
  const animations = {};
  const rows = [...block.children];
  for (let index = 0; index < rows.length; index += 1) {
    const div = rows[index];
    let rowType = 'animation';
    let typeHint;
    if ([...div.children].length > 1) typeHint = div.children[0].textContent.trim().toLowerCase();
    if (index + 1 === rows.length) {
      rowType = 'content';
    }
    if (typeHint && possibleOptions.includes(typeHint)) {
      rowType = 'option';
    } else if (!typeHint || !possibleBreakpoints.includes(typeHint)) {
      typeHint = 'default';
    }

    if (rowType === 'animation') {
      handleAnimation(div, typeHint, block, animations);
    } else if (rowType === 'content') {
      handleContent(rows[rows.length - 1], block, animations);
    } else if (rowType === 'option') {
      handleOptions(div, typeHint, block);
    }
  }

  const button = block.querySelector('.button');
  const promises = [];
  if (button) {
    const { addFreePlanWidget } = await import('../../scripts/widgets/free-plan.js');
    promises.push(addFreePlanWidget(button.parentElement));
  }

  const phoneNumberTags = [...block.querySelectorAll(':scope a')].filter((a) => a.textContent.includes('((business-sales-numbers))'));
  if (phoneNumberTags.length) {
    const { formatSalesPhoneNumber } = await import('../../scripts/utils/location-utils.js');
    promises.push(formatSalesPhoneNumber(phoneNumberTags));
  }

  await Promise.all(promises);

  if (getConfig().locale?.region === 'jp') {
    addHeaderSizing(block, getConfig);
  }
  block.classList.add('appear');
}
