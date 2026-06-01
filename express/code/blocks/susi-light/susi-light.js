/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import { getTrackingAppendedURL } from '../../scripts/branchlinks.js';

let createTag; let loadScript;
let getConfig; let isStage;
let loadIms;

export const DCTX_ID_MAP = {
  'context-default': {
    stage: 'v:2,s,dcp-r,bg:express2024,bf31d610-dd5f-11ee-abfd-ebac9468bc58',
    prod: 'v:2,s,dcp-r,bg:express2024,45faecb0-e687-11ee-a865-f545a8ca5d2c',
  },
  'context-edu': {
    stage: 'v:2,s,bg:EDUExpressPurple,40262910-c9bd-11f0-8359-b30f8fb5b3f5',
    prod: 'v:2,s,bg:EDUExpressPurple,a6588140-c9bf-11f0-a941-d1bc629a24f2',
  },
};

const usp = new URLSearchParams(window.location.search);

const onRedirect = (e) => {
  // eslint-disable-next-line no-console
  console.log('redirecting to:', e.detail);
  // temporary solution: allows analytics to go thru. should move to a promise
  setTimeout(() => {
    window.location.assign(e.detail);
  }, 100);
};
const onError = (error) => {
  window.lana?.log(`on error: ${error?.message || error?.detail || error}`, { tags: 'susi-light', severity: 'error' });
};

const onAuthFailed = (error) => {
  window.lana?.log(`on auth failed: ${error?.message || error?.detail || error}`, { tags: 'susi-light, susi-auth-failed', severity: 'error' });
};
// easier to mock in unit test
export const SUSIUtils = {
  loadSUSIScripts: async () => {
    const CDN_URL = `https://auth-light.identity${isStage ? '-stage' : ''}.adobe.com/sentry/wrapper.js`;
    if (!loadScript) {
      ({ loadScript } = await import(`${getLibs()}/utils/utils.js`));
    }
    return loadScript(CDN_URL);
  },
};

async function getDestURL(url) {
  let destURL;
  try {
    const appended = await getTrackingAppendedURL(url);
    destURL = new URL(appended);
  } catch (error) {
    window.lana?.log(`invalid redirect uri for susi-light: ${url}: ${error?.message || error?.detail || error}`, { tags: 'susi-light, susi-invalid-redirect-uri', severity: 'error' });
    destURL = new URL('https://new.express.adobe.com');
  }
  if (isStage) {
    if (['new.express.adobe.com', 'express.adobe.com'].includes(destURL.hostname)) {
      destURL.hostname = 'stage.projectx.corp.adobe.com';
    }
    if (destURL.hostname === 'adobesparkpost.app.link') {
      destURL.pathname = '1F048UHIAVb';
    }
  }
  return destURL;
}

function sendEventToAnalytics(type, eventName, client_id) {
  const sendEvent = () => {
    window._satellite.track('event', {
      xdm: {},
      data: {
        eventType: 'web.webinteraction.linkClicks',
        web: {
          webInteraction: {
            name: eventName,
            linkClicks: {
              value: 1,
            },
            type,
          },
        },
        _adobe_corpnew: {
          digitalData: {
            primaryEvent: {
              eventInfo: {
                eventName,
                client_id,
              },
            },
          },
        },
      },
    });
  };
  if (window._satellite?.track) {
    sendEvent();
  } else {
    window.addEventListener('alloy_sendEvent', () => {
      sendEvent();
    }, { once: true });
  }
}

function createSUSIComponent({
  variant,
  config,
  authParams,
  destURL,
  context,
  popup,
  onSuccessfulToken,
}) {
  const susi = createTag('susi-sentry-light');
  susi.authParams = authParams;
  susi.authParams.redirect_uri = destURL.toString();
  susi.authParams.dctx_id = (DCTX_ID_MAP[context] || DCTX_ID_MAP['context-default'])[isStage ? 'stage' : 'prod'];
  susi.config = config;
  susi.popup = popup;
  if (isStage) susi.stage = 'true';
  susi.variant = variant;

  const onAnalytics = (e) => {
    const { type, event } = e.detail;
    sendEventToAnalytics(type, event, authParams.client_id);
  };
  susi.addEventListener('redirect', onRedirect);
  susi.addEventListener('on-error', onError);
  susi.addEventListener('on-analytics', onAnalytics);
  if (onSuccessfulToken) {
    susi.addEventListener('on-token', onSuccessfulToken);
  }
  susi.addEventListener('on-auth-failed', onAuthFailed);
  return susi;
}

function redirectIfLoggedIn(destURL) {
  const goDest = () => {
    sendEventToAnalytics('redirect', 'logged-in-auto-redirect');
    window.location.assign(destURL.toString());
  };
  if (window.adobeIMS) {
    window.adobeIMS.isSignedInUser() && goDest();
  } else {
    loadIms()
      .then(() => {
        /* c8 ignore next */
        window.adobeIMS?.isSignedInUser() && goDest();
      })
      .catch((error) => {
        window.lana?.log(`Unable to load IMS in susi-light: ${error?.message || error?.detail || error}`, { tags: 'susi-light, susi-load-ims-failed', severity: 'error' });
      });
  }
}

function buildSUSIParams({
  client_id,
  variant,
  destURL,
  locale,
  title,
  hideIcon,
  layout,
  el,
  popup,
  dt,
  responseType,
}) {
  const params = {
    variant,
    authParams: {
      dt: dt || false,
      locale,
      response_type: responseType || 'code',
      client_id,
      scope: 'AdobeID,openid',
    },
    destURL,
    config: {
      consentProfile: 'free',
      fullWidth: true,
    },
    popup: popup || false,
  };
  // '' for no title
  if (title !== undefined) {
    params.config.title = title;
  }
  if (hideIcon) {
    params.config.hideIcon = true;
  }
  if (layout) {
    params.config.layout = layout;
  }
  const ctx = Object.keys(DCTX_ID_MAP).find((k) => el?.classList.contains(k));
  if (ctx) {
    params.context = ctx;
  }
  return params;
}

function sanitizeId(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

function createLogo() {
  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.classList.add('express-logo');
  logo.height = 24;
  return logo;
}

async function buildEdu(el, locale, imsClientId, noRedirect) {
  const rows = el.querySelectorAll(':scope > div > div');
  const redirectUrl = rows[0]?.textContent?.trim();
  const client_id = rows[1]?.textContent?.trim() || (imsClientId ?? 'AdobeExpressWeb');
  const title = rows[2]?.textContent?.trim();
  const variant = 'edu-express';
  const destURL = await getDestURL(redirectUrl);
  const params = buildSUSIParams({
    client_id, variant, destURL, locale, title, el,
  });
  if (!noRedirect) {
    redirectIfLoggedIn(params.destURL);
  }
  await SUSIUtils.loadSUSIScripts();
  return createSUSIComponent(params);
}

// TODO: rename after buildEdu is deprecated
async function buildEduNew(el, locale, imsClientId, noRedirect) {
  const rows = el.querySelectorAll(':scope > div > div');
  const redirectUrl = rows[0]?.textContent?.trim();
  const client_id = rows[1]?.textContent?.trim() || (imsClientId ?? 'AdobeExpressWeb');
  const title = rows[2]?.textContent?.trim();
  const subheading = rows[3];
  subheading?.classList.add('subheading');
  const variant = 'standard';
  const destURL = await getDestURL(redirectUrl);
  const susiConfigs = {
    client_id, variant, destURL, locale, title: '', hideIcon: true, el,
  };
  const params = buildSUSIParams(susiConfigs);
  if (!noRedirect) {
    redirectIfLoggedIn(params.destURL);
  }
  await SUSIUtils.loadSUSIScripts();
  const titleDiv = createTag('div', { class: 'title' }, title);
  const susiWrapper = createTag('div', { class: 'susi-wrapper' }, createSUSIComponent(params));
  const layout = createTag('div', { class: 'susi-layout' }, [createLogo(), titleDiv, subheading, susiWrapper]);
  return layout;
}

// wrap susi component with custom logo + footer
async function buildB2B(el, locale, imsClientId, noRedirect) {
  const emailFirst = el.classList.contains('email-first');
  const emailOnly = el.classList.contains('email-only');
  const rows = el.querySelectorAll(':scope > div > div');
  const redirectUrl = rows[0]?.textContent?.trim();
  const client_id = rows[1]?.textContent?.trim() || (imsClientId ?? 'AdobeExpressWeb');
  const title = rows[2]?.textContent?.trim();
  const footer = rows[3];
  footer?.classList.add('footer', 'susi-banner');
  const variant = 'standard';
  const destURL = await getDestURL(redirectUrl);
  const susiConfigs = {
    client_id, variant, destURL, locale, title: '', hideIcon: true, el,
  };
  if (emailFirst) {
    susiConfigs.layout = 'emailAndSocial';
  } else if (emailOnly) {
    susiConfigs.layout = 'emailOnly';
  }
  const params = buildSUSIParams(susiConfigs);
  if (!noRedirect) {
    redirectIfLoggedIn(params.destURL);
  }
  await SUSIUtils.loadSUSIScripts();
  const titleDiv = createTag('div', { class: 'title' }, title);
  const susiWrapper = createTag('div', { class: 'susi-wrapper' }, createSUSIComponent(params));
  const layout = createTag('div', { class: 'susi-layout' }, [createLogo(), titleDiv, susiWrapper]);
  footer && layout.append(footer);
  return layout;
}

async function buildStudent(el, locale, imsClientId, noRedirect) {
  const checked = el.classList.contains('checked');
  const rows = el.querySelectorAll(':scope > div > div');
  const redirectUrl = rows[0]?.textContent?.trim();
  const client_id = rows[1]?.textContent?.trim() || (imsClientId ?? 'AdobeExpressWeb');
  const title = rows[2]?.textContent?.trim();
  const studentCheckText = rows[3]?.textContent?.trim();
  const footer = rows[4];
  footer?.classList.add('footer', 'susi-banner');
  const variant = 'standard';
  const destURL = await getDestURL(redirectUrl);
  if (checked) {
    destURL.searchParams.set('student', 'true');
  }
  const susiConfigs = {
    client_id, variant, destURL, locale, title: '', hideIcon: true, el,
  };
  const params = buildSUSIParams(susiConfigs);
  if (!noRedirect) {
    redirectIfLoggedIn(params.destURL);
  }
  await SUSIUtils.loadSUSIScripts();
  const titleDiv = createTag('div', { class: 'title' }, title);
  const checkboxInput = createTag('input', { type: 'checkbox', name: 'student' });
  const checkedAttribute = `checked-${studentCheckText}`;
  const uncheckedAttribute = `unchecked-${studentCheckText}`;
  if (checked) {
    checkboxInput.checked = true;
    checkboxInput.setAttribute('daa-ll', checkedAttribute);
  } else {
    checkboxInput.setAttribute('daa-ll', uncheckedAttribute);
  }
  const susiComponent = createSUSIComponent(params);
  checkboxInput.addEventListener('change', (e) => {
    const url = new URL(susiComponent.authParams.redirect_uri);
    if (e.target.checked) {
      url.searchParams.set('student', 'true');
    } else {
      url.searchParams.delete('student');
    }
    susiComponent.authParams = { ...susiComponent.authParams, redirect_uri: url.toString() };
    checkboxInput.setAttribute('daa-ll', e.target.checked ? checkedAttribute : uncheckedAttribute);
  });
  const susiWrapper = createTag('div', { class: 'susi-wrapper' }, susiComponent);
  const studentCheckDiv = createTag(
    'div',
    { class: 'student-check' },
    createTag('label', {}, [checkboxInput, studentCheckText]),
  );
  const layout = createTag('div', { class: 'susi-layout' }, [
    createLogo(),
    titleDiv,
    studentCheckDiv,
    susiWrapper,
  ]);
  footer && layout.append(footer);
  return layout;
}

// each tab wraps susi component with custom logo + footer
let tabsId = 0;

function readTokenPx(root, prop, fallback) {
  const n = parseFloat(root.getPropertyValue(prop));
  return Number.isFinite(n) ? n : fallback;
}

/** Tab panel slot = max(measured panel per variant) + buffer; sync tokens in susi-light.css */
export function resolveTabsPanelMinHeight(variants) {
  const root = getComputedStyle(document.documentElement);
  const panelByVariant = {
    standard: readTokenPx(root, '--susi-tabs-panel-standard', 508),
    'edu-express': readTokenPx(root, '--susi-tabs-panel-edu-express', 513),
  };
  const buffer = readTokenPx(root, '--susi-tabs-panel-buffer', 8);
  const fallback = readTokenPx(root, '--susi-tabs-panel-height', 521);
  const heights = variants
    .filter(Boolean)
    .map((v) => panelByVariant[v] ?? panelByVariant.standard);
  if (!heights.length) return fallback;
  return Math.ceil(Math.max(...heights) + buffer);
}

/** Tallest widget min-height across authored variants (for tests / tooling) */
export function resolveTabsWrapperMinHeight(variants) {
  const root = getComputedStyle(document.documentElement);
  const byVariant = {
    standard: readTokenPx(root, '--susi-tabs-wrapper-standard', 458),
    'edu-express': readTokenPx(root, '--susi-tabs-wrapper-edu-express', 367),
  };
  const fallback = byVariant.standard;
  const heights = variants
    .filter(Boolean)
    .map((v) => byVariant[v] ?? fallback);
  if (!heights.length) return fallback;
  return Math.max(...heights);
}

/** Reserve tallest tab panel slot from authoring row 2 variants (CLS). */
export function applyTabsReserveFromAuthoring(el, variants) {
  el.style.setProperty('--susi-tabs-panel-height', `${resolveTabsPanelMinHeight(variants)}px`);
}

function setTabPanelActive(panel, isActive) {
  panel.classList.toggle('hide', !isActive);
  panel.setAttribute('aria-hidden', String(!isActive));
  if (isActive) {
    panel.removeAttribute('inert');
  } else {
    panel.setAttribute('inert', '');
  }
}

async function buildSUSITabs(el, locale, imsClientId, noRedirect) {
  const rows = [...el.children];
  const title = rows[0].textContent?.trim();
  const tabNames = [...rows[1].querySelectorAll('div')].map((div) => div.textContent);
  const variants = [...rows[2].querySelectorAll('div')].map((div) => div.textContent?.trim().toLowerCase());
  applyTabsReserveFromAuthoring(el, variants);
  const redirectUrls = [...rows[3].querySelectorAll('div')].map((div) => div.textContent?.trim());
  const client_ids = [...rows[4].querySelectorAll('div')].map((div) => div.textContent?.trim() || (imsClientId ?? 'AdobeExpressWeb'));
  const footers = rows[5] ? [...rows[5].querySelectorAll('div')] : [];
  const destURLs = await Promise.all(redirectUrls.map((redirectUrl) => getDestURL(redirectUrl)));
  const tabParams = tabNames.map((tabName, index) => ({
    tabName,
    ...buildSUSIParams({
      client_id: client_ids[index],
      variant: variants[index],
      destURL: destURLs[index],
      locale,
      title: '', // rm titles
      hideIcon: true,
      el,
    }),
    footer: footers[index] ?? null,
  }));
  if (!noRedirect) {
    // redirect to first one if logged in
    redirectIfLoggedIn(tabParams[0].destURL);
  }

  tabsId += 1;
  const layout = createTag('div', { class: 'susi-layout' });
  const tabList = createTag('div', { role: 'tablist' });
  const susiScriptReady = SUSIUtils.loadSUSIScripts();
  const panels = tabParams.map((option, i) => {
    const { footer, tabName, variant } = option;
    const susiWrapper = createTag('div', { class: 'susi-wrapper' });
    const panel = createTag('div', { role: 'tabpanel', class: variant }, susiWrapper);
    susiScriptReady.then(() => susiWrapper.append(createSUSIComponent(option)));

    if (footer) {
      footer.classList.add('footer');
      if (footer.querySelector('h2')) {
        footer.classList.add('susi-bubbles');
        const bubbleContainer = createTag('div', { class: 'susi-bubble-container' });
        [...footer.querySelectorAll('p')].forEach((p) => {
          p.classList.add('susi-bubble');
          bubbleContainer.append(p);
        });
        footer.append(bubbleContainer);
      } else {
        footer.classList.add('susi-banner');
      }
      panel.append(footer);
    }

    const id = sanitizeId(`${tabName}-${tabsId}`);
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.id = `panel-${id}`;
    setTabPanelActive(panel, i === 0);
    const tab = createTag('button', {
      role: 'tab',
      'aria-selected': i === 0,
      'aria-controls': `panel-${id}`,
      id: `tab-${id}`,
    }, tabName);
    tab.addEventListener('click', () => {
      tabList.querySelector('[aria-selected=true]')?.setAttribute('aria-selected', false);
      tab.setAttribute('aria-selected', true);
      panels.forEach((p) => setTabPanelActive(p, p === panel));
    });
    tabList.append(tab);
    return panel;
  });
  const titleDiv = createTag('div', { class: 'title' }, title);
  const tabPanelsSlot = createTag('div', { class: 'susi-tab-panels' });
  panels.forEach((panel) => tabPanelsSlot.append(panel));
  layout.append(createLogo(), titleDiv, tabList, tabPanelsSlot);
  return layout;
}

async function buildSimplifiedSusi(el, locale, imsClientId, noRedirect) {
  const rows = el.querySelectorAll(':scope > div > div');
  const isColor = el.classList.contains('color');

  let redirectUrl;
  if (isColor) {
    const { consumeSusiColorRedirect } = await import(
      '../../scripts/color-shared/utils/susiRedirect.js'
    );
    redirectUrl = consumeSusiColorRedirect() || window.location.href;
  } else {
    redirectUrl = rows[0]?.textContent?.trim();
  }

  const client_id = rows[1]?.textContent?.trim() || (imsClientId ?? 'AdobeExpressWeb');
  const title = rows[2]?.textContent?.trim();
  const popup = el.classList.contains('popup') || false;
  const variant = 'standard';
  const destURL = await getDestURL(redirectUrl);
  const params = buildSUSIParams({
    client_id, variant, destURL, locale, title, popup, responseType: 'token',
  });
  if (!noRedirect && !isColor) {
    redirectIfLoggedIn(params.destURL);
  }
  await SUSIUtils.loadSUSIScripts();
  const titleDiv = createTag('div', { class: 'title' }, title);
  const susiWrapper = createTag('div', { class: 'susi-wrapper' }, createSUSIComponent({
    ...params,
    onSuccessfulToken: () => window.location.assign(destURL.toString()),
  }));
  const layout = createTag('div', { class: 'susi-layout' }, [createLogo(), titleDiv, susiWrapper]);
  return layout;
}

function blurModalCurtain() {
  const updateBlurState = () => {
    const modalCurtain = document.querySelector('.modal-curtain');
    const dialogModal = document.querySelector('.dialog-modal');
    if (modalCurtain && dialogModal) {
      if (modalCurtain.classList.contains('is-open')) {
        modalCurtain.classList.add('blurred');
      } else if (!modalCurtain.classList.contains('is-open')) {
        modalCurtain.classList.remove('blurred');
      }
    }
  };

  const modalCurtain = document.querySelector('.modal-curtain');
  if (modalCurtain) {
    updateBlurState();
  } else {
    const observer = new MutationObserver(() => {
      const curtain = document.querySelector('.modal-curtain');
      if (curtain) {
        updateBlurState();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

export default async function init(el) {
  ({ createTag, loadScript, getConfig, loadIms } = await import(`${getLibs()}/utils/utils.js`));
  isStage = (usp.get('env') && usp.get('env') !== 'prod') || getConfig().env.name !== 'prod';
  const locale = getConfig().locale.ietf.toLowerCase();
  const { imsClientId } = getConfig();
  const noRedirect = el.classList.contains('no-redirect');

  /**
   * customize can be used to add custom logic to the susi-light component
    * that we wanna keep separate from the build function.
   */
  const match = [
    { cls: 'b2b', build: buildB2B },
    { cls: 'tabs', build: buildSUSITabs },
    { cls: 'student', build: buildStudent },
    { cls: 'edu', build: buildEduNew },
    { cls: 'simplified', build: buildSimplifiedSusi, customize: blurModalCurtain },
  ].find(({ cls }) => el.classList.contains(cls));

  // default edu-express variant, TODO: to be deprecated soon
  const susi = await (match?.build || buildEdu)(el, locale, imsClientId, noRedirect);
  if (match?.customize) {
    match.customize();
  }
  el.replaceChildren(susi);

  // branchlinks can exist in footers
  const footer = el.querySelector('.footer');
  if (footer) {
    const links = footer.querySelectorAll('a[href*="adobesparkpost"]');
    const linksPopulated = new CustomEvent('linkspopulated', { detail: links });
    document.dispatchEvent(linksPopulated);
  }
}
