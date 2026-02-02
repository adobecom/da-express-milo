import { getLibs, yieldToMain, getMobileOperatingSystem, getIconElementDeprecated, createTag, formatDynamicCartLink } from '../../scripts/utils.js';

let currDrawer = null;
const largeMQ = window.matchMedia('(min-width: 1280px)');
const mediumMQ = window.matchMedia('(min-width: 768px)');
const reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

const APPLE = 'apple';
const GOOGLE = 'google';

const CARD_IMG_SIZES = '(min-width: 1280px) 254px, (min-width: 768px) 304px, 152px';

function normalizePicture(picture) {
  if (!picture) return;
  picture.querySelectorAll('source, img').forEach((node) => {
    const attr = node.tagName === 'SOURCE' ? 'srcset' : 'src';
    const url = node.getAttribute(attr);
    if (!url) return;
    // Fix common authoring typo: webply -> webp so the smaller format can be served
    if (url.includes('webply')) {
      node.setAttribute(attr, url.replace(/webply/g, 'webp'));
    }
    // Ensure width/height propagated to img for intrinsic sizing
    if (node.tagName === 'IMG' && (!node.width || !node.height)) {
      const width = node.getAttribute('width');
      const height = node.getAttribute('height');
      if (width && height) {
        node.width = width;
        node.height = height;
      }
    }
  });
}

function preloadImage(img) {
  if (!img) return;
  const url = img.currentSrc || img.src;
  if (!url) return;
  if (document.querySelector(`link[rel="preload"][as="image"][href="${url}"]`)) return;
  const attrs = {
    rel: 'preload',
    as: 'image',
    href: url,
  };
  if (img.srcset) attrs.imagesrcset = img.srcset;
  if (img.sizes) attrs.imagesizes = img.sizes;
  const link = createTag('link', attrs);
  document.head.append(link);
}

function setImagePriority(img, { isLcp = false, sizes } = {}) {
  if (!img) return;
  if (sizes && !img.sizes) {
    img.sizes = sizes;
  }
  if (isLcp) {
    img.loading = 'eager';
    img.decoding = 'sync';
    img.fetchPriority = 'high';
    preloadImage(img);
    return;
  }
  img.loading = 'lazy';
  img.decoding = 'async';
  img.fetchPriority = 'low';
}

function drawerOff() {
  if (!currDrawer) return;
  currDrawer.closest('.card').setAttribute('aria-expanded', false);
  currDrawer.classList.add('hide');
  const video = currDrawer.querySelector('video');
  if (video) {
    try {
      video.pause();
    } catch (e) { /* noop */ }
    video.removeAttribute('src');
    video.querySelectorAll('source').forEach((source) => source.remove());
    video.load();
    delete video.dataset.loaded;
  }
  currDrawer = null;
  if (!largeMQ.matches) document.body.classList.remove('disable-scroll');
}
function drawerOn(drawer) {
  drawerOff();
  drawer.closest('.card').setAttribute('aria-expanded', true);
  drawer.classList.remove('hide');
  const video = drawer.querySelector('video');
  if (video && !reduceMotionMQ.matches) {
    if (!video.dataset.loaded && video.dataset.src) {
      const source = createTag('source', { src: video.dataset.src, type: 'video/mp4' });
      video.append(source);
      video.load();
      video.dataset.loaded = 'true';
    }
    video.muted = true;
    video.play().catch(() => { });
  }
  currDrawer = drawer;
  if (!largeMQ.matches) document.body.classList.add('disable-scroll');
}
document.addEventListener('click', (e) => currDrawer && !currDrawer.closest('.card').contains(e.target) && drawerOff());
let isTouch;
const iconRegex = /icon-\s*([^\s]+)/;
async function decorateDrawer(videoSrc, poster, titleText, panels, panelsFrag, drawer) {
  const titleRow = createTag('div', { class: 'title-row' });
  const content = createTag('div', { class: 'content' });
  const closeButton = createTag('button', { 'aria-label': 'close' }, getIconElementDeprecated('close-black'));
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    drawerOff();
  });
  titleRow.append(createTag('strong', { class: 'drawer-title' }, titleText), closeButton);
  await yieldToMain();

  const icons = panelsFrag.querySelectorAll('.icon');
  const anchors = [...panelsFrag.querySelectorAll('a')];
  anchors.forEach((anchor, i) => {
    const parent = anchor.parentElement;
    if (parent.tagName === 'P') {
      parent.classList.add('drawer-cta-wrapper');
    }
    anchor.classList.add('drawer-cta');
    const icon = icons[i];
    const match = icon && iconRegex.exec(icon.className);
    if (match?.[1]) {
      // Avoid duplicating icons when an SVG has already been injected into the span
      const hasExistingGraphic = icon.querySelector('svg, img');
      if (!hasExistingGraphic) icon.append(getIconElementDeprecated(match[1]));
    }
    const anchorText = anchor.textContent.trim();
    anchor.textContent = '';
    anchor.title = anchor.title || anchorText;
    anchor.append(createTag('div', { class: 'text-group' }, [icon, anchorText]));

    const mLabel = parent.querySelector('em');
    const dLabel = parent.querySelector('strong');
    const [toStay, toGo] = document.body.dataset?.device === 'mobile' ? [mLabel, dLabel] : [dLabel, mLabel];
    toStay?.contains(toGo) && toGo.replaceWith(...toGo.childNodes);
    toGo?.remove();
    if (toStay) {
      toStay.classList.add('grid-marquee-label');
      anchor.append(toStay);
    }
  });

  const video = createTag('video', {
    playsinline: '',
    muted: '',
    loop: '',
    preload: 'none',
    title: titleText,
    poster,
  });
  video.dataset.src = videoSrc;
  const videoWrapper = createTag('button', { class: 'video-container' }, video);
  // link video to first anchor
  videoWrapper.addEventListener('click', () => anchors[0]?.click());
  videoWrapper.setAttribute('title', anchors[0]?.title);

  content.append(titleRow, videoWrapper, panelsFrag);
  drawer.append(content);
  if (panels.length <= 1) {
    return;
  }

  const tabList = createTag('div', { role: 'tablist' });
  let activeTab = null;
  panels.forEach((panel, i) => {
    panel.role = 'tabpanel';
    const tabHead = panel.querySelector('p');
    const tabName = tabHead.textContent;
    const id = `${titleText}-${tabName}`;
    tabHead.remove();
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.id = `panel-${id}`;
    i > 0 && panel.classList.add('hide');
    const tab = createTag('button', {
      role: 'tab',
      'aria-selected': i === 0,
      'aria-controls': `panel-${id}`,
      id: `tab-${id}`,
    }, tabName);
    activeTab ||= tab;
    tab.addEventListener('click', () => {
      activeTab.setAttribute('aria-selected', false);
      tab.setAttribute('aria-selected', true);
      panels.forEach((p) => {
        p === panel ? p.classList.remove('hide') : p.classList.add('hide');
      });
      activeTab = tab;
    });
    tabList.append(tab);
  });

  panels[0].before(tabList);
}
function addCardInteractions(card, drawer, lazyCB) {
  let drawerReady = false;
  let drawerBuildPromise;
  const ensureDrawer = () => {
    if (!drawerReady) {
      drawerReady = true;
      drawerBuildPromise = Promise.resolve(lazyCB());
    }
    return drawerBuildPromise || Promise.resolve();
  };

  const openDrawer = () => {
    ensureDrawer().then(() => {
      drawerOn(drawer);
    });
  };

  card.addEventListener('click', (e) => {
    if (currDrawer && e.target !== card && !card.contains(e.target)) return;
    e.stopPropagation();
    openDrawer();
  });
  card.addEventListener('touchstart', () => {
    isTouch = true;
  });
  card.addEventListener('mouseenter', () => {
    if (isTouch) return; // touchstart→mouseenter→click
    openDrawer();
  });
  card.addEventListener('mouseleave', () => {
    drawerOff();
  });
}

function toCard(drawer, isFirstCard = false) {
  const titleText = drawer.querySelector('strong').textContent.trim();
  const [face, ...panels] = [...drawer.querySelectorAll(':scope > div')];
  const panelsFrag = new DocumentFragment();
  panelsFrag.append(...panels);
  panels.forEach((panel) => panel.classList.add('panel'));
  const videoAnchor = face.querySelector('a');
  videoAnchor?.remove();

  normalizePicture(face.querySelector('picture'));
  // Use createTag like hero-marquee does (now available)
  const card = createTag('button', {
    class: 'card',
    'aria-controls': `drawer-${titleText}`,
    'aria-expanded': false,
    'aria-label': titleText,
  }, [face, drawer]);

  face.classList.add('face');
  const faceImg = face.querySelector('img');
  setImagePriority(faceImg, { isLcp: isFirstCard, sizes: CARD_IMG_SIZES });
  const lazyCB = () => decorateDrawer(videoAnchor?.href, faceImg?.src, titleText, panels, panelsFrag, drawer);
  addCardInteractions(card, drawer, lazyCB);
  drawer.classList.add('drawer', 'hide');
  drawer.id = `drawer-${titleText}`;
  return { card, lazyCB };
}

// formatDynamicCartLink moved to grid-marquee-hero block

// Headline functions moved to grid-marquee-hero block

async function makeRating(
  store,
  ratingPlaceholder,
  starsPlaceholder,
  playStoreLabelPlaceholder,
  appleStoreLabelPlaceholder,
) {
  const ratings = ratingPlaceholder?.split(';') || [];
  const link = ratings[2]?.trim();
  if (!link) {
    return null;
  }

  const storeTypeIndex = [APPLE, GOOGLE].indexOf(store);
  const [score, cnt] = ratings[storeTypeIndex].split(',').map((str) => str.trim());
  const ariaLabel = store === APPLE ? appleStoreLabelPlaceholder : playStoreLabelPlaceholder;
  const storeLink = createTag('a', {
    href: link,
  }, getIconElementDeprecated(`${store}-store`));
  storeLink.setAttribute('aria-label', ariaLabel);
  const { default: trackBranchParameters } = await import('../../scripts/branchlinks.js');
  await trackBranchParameters([storeLink]);

  const star = getIconElementDeprecated('star');
  star.setAttribute('role', 'img');
  star.setAttribute('aria-label', starsPlaceholder);
  return createTag('div', { class: 'ratings-container' }, [score, star, cnt, storeLink]);
}

async function makeRatings(
  ratingPlaceholder,
  starsPlaceholder,
  playStoreLabelPlaceholder,
  appleStoreLabelPlaceholder,
) {
  const ratings = createTag('div', { class: 'ratings' });
  const userAgent = getMobileOperatingSystem();
  if (userAgent !== 'Android') {
    const appleElement = await makeRating(
      'apple',
      ratingPlaceholder,
      starsPlaceholder,
      playStoreLabelPlaceholder,
      appleStoreLabelPlaceholder,
    );
    appleElement && ratings.append(appleElement);
  }
  if (userAgent !== 'iOS') {
    const googleElement = await makeRating(
      'google',
      ratingPlaceholder,
      starsPlaceholder,
      playStoreLabelPlaceholder,
      appleStoreLabelPlaceholder,
    );
    googleElement && ratings.append(googleElement);
  }
  return ratings;
}

export default async function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const hasLegacyHeadline = !!rows[0]?.querySelector('h1');
  const foreground = createTag('div', { class: 'foreground' });

  // Context: if a hero block exists in the previous section, tag for contextual styles
  const thisSection = el.closest('.section');
  let prevSection = thisSection && thisSection.previousElementSibling;
  while (prevSection && !prevSection.classList.contains('section')) {
    prevSection = prevSection.previousElementSibling;
  }
  if (prevSection?.querySelector('.grid-marquee-hero')) {
    el.classList.add('with-hero-above');
  }

  // Helper to decorate headline in legacy mode
  const decorateLegacyHeadline = (headline) => {
    headline.classList.add('headline');
    const ctas = headline.querySelectorAll('a');
    if (!ctas.length) {
      headline.classList.add('no-cta');
      return headline;
    }
    ctas[0].parentElement.classList.add('ctas');
    ctas.forEach((cta) => {
      cta.classList.add('button');
    });
    ctas[0].classList.add('primaryCTA');
    // Defer pricing formatting to idle time
    const idleCb = (cb) => (
      window.requestIdleCallback
        ? window.requestIdleCallback(cb, { timeout: 3000 })
        : setTimeout(cb, 3000)
    );
    idleCb(() => {
      ctas.forEach((cta) => formatDynamicCartLink(cta));
    });
    return headline;
  };

  // Register responsive handlers for both modes
  largeMQ.addEventListener('change', () => {
    isTouch = false;
    drawerOff();
  });
  mediumMQ.addEventListener('change', () => {
    drawerOff();
  });

  // Legacy mode: headline + background + items inside this block
  if (hasLegacyHeadline) {
    const [headline, background, ...items] = rows;
    const logo = getIconElementDeprecated('adobe-express-logo');
    logo.classList.add('express-logo');

    background.classList.add('background');
    const backgroundImg = background.querySelector('img');
    setImagePriority(backgroundImg);
    el.append(foreground);

    // Build cards first (do not nuke headline images)
    const cards = items.map((item, index) => toCard(item, index === 0));
    const cardsContainer = createTag('div', { class: 'cards-container' }, cards.map(({ card }) => card));
    [...cardsContainer.querySelectorAll('p:empty')].forEach((p) => p.remove());

    // Headline decoration now
    decorateLegacyHeadline(headline);
    foreground.append(logo, headline, cardsContainer);

    // Ratings if needed
    if (el.classList.contains('ratings')) {
      const { replaceKey } = await import(`${getLibs()}/features/placeholders.js`);
      const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
      const [ratingPlaceholder,
        starsPlaceholder,
        playStoreLabelPlaceholder,
        appleStoreLabelPlaceholder] = await Promise.all([
        replaceKey('app-store-ratings', getConfig()),
        replaceKey('app-store-stars', getConfig()),
        replaceKey('app-store-ratings-play-store', getConfig()),
        replaceKey('app-store-ratings-apple-store', getConfig()),
      ]);

      const ratingsElement = await makeRatings(
        ratingPlaceholder,
        starsPlaceholder,
        playStoreLabelPlaceholder,
        appleStoreLabelPlaceholder,
      );
      foreground.append(ratingsElement);
    }
  } else {
    // New mode: headline is in grid-marquee-hero; this block handles background + cards (+ratings)
    const [, background, ...items] = rows;

    background.classList.add('background');
    const backgroundImg = background.querySelector('img');
    normalizePicture(background.querySelector('picture'));
    setImagePriority(backgroundImg);
    el.append(foreground);

    if (items.length > 0) {
      requestAnimationFrame(() => {
        const cards = items.map((item, index) => toCard(item, index === 0));
        const cardsContainer = createTag('div', { class: 'cards-container' }, cards.map(({ card }) => card));
        [...cardsContainer.querySelectorAll('p:empty')].forEach((p) => p.remove());
        foreground.append(cardsContainer);

        if (el.classList.contains('ratings')) {
          const ratingsPlaceholder = createTag('div', { class: 'ratings' });
          foreground.append(ratingsPlaceholder);

          setTimeout(async () => {
            const { replaceKey } = await import(`${getLibs()}/features/placeholders.js`);
            const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
            const [ratingPlaceholder,
              starsPlaceholder,
              playStoreLabelPlaceholder,
              appleStoreLabelPlaceholder] = await Promise.all([
              replaceKey('app-store-ratings', getConfig()),
              replaceKey('app-store-stars', getConfig()),
              replaceKey('app-store-ratings-play-store', getConfig()),
              replaceKey('app-store-ratings-apple-store', getConfig()),
            ]);

            const ratingsElement = await makeRatings(
              ratingPlaceholder,
              starsPlaceholder,
              playStoreLabelPlaceholder,
              appleStoreLabelPlaceholder,
            );
            ratingsPlaceholder.replaceWith(ratingsElement);
          }, 1000);
        }
      });
    }
  }

  // Done
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && currDrawer) {
    e.preventDefault();
    drawerOff();
  }
});
