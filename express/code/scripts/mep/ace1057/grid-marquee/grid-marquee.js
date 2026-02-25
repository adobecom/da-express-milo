import { getLibs, yieldToMain, getMobileOperatingSystem, getIconElementDeprecated } from '../../../utils.js';

let createTag; let getConfig;

let currDrawer = null;
const largeMQ = window.matchMedia('(min-width: 1280px)');
const mediumMQ = window.matchMedia('(min-width: 768px)');
const reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

function drawerOff() {
  if (!currDrawer) return;
  currDrawer.closest('.card').setAttribute('aria-expanded', false);
  currDrawer.setAttribute('aria-hidden', true);
  currDrawer.querySelector('video')?.pause()?.catch(() => { });
  currDrawer = null;
}
function drawerOn(drawer) {
  drawerOff();
  drawer.closest('.card').setAttribute('aria-expanded', true);
  drawer.setAttribute('aria-hidden', false);
  const video = drawer.querySelector('video');
  if (video && !reduceMotionMQ.matches) {
    video.muted = true;
    video.play().catch(() => { });
  }
  currDrawer = drawer;
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
  const videoAnchor = face.querySelector('a') || face.querySelector('video');
  const videoSrc = videoAnchor?.href || videoAnchor?.dataset.videoSource;
  videoAnchor?.remove();
  const card = createTag('button', {
    class: 'card',
    'aria-controls': `drawer-${titleText}`,
    'aria-expanded': false,
    'aria-label': titleText,
  }, [face, drawer]);

  face.classList.add('face');
  addCardInteractions(card, drawer);
  const lazyCB = () => decorateDrawer(videoSrc, face.querySelector('img').src, titleText, panels, panelsFrag, drawer);
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
    window.lana.log(`Failed to fetch prices for page plan: ${error}`);
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

function createToggle({ toggleText, toggleActive, toggleBypassParam }) {
  const bypassParam = toggleBypassParam.querySelector('div:nth-child(2)').innerText;
  const toggleLabels = toggleText.querySelectorAll('li');
  const isChecked = toggleActive.querySelector('div:nth-child(2)')?.innerText || 1;
  const toggleId = `grid-marquee-toggle-${Math.random().toString(36).slice(2, 10)}`;
  const uncheckedLabelId = `${toggleId}-unchecked-label`;
  const checkedLabelId = `${toggleId}-checked-label`;

  toggleText.remove();
  toggleBypassParam.remove();
  toggleActive.remove();
  if (document.location.href.includes(bypassParam)) return null;

  const toggleWrapper = createTag(
    'div',
    { class: 'toggle-wrapper' },
    `
    <span id="${uncheckedLabelId}" class="toggle_label_unchecked" daa-ll="Individual vs Business toggle">${toggleLabels[0]?.innerText}</span>
    <label class="toggle" daa-ll="Individual vs Business toggle" for="${toggleId}">
      <input
        id="${toggleId}"
        daa-ll="Individual vs Business toggle"
        type="checkbox"
        role="switch"
        aria-labelledby="${uncheckedLabelId} ${checkedLabelId}"
        ${isChecked ? 'checked' : ''}>
      <span class="slider round"></span>
    </label>
    <span id="${checkedLabelId}" class="toggle_label_checked">${toggleLabels[1]?.innerText}</span>
    `,
  );

  toggleWrapper.querySelector(`.${uncheckedLabelId}`)?.addEventListener('click', () => {
    toggleWrapper.querySelector('input')?.click();
  });
  toggleWrapper.querySelector('input')?.addEventListener('click', (e) => {
    e.target.checked = true;
    const hasSearch = Boolean(document.location.search);
    window.location.href = `${window.location.href}${hasSearch ? '&' : '?'}${bypassParam}`;
  });

  return toggleWrapper;
}

const appendToggleToGridMarquee = (toggle, cardsContainer) => {
  toggle && cardsContainer.parentNode?.insertBefore(toggle, cardsContainer);
};

export default async function init(el) {
  ({ createTag, getConfig } = await import(`${getLibs()}/utils/utils.js`));
  let rows = [...el.querySelectorAll(':scope > div')];
  let toggle;

  if (el.classList.contains('toggle')) {
    const [headline, background, toggleText, toggleActive, toggleBypassParam, ...tail] = rows;
    toggle = createToggle({ toggleText, toggleActive, toggleBypassParam });
    rows = [headline, background].concat(tail);
  }
  const [headline, background, items, foreground] = [rows[0], rows[1], rows.slice(2), createTag('div', { class: 'foreground' })];
  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.classList.add('express-logo');
  const cards = items.map((item) => toCard(item));
  const cardsContainer = createTag('div', { class: 'cards-container' }, cards.map(({ card }) => card));
  [...cardsContainer.querySelectorAll('p:empty')].forEach((p) => p.remove());
  foreground.append(logo, decorateHeadline(headline), cardsContainer, ...(el.classList.contains('ratings') ? [makeRatings()] : []));
  background.classList.add('background');
  appendToggleToGridMarquee(toggle, cardsContainer);
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
