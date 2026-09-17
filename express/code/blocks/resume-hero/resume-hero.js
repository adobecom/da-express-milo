import { setLibs, getIconElementDeprecated, getMetadata } from '../../scripts/utils.js';
import trackBranchParameters from '../../scripts/branchlinks.js';

function isOldBrowser() {
  const { name, version } = window?.browser || {};
  return (
    name === 'Internet Explorer'
    || (name === 'Microsoft Edge' && (!version || version.split('.')[0] < 86))
    || (name === 'Safari' && version.split('.')[0] < 14)
  );
}

async function loadPlaceholders(prefix) {
  const miloLibs = setLibs('/libs');
  const { getConfig } = await import(`${miloLibs}/utils/utils.js`);
  const config = getConfig();

  let prefixes;
  if (prefix == null) prefixes = [];
  else if (Array.isArray(prefix)) prefixes = prefix;
  else prefixes = [prefix];
  const keyMatches = (key) => prefixes.length === 0 || prefixes.some((p) => key.startsWith(p));

  window.mph = window.mph || {};

  const mphKeyList = Object.keys(window.mph);
  const allCovered = (prefixes.length === 0 && mphKeyList.length > 0)
    || (prefixes.length > 0 && prefixes.every((p) => mphKeyList.some((k) => k.startsWith(p))));

  if (!allCovered) {
    const placeholdersPath = `${config.locale.contentRoot}/placeholders.json`;
    try {
      const response = await fetch(placeholdersPath);
      if (response.ok) {
        const placeholderData = await response.json();
        placeholderData.data.forEach(({ key, value }) => {
          if (prefixes.length && !keyMatches(key)) return;
          window.mph[key] = value.replace(/\u00A0/g, ' ');
        });
      }
    } catch (error) {
      window.lana?.log(`Failed to load placeholders: ${error?.message}`, { severity: 'error' });
    }
  }
}

const MB20 = 20971520;
const DOC_ONLY = ['.pdf', '.doc', '.docx'];
const LOGO_INJECT_VALUES = ['on', 'yes', 'true'];

// This block only ships the resume-builder verb; kept as a LIMITS map (rather
// than a flat constant) to match verb-dropzone's shape so the rest of this
// file's upload/analytics engine (copied from verb-dropzone.js) needs no
// further changes.
export const LIMITS = {
  'resume-builder': { maxFileSize: MB20, acceptedFiles: DOC_ONLY, maxNumFiles: 1, genAI: true },
};

const miloLibs = setLibs('/libs');
let createTag;
let getConfig;

const EOLBrowserPage = 'https://acrobat.adobe.com/home/index-browser-eol.html';

const lanaOptions = {
  sampleRate: 1,
  tags: 'express,Project Unity (Express), resume-hero',
  severity: 'error',
};

const ICONS = {
  INFO_ICON: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path id="Path_127061" data-name="Path 127061" d="M9,8A1,1,0,0,0,8,9v4a1,1,0,0,0,2,0V9A1,1,0,0,0,9,8Z" fill="currentColor"/><circle id="Ellipse_24720" data-name="Ellipse 24720" cx="1.5" cy="1.5" r="1.5" transform="translate(7.5 4)" fill="currentColor"/><path id="Path_127062" data-name="Path 127062" d="M9,0a9,9,0,1,0,9,9A9,9,0,0,0,9,0ZM9,16a7,7,0,1,1,7-7A7,7,0,0,1,9,16Z" fill="currentColor"/></svg>',
  CLOSE_ICON: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_15746_2423)"><g clip-path="url(#clip1_15746_2423)"><path fill-rule="evenodd" clip-rule="evenodd" d="M17.2381 15.9994L19.6944 13.5434C19.8586 13.3793 19.9509 13.1566 19.9509 12.9245C19.951 12.6923 19.8588 12.4696 19.6946 12.3054C19.5305 12.1412 19.3078 12.0489 19.0757 12.0488C18.8435 12.0488 18.6208 12.141 18.4566 12.3051L16.0002 14.7615L13.5435 12.3051C13.3793 12.141 13.1566 12.0489 12.9245 12.049C12.6923 12.0491 12.4697 12.1414 12.3057 12.3056C12.1416 12.4698 12.0495 12.6925 12.0496 12.9246C12.0497 13.1568 12.142 13.3794 12.3062 13.5434L14.7622 15.9994L12.3062 18.4555C12.1427 18.6197 12.051 18.8421 12.0512 19.0738C12.0515 19.3055 12.1436 19.5277 12.3074 19.6916C12.4711 19.8556 12.6933 19.9478 12.925 19.9482C13.1567 19.9486 13.3791 19.8571 13.5435 19.6938L16.0002 17.2374L18.4566 19.6938C18.6208 19.8579 18.8435 19.9501 19.0756 19.9501C19.3078 19.95 19.5305 19.8577 19.6946 19.6935C19.8588 19.5293 19.9509 19.3066 19.9509 19.0745C19.9509 18.8423 19.8586 18.6196 19.6944 18.4555L17.2381 15.9994Z" fill="white"/></g></g><defs><clipPath id="clip0_15746_2423"><rect width="8" height="8" fill="white" transform="translate(12 12)"/></clipPath><clipPath id="clip1_15746_2423"><rect width="8" height="8" fill="white" transform="translate(12 12)"/></clipPath></defs></svg>',
  ICON_HAND: '<svg xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="0 0 65 65" fill="none"><path d="M53.3013 16.6594C52.1413 16.4619 51.009 16.5983 49.9624 16.9506V14.1204C49.9624 10.3118 46.8648 7.21412 43.0562 7.21412C41.7855 7.21412 40.7714 7.56801 39.957 8.1496C38.735 6.20165 36.5836 4.89404 34.1187 4.89404C30.9798 4.89404 28.3542 7.011 27.5171 9.88331C26.784 9.6175 26.0048 9.4485 25.1812 9.4485C21.3726 9.4485 18.2749 12.5461 18.2749 16.3547V28.3677C17.2244 27.0236 15.7537 26.1111 14.0633 25.8128C12.2383 25.4827 10.407 25.8985 8.90263 26.9553C7.38871 28.0122 6.38261 29.596 6.06206 31.4114C5.74152 33.23 6.14777 35.0613 7.20463 36.5752L16.1421 49.3023C22.128 57.0401 27.7203 60.1028 35.9405 60.1028C36.1182 60.1028 36.296 60.1028 36.4769 60.0996C46.9568 60.0076 54.4121 52.2825 56.4117 39.4729L58.9476 24.6289C59.5855 20.8743 57.0527 17.3006 53.3013 16.6594ZM51.6001 38.689C49.9719 49.1277 44.4431 55.1548 36.4165 55.2246C29.5103 55.3008 25.1653 53.0029 20.0681 46.4109L11.1973 33.7791C10.8863 33.3347 10.7657 32.7952 10.8609 32.2588C10.9561 31.7256 11.2512 31.2591 11.6956 30.948C12.6128 30.3069 13.8823 30.5259 14.5298 31.4527L18.7193 37.4004C19.4968 38.5017 21.0171 38.7747 22.1152 37.9907C22.7246 37.5623 23.0476 36.9037 23.1098 36.2158C23.1332 36.2007 23.1499 36.1484 23.1499 35.9976V16.3547C23.1499 15.2344 24.0608 14.3235 25.1812 14.3235C26.3015 14.3235 27.2124 15.2344 27.2124 16.3547V28.5676C27.2124 29.9133 28.3042 31.0051 29.6499 31.0051C30.9956 31.0051 32.0874 29.9133 32.0874 28.5676V11.8003C32.0874 10.6799 32.9983 9.76904 34.1187 9.76904C35.239 9.76904 36.1499 10.6799 36.1499 11.8003V28.1487C36.1499 29.4944 37.2417 30.5862 38.5874 30.5862C39.9331 30.5862 41.0249 29.4944 41.0249 28.1487V14.1203C41.0249 13 41.9358 12.0891 43.0562 12.0891C44.1765 12.0891 45.0874 13 45.0874 14.1203V23.1308C45.0874 23.2292 45.0846 23.7547 45.0846 23.7547L44.1638 29.1452C43.9385 30.4719 44.8303 31.7319 46.157 31.9572C47.4614 32.2016 48.7405 31.2939 48.969 29.9641L50.137 23.1245C50.3242 22.0231 51.3367 21.2773 52.4824 21.4646C53.5838 21.6518 54.3296 22.7055 54.1423 23.81L51.6001 38.689Z" fill="#131313"/></svg>',
};

function createSvgElement(iconName) {
  const svgString = ICONS[iconName];
  if (!svgString) {
    window.lana?.log(
      `Error Code: Unknown, Status: 'Unknown', Message: Icon not found: ${iconName}`,
      lanaOptions,
    );
    return null;
  }
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  return svgDoc.documentElement;
}

const getCTA = (verb) => {
  const verbConfig = LIMITS[verb];
  return window.mph?.[`verb-dropzone-${verb}-upload-cta`]
    || window.mph?.[`verb-widget-cta-${verbConfig?.uploadType}`];
};

function isMobileDevice() {
  const ua = navigator.userAgent.toLowerCase();
  return /android|iphone|ipod|blackberry|windows phone/i.test(ua);
}

function isTabletDevice() {
  const ua = navigator.userAgent.toLowerCase();
  const isIPadOS = navigator.userAgent.includes('Mac')
    && 'ontouchend' in document
    && !/iphone|ipod/i.test(ua);
  const isTabletUA = /ipad|android(?!.*mobile)/i.test(ua);
  return isIPadOS || isTabletUA;
}

function getEnv() {
  const { hostname } = window.location;
  if (['localhost', '.hlx.', '.aem.', 'stage.adobe.com'].some((p) => hostname.includes(p))) return 'stage';
  return 'prod';
}

function getSplunkEndpoint() {
  return (getEnv() === 'prod') ? 'https://unity.adobe.io/api/v1/log' : 'https://unity-stage.adobe.io/api/v1/log';
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, expires) {
  document.cookie = `${name}=${value};domain=.adobe.com;path=/;expires=${expires}`;
}

function uploadedTime() {
  const uploadingUTS = parseInt(getCookie('UTS_Uploading'), 10);
  const uploadedUTS = parseInt(getCookie('UTS_Uploaded'), 10);
  if (Number.isNaN(uploadingUTS) || Number.isNaN(uploadedUTS)) return 'N/A';
  return ((uploadedUTS - uploadingUTS) / 1000).toFixed(1);
}

function incrementVerbKey(verbKey) {
  let count = parseInt(localStorage.getItem(verbKey), 10) || 0;
  count += 1;
  localStorage.setItem(verbKey, count);
  return count;
}

function getVerbKey(verbKey) {
  const count = parseInt(localStorage.getItem(verbKey), 10) || 0;
  const trialMapping = {
    0: '1st',
    1: '2nd',
  };
  return trialMapping[count] || '2+';
}

const setUser = () => {
  localStorage.setItem('unity.user', 'true');
};

const redirectReady = new CustomEvent('DCUnity:RedirectReady');

let exitFlag = true;
let tabClosureSent = false;
let isUploading = false;

function prefetchTarget() {
  const iframe = document.createElement('iframe');
  iframe.src = window.prefetchTargetUrl;
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
}

function prefetchNextPage(url) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.crossOrigin = 'anonymous';
  link.as = 'document';
  document.head.appendChild(link);
}

function initiatePrefetch(url) {
  if (!window.prefetchTargetUrl) {
    prefetchNextPage(url);
    window.prefetchTargetUrl = url;
  }
}

function handleExit(event, verb, userObj, unloadFlag, workflowStep) {
  if (exitFlag || tabClosureSent || (isUploading && workflowStep === 'preuploading')) { return; }
  tabClosureSent = true;
  const uploadingStartTime = parseInt(getCookie('UTS_Uploading'), 10);
  const tabClosureTime = Date.now();
  const duration = uploadingStartTime ? ((tabClosureTime - uploadingStartTime) / 1000).toFixed(1) : 'N/A';
  window.analytics.verbAnalytics('job:browser-tab-closure', verb, userObj, unloadFlag);
  window.analytics.sendAnalyticsToSplunk('job:browser-tab-closure', verb, { ...userObj, workflowStep, uploadTime: duration }, getSplunkEndpoint(), true);
  if (!isUploading) return;
  event.preventDefault();
  event.returnValue = true;
}

window.analytics = window.analytics || {
  verbAnalytics: () => {},
  sendAnalyticsToSplunk: () => {},
};

async function loadAnalyticsAfterLCP(analyticsData) {
  const { verb, userAttempts } = analyticsData;
  try {
    const analyticsModule = await import('./resume-hero-analytics.js');
    const { default: verbAnalytics, sendAnalyticsToSplunk } = analyticsModule;
    window.analytics.verbAnalytics = verbAnalytics;
    window.analytics.sendAnalyticsToSplunk = sendAnalyticsToSplunk;
    window.analytics.verbAnalytics('landing:shown', verb, { userAttempts });
  } catch (error) {
    window.lana?.log(
      `Error Code: Unknown, Status: 'Unknown', Message: Analytics import failed: ${error.message} on ${verb}`,
      lanaOptions,
    );
  }
  return window.analytics;
}

window.addEventListener('analyticsLoad', async ({ detail }) => {
  const delay = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
  const {
    verbAnalytics: stubVerb,
    sendAnalyticsToSplunk: stubSend,
  } = window.analytics;
  if (window.PerformanceObserver) {
    await Promise.race([
      new Promise((res) => {
        try {
          const obs = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) res();
          });
          obs.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (error) {
          res();
        }
      }),
      delay(3000),
    ]);
  } else {
    await delay(3000);
  }
  await loadAnalyticsAfterLCP(detail);

  const {
    verbAnalytics,
    sendAnalyticsToSplunk,
  } = window.analytics;
  if (
    verbAnalytics === stubVerb
    || sendAnalyticsToSplunk === stubSend
  ) {
    window.lana?.log(
      'Analytics failed to initialize correctly: some methods remain no-ops on resume-hero block',
      lanaOptions,
    );
  }
});

function buildDragOverlay(overlayText) {
  const overlay = createTag('div', { class: 'verb-dropzone-drag-overlay', 'aria-hidden': 'true' });
  const icon = createTag('div', { class: 'verb-dropzone-drag-icon' });
  const iconSvg = createSvgElement('ICON_HAND');
  if (iconSvg) icon.appendChild(iconSvg);
  overlay.append(icon, createTag('p', { class: 'verb-dropzone-drag-text' }, overlayText));
  return overlay;
}

function getBrandingLogo() {
  const metadataValues = [
    getMetadata('inject-branding-logo'),
    getMetadata('marquee-inject-logo'),
  ];
  const shouldInject = metadataValues.some((value) => (
    LOGO_INJECT_VALUES.includes(value?.toLowerCase()?.trim())
  ));
  if (!shouldInject) return null;

  const logo = getIconElementDeprecated('adobe-brand-logo');
  logo.classList.add('express-logo');
  return logo;
}

/**
 * Adds layout hooks to the authored rows without replacing their content.
 * The legacy fixture placed the create card in the header's second cell;
 * current authoring places it in the action row's second cell. Both shapes
 * are retained, and any additional rows or cells are left untouched.
 * @param {HTMLElement} element The resume hero block.
 * @returns {object} Authored nodes used by the upload UI.
 */
function decorateAuthoredLayout(element) {
  const rows = [...element.querySelectorAll(':scope > div')];
  let [headerRow, actionsRow] = rows;

  if (!headerRow) {
    headerRow = createTag('div');
    element.append(headerRow);
  }
  if (!actionsRow) {
    actionsRow = createTag('div');
    element.append(actionsRow);
  }

  let headerCell = headerRow.querySelector(':scope > div:first-child');
  if (!headerCell) {
    headerCell = createTag('div');
    headerRow.append(headerCell);
  }

  const headerSecondCell = headerRow.querySelector(':scope > div:nth-child(2)');
  let uploadCell = actionsRow.querySelector(':scope > div:first-child');
  if (!uploadCell) {
    uploadCell = createTag('div');
    actionsRow.prepend(uploadCell);
  }

  let createCell = actionsRow.querySelector(':scope > div:nth-child(2)');
  if (!createCell && headerSecondCell) {
    createCell = headerSecondCell;
    actionsRow.append(createCell);
  }

  headerRow.classList.add('resume-hero-header');
  headerCell.classList.add('resume-hero-header-content');
  actionsRow.classList.add('resume-hero-actions');
  uploadCell.classList.add('resume-hero-upload');
  createCell?.classList.add('resume-hero-create');

  const headline = headerCell.querySelector('h1, h2, h3, h4, h5, h6');
  headline?.classList.add('heading');
  const subcopy = [...headerCell.querySelectorAll('p')].find((p) => !p.querySelector('a'));
  subcopy?.classList.add('subcopy');

  const brandingLogo = getBrandingLogo();
  if (brandingLogo && headline && !headerCell.querySelector('.express-logo')) {
    headerCell.insertBefore(brandingLogo, headline);
  }

  return {
    uploadCell,
    createCell,
    picture: uploadCell.querySelector('picture'),
  };
}

export default async function decorate(element) {
  ({ createTag, getConfig } = (await import(`${miloLibs}/utils/utils.js`)));

  if (element.dataset.resumeHeroDecorated === 'true') return;

  if (isOldBrowser()) {
    window.location.href = EOLBrowserPage;
    return;
  }
  // Unlike verb-dropzone (typically below the fold), this block is a hero —
  // flip the section visible before any of the awaited work below so it
  // doesn't sit hidden any longer than necessary.
  element.parentElement?.style.setProperty('display', 'block');
  window.mph = window.mph || {};
  await loadPlaceholders(['verb-dropzone', 'verb-widget', 'close-dialog']);
  const rawVerb = [...element.classList].find((className) => LIMITS[className])
    || 'resume-builder';
  const VERB = rawVerb === 'ai-summary-generator' ? 'summarize-pdf' : rawVerb;
  const limits = LIMITS[VERB];
  const isMobile = isMobileDevice();
  const isTablet = isTabletDevice();
  const mobileOrTabletTouch = isMobile || isTablet;

  let useFileUpload = true;
  if (mobileOrTabletTouch) {
    if (limits?.level === 0) useFileUpload = false;
    else if (limits?.mobileApp) useFileUpload = false;
  }

  // Initialize analytics - track attempts for analytics data (no UI changes based on attempts)
  const userAttempts = getVerbKey(`${VERB}_attempts`);
  let noOfFiles = null;

  function mergeData(eventData = {}) {
    return { ...eventData, noOfFiles };
  }
  function runWhenDocumentIsReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }
  runWhenDocumentIsReady(() => {
    window.dispatchEvent(new CustomEvent('analyticsLoad', { detail: { verb: VERB, userAttempts } }));
  });

  // Decorate authored CTAs before moving the legacy create cell. The elements
  // themselves are retained so authored URLs, text, pictures, and attributes
  // remain intact.
  const { decorateButtons } = await import(`${miloLibs}/utils/decorate.js`);
  decorateButtons(element, 'button-xl');
  const authoredLinks = [...element.querySelectorAll('a')];
  const { uploadCell, createCell, picture } = decorateAuthoredLayout(element);

  // Dropzone
  const dropzone = createTag('button', {
    class: 'verb-dropzone-area resume-hero-dropzone-area',
    type: 'button',
    id: 'unity-upload',
    'aria-labelledby': 'verb-dropzone-heading',
    'aria-describedby': 'file-upload-description',
  });
  const dzInner = createTag('div', { class: 'verb-dropzone-inner' });
  const iconWrapper = createTag('div', { class: 'widget-icon' });
  if (picture) {
    picture.classList.add('resume-hero-dropzone-image');
    iconWrapper.append(picture);
  } else {
    const uploadDocImg = createTag('img', {
      src: new URL('../../icons/upload-document.png', import.meta.url).href,
      alt: '',
      'aria-hidden': 'true',
    });
    iconWrapper.append(uploadDocImg);
  }
  const dzContent = createTag('div', { class: 'verb-dropzone-content' });
  // Unlike verb-dropzone, the authored heading is this marquee's own H1
  // (kept visible above, not swallowed into the dropzone) — the dropzone's
  // own heading/subcopy always come from placeholders, matching the Figma
  // "mini dropzone" component (no separate desktop/mobile drag copy, no
  // extra CTA pill).
  const headingEl = createTag('p', { class: 'verb-dropzone-heading', id: 'verb-dropzone-heading' }, getCTA(VERB));
  const subLine = createTag('p', { class: 'verb-dropzone-sub', id: 'file-upload-description' }, window.mph?.[`verb-widget-${VERB}-file-limit`]);
  dzContent.append(headingEl, subLine);
  dzInner.append(iconWrapper, dzContent);
  dropzone.append(dzInner);

  let soloClicked = false;
  let fileInput = null;
  if (useFileUpload) {
    fileInput = createTag('input', {
      type: 'file',
      accept: limits?.acceptedFiles,
      id: 'file-upload',
      class: 'hide',
      'aria-hidden': 'true',
      'aria-describedby': 'file-upload-description',
      ...(limits?.multipleFiles && { multiple: '' }),
    });
  }
  const errorState = createTag('div', {
    class: 'error hide',
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': 'true',
  });
  const errorStateText = createTag('p', {
    class: 'verb-dropzone-error-text',
    id: 'error-message',
  });
  const errorIcon = createTag('div', {
    class: 'verb-dropzone-errorIcon',
    'aria-hidden': 'true',
  });
  const errorCloseBtn = createTag('div', { class: 'verb-dropzone-errorBtn', role: 'button', tabindex: '0', 'aria-label': window.mph?.['close-dialog'] });
  const srAlert = { announceTimer: null, cleanupTimer: null };
  const clearSrAlert = () => {
    clearTimeout(srAlert.announceTimer);
    clearTimeout(srAlert.cleanupTimer);
    document.querySelector('.verb-dropzone-sr-alert')?.remove();
  };
  const announceToScreenReader = (msg) => {
    clearSrAlert();
    srAlert.announceTimer = setTimeout(() => {
      const alertEl = createTag('div', {
        class: 'verb-dropzone-sr-alert',
        role: 'alert',
        style: 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0',
      });
      alertEl.textContent = msg;
      document.body.appendChild(alertEl);
      srAlert.cleanupTimer = setTimeout(() => alertEl.remove(), 10000);
    }, 5000);
  };
  const closeIconSvg = createSvgElement('CLOSE_ICON');
  if (closeIconSvg) {
    closeIconSvg.classList.add('close-icon', 'error');
    closeIconSvg.setAttribute('aria-hidden', 'true');
    errorCloseBtn.prepend(closeIconSvg);
  }
  errorState.append(errorIcon, errorStateText, errorCloseBtn);

  // Footer with legal
  const footer = createTag('div', { class: 'verb-dropzone-footer' });
  const { locale } = getConfig();
  const ppURL = window.mph?.['verb-widget-privacy-policy-url'] || `https://www.adobe.com${locale.prefix}/privacy/policy.html`;
  const touURL = window.mph?.['verb-widget-terms-of-use-url'] || `https://www.adobe.com${locale.prefix}/legal/terms.html`;
  const genAIurl = window.mph?.['verb-widget-genai-terms-url'] || `https://www.adobe.com${locale.prefix}/legal/licenses-terms/adobe-gen-ai-user-guidelines.html`;
  const mph = window.mph || {};
  const legalPart1 = mph['verb-dropzone-legal'] || mph['verb-widget-legal'];
  const legalPart2 = limits?.genAI
    ? (mph['verb-dropzone-legal-2-ai'] || mph['verb-widget-legal-2-ai'])
    : (mph['verb-dropzone-legal-2'] || mph['verb-widget-legal-2']);
  const legalText = createTag('div', { class: 'verb-dropzone-legal' });
  const legalPart1El = createTag('p', {}, legalPart1);
  const legalPart2El = createTag('p', {}, legalPart2);
  const legalLinks = [
    ['verb-widget-terms-of-use', touURL],
    ['verb-widget-privacy-policy', ppURL],
    ...(limits?.genAI ? [['verb-widget-genai-guidelines', genAIurl]] : []),
  ];
  // Build the linked paragraph from text/anchor nodes (no innerHTML).
  let remaining = legalPart2El.textContent;
  legalPart2El.textContent = '';
  legalLinks.forEach(([key, url]) => {
    const linkText = window.mph?.[key];
    const idx = linkText ? remaining.indexOf(linkText) : -1;
    if (idx === -1) return;
    legalPart2El.append(document.createTextNode(remaining.slice(0, idx)));
    const a = createTag('a', { class: 'verb-dropzone-legal-url', target: '_blank', href: url }, linkText);
    legalPart2El.append(a);
    remaining = remaining.slice(idx + linkText.length);
  });
  legalPart2El.append(document.createTextNode(remaining));
  const tooltipContent = window.mph?.['verb-widget-tool-tip'] || '';
  const infoIcon = createTag('button', {
    class: 'info-icon milo-tooltip top',
    type: 'button',
    ...(tooltipContent && { 'aria-label': tooltipContent }),
    'aria-describedby': 'info-tooltip-text',
    ...(tooltipContent && { 'data-tooltip': tooltipContent }),
  });
  const infoIconSvg = createSvgElement('INFO_ICON');
  if (infoIconSvg) {
    infoIconSvg.setAttribute('aria-hidden', 'true');
    infoIcon.appendChild(infoIconSvg);
  }
  infoIcon.appendChild(createTag('span', { id: 'info-tooltip-text', class: 'hide' }, tooltipContent));
  legalPart1El.append(infoIcon);
  legalText.append(legalPart1El, legalPart2El);
  footer.append(legalText);

  uploadCell.append(dropzone, footer);
  if (fileInput) uploadCell.append(fileInput);
  element.append(errorState);
  element.dataset.resumeHeroDecorated = 'true';

  if (authoredLinks.length) await trackBranchParameters(authoredLinks);
  createCell?.classList.add('media');

  function handleAnalyticsEvent(
    eventName,
    metadata = {},
    documentUnloading = true,
    canSendDataToSplunk = true,
  ) {
    window.analytics.verbAnalytics(eventName, VERB, metadata, documentUnloading);
    if (!canSendDataToSplunk) return;
    window.analytics.sendAnalyticsToSplunk(eventName, VERB, metadata, getSplunkEndpoint());
  }

  let tabCloseHandler = null;
  function registerTabCloseEvent(eventData, workflowStep) {
    if (tabCloseHandler) window.removeEventListener('beforeunload', tabCloseHandler);
    tabCloseHandler = (windowEvent) => (
      handleExit(windowEvent, VERB, eventData, false, workflowStep)
    );
    window.addEventListener('beforeunload', tabCloseHandler);
  }

  function handleUploadingEvent(data, attempts, cookieExp, canSendDataToSplunk) {
    isUploading = true;
    exitFlag = false;
    prefetchTarget();
    const metadata = mergeData({ ...data, userAttempts: attempts });
    handleAnalyticsEvent('job:uploading', metadata, false, canSendDataToSplunk);
    setCookie('UTS_Uploading', Date.now(), cookieExp);
    registerTabCloseEvent(metadata, 'uploading');
  }

  function handleUploadedEvent(data, attempts, cookieExp, canSendDataToSplunk) {
    exitFlag = true;
    setTimeout(() => {
      window.dispatchEvent(redirectReady);
      window.lana?.log(
        'Adobe Analytics done callback failed to trigger, 3 second timeout dispatched event.',
        { ...lanaOptions, severity: 'warning' },
      );
    }, 3000);
    setCookie('UTS_Uploaded', Date.now(), cookieExp);
    const calcUploadedTime = uploadedTime();
    const metadata = { ...data, uploadTime: calcUploadedTime, userAttempts: attempts };
    handleAnalyticsEvent('job:uploaded', metadata, false, canSendDataToSplunk);
    setUser();
    incrementVerbKey(`${VERB}_attempts`);
  }

  const setDraggingClass = (shouldToggle) => {
    dropzone.classList.toggle('dragging', !!shouldToggle);
  };
  let outsideClickHandler = null;
  const closeError = () => {
    errorState.classList.remove('verb-dropzone-error');
    errorState.classList.add('hide');
    errorStateText.textContent = '';
    clearSrAlert();
    if (outsideClickHandler) {
      document.removeEventListener('click', outsideClickHandler);
      outsideClickHandler = null;
    }
  };
  const handleError = (detail, logToLana = false, logOptions = {}) => {
    const { code, message, status, info = 'No additional info provided', accountType = 'Unknown account type' } = detail;
    if (message) {
      setDraggingClass(false);
      errorState.classList.add('verb-dropzone-error');
      errorState.classList.remove('hide');
      errorStateText.textContent = message;
      announceToScreenReader(message);
      errorCloseBtn.focus();
      setTimeout(() => {
        if (outsideClickHandler) return;
        outsideClickHandler = (e) => {
          if (!errorState.contains(e.target)) closeError();
        };
        document.addEventListener('click', outsideClickHandler);
      }, 0);
    }
    if (logToLana) {
      window.lana?.log(
        `Error Code: ${code}, Status: ${status}, Message: ${message}, Info: ${info}, Account Type: ${accountType}`,
        logOptions,
      );
    }
  };
  if (useFileUpload && fileInput) {
    const dragOverlay = buildDragOverlay(window.mph?.['verb-dropzone-drag-overlay'] || '');
    document.body.append(dragOverlay);
    const hideDragOverlay = () => dragOverlay.classList.remove('is-dragging');
    let dragLeaveTimer = null;
    let isBlockVisible = false;
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isBlockVisible = entry.isIntersecting;
    }, { threshold: 0 });
    visibilityObserver.observe(element);

    dropzone.addEventListener('click', () => {
      fileInput.click();
    });
    document.addEventListener('dragenter', (e) => {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      if (!isBlockVisible) return;
      clearTimeout(dragLeaveTimer);
      dragOverlay.classList.add('is-dragging');
    });
    document.addEventListener('dragleave', (e) => {
      if (e.relatedTarget) return;
      dragLeaveTimer = setTimeout(hideDragOverlay, 200);
    });
    document.addEventListener('dragend', hideDragOverlay);
    document.addEventListener('drop', () => setTimeout(hideDragOverlay, 200), true);
    window.addEventListener('blur', hideDragOverlay);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') hideDragOverlay();
    });
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingClass(true);
      element.classList.add('dragging-block');
    });
    element.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!element.contains(e.relatedTarget)) {
        setDraggingClass(false);
        element.classList.remove('dragging-block');
      }
    });
    element.addEventListener('drop', (e) => {
      e.preventDefault();
      setTimeout(hideDragOverlay, 200);
      setDraggingClass(false);
      element.classList.remove('dragging-block');
      const { dataTransfer: { files } } = e;
      if (files.length > 0) {
        noOfFiles = files.length;
      }
    });
    fileInput.addEventListener('click', () => {
      if (soloClicked) {
        soloClicked = false;
        return;
      }
      [
        'filepicker:shown',
        'dropzone:choose-file-clicked',
        'files-selected',
        'entry:clicked',
        'discover:clicked',
      ].forEach((analyticsEvent) => {
        window.analytics.verbAnalytics(analyticsEvent, VERB, { userAttempts });
      });
    });
    fileInput.addEventListener('change', (data) => {
      const { target: { files } } = data;
      if (files.length > 0) {
        noOfFiles = files.length;
      }
    });
    fileInput.addEventListener('cancel', () => {
      window.analytics.verbAnalytics('choose-file:close', VERB, { userAttempts });
    });
  }
  errorCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeError();
  });
  errorCloseBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeError();
    }
  });
  element.addEventListener('unity:track-analytics', (e) => {
    const cookieExp = new Date(Date.now() + 30 * 60 * 1000).toUTCString();
    const { event, data } = e.detail || {};
    const canSendDataToSplunk = e.detail?.sendToSplunk ?? true;
    if (!event) return;
    const metadata = mergeData({ ...data, userAttempts });
    const analyticsMap = {
      change: () => {
        exitFlag = false;
        handleAnalyticsEvent('choose-file:open', metadata, true, canSendDataToSplunk);
        registerTabCloseEvent(metadata, 'preuploading');
      },
      drop: () => {
        exitFlag = false;
        ['files-dropped', 'entry:clicked', 'discover:clicked'].forEach((analyticsEvent) => {
          handleAnalyticsEvent(analyticsEvent, metadata, true, canSendDataToSplunk);
        });
        setDraggingClass(false);
        registerTabCloseEvent(metadata, 'preuploading');
      },
      cancel: () => {
        if (exitFlag) return;
        handleAnalyticsEvent('job:cancel', metadata, true, canSendDataToSplunk);
        exitFlag = true;
      },
      uploading: () => handleUploadingEvent(data, userAttempts, cookieExp, canSendDataToSplunk),
      uploaded: () => handleUploadedEvent(data, userAttempts, cookieExp, canSendDataToSplunk),
      chunk_uploaded: () => {
        if (canSendDataToSplunk) window.analytics.sendAnalyticsToSplunk('job:chunk-uploaded', VERB, metadata, getSplunkEndpoint());
      },
      redirectUrl: () => {
        if (data) initiatePrefetch(data.redirectUrl);
        handleAnalyticsEvent('job:redirect-success', metadata, false, canSendDataToSplunk);
      },
    };
    if (analyticsMap[event]) {
      analyticsMap[event]();
    }
  });
  element.addEventListener('unity:show-error-toast', (e) => {
    const {
      code: errorCode,
      info: errorInfo,
      metaData: metadata,
      errorData,
      sendToSplunk: canSendDataToSplunk = true,
    } = e.detail || {};
    if (!errorCode) return;
    handleError(e.detail, true, lanaOptions);
    if (errorCode.includes('cookie_not_set')) return;
    const errorAnalyticsMap = {
      error_only_accept_one_file: 'error_only_accept_one_file',
      error_unsupported_type: 'error:UnsupportedFile',
      error_empty_file: 'error:EmptyFile',
      error_file_too_large: 'error:TooLargeFile',
      error_max_page_count: 'error:max_page_count',
      error_min_page_count: 'error:min_page_count',
      error_max_num_files: 'error:max_num_files',
      error_generic: 'error',
      error_max_quota_exceeded: 'error:max_quota_exceeded',
      error_no_storage_provision: 'error:no_storage_provision',
      error_duplicate_asset: 'error:duplicate_asset',
      warn_chunk_upload: 'warn:verb_upload_warn_chunk_upload',
      error_file_same_type: 'error:file_same_type',
      error_fetch_redirect_url: 'error:fetch_redirect_url',
      error_finalize_asset: 'error:finalize_asset',
      error_verify_page_count: 'error:verify_page_count',
      error_chunk_upload: 'error:chunk_upload',
      error_create_asset: 'error:create_asset',
      error_fetching_access_token: 'error:fetching_access_token',
    };
    const key = Object.keys(errorAnalyticsMap).find((k) => errorCode?.includes(k));
    if (key) {
      const event = errorAnalyticsMap[key];
      window.analytics.verbAnalytics(event, VERB, event === 'error' ? { errorInfo } : {});
    }
    if (canSendDataToSplunk) {
      window.analytics.sendAnalyticsToSplunk(
        key,
        VERB,
        { ...metadata, errorData },
        getSplunkEndpoint(),
      );
    }
    exitFlag = true;
  });
  window.addEventListener('beforeunload', (event) => {
    if (exitFlag || tabClosureSent || !isUploading) return;
    tabClosureSent = true;
    const uploadingUTS = parseInt(getCookie('UTS_Uploading'), 10);
    const tabClosureTime = Date.now();
    const duration = uploadingUTS ? ((tabClosureTime - uploadingUTS) / 1000).toFixed(1) : 'N/A';
    window.analytics.verbAnalytics('job:browser-tab-closure', VERB, { userAttempts }, exitFlag);
    window.analytics.sendAnalyticsToSplunk('job:browser-tab-closure', VERB, { userAttempts, uploadTime: duration }, getSplunkEndpoint(), true);
    if (!isUploading) return;
    event.preventDefault();
    event.returnValue = true;
  });
  window.addEventListener('beforeunload', () => {
    const cookieExp = new Date(Date.now() + 90 * 1000).toUTCString();
    if (exitFlag) {
      document.cookie = `UTS_Redirect=${Date.now()};domain=.adobe.com;path=/;expires=${cookieExp}`;
    }
  });

  window.prefetchTargetUrl = null;
  window.addEventListener('pageshow', (event) => {
    const historyTraversal = event.persisted
      || (typeof window.performance !== 'undefined'
        && window.performance.getEntriesByType('navigation')[0].type === 'back_forward');
    if (historyTraversal) {
      window.location.reload();
    }
  });
}
