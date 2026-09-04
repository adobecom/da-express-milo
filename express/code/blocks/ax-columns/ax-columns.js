import { getLibs, toClassName, getIconElementDeprecated } from '../../scripts/utils.js';

import {
  addAnimationToggle,
  linkImage,
  transformLinkToAnimation,
} from '../../scripts/utils/media.js';

import { decorateSocialIcons } from '../../scripts/utils/icons.js';
import { addHeaderSizing, formatSalesPhoneNumber } from '../../scripts/utils/location-utils.js';
import {
  splitAndAddVariantsWithDash,
} from '../../scripts/utils/decorate.js';
import { addFreePlanWidget } from '../../scripts/widgets/free-plan.js';
import { displayVideoModal, hideVideoModal, isVideoLink } from '../../scripts/widgets/video.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import {
  appendLinkText,
  getExpressLandingPageType,
  sendEventToAnalytics,
} from '../../scripts/instrument.js';

let createTag; let getMetadata;
let getConfig; let decorateButtons;

function replaceHyphensInText(area) {
  [...area.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter((header) => header.textContent.includes('-'))
    .forEach((header) => {
      header.textContent = header.textContent.replace(/-/g, '\u2011');
    });
}

function transformToVideoColumn(cell, aTag, block) {
  const parent = cell.parentElement;
  const title = aTag.textContent.trim();
  // gather video urls from all links in cell
  const vidUrls = [];
  cell.querySelectorAll(':scope a.con-button').forEach((button) => {
    vidUrls.push(button.href);
    if (button !== aTag) {
      const buttonContainer = button.closest('.button-container');
      if (buttonContainer) buttonContainer.remove();
      else button.remove();
    } else {
      const header = parent?.querySelector('h1, h2, h3, h4, h5, h6');
      if (header) {
        button.setAttribute('aria-label', `${button.textContent.trim()} ${header.textContent.trim()}`);
      }
    }
  });
  aTag.setAttribute('rel', 'nofollow');

  cell.classList.add('column-video');
  parent.classList.add('columns-video');

  setTimeout(() => {
    const sibling = parent.querySelector('.column-picture');
    if (sibling && block.classList.contains('highlight')) {
      const videoOverlay = createTag('div', { class: 'column-video-overlay' });
      const videoOverlayIcon = getIconElementDeprecated('play', 44);
      videoOverlay.append(videoOverlayIcon);
      sibling.append(videoOverlay);
    }
  }, 1);

  const modalActivator = block.classList.contains('highlight') ? parent : aTag;
  modalActivator.addEventListener('click', () => {
    displayVideoModal(vidUrls, title, true);
  });

  modalActivator.addEventListener('keyup', ({ key }) => {
    if (key === 'Enter') {
      displayVideoModal(vidUrls, title);
    }
  });

  // auto-play if hash matches title
  const hash = window.location.hash.substring(1);
  const titleName = toClassName(title);
  if (hash && titleName && titleName === hash && hash !== '#embed-video') {
    displayVideoModal(vidUrls, title);
  }
}

function decorateIconList(columnCell, rowNum, blockClasses) {
  const icons = [...columnCell.querySelectorAll('img.icon, svg.icon')].filter(
    (icon) => !icon.closest('p')?.classList?.contains('social-links'),
  );

  // decorate offer icons
  if (rowNum === 0 && blockClasses.contains('offer')) {
    const titleIcon = columnCell.querySelector('img.icon, svg.icon');
    const title = columnCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (title && titleIcon) {
      const titleIconWrapper = createTag('span', { class: 'columns-offer-icon' });
      titleIconWrapper.append(titleIcon);
      title.prepend(titleIconWrapper);
    }
    return;
  }

  if (
    rowNum === 0
    && icons.length === 1
    && icons[0].closest('p')?.innerText?.trim() === ''
    && !icons[0].closest('p')?.previousElementSibling
  ) {
    // treat icon as brand icon if first element in first row cell and no text next to it
    icons[0].classList.add('brand');
    columnCell.parentElement.classList.add('has-brand');
    return;
  }
  if (icons?.length) {
    let iconList = createTag('div', { class: 'columns-iconlist' });
    let iconListDescription;
    [...columnCell.children].forEach(($e) => {
      const imgs = $e.querySelectorAll('img.icon, svg.icon');
      // only build icon list if single icon plus text
      const img = imgs.length === 1 ? imgs[0] : null;
      const hasText = img ? img.closest('p')?.textContent?.trim() !== '' : false;
      if (img && hasText) {
        const iconListRow = createTag('div');
        const iconDiv = createTag('div', { class: 'columns-iconlist-icon' });
        iconDiv.appendChild(img);
        iconListRow.append(iconDiv);
        iconListDescription = createTag('div', { class: 'columns-iconlist-description' });
        iconListRow.append(iconListDescription);
        iconListDescription.appendChild($e);
        iconList.appendChild(iconListRow);
      } else {
        if (iconList.children.length > 0) {
          columnCell.appendChild(iconList);
          iconList = createTag('div', { class: 'columns-iconlist' });
        }
        columnCell.appendChild($e);
      }
    });
    if (iconList.children.length > 0) columnCell.appendChild(iconList);
  }
}

const handleVideos = (cell, a, block) => {
  if (!a.href) return;

  transformToVideoColumn(cell, a, block);
  a.addEventListener('click', (e) => {
    e.preventDefault();
  });
};

const extractProperties = (block) => {
  const allProperties = {};
  const rows = Array.from(block.querySelectorAll(':scope > div')).slice(0, 3);

  rows.forEach((row) => {
    const content = row.innerText.trim();
    if (content.includes('linear-gradient')) {
      allProperties['card-gradient'] = content;
      row.remove();
    } else if (content.includes('text-color')) {
      allProperties['card-text-color'] = content.replace(/text-color\(|\)/g, '');
      row.remove();
    } else if (content.includes('background-color')) {
      allProperties['background-color'] = content.replace(/background-color\(|\)/g, '');
      row.remove();
    }
  });

  return allProperties;
};

const LOGO = 'adobe-express-logo';
const LOGO_WHITE = 'adobe-express-logo-white';

/**
 * Injects the appropriate logo (regular or photos) into the block
 * @param {Element} block - The block element to inject the logo into
 * @returns {Element|null} - The logo element if injected, null otherwise
 */
function injectLogo(block) {
  const injectRegularLogo = ['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase());
  const injectPhotoLogo = ['on', 'yes'].includes(getMetadata('marquee-inject-photo-logo')?.toLowerCase());
  const injectAcrobatLogo = ['on', 'yes'].includes(getMetadata('marquee-inject-acrobat-logo')?.toLowerCase());
  const injectRealMadridLogo = ['on', 'yes'].includes(getMetadata('marquee-inject-real-madrid-logo')?.toLowerCase());
  if (!injectRegularLogo
    && !injectPhotoLogo && !injectAcrobatLogo && !injectRealMadridLogo) return null;

  let logo;

  if (injectPhotoLogo) {
    logo = getIconElementDeprecated('adobe-express-photos-logo');
  } else if (injectAcrobatLogo) {
    const logoName = 'cobrand-lockup-acrobat-express';
    const logoSize = '22px';
    const logoAlt = 'Adobe Acrobat X Adobe Express co-brand logo';
    const logoClass = 'marquee-eyebrow-logo-wide';
    logo = getIconElementDeprecated(logoName, logoSize, logoAlt, logoClass);
  } else if (injectRealMadridLogo) {
    const logoName = 'cobrand-lockup-real-madrid-logo';
    const logoSize = '40px';
    const logoAlt = 'Adobe X Real Madrid logo';
    const logoClass = 'marquee-eyebrow-logo-large';
    logo = getIconElementDeprecated(logoName, logoSize, logoAlt, logoClass);
  } else {
    const mediaQuery = window.matchMedia('(min-width: 900px)');
    logo = getIconElementDeprecated(block.classList.contains('dark') && mediaQuery.matches ? LOGO_WHITE : LOGO);
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
  }

  logo.classList.add('express-logo');
  return logo;
}

// Prepends the page-injected logo (see injectLogo) to a block's first
// column, if one applies. Shared by the first-block-on-page case and the
// ribbon-banner second-section case below.
function injectPageLogo(block) {
  const logo = injectLogo(block);
  if (logo) {
    block.querySelector('.column')?.prepend(logo);
  }
}

const decoratePrimaryCTARow = (rowNum, cellNum, cell) => {
  if (rowNum + cellNum !== 0) return;
  const block = cell.closest('.ax-columns');

  // Post milo-decoration the primary CTA (authored bold/strong) is `a.con-button.blue`
  // and the secondary (authored italic/em) is `a.con-button.outline`; milo has
  // already unwrapped the <em>/<strong> and moved each anchor into its <p>.
  const primaryAnchor = cell.querySelector('a.con-button.blue');
  const secondaryAnchor = cell.querySelector('a.con-button.outline');
  if (!secondaryAnchor && !primaryAnchor) return;

  if (block?.classList.contains('fullsize') && primaryAnchor) {
    primaryAnchor.classList.add('xlarge', 'primaryCTA');
    BlockMediator.set('primaryCtaUrl', primaryAnchor.href);
    secondaryAnchor?.classList.add('reverse', 'xlarge');
    primaryAnchor.closest('p')?.classList.add('button-container', 'two-ctas');
    return;
  }

  const links = secondaryAnchor?.closest('p')?.querySelectorAll('a');
  if (!links || links.length < 2) return;
  secondaryAnchor.closest('p')?.classList.add('phone-number-cta-row');
  links[0].classList.add('con-button', 'xlarge', 'trial-cta');
  links[1].classList.add('phone');
  secondaryAnchor.closest('p')?.prepend(links[0]);
};

function addHeaderClass(block, size) {
  const parentDiv = block.parentElement;
  if (parentDiv) {
    const parentHeader = parentDiv.querySelector('h1, h2, h3, h4, h5, h6');
    if (parentHeader) {
      parentHeader.parentElement.classList.add(`columns-${size}-heading`);
    }
  }
}

function setupCornerOverlayAnimation(cell) {
  cell.addEventListener('mouseleave', () => {
    cell.classList.add('animating-out');

    setTimeout(() => {
      cell.classList.remove('animating-out');
      cell.classList.add('reset-position');
    }, 250);
  });
}

function createCornerOverlays(cell) {
  const overlays = [
    { src: '/express/code/blocks/ax-columns/img/resize-button.png', class: 'top-left' },
    { src: '/express/code/blocks/ax-columns/img/users.png', class: 'top-right' },
    { src: '/express/code/blocks/ax-columns/img/ai-image-edit.png', class: 'bottom-left', width: 47, height: 104 },
    { src: '/express/code/blocks/ax-columns/img/gen-ai-panel.png', class: 'bottom-right' },
    { src: '/express/code/blocks/ax-columns/img/cursor-small.svg', class: 'bottom-center', width: 26, height: 26 },
  ];

  overlays.forEach((overlay) => {
    const img = createTag('img', {
      class: `corner-overlay ${overlay.class}`,
      src: overlay.src,
      alt: '',
      fetchpriority: 'low',
      loading: 'lazy',
      ...(overlay.width && { width: overlay.width }),
      ...(overlay.height && { height: overlay.height }),
    });
    cell.appendChild(img);
  });

  setupCornerOverlayAnimation(cell);
}

function getOptimalImageSize() {
  if (window.innerWidth <= 600) return 400; // Mobile (covers ~350px column + 170% scaling)
  if (window.innerWidth <= 900) return 600; // Tablet (covers ~520px column)
  return 900; // Desktop+ (covers 884px background area at 170% scaling)
}

// Add preconnect hints for faster CDN connections
function addImagePreconnects(imageUrl) {
  if (!imageUrl) return;

  try {
    const url = new URL(imageUrl, window.location.href);
    // Only add preconnect if image is served from different origin
    if (url.origin !== window.location.origin) {
      const existingPreconnect = document.querySelector(`link[rel="preconnect"][href="${url.origin}"]`);
      if (!existingPreconnect) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.fetchPriority = 'high';
        link.href = url.origin;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    }
  } catch (e) {
    // Invalid URL, ignore
  }
}

// A CSS background is only discovered after style recalc, so the browser fetches it late
// and at low priority. For the marquee variants that background is the LCP element, so
// preload it explicitly. Same shape as banner-bg.js and search-marquee.js — duplicated
// deliberately rather than shared, so this LCP-critical path never waits on an extra
// module fetch/eval.
function preloadBackgroundImage(imageUrl) {
  if (!imageUrl || document.head.querySelector(`link[rel="preload"][href="${imageUrl}"]`)) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = imageUrl;
  link.fetchPriority = 'high';
  document.head.appendChild(link);
}

function markVideoToGifImagesDecorative(scope) {
  if (!scope) return;
  scope.querySelectorAll('img[alt]').forEach((img) => {
    const altText = img.getAttribute('alt')?.trim().toLowerCase();
    if (altText === 'video to gif') {
      img.setAttribute('alt', '');
      img.removeAttribute('title');
      img.removeAttribute('aria-hidden');
      img.removeAttribute('role');
    }
  });
}

// Handles the marquee/hero-animation-overlay background row: pulls it off `rows`
// (mutating in place), turns its image into an optimized CSS background, and
// preloads/preconnects it as the page's LCP element. Returns whether the
// preload already happened, so the per-cell picture handling below doesn't
// redundantly preload the same image again.
function decorateBackgroundImage(block, rows) {
  if (!block.classList.contains('marquee') && !block.classList.contains('hero-animation-overlay')) {
    return false;
  }

  const background = rows.shift();
  const bgImg = background?.querySelector('img');
  block.firstElementChild?.remove();
  if (!bgImg) return false;

  const url = new URL(bgImg.src, window.location.href);
  const { pathname } = url;
  const width = getOptimalImageSize();
  const optimizedImageUrl = `${pathname}?width=${width}&format=webply&optimize=medium`;

  block.style.setProperty('--bg-image', `url("${optimizedImageUrl}")`);
  preloadBackgroundImage(optimizedImageUrl);
  addImagePreconnects(bgImg.src);
  return true;
}

// `narrow` variant: prefix every h2 with a gradient-filled running number.
function decorateNarrowHeadings(rows) {
  let count = 1;
  rows.forEach((row) => {
    row.querySelectorAll('h2').forEach((header) => {
      const span = document.createElement('span');
      span.style.background = 'linear-gradient(to top, rgb(201, 101, 214), rgb(239, 133, 120))';
      span.style.webkitBackgroundClip = 'text';
      span.style.backgroundClip = 'text';
      span.style.color = 'transparent';
      span.textContent = `${count}. `;
      header.prepend(span);
      count += 1;
    });
  });
}

// `numbered` variant: the total is normally the row count, but can be
// overridden by an authored numeric class (landing at classList[3] — see the
// `.s2` ordering comment in decorate()).
function computeNumberedListTotal(block, isNumberedList, rowCount) {
  if (!isNumberedList || block.classList.length <= 4) return rowCount;
  const i = parseInt(block.classList[3], 10);
  // eslint-disable-next-line no-restricted-globals
  return isNaN(i) ? rowCount : i;
}

function formatNumberedPrefix(rowNum, total) {
  const num = rowNum + 1;
  if (total <= 9) return `${num}.`;
  // stylize with total for 10 or more items, zero-padded below 10
  const padded = rowNum < 9 ? `0${num}` : `${num}`;
  return `${padded}/${total} —`;
}

// Marquee picture cells are always above the fold: apply loading/sizing
// optimizations to their images and stagger the decorative corner overlays
// until after the main image loads, so they never compete with it for LCP.
function optimizeMarqueeCellImages(cell, bgPreloaded, counters) {
  cell.querySelectorAll('img').forEach((img) => {
    img.removeAttribute('loading');
    img.setAttribute('loading', 'eager');
    img.setAttribute('fetchpriority', 'high');

    const url = new URL(img.src, window.location.href);
    const { pathname } = url;
    const optimalWidth = getOptimalImageSize();
    const newSrc = `${pathname}?width=${optimalWidth}&format=webply&optimize=medium`;
    if (img.src !== newSrc) {
      img.src = newSrc;
    }

    // Update width/height attributes to match downloaded dimensions
    img.setAttribute('width', optimalWidth);
    img.setAttribute('height', Math.round(optimalWidth * (352 / 600))); // Maintain aspect ratio
  });

  const firstImg = cell.querySelector('img');
  if (firstImg) addImagePreconnects(firstImg.src);

  // Handle preload for first image only. When a background image exists it is the
  // LCP element and has already been preloaded, so preloading this picture too
  // would only compete with it for bandwidth.
  if (counters.pictureCellCount === 1 && !bgPreloaded) {
    const preloadImg = cell.querySelector('img');
    if (preloadImg?.src && !document.querySelector(`link[href="${preloadImg.src}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.fetchPriority = 'high';
      link.as = 'image';
      link.href = preloadImg.src;
      document.head.appendChild(link);
    }
  }

  // Delay decorative elements until main image loads to prioritize LCP
  const mainImg = cell.querySelector('img');
  if (!mainImg) {
    createCornerOverlays(cell);
    return;
  }
  let overlaysCreated = false;
  const createOverlaysDelayed = () => {
    if (!overlaysCreated) {
      overlaysCreated = true;
      createCornerOverlays(cell);
    }
  };
  if (mainImg.complete) {
    // Image already loaded, delay slightly to avoid blocking
    setTimeout(createOverlaysDelayed, 100);
  } else {
    // Wait for main image load, with fallback timeout
    mainImg.addEventListener('load', createOverlaysDelayed, { once: true });
    setTimeout(createOverlaysDelayed, 2000); // Fallback in case load event doesn't fire
  }
}

function decorateCell(cell, rowNum, cellNum, ctx) {
  const {
    block, colorProperties, isNumberedList, total, bgPreloaded, counters,
  } = ctx;
  const aTag = cell.querySelector('a');
  const pics = cell.querySelectorAll(':scope picture');

  // apply custom gradient and text color to all columns cards
  const parent = cell.parentElement;
  if (colorProperties['card-gradient']) {
    parent.style.background = colorProperties['card-gradient'];
  }
  if (colorProperties['card-text-color']) {
    parent.style.color = colorProperties['card-text-color'];
  }

  if (cellNum === 0 && isNumberedList) {
    const numSpan = createTag('span', { class: 'num' }, formatNumberedPrefix(rowNum, total));
    cell.prepend(numSpan);
  }

  if (pics.length === 1 && pics[0].parentElement.tagName === 'P') {
    // unwrap single picture if wrapped in p tag, see https://github.com/adobe/helix-word2md/issues/662
    const parentDiv = pics[0].closest('div');
    const parentParagraph = pics[0].parentNode;
    parentDiv.insertBefore(pics[0], parentParagraph);
  }

  if (cell.querySelector('img.icon, svg.icon')) {
    decorateIconList(cell, rowNum, block.classList);
  }
  if (isVideoLink(aTag?.href)) {
    handleVideos(cell, aTag, block, pics[0]);
  }

  if (aTag?.textContent.trim().startsWith('https://')) {
    if (aTag.href.endsWith('.mp4')) {
      transformLinkToAnimation(aTag);
    } else if (pics[0]) {
      linkImage(cell);
    }
  }

  if (aTag?.classList.contains('con-button')) {
    if (block.classList.contains('fullsize')) {
      aTag.classList.add('xlarge');
      BlockMediator.set('primaryCtaUrl', aTag.href);
      aTag.classList.add('primaryCTA');
    } else if (aTag.classList.contains('light')) {
      aTag.classList.replace('accent', 'primary');
    }
    if (!aTag.getAttribute('aria-label')) {
      const header = cell.querySelector('h1, h2, h3, h4, h5, h6');
      if (header) {
        aTag.setAttribute('aria-label', `${aTag.textContent.trim()} ${header.textContent.trim()}`);
      }
    }
  }

  cell.querySelectorAll(':scope p:empty').forEach(($p) => {
    if ($p.innerHTML.trim() === '') {
      $p.remove();
    }
  });

  cell.classList.add('column');
  const childEls = [...cell.children];
  const isPictureColumn = childEls.length > 0
    && childEls.every((el) => ['BR', 'PICTURE'].includes(el.tagName));

  if (isPictureColumn) {
    counters.pictureCellCount += 1;
    cell.classList.add('column-picture');

    // Add mobile class to the second picture cell
    if (counters.pictureCellCount === 2) {
      cell.classList.add('column-picture-mobile');
    }

    if (block.classList.contains('marquee')) {
      optimizeMarqueeCellImages(cell, bgPreloaded, counters);
    }
  }

  const $pars = cell.querySelectorAll('p');
  for (let i = 0; i < $pars.length; i += 1) {
    if ($pars[i].innerText.match(/Powered by/)) {
      $pars[i].classList.add('powered-by');
    }
  }
  decoratePrimaryCTARow(rowNum, cellNum, cell);
}

function decorateRows(block, rows, { colorProperties, isNumberedList, total, bgPreloaded }) {
  const counters = { pictureCellCount: 0 };
  rows.forEach((row, rowNum) => {
    Array.from(row.children).forEach((cell, cellNum) => {
      decorateCell(cell, rowNum, cellNum, {
        block, colorProperties, isNumberedList, total, bgPreloaded, counters,
      });
    });
  });
}

function decorateOfferVariant(block, rows) {
  if (!block.classList.contains('offer')) return;

  block.querySelectorAll('a.con-button').forEach((aTag) => aTag.classList.add('large', 'wide'));
  if (rows.length <= 1) return;

  // move all content into first row
  rows.forEach((row, rowNum) => {
    if (rowNum === 0) return;
    Array.from(row.children).forEach((cell, cellNum) => {
      rows[0].children[cellNum].append(...cell.children);
    });
    row.remove();
  });
}

// add free plan widget to the first columns block on every page except blog
function injectFreePlanWidgetIfFirst(block) {
  if (document.querySelector('main .ax-columns.marquee') !== block) return;
  if (!['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) return;

  addFreePlanWidget(
    block.querySelector('.button-container')
      || block.querySelector('.con-button')?.parentElement
      || block.querySelector(':scope .column:not(.hero-animation-overlay,.columns-picture)'),
  );
}

function decorateRibbonBannerContext(block) {
  if (!document.querySelector('main .ribbon-banner')) return;

  // `.has-ribbon-banner` used to be a CSS hook too, but the only rule that
  // targeted it was dead (no page combines ribbon-banner + ax-columns) and
  // was removed in the v2-spacing-default migration. Kept as a class add
  // here since it's a cheap, potentially-useful signal for anything
  // inspecting this block, but nothing in this codebase reads it anymore.
  block.classList.add('has-ribbon-banner');
  const secondSection = document.querySelectorAll('main > div')[1];
  if (secondSection?.querySelector('.ax-columns') === block) {
    injectPageLogo(block);
  }
}

function decorateHighlightContainer(block, colorProperties) {
  const sectionContainer = block.closest('.section:has(.ax-columns.highlight)');
  if (!sectionContainer) return;

  // add custom background color to columns-highlight-container
  if (colorProperties['background-color']) {
    sectionContainer.style.background = colorProperties['background-color'];
  }

  // invert buttons in regular columns inside columns-highlight-container
  if (!block.classList.contains('highlight')) {
    block.querySelectorAll('a.con-button').forEach((button) => {
      button.classList.add('dark');
    });
  }
}

// variant for the colors pages
async function decorateColorVariant(block, rows) {
  if (!block.classList.contains('color')) return;

  const [primaryColor, accentColor] = rows[1]
    .querySelector(':scope > div')
    .textContent.trim()
    .split(',');
  const [textCol, svgCol] = Array.from(
    rows[0].querySelectorAll(':scope > div'),
  );
  const svgId = svgCol.textContent.trim();
  const svg = createTag('div', { class: 'img-wrapper' });

  svgCol.remove();
  rows[1].remove();
  textCol.classList.add('text');
  svg.innerHTML = `<svg class='color-svg-img'> <use href='/express/code/icons/color-sprite.svg#${svgId}'></use></svg>`;
  svg.style.backgroundColor = primaryColor;
  svg.style.fill = accentColor;
  rows[0].append(svg);

  const { default: isDarkOverlayReadable } = await import(
    '../../scripts/utils/color-tools.js'
  );

  if (isDarkOverlayReadable(primaryColor)) {
    block.classList.add('shadow');
  }
}

async function decorateSalesPhoneNumbers(block) {
  const phoneNumberTags = block.querySelectorAll(
    'a[title="{{business-sales-numbers}}"]',
  );
  if (phoneNumberTags.length === 0) return;

  try {
    await formatSalesPhoneNumber(phoneNumberTags);
  } catch (error) {
    window.lana?.log(`Error fetching sales phones numbers: ${error.message}`, { tags: 'ax-columns', severity: 'error' });
  }
}

// Tracking any video column blocks.
function trackVideoColumns(block) {
  const columnVideos = block.querySelectorAll('.column-video');
  if (!columnVideos.length) return;

  columnVideos.forEach((columnVideo) => {
    const parent = columnVideo.closest('.ax-columns');
    const a = parent.querySelector('a');
    const adobeEventName = appendLinkText(`adobe.com:express:cta:learn:columns:${getExpressLandingPageType()}:`, a);

    parent.addEventListener('click', (e) => {
      e.stopPropagation();
      sendEventToAnalytics(adobeEventName);
    });
  });
}

export default async function decorate(block) {
  await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/utils/decorate.js`),
  ]).then(([utils, decorateUtils]) => {
    ({ createTag, getMetadata, getConfig } = utils);
    ({ decorateButtons } = decorateUtils);
  });

  if (document.body.dataset.device === 'mobile') replaceHyphensInText(block);
  const colorProperties = extractProperties(block);
  splitAndAddVariantsWithDash(block);
  // Verified against the Spectrum-2 button system (see styles.css) — see
  // that comment block for the other blocks in this rollout. Added after
  // splitAndAddVariantsWithDash so it doesn't shift the positional index the
  // numbered-list total-count parsing below relies on (block.classList[3]).
  block.classList.add('s2');
  decorateSocialIcons(block);
  await decorateButtons(block, 'button-xxl');

  // This block's CSS/JS is written against `.button-container` and `.xlarge`;
  // bridge milo's output (`.con-button`, `.action-area`) back onto that
  // existing contract instead of rewriting every rule. Idempotent and scoped
  // to this block's already-decorated con-buttons.
  block.querySelectorAll('a.con-button').forEach((btn) => {
    btn.classList.add('xlarge');
    btn.closest('p, div')?.classList.add('button-container');
  });

  // Restores video-modal state on browser back/forward. Registered once per
  // block instance (not per cell/row — the handler doesn't depend on either).
  window.addEventListener('popstate', ({ state }) => {
    hideVideoModal();
    const { url, title } = state || {};
    if (url) {
      displayVideoModal(url, title);
    }
  });

  const rows = Array.from(block.children);
  const bgPreloaded = decorateBackgroundImage(block, rows);

  if (block.classList.contains('xl-heading')) {
    addHeaderClass(block, 'xl');
  }
  if (block.classList.contains('narrow')) {
    decorateNarrowHeadings(rows);
  }

  const numCols = rows[0]?.children.length || 0;
  if (numCols) block.classList.add(`width-${numCols}-columns`);

  const isNumberedList = block.classList.contains('numbered');
  const total = computeNumberedListTotal(block, isNumberedList, rows.length);

  decorateRows(block, rows, {
    colorProperties, isNumberedList, total, bgPreloaded,
  });

  markVideoToGifImagesDecorative(block);
  addAnimationToggle(block);
  addHeaderSizing(block, getConfig, 'columns-heading');

  decorateOfferVariant(block, rows);
  injectFreePlanWidgetIfFirst(block);

  if (document.querySelector('main > div > div') === block) {
    injectPageLogo(block);
  }
  decorateRibbonBannerContext(block);
  decorateHighlightContainer(block, colorProperties);

  await decorateColorVariant(block, rows);
  await decorateSalesPhoneNumbers(block);
  trackVideoColumns(block);
}
