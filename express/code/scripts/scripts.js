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
} from './utils.js';
import { locales, languageMap } from './locales.js';

// Add project-wide style path here.
const STYLES = [];

// Use 'https://milo.adobe.com/libs' if you cannot map '/libs' to milo's origin.
const LIBS = '/libs';
const miloLibs = setLibs(LIBS);
let jarvisImmediatelyVisible = false;
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
  locales,
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
  languageMap,
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

/*
 * ------------------------------------------------------------
 * Edit below at your own risk
 * ------------------------------------------------------------
 */

document.body.dataset.device = navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop';
preDecorateSections(document);
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
  if (getMetadata('theme') !== 'doodlebug') {
    paths.push('/express/code/styles/styles.css');
  }
  if (STYLES) { paths.push(STYLES); }
  paths.forEach((path) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', path);
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

async function loadPage() {
  if (window.isTestEnv) return;
  const {
    loadArea,
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

  if (getMetadata('sheet-powered') === 'Y' || window.location.href.includes('/express/templates/')) {
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

  await loadArea();

  // Defer martech/analytics until after all blocks have loaded, so it
  // doesn't compete with LCP/block requests on the critical path.
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('martech') !== 'off' && getMetadata('martech') !== 'off') {
    import('./instrument.js').then((mod) => { mod.default(); });
  }

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
