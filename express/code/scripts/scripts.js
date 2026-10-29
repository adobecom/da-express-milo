/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  setLibs,
  buildAutoBlocks,
  decorateArea,
  getMetadata,
  preDecorateSections,
  getRedirectUri,
  getIconElementDeprecated,
  getContentRoot,
  trackFixedTopOffset,
} from './utils.js';

// Add project-wide style path here.
const STYLES = [];

// Use 'https://milo.adobe.com/libs' if you cannot map '/libs' to milo's origin.
const LIBS = '/libs';
const miloLibs = setLibs(LIBS);
let jarvisImmediatelyVisible = false;
let stopFixedTopOffsetTracking;
const jarvisVisibleMeta = getMetadata('jarvis-immediately-visible')?.toLowerCase();
const desktopViewport = window.matchMedia('(min-width: 900px)').matches;
if (jarvisVisibleMeta && ['mobile', 'desktop', 'on'].includes(jarvisVisibleMeta) && (
  (jarvisVisibleMeta === 'mobile' && !desktopViewport) || (jarvisVisibleMeta === 'desktop' && desktopViewport))) jarvisImmediatelyVisible = true;

const prodDomains = ['business.adobe.com', 'www.adobe.com', 'color.adobe.com', 'helpx.adobe.com'];

// Add any config options.
const CONFIG = {
  local: { express: 'stage.projectx.corp.adobe.com', commerce: 'commerce-stg.adobe.com' },
  stage: { express: 'stage.projectx.corp.adobe.com', commerce: 'commerce-stg.adobe.com' },
  prod: { express: 'express.adobe.com', commerce: 'commerce.adobe.com' },
  codeRoot: '/express/code',
  contentRoot: getContentRoot(),
  stageDomainsMap: {
    '--da-express-milo--adobecom.(hlx|aem).(page|live)': {
      'www.adobe.com': 'origin',
      'commerce.adobe.com': 'commerce-stg.adobe.com',
      'new.express.adobe.com': 'stage.projectx.corp.adobe.com',
      'express.adobe.com': 'stage.projectx.corp.adobe.com',
      'color.adobe.com': 'color.stage.adobe.com',
      'helpx.adobe.com': 'helpx.stage.adobe.com',
    },
    'www.stage.adobe.com': {
      'www.adobe.com': 'origin',
      'commerce.adobe.com': 'commerce-stg.adobe.com',
      'new.express.adobe.com': 'stage.projectx.corp.adobe.com',
      'express.adobe.com': 'stage.projectx.corp.adobe.com',
      'color.adobe.com': 'color.stage.adobe.com',
      'helpx.adobe.com': 'helpx.stage.adobe.com',
    },
    '--express-color--adobecom.(hlx|aem).(page|live)': {
      'color.adobe.com': 'origin',
      'www.adobe.com': 'www.stage.adobe.com',
      'commerce.adobe.com': 'commerce-stg.adobe.com',
      'new.express.adobe.com': 'stage.projectx.corp.adobe.com',
      'express.adobe.com': 'stage.projectx.corp.adobe.com',
      'helpx.adobe.com': 'helpx.stage.adobe.com',
    },
    'color.stage.adobe.com': {
      'color.adobe.com': 'origin',
      'www.adobe.com': 'www.stage.adobe.com',
      'commerce.adobe.com': 'commerce-stg.adobe.com',
      'new.express.adobe.com': 'stage.projectx.corp.adobe.com',
      'express.adobe.com': 'stage.projectx.corp.adobe.com',
      'helpx.adobe.com': 'helpx.stage.adobe.com',
    },
  },
  jarvis: {
    id: getMetadata('jarvis-surface-id') || 'Acom_Express',
    version: getMetadata('jarvis-surface-version') || '1.0',
    onDemand: !jarvisImmediatelyVisible,
  },
  imsClientId: 'AdobeExpressWeb',
  iconsExcludeBlocks: ['unity', 'firefly-howto'],
  prodDomains,
  geoRouting: 'on',
  lingoProjectSuccessLogging: 'on',
  fallbackRouting: 'on',
  decorateArea,
  faasCloseModalAfterSubmit: 'on',
  locales: {
    '': { ietf: 'en-US', tk: 'hah7vzn.css' },
    ara: { ietf: 'ar', tk: 'cbp4pzm.css', dir: 'rtl' },
    br: { ietf: 'pt-BR', tk: 'inq1xob.css' },
    // eslint-disable-next-line max-len
    // TODO check that this ietf is ok to use everywhere. It's different in the old project zh-Hans-CN
    cn: { ietf: 'zh-CN', tk: 'qxw8hzm' },
    de: { ietf: 'de-DE', tk: 'vin7zsi.css' },
    dk: { ietf: 'da-DK', tk: 'aaz7dvd.css' },
    es: { ietf: 'es-ES', tk: 'oln4yqj.css' },
    fi: { ietf: 'fi-FI', tk: 'aaz7dvd.css' },
    fr: { ietf: 'fr-FR', tk: 'vrk5vyv.css' },
    gb: { ietf: 'en-GB', tk: 'pps7abe.css' },
    id_id: { ietf: 'id-ID', tk: 'cya6bri.css' },
    in: { ietf: 'en-IN', tk: 'pps7abe.css' },
    it: { ietf: 'it-IT', tk: 'bbf5pok.css' },
    jp: { ietf: 'ja-JP', tk: 'dvg6awq' },
    kr: { ietf: 'ko-KR', tk: 'qjs5sfm' },
    ng: { ietf: 'en-NG', tk: 'cya6bri.css' },
    nl: { ietf: 'nl-NL', tk: 'cya6bri.css' },
    no: { ietf: 'no-NO', tk: 'aaz7dvd.css' },
    se: { ietf: 'sv-SE', tk: 'fpk1pcd.css' },
    // eslint-disable-next-line max-len
    // TODO check that this ietf is ok to use everywhere. It's different in the old project zh-Hant-TW
    tw: { ietf: 'zh-TW', tk: 'jay0ecd' },
    uk: { ietf: 'en-GB', tk: 'pps7abe.css' },
    // Sub-locales declared in languageMap above must also be registered here
    // so Milo's locale resolver recognizes their URL prefixes (AEEE-34989).
    // Values match da-cc's canonical locales config.
    ae_ar: { ietf: 'ar', tk: 'rnf4ipd.css', dir: 'rtl' },
    ae_en: { ietf: 'en', tk: 'pps7abe.css' },
    africa: { ietf: 'en', tk: 'pps7abe.css' },
    ar: { ietf: 'es-AR', tk: 'oln4yqj.css' },
    at: { ietf: 'de-AT', tk: 'vin7zsi.css' },
    au: { ietf: 'en-AU', tk: 'pps7abe.css' },
    be_en: { ietf: 'en-BE', tk: 'pps7abe.css' },
    be_fr: { ietf: 'fr-BE', tk: 'vrk5vyv.css', base: 'fr' },
    be_nl: { ietf: 'nl-BE', tk: 'cya6bri.css' },
    bg: { ietf: 'bg-BG', tk: 'aaz7dvd.css' },
    ca: { ietf: 'en-CA', tk: 'pps7abe.css' },
    ca_fr: { ietf: 'fr-CA', tk: 'vrk5vyv.css', base: 'fr' },
    ch_de: { ietf: 'de-CH', tk: 'vin7zsi.css' },
    ch_fr: { ietf: 'fr-CH', tk: 'vrk5vyv.css', base: 'fr' },
    ch_it: { ietf: 'it-CH', tk: 'bbf5pok.css' },
    cis_en: { ietf: 'en', tk: 'pps7abe.css' },
    cis_ru: { ietf: 'ru', tk: 'qxw8hzm.css' },
    cl: { ietf: 'es-CL', tk: 'oln4yqj.css' },
    co: { ietf: 'es-CO', tk: 'oln4yqj.css' },
    cr: { ietf: 'es-419', tk: 'oln4yqj.css' },
    cy_en: { ietf: 'en-CY', tk: 'pps7abe.css' },
    cz: { ietf: 'cs-CZ', tk: 'aaz7dvd.css' },
    ec: { ietf: 'es-419', tk: 'oln4yqj.css' },
    ee: { ietf: 'et-EE', tk: 'aaz7dvd.css' },
    eg_ar: { ietf: 'ar', tk: 'rnf4ipd.css', dir: 'rtl' },
    eg_en: { ietf: 'en-GB', tk: 'pps7abe.css' },
    gr_el: { ietf: 'el', tk: 'fnx0rsr.css' },
    gr_en: { ietf: 'en-GR', tk: 'pps7abe.css' },
    gt: { ietf: 'es-419', tk: 'oln4yqj.css' },
    hk_en: { ietf: 'en-HK', tk: 'pps7abe.css' },
    hk_zh: { ietf: 'zh-HK', tk: 'jay0ecd' },
    hu: { ietf: 'hu-HU', tk: 'aaz7dvd.css' },
    id_en: { ietf: 'en', tk: 'pps7abe.css' },
    ie: { ietf: 'en-GB', tk: 'pps7abe.css' },
    il_en: { ietf: 'en-IL', tk: 'pps7abe.css' },
    il_he: { ietf: 'he', tk: 'rnf4ipd.css', dir: 'rtl' },
    in_hi: { ietf: 'hi', tk: 'aaa8deh.css' },
    kw_ar: { ietf: 'ar', tk: 'rnf4ipd.css', dir: 'rtl' },
    kw_en: { ietf: 'en-GB', tk: 'pps7abe.css' },
    la: { ietf: 'es-LA', tk: 'oln4yqj.css' },
    lt: { ietf: 'lt-LT', tk: 'aaz7dvd.css' },
    lu_de: { ietf: 'de-LU', tk: 'vin7zsi.css' },
    lu_en: { ietf: 'en-LU', tk: 'pps7abe.css' },
    lu_fr: { ietf: 'fr-LU', tk: 'vrk5vyv.css', base: 'fr' },
    lv: { ietf: 'lv-LV', tk: 'aaz7dvd.css' },
    mena_ar: { ietf: 'ar', tk: 'dis2dpj.css', dir: 'rtl' },
    mena_en: { ietf: 'en', tk: 'pps7abe.css' },
    mt: { ietf: 'en-MT', tk: 'pps7abe.css' },
    mx: { ietf: 'es-MX', tk: 'oln4yqj.css' },
    my_en: { ietf: 'en-GB', tk: 'pps7abe.css' },
    my_ms: { ietf: 'ms', tk: 'sxj4tvo.css' },
    nz: { ietf: 'en-GB', tk: 'pps7abe.css' },
    pe: { ietf: 'es-PE', tk: 'oln4yqj.css' },
    ph_en: { ietf: 'en', tk: 'pps7abe.css' },
    ph_fil: { ietf: 'fil-PH', tk: 'ict8rmp.css' },
    pl: { ietf: 'pl-PL', tk: 'aaz7dvd.css' },
    pr: { ietf: 'es-419', tk: 'oln4yqj.css' },
    pt: { ietf: 'pt-PT', tk: 'inq1xob.css' },
    qa_ar: { ietf: 'ar', tk: 'rnf4ipd.css', dir: 'rtl' },
    qa_en: { ietf: 'en-GB', tk: 'pps7abe.css' },
    ro: { ietf: 'ro-RO', tk: 'aaz7dvd.css' },
    ru: { ietf: 'ru-RU', tk: 'aaz7dvd.css' },
    sa_ar: { ietf: 'ar', tk: 'rnf4ipd.css', dir: 'rtl' },
    sa_en: { ietf: 'en', tk: 'pps7abe.css' },
    // sea has no da-cc precedent; defaulting to umbrella English.
    sea: { ietf: 'en', tk: 'pps7abe.css' },
    sg: { ietf: 'en-SG', tk: 'pps7abe.css' },
    si: { ietf: 'sl-SI', tk: 'aaz7dvd.css' },
    sk: { ietf: 'sk-SK', tk: 'aaz7dvd.css' },
    th_en: { ietf: 'en', tk: 'pps7abe.css' },
    th_th: { ietf: 'th', tk: 'lqo2bst.css' },
    tr: { ietf: 'tr-TR', tk: 'aaz7dvd.css' },
    ua: { ietf: 'uk-UA', tk: 'aaz7dvd.css' },
    vn_en: { ietf: 'en-GB', tk: 'hah7vzn.css' },
    vn_vi: { ietf: 'vi', tk: 'qxw8hzm.css' },
    za: { ietf: 'en-GB', tk: 'pps7abe.css' },
  },
  entitlements: {
    '2a537e84-b35f-4158-8935-170c22b8ae87': 'express-entitled',
    'eb0dcb78-3e56-4b10-89f9-51831f2cc37f': 'express-pep',
  },
  links: 'on',
  googleLoginURLCallback: getRedirectUri,
  autoBlocks: [
    { axfaas: '/tools/axfaas' },
  ],
  dynamicNavKey: 'bacom',
  languageMap: {
    ae_ar: '',
    ae_en: '',
    africa: '',
    ar: 'es',
    at: 'de',
    au: '',
    be_en: '',
    be_fr: 'fr',
    be_nl: 'nl',
    bg: '',
    ca: '',
    ca_fr: 'fr',
    cis_en: '',
    cis_ru: '',
    cr: 'es',
    cy_en: '',
    cz: '',
    ch_de: 'de',
    ch_fr: 'fr',
    ch_it: 'it',
    cl: 'es',
    co: 'es',
    ec: 'es',
    ee: '',
    eg_ar: '',
    eg_en: '',
    gr_en: '',
    gr_el: '',
    gt: 'es',
    hk_en: '',
    hk_zh: 'tw',
    hu: '',
    id_en: '',
    ie: '',
    il_en: '',
    il_he: '',
    in_hi: 'in',
    kw_ar: '',
    kw_en: '',
    la: 'es',
    lt: '',
    lu_en: '',
    lu_de: 'de',
    lu_fr: 'fr',
    lv: '',
    mena_ar: '',
    mena_en: '',
    mt: '',
    mx: 'es',
    my_en: '',
    my_ms: '',
    ng: '',
    nz: '',
    pe: 'es',
    ph_en: '',
    ph_fil: '',
    pl: '',
    pr: 'es',
    pt: 'br',
    qa_ar: '',
    qa_en: '',
    ro: '',
    ru: '',
    sa_ar: '',
    sa_en: '',
    sea: '',
    sg: '',
    si: '',
    sk: '',
    th_en: '',
    th_th: '',
    tr: '',
    ua: '',
    fi: '',
    vn_en: '',
    vn_vi: '',
    za: '',
  },
  adobeid: {
    enableGuestAccounts: true,
    enableGuestTokenForceRefresh: true,
    enableGuestBotDetection: false,
    api_parameters: { check_token: { guest_allowed: true } },
    onTokenExpired: () => {
      window.location.reload();
    },
  },
  commerce: {
    'wcs-api-key': 'AdobeExpressWeb',
  },
};

// Handle dynamic import failures gracefully. Bots are hitting the templates page
// and causing unhandled rejections that are logged with extreme frequency.
window.addEventListener('unhandledrejection', (event) => {
  const { reason } = event;
  if (reason instanceof TypeError && reason.message.includes('dynamically imported module')) {
    event.preventDefault();
    // preventDefault() only suppresses the browser's default console reporting;
    // lana's own unhandledrejection listener still fires unless propagation is stopped.
    event.stopImmediatePropagation();
    window.lana?.log(`Import failed: ${reason.message}`, { tags: 'dynamic-import', severity: 'error' });
  }
});

/*
 * ------------------------------------------------------------
 * Edit below at your own risk
 * ------------------------------------------------------------
 */

document.body.dataset.device = navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop';
preDecorateSections(document);

// Milo's decorateHeader only runs after personalization, so a hero shown before it would be
// pushed down when the nav reserves its height. Mirror its className (Milo overwrites it with
// the same value) and its localnav check (isLocalNav; Express defaults gnav-source to
// localnav-express).
function reserveGnavSpace() {
  const header = document.querySelector('body > header');
  const headerMeta = getMetadata('header');
  if (!header || header.className || headerMeta === 'off') return;
  header.className = headerMeta || 'global-navigation';
  const gnavSource = getMetadata('gnav-source') || 'localnav-express';
  const newNav = new URLSearchParams(window.location.search).get('newNav');
  const newNavEnabled = newNav ? newNav !== 'false' : getMetadata('mobile-gnav-v2') !== 'off';
  if (newNavEnabled && gnavSource.split('/').pop().startsWith('localnav-')) {
    header.dataset.reserveLocalnav = '';
  }
}

// Tier 1e: paint an opted-in hero block from authored content before Milo's section
// pipeline runs. Milo's loadBlock later reuses the same module + stylesheet and calls
// init(), which skips the already-rendered markup and only runs the async enhancements.
const FAST_HERO_BLOCKS = new Set(['grid-marquee']);
(function renderFastHero() {
  if (window.isTestEnv) return;
  const heroFast = getMetadata('hero-fast')?.trim().toLowerCase();
  if (heroFast !== 'on' && heroFast !== 'force') return;
  if (heroFast === 'on') {
    // Blocking Target or an MEP preview may rewrite section 1: keep today's behavior.
    if (getMetadata('target')?.trim().toLowerCase() === 'on') return;
    if (new URLSearchParams(window.location.search).has('mep')) return;
  }
  const section = document.querySelector('body > main > div:first-child');
  const hero = section?.querySelector(':scope > div[class]');
  const name = hero?.classList[0];
  if (!FAST_HERO_BLOCKS.has(name)) return;
  // Revealing the section early is only safe when nothing else in it is still undecorated.
  const others = [...section.children].filter((el) => el !== hero && !el.matches('.section-metadata'));
  if (others.length) return;

  // Same absolute URLs Milo's loadBlock uses (config.codeRoot is origin-prefixed), so its
  // loadStyle dedupes the stylesheet and its import() hits the same module instance.
  const base = `${window.location.origin}/express/code/blocks/${name}/${name}`;
  const cssLoaded = new Promise((resolve) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', `${base}.css`);
    link.onload = resolve;
    link.onerror = resolve;
    document.head.append(link);
  });
  Promise.all([import(`${base}.js`), cssLoaded]).then(([mod]) => {
    if (!hero.isConnected || !mod.renderCritical?.(hero)) return;
    // Block CSS is scoped to `main .section`; Milo sets the same className later.
    section.classList.add('section');
    section.dataset.heroFast = '';
    reserveGnavSpace();
  }).catch((e) => {
    window.lana?.log(`Fast hero render failed: ${e?.message || e}`, { tags: 'hero-fast', severity: 'error' });
  });
}());

// LCP image decoration
const eagerLoad = (img) => {
  img?.setAttribute('loading', 'eager');
  img?.setAttribute('fetchpriority', 'high');
};

function preloadLCPImage(img) {
  // Build a preload that mirrors the <picture> responsive sources when available.
  // currentSrc is empty at module-evaluation time (before layout), so we extract
  // the best candidate from <source> srcset or fall back to img.src.
  const picture = img?.closest('picture');
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.fetchPriority = 'high';

  if (picture) {
    const sources = [...picture.querySelectorAll('source')];
    if (sources.length) {
      // Use imagesrcset/imagesizes so the browser picks the right variant
      link.type = sources[0].type || '';
      link.imageSrcset = sources[0].srcset || '';
      if (sources[0].sizes) link.imageSizes = sources[0].sizes;
      if (sources[0].media) link.media = sources[0].media;
    } else {
      link.href = img.src;
    }
  } else {
    link.href = img.src;
  }

  const key = link.href || link.imageSrcset;
  const alreadyExists = key && (
    document.querySelector(`link[rel="preload"][href="${key}"]`)
    || document.querySelector(`link[rel="preload"][imagesrcset="${key}"]`)
  );
  if (key && !alreadyExists) {
    document.head.appendChild(link);
  }
}

(function decorateLCPImage() {
  const firstSection = document.querySelector('body > main > div:nth-child(1)');
  if (!firstSection) return;

  const images = firstSection.querySelectorAll('img');
  if (images.length > 0) {
    images.forEach(eagerLoad);
    preloadLCPImage(images[0]);
  } else {
    const lcpImg = document.querySelector('img');
    if (lcpImg) {
      eagerLoad(lcpImg);
      preloadLCPImage(lcpImg);
    }
  }
}());

let fragmentLcpPreloaded = false;
// eslint-disable-next-line import/prefer-default-export
export function decorateAreaWithLCP(area = document, options = {}) {
  const { fragmentLink } = options;
  if (fragmentLink && !fragmentLcpPreloaded) {
    const firstSection = document.querySelector('body > main > div:nth-child(1)');
    if (firstSection?.querySelector('a.fragment') === fragmentLink) {
      const section = area.querySelector('body > div') || area;
      const images = section.querySelectorAll('img');
      if (images.length) {
        images.forEach(eagerLoad);
        preloadLCPImage(images[0]);
        fragmentLcpPreloaded = true;
      }
    }
  }
  decorateArea(area, options);
}
CONFIG.decorateArea = decorateAreaWithLCP;

(function loadStyles() {
  const paths = [`${miloLibs}/styles/styles.css`];
  if (!document.querySelector('link[data-s2a-tokens="true"]')) {
    paths.unshift('https://www.adobe.com/libs/c2/styles/s2a-tokens.css');
  }
  if (getMetadata('theme') !== 'doodlebug') {
    paths.push('/express/code/styles/styles.css');
  }
  if (getMetadata('font-styling')?.trim().toLowerCase() === 'jp') {
    paths.push('/express/code/styles/font-styling-jp.css');
  }
  if (STYLES) { paths.push(STYLES); }
  paths.forEach((path) => {
    // Match rel=stylesheet only: head.html may <link rel="preload"> the same href.
    const existing = document.querySelector(`link[rel="stylesheet"][href="${path}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', path);
    if (path === 'https://www.adobe.com/libs/c2/styles/s2a-tokens.css') {
      link.dataset.s2aTokens = 'true';
    }
    document.head.appendChild(link);
  });
}());

function decorateHeroLCP(loadStyle, config, createTag) {
  const template = getMetadata('template');
  const h1 = document.querySelector('main h1');
  if (template !== 'blog') {
    if (h1 && !h1.closest('main > div > div')) {
      const heroPicture = h1.parentElement.querySelector('picture');
      let heroSection;
      const main = document.querySelector('main');
      if (main.children.length === 1) {
        heroSection = createTag('div', { id: 'hero' });
        const div = createTag('div');
        heroSection.append(div);
        if (heroPicture) {
          div.append(heroPicture);
        }
        div.append(h1);
        main.prepend(heroSection);
      } else {
        heroSection = h1.closest('main > div');
        heroSection.id = 'hero';
        heroSection.removeAttribute('style');
      }
      if (heroPicture) {
        heroPicture.classList.add('hero-bg');
      } else {
        heroSection.classList.add('hero-noimage');
      }
      if (['on', 'yes'].includes(getMetadata('hero-inject-logo')?.toLowerCase()?.trim())) {
        const logo = getIconElementDeprecated('adobe-express-logo');
        logo.classList.add('express-logo');
        heroSection.prepend(logo);
      }
    }
  } else if (template === 'blog' && h1 && getMetadata('author') && getMetadata('publication-date')) {
    loadStyle(`${config.codeRoot}/templates/blog/blog.css`);
    document.body.style.visibility = 'hidden';
    const heroSection = createTag('div', { id: 'hero' });
    const main = document.querySelector('main');
    main.prepend(heroSection);
    // split sections for template-list
    const blocks = document.querySelectorAll('main > div > .template-list');
    blocks.forEach((block) => {
      const $section = block.parentNode;
      const $elems = [...$section.children];

      if ($elems.length <= 1) return;

      const $blockSection = createTag('div');
      const $postBlockSection = createTag('div');
      const $nextSection = $section.nextElementSibling;
      $section.parentNode.insertBefore($blockSection, $nextSection);
      $section.parentNode.insertBefore($postBlockSection, $nextSection);

      let $appendTo;
      $elems.forEach(($e) => {
        if ($e === block || ($e.className === 'section-metadata')) {
          $appendTo = $blockSection;
        }

        if ($appendTo) {
          $appendTo.appendChild($e);
          $appendTo = $postBlockSection;
        }
      });

      if (!$postBlockSection.hasChildNodes()) {
        $postBlockSection.remove();
      }
    });
  }
}

const listenAlloy = () => {
  let resolver;
  let loaded;
  window.alloyLoader = new Promise((r) => {
    resolver = r;
  });
  window.addEventListener('alloy_sendEvent', (e) => {
    if (e.detail.type === 'pageView') {
      // eslint-disable-next-line no-console
      loaded = true;
      resolver(e.detail.result);
    }
  }, { once: true });
  setTimeout(() => {
    if (!loaded) {
      resolver();
    }
  }, 3000);
};

const CONTENT_REPLACE_MARKERS = /\{\{|%7B%7B|default-create-link|Default template (title|text)|Default top templates/;
// content-replace.js awaits placeholders before decoration. Under /express/templates/ only run
// it when the page actually has something for it to replace (see content-replace.js).
function needsContentReplace(main) {
  if (getMetadata('sheet-powered') === 'Y') return true;
  if (!window.location.href.includes('/express/templates/')) return false;
  if (getMetadata('template-search-page') || getMetadata('live') === 'N') return true;
  if (window.location.pathname.endsWith('/express/templates/default')) return true;
  if (!main || document.title.includes('{{')) return true;
  if (main.querySelector('.browse-by-category')) return true;
  const hashLinkToMetadata = [...main.querySelectorAll('a[href*="#"]')]
    .some((a) => a.hash.length > 1 && getMetadata(a.hash.slice(1)));
  return hashLinkToMetadata || CONTENT_REPLACE_MARKERS.test(main.innerHTML);
}

// Runs cb once Milo has finished section 1 (processSection deletes data-status after all its
// blocks load), i.e. right at LCP rather than after loadArea has processed every section.
function onFirstSectionLoaded(cb) {
  const section = document.querySelector('body > main > div');
  if (!section) return;
  const done = () => section.classList.contains('section') && !section.dataset.status;
  const observer = new MutationObserver(() => {
    if (!done()) return;
    observer.disconnect();
    cb();
  });
  observer.observe(section, { attributes: true, attributeFilter: ['class', 'data-status'] });
}

// Calls cb once el has a layout box. Hero CTAs can be display:none at some breakpoints
// (grid-marquee hides .ctas below 768px, where the floating CTA takes over); there's no
// point paying for merch + commerce for a link nobody can see.
function whenRendered(el, cb) {
  if (el.getClientRects().length) {
    cb();
    return;
  }
  const observer = new ResizeObserver(() => {
    if (!el.getClientRects().length) return;
    observer.disconnect();
    cb();
  });
  observer.observe(el);
}

// Tier 1b: hero OST links were neutralized in decorateArea so Milo's preloadLcpCodeFiles
// doesn't pull merch/commerce into the critical path. Hand them to Milo's merch block now.
function loadDeferredMerch(loadBlock) {
  document.querySelectorAll('a[data-deferred-merch]:not([data-merch-queued])').forEach((a) => {
    a.dataset.merchQueued = '';
    whenRendered(a, async () => {
      // The hero block decorated this link (button, primaryCTA, ...). On the eager path merch
      // swapped the link first and the block decorated the replacement; replay that here.
      const heroClasses = [...a.classList];
      const { parentNode } = a;
      const index = [...parentNode.childNodes].indexOf(a);
      a.href = a.dataset.deferredMerch;
      delete a.dataset.deferredMerch;
      delete a.dataset.merchQueued;
      // Same shape decorateAutoBlock gives it: Milo derives the block name from classList[0].
      a.className = 'merch link-block';
      await loadBlock(a);
      const cta = parentNode.childNodes[index];
      if (cta !== a && heroClasses.length && cta?.classList) cta.classList.add(...heroClasses);
    });
  });
}

async function loadPage() {
  if (window.isTestEnv) return;
  const {
    loadArea,
    loadBlock,
    loadStyle,
    setConfig,
    loadLana,
    createTag,
  } = await import(`${miloLibs}/utils/utils.js`);

  const footer = createTag('meta', { name: 'footer', content: 'global-footer' });
  document.head.append(footer);

  if (!getMetadata('footer-source')) {
    document.head.append(createTag('meta', { name: 'footer-source', content: `${window.location.origin}/federal/footer/footer` }));
  }

  const adobeHomeRedirect = createTag('meta', { name: 'adobe-home-redirect', content: 'on' });
  document.head.append(adobeHomeRedirect);

  const googleLoginRedirect = createTag('meta', { name: 'google-login', content: 'desktop' });
  document.head.append(googleLoginRedirect);
  // end TODO remove metadata after we go live

  const config = setConfig({ ...CONFIG, miloLibs });

  // Legacy color.adobe.com deeplink redirect
  if (/color-theme-\d+\/?$/.test(window.location.pathname)) {
    const { default: colorThemeRedirect } = await import('./utils/color-theme-redirect.js');
    const redirected = await colorThemeRedirect(config);
    if (redirected) return;
  }

  if (getMetadata('template-search-page') === 'Y') {
    const { default: redirect } = await import('./utils/template-redirect.js');
    await redirect();
  }

  // TODO remove metadata after we go live
  getMetadata('gnav-source') || document.head.append(createTag('meta', { name: 'gnav-source', content: `${config.locale.prefix}/express/localnav-express` }));

  if (needsContentReplace(document.querySelector('main'))) {
    const { default: replaceContent } = await import('./utils/content-replace.js');
    await replaceContent(document.querySelector('main'));
  }
  // Decorate the page with site specific needs.
  decorateArea();

  loadLana({ clientId: 'express' });

  // TODO this method should be removed about two weeks after going live
  listenAlloy();

  // prevent milo gnav from loading
  const headerMeta = createTag('meta', { name: 'custom-header', content: 'on' });
  document.head.append(headerMeta);
  const footerMeta = createTag('meta', { name: 'custom-footer', content: 'on' });
  document.head.append(footerMeta);

  buildAutoBlocks();
  decorateHeroLCP(loadStyle, config, createTag, getMetadata);
  const urlParams = new URLSearchParams(window.location.search);
  const martechOn = urlParams.get('martech') !== 'off' && getMetadata('martech') !== 'off';
  const loadInstrument = () => import('./instrument.js').then((mod) => { mod.default(); });
  // Tier 1a (opt-in): keep analytics wiring off the critical path. Opt-in until analytics
  // owners confirm nothing in instrument.js must be set before Milo's page-view event.
  const deferInstrument = getMetadata('defer-instrument')?.trim().toLowerCase() === 'on';
  if (martechOn && !deferInstrument) loadInstrument();

  /* region based redirect to CN homepage */
  const isAdobeOrigin = /^(www|color)\.(stage\.)?adobe\.com$/.test(window.location.hostname);
  import('./utils/location-utils.js').then(({ getCountry }) => getCountry()).then((country) => {
    if (country === 'cn' && isAdobeOrigin && !window.location.pathname.startsWith('/cn') && !window.isErrorPage) {
      window.location.href = window.location.hostname.includes('stage') ? 'https://www.stage.adobe.com/cn' : 'https://www.adobe.com/cn';
    }
  });

  document.head.querySelectorAll('meta').forEach((meta) => {
    if (meta.content && meta.content.includes('--none--')) {
      meta.remove();
    }
  });

  document.querySelectorAll('span.icon').forEach((icon) => {
    icon.dataset.svgInjected = 'true';
  });

  if (document.querySelector('a[data-deferred-merch]')) {
    onFirstSectionLoaded(() => loadDeferredMerch(loadBlock));
  }
  await loadArea();
  stopFixedTopOffsetTracking?.();
  stopFixedTopOffsetTracking = await trackFixedTopOffset(config);
  // Fallback if section 1 was replaced before it finished (e.g. MEP); no-op once handled.
  loadDeferredMerch(loadBlock);
  if (martechOn && deferInstrument) loadInstrument();

  const { fixIcons } = await import('./utils.js');
  document.querySelectorAll('.section>.text').forEach((block) => fixIcons(block));

  import('./express-delayed.js').then((mod) => {
    mod.default();
  });
}

loadPage();

(async function loadDa() {
  if (!new URL(window.location.href).searchParams.get('dapreview')) return;
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());
