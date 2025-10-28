/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import { getLibs, getIconElementDeprecated } from '../../scripts/utils.js';
import { getTrackingAppendedURL } from '../../scripts/branchlinks.js';

let createTag; let loadScript;
let getConfig; let isStage;
let loadIms;

const DCTX_ID_STAGE = 'v:2,s,dcp-r,bg:express2024,bf31d610-dd5f-11ee-abfd-ebac9468bc58';
const DCTX_ID_PROD = 'v:2,s,dcp-r,bg:express2024,45faecb0-e687-11ee-a865-f545a8ca5d2c';

const usp = new URLSearchParams(window.location.search);

const onRedirect = (e) => {
  // eslint-disable-next-line no-console
  console.log('redirecting to:', e.detail);
  // temporary solution: allows analytics to go thru. should move to a promise
  setTimeout(() => {
    window.location.assign(e.detail);
  }, 100);
};
const onError = (e) => {
  window.lana?.log('on error:', e);
};

// easier to mock in unit test
export const SUSIUtils = {
  loadSUSIScripts: () => {
    const CDN_URL = `https://auth-light.identity${isStage ? '-stage' : ''}.adobe.com/sentry/wrapper.js`;
    return loadScript(CDN_URL);
  },
};

async function getDestURL(url) {
  let destURL;
  try {
    const appended = await getTrackingAppendedURL(url);
    destURL = new URL(appended);
  } catch (err) {
    window.lana?.log(`invalid redirect uri for susi-light: ${url}`);
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
}) {
  const susi = createTag('susi-sentry-light');
  susi.authParams = authParams;
  susi.authParams.redirect_uri = destURL.toString();
  susi.authParams.dctx_id = isStage ? DCTX_ID_STAGE : DCTX_ID_PROD;
  susi.config = config;
  if (isStage) susi.stage = 'true';
  susi.variant = variant;

  const onAnalytics = (e) => {
    const { type, event } = e.detail;
    sendEventToAnalytics(type, event, authParams.client_id);
  };
  susi.addEventListener('redirect', onRedirect);
  susi.addEventListener('on-error', onError);
  susi.addEventListener('on-analytics', onAnalytics);
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
      .catch((e) => { window.lana?.log(`Unable to load IMS in susi-light: ${e}`); });
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
}) {
  const params = {
    variant,
    authParams: {
      dt: false,
      locale,
      response_type: 'code',
      client_id,
      scope: 'AdobeID,openid',
    },
    destURL,
    config: {
      consentProfile: 'free',
      fullWidth: true,
    },
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
    client_id, variant, destURL, locale, title,
  });
  if (!noRedirect) {
    redirectIfLoggedIn(params.destURL);
  }
  await SUSIUtils.loadSUSIScripts();
  return createSUSIComponent(params);
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
    client_id, variant, destURL, locale, title: '', hideIcon: true,
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
    client_id, variant, destURL, locale, title: '', hideIcon: true,
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
async function buildSUSITabs(el, locale, imsClientId, noRedirect) {
  const rows = [...el.children];
  const title = rows[0].textContent?.trim();
  const tabNames = [...rows[1].querySelectorAll('div')].map((div) => div.textContent);
  const variants = [...rows[2].querySelectorAll('div')].map((div) => div.textContent?.trim().toLowerCase());
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
    i > 0 && panel.classList.add('hide');
    const tab = createTag('button', {
      role: 'tab',
      'aria-selected': i === 0,
      'aria-controls': `panel-${id}`,
      id: `tab-${id}`,
    }, tabName);
    tab.addEventListener('click', () => {
      tabList.querySelector('[aria-selected=true]')?.setAttribute('aria-selected', false);
      tab.setAttribute('aria-selected', true);
      panels.forEach((p) => {
        p !== panel ? p.classList.add('hide') : p.classList.remove('hide');
      });
    });
    tabList.append(tab);
    return panel;
  });
  const titleDiv = createTag('div', { class: 'title' }, title);
  layout.append(createLogo(), titleDiv, tabList, ...panels);
  return layout;
}

export default async function init(el) {
  ({ createTag, loadScript, getConfig, loadIms } = await import(`${getLibs()}/utils/utils.js`));
  isStage = (usp.get('env') && usp.get('env') !== 'prod') || getConfig().env.name !== 'prod';
  const locale = getConfig().locale.ietf.toLowerCase();
  const { imsClientId } = getConfig();
  const noRedirect = el.classList.contains('no-redirect');

  const match = [
    { cls: 'b2b', build: buildB2B },
    { cls: 'tabs', build: buildSUSITabs },
    { cls: 'student', build: buildStudent },
  ].find(({ cls }) => el.classList.contains(cls));

  const susi = await (match?.build || buildEdu)(el, locale, imsClientId, noRedirect);
  el.replaceChildren(susi);

  // branchlinks can exist in footers
  const footer = el.querySelector('.footer');
  if (footer) {
    const links = footer.querySelectorAll('a[href*="adobesparkpost"]');
    const linksPopulated = new CustomEvent('linkspopulated', { detail: links });
    document.dispatchEvent(linksPopulated);
  }
}
