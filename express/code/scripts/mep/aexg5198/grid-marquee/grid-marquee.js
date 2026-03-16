import { getLibs, yieldToMain, getMobileOperatingSystem, getIconElementDeprecated, getMetadata } from '../../../utils.js';

let createTag; let getConfig;

let currDrawer = null;
const largeMQ = window.matchMedia('(min-width: 1280px)');
const mediumMQ = window.matchMedia('(min-width: 768px)');
const reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

function drawerOff() {
  if (!currDrawer) return;
  currDrawer.closest('.card').setAttribute('aria-expanded', false);
  currDrawer.setAttribute('aria-hidden', true);
  currDrawer.querySelector('video')?.pause()?.catch(() => {});
  currDrawer = null;
}
function drawerOn(drawer) {
  drawerOff();
  drawer.closest('.card').setAttribute('aria-expanded', true);
  drawer.setAttribute('aria-hidden', false);
  const video = drawer.querySelector('video');
  if (video && !reduceMotionMQ.matches) {
    video.muted = true;
    video.play().catch(() => {});
  }
  currDrawer = drawer;
}

function mWebLabel(anchor) {
  const metadata = getMetadata('mweb-app-label');
  if (metadata === null || anchor.textContent.trim().toLowerCase() !== 'generative fill') return;
  const appOnlyLink = createTag('div', { class: 'mweb-app-only' }, metadata);
  anchor.parentElement.append(appOnlyLink);
}

function mWebChevron(face) {
  const metadata = getMetadata('mweb-card-chevron');
  if (metadata === null) return;
  const svg = `
    <svg width="11" height="6" viewBox="0 0 11 6" fill="none" xmlns="http://www.w3.org/2000/svg" class="mweb-card-chevron">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M6.20703 5.70704C5.81641 6.09765 5.18358 6.09765 4.79296 5.70704L0.792965 1.70704C0.402345 1.31642 0.402345 0.683595 0.792965 0.292975C1.18358 -0.0976448 1.8164 -0.0976448 2.20702 0.292975L5.49999 3.58595L8.79296 0.292975C8.98827 0.0976648 9.24413 5.24521e-06 9.5 5.24521e-06C9.75586 5.24521e-06 10.0117 0.0976648 10.207 0.292975C10.5976 0.683595 10.5976 1.31642 10.207 1.70704L6.20703 5.70704Z" fill="#8F8F8F"/>
    </svg>
  `;
  face.innerHTML += svg;
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
    const linkText = anchor.textContent.trim();
    anchor.title = anchor.title || linkText;
    mWebLabel(anchor);
    const icon = icons[i];
    const match = icon && iconRegex.exec(icon.className);
    if (match?.[1]) {
      icon.append(getIconElementDeprecated(match[1]));
    }
    anchor.prepend(icon);
  });

  const video = createTag('video', {
    playsinline: '',
    muted: '',
    loop: '',
    preload: 'metadata',
    title: titleText,
    poster,
  }, `<source src="${videoSrc}" type="video/mp4">`);
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
    panel.setAttribute('aria-hidden', i > 0);
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
        p.setAttribute('aria-hidden', p !== panel);
      });
      activeTab = tab;
    });
    tabList.append(tab);
  });

  panels[0].before(tabList);
}
function addCardInteractions(card, drawer) {
  card.addEventListener('click', (e) => {
    if (currDrawer && e.target !== card && !card.contains(e.target)) return;
    e.stopPropagation();
    drawerOn(drawer);
  });
  card.addEventListener('touchstart', () => {
    isTouch = true;
  });
  card.addEventListener('mouseenter', () => {
    if (isTouch) return; // touchstart->mouseenter->click
    drawerOn(drawer);
  });
  card.addEventListener('mouseleave', () => {
    drawerOff();
  });
}
function toCard(drawer) {
  const titleText = drawer.querySelector('strong').textContent.trim();
  const [face, ...panels] = [...drawer.querySelectorAll(':scope > div')];
  const panelsFrag = new DocumentFragment();
  panelsFrag.append(...panels);
  panels.forEach((panel) => panel.classList.add('panel'));
  const videoAnchor = face.querySelector('a');
  videoAnchor?.remove();
  const card = createTag('button', {
    class: 'card',
    'aria-controls': `drawer-${titleText}`,
    'aria-expanded': false,
    'aria-label': titleText,
  }, [face, drawer]);
  face.classList.add('face');
  mWebChevron(face);
  addCardInteractions(card, drawer);
  const lazyCB = () => decorateDrawer(videoAnchor.href, face.querySelector('img').src, titleText, panels, panelsFrag, drawer);
  drawer.classList.add('drawer');
  drawer.setAttribute('aria-hidden', true);
  drawer.id = `drawer-${titleText}`;

  return { card, lazyCB };
}

async function formatDynamicCartLink(a) {
  try {
    const pattern = /.*commerce.*adobe\.com.*/gm;
    if (!pattern.test(a.href)) return a;
    a.style.visibility = 'hidden';
    const {
      fetchPlanOnePlans,
      buildUrl,
    } = await import('../../../utils/pricing.js');
    const {
      url,
      country,
      language,
      offerId,
    } = await fetchPlanOnePlans(a.href);
    const newTrialHref = buildUrl(url, country, language, getConfig, offerId);
    a.href = newTrialHref;
  } catch (error) {
    window.lana.log(`Failed to fetch prices for page plan: ${error}`, { clientId: 'express', tags: 'grid-marquee', errorType: 'e', severity: 'error', sampleRate: '1' });
  }
  a.style.visibility = 'visible';
  return a;
}

function decorateHeadline(headline) {
  const ctas = headline.querySelectorAll('a');
  if (!ctas.length) return headline;
  ctas[0].parentElement.classList.add('ctas');
  ctas.forEach((cta) => {
    cta.classList.add('button');
    formatDynamicCartLink(cta);
  });
  ctas[0].classList.add('primaryCTA');
  headline.classList.add('headline');
  return headline;
}

async function makeRating(store) {
  const { replaceKey } = await import(`${getLibs()}/features/placeholders.js`);
  const ratings = (await replaceKey('app-store-ratings', getConfig()))?.split(';') || [];
  const link = ratings[2]?.trim();
  if (!link) {
    return null;
  }
  const [score, cnt] = ratings[['apple', 'google'].indexOf(store)].split(',').map((str) => str.trim());
  const storeLink = createTag('a', { href: link }, getIconElementDeprecated(`${store}-store`));
  const { default: trackBranchParameters } = await import('../../../branchlinks.js');
  await trackBranchParameters([storeLink]);
  return createTag('div', { class: 'ratings-container' }, [score, getIconElementDeprecated('star'), cnt, storeLink]);
}

function makeRatings() {
  const ratings = createTag('div', { class: 'ratings' });
  const userAgent = getMobileOperatingSystem();
  const cb = (el) => el && ratings.append(el);
  // eslint-disable-next-line chai-friendly/no-unused-expressions
  userAgent !== 'Android' && makeRating('apple').then(cb);
  // eslint-disable-next-line chai-friendly/no-unused-expressions
  userAgent !== 'iOS' && makeRating('google').then(cb);
  return ratings;
}

export default async function init(el) {
  ({ createTag, getConfig } = await import(`${getLibs()}/utils/utils.js`));
  const rows = [...el.querySelectorAll(':scope > div')];
  const [headline, background, items, foreground] = [rows[0], rows[1], rows.slice(2), createTag('div', { class: 'foreground' })];
  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.classList.add('express-logo');
  const cards = items.map((item) => toCard(item));
  const cardsContainer = createTag('div', { class: 'cards-container' }, cards.map(({ card }) => card));
  [...cardsContainer.querySelectorAll('p:empty')].forEach((p) => p.remove());
  foreground.append(logo, decorateHeadline(headline), cardsContainer, ...(el.classList.contains('ratings') ? [makeRatings()] : []));
  background.classList.add('background');
  el.append(foreground);
  new IntersectionObserver((entries, ob) => {
    ob.unobserve(el);
    cards.forEach((card) => card.lazyCB());
  }).observe(el);
  largeMQ.addEventListener('change', () => {
    isTouch = false;
    drawerOff();
  });
  mediumMQ.addEventListener('change', () => {
    drawerOff();
  });
}
