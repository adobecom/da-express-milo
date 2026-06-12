import { setLibs } from '../../scripts/utils.js';

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
          window.mph[key] = value.replace(/ /g, ' ');
        });
      }
    } catch (error) {
      window.lana?.log(`Failed to load placeholders: ${error?.message}`, { severity: 'error' });
    }
  }
}

const MB100 = 104857600;
const MB20 = 20971520;
const PDF_ONLY = ['.pdf'];
const DOC_ONLY = ['.pdf', '.doc', '.docx'];
const ALL_FILES = ['.pdf', '.doc', '.docx', '.xml', '.ppt', '.pptx', '.xls', '.xlsx', '.rtf', '.txt', '.text', '.ai', '.form', '.bmp', '.gif', '.indd', '.jpeg', '.jpg', '.png', '.psd', '.tif', '.tiff'];
const SINGLE_PDF = { maxFileSize: MB100, acceptedFiles: PDF_ONLY, maxNumFiles: 1 };
const MULTI_ALL = { maxFileSize: MB100, acceptedFiles: ALL_FILES, multipleFiles: true };
const group = (verbs, config) => verbs.reduce((acc, v) => {
  acc[v] = config;
  return acc;
}, {});

export const LIMITS = {
  fillsign: { ...SINGLE_PDF, mobileApp: true },
  'summarize-pdf': { maxFileSize: MB100, acceptedFiles: ALL_FILES, maxNumFiles: 1, genAI: true },
  'resume-builder': { maxFileSize: MB20, acceptedFiles: DOC_ONLY, maxNumFiles: 1, genAI: true },
  ...group(['word-to-pdf', 'jpg-to-pdf'], MULTI_ALL),
};

const miloLibs = setLibs('/libs');
let createTag;
let getConfig;

const EOLBrowserPage = 'https://acrobat.adobe.com/home/index-browser-eol.html';

const lanaOptions = {
  sampleRate: 1,
  tags: 'express,Project Unity (Express), verb-dropzone',
  severity: 'error',
};

const ICONS = {
  ACROBAT_ICON: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="31" viewBox="0 0 32 31" fill="none"><path d="M25.8211 0H5.67886C2.54251 0 0 2.45484 0 5.48304V24.9308C0 27.959 2.54251 30.4138 5.67886 30.4138H25.8211C28.9575 30.4138 31.5 27.959 31.5 24.9308V5.48304C31.5 2.45484 28.9575 0 25.8211 0Z" fill="#B30B00"/><path d="M25.7023 17.5726C24.1856 16.0519 20.044 16.6714 19.0523 16.784C17.594 15.4323 16.6023 13.799 16.2523 13.2358C16.7773 11.7151 17.1273 10.1944 17.1856 8.56106C17.1856 7.15301 16.6023 5.63232 14.969 5.63232C14.3856 5.63232 13.8606 5.97026 13.569 6.42083C12.869 7.60359 13.1606 9.96911 14.269 12.3909C13.6273 14.1369 13.044 15.8266 11.4106 18.8116C9.71898 19.4875 6.16064 21.0645 5.86898 22.7542C5.75231 23.2611 5.92731 23.768 6.33564 24.1622C6.74398 24.5001 7.26898 24.6691 7.79398 24.6691C9.95231 24.6691 12.0523 21.7967 13.5106 19.3749C14.7356 18.9806 16.6606 18.4174 18.5856 18.0795C20.8606 19.9944 22.844 20.276 23.894 20.276C25.294 20.276 25.819 19.7128 25.994 19.2059C26.2856 18.6427 26.1106 18.0231 25.7023 17.5726ZM24.244 18.53C24.1856 18.9243 23.6606 19.3185 22.7273 19.0932C21.619 18.8116 20.6273 18.3047 19.7523 17.6289C20.5106 17.5162 22.2023 17.3473 23.4273 17.5726C23.894 17.6852 24.3606 17.9668 24.244 18.53ZM14.5023 6.92773C14.619 6.75876 14.794 6.64612 14.969 6.64612C15.494 6.64612 15.6106 7.26566 15.6106 7.77255C15.5523 8.95531 15.319 10.1381 14.9106 11.2645C14.0356 9.01164 14.2106 7.43462 14.5023 6.92773ZM14.3856 17.8542C14.8523 16.953 15.494 15.376 15.7273 14.7001C16.2523 15.545 17.1273 16.5588 17.594 17.0093C17.594 17.0657 15.7856 17.4036 14.3856 17.8542ZM10.944 20.107C9.60231 22.2473 8.20231 23.599 7.44398 23.599C7.32731 23.599 7.21064 23.5427 7.09398 23.4864C6.91898 23.3737 6.86064 23.2047 6.91898 22.9795C7.09398 22.1909 8.61064 21.1208 10.944 20.107Z" fill="white"/></svg>',
  UPLOAD_ICON: '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_541_34768" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="26" height="26"><path fill="currentColor" d="M17.5856 13.6386L13.6824 9.74109C13.3015 9.36023 12.6852 9.36023 12.3043 9.74109L8.40747 13.6386C8.02661 14.0194 8.02661 14.6364 8.40747 15.0173C8.5979 15.2077 8.84737 15.3029 9.09682 15.3029C9.34628 15.3029 9.59575 15.2077 9.78617 15.0173L12.025 12.7784V23.4127C12.025 23.951 12.4617 24.3877 13 24.3877C13.5383 24.3877 13.975 23.951 13.975 23.4127V12.788L16.2081 15.0173C16.589 15.3981 17.206 15.3981 17.5868 15.0173C17.967 14.6364 17.967 14.0182 17.5856 13.6386Z"/><path fill="currentColor" d="M20.475 22.1H16.8365C16.2982 22.1 15.8615 21.6633 15.8615 21.125C15.8615 20.5867 16.2982 20.15 16.8365 20.15H20.475C21.0126 20.15 21.45 19.712 21.45 19.175V5.52498C21.45 4.98796 21.0126 4.54998 20.475 4.54998H5.52498C4.98733 4.54998 4.54998 4.98796 4.54998 5.52498V19.175C4.54998 19.712 4.98733 20.15 5.52498 20.15H9.06824C9.60652 20.15 10.0432 20.5867 10.0432 21.125C10.0432 21.6633 9.60652 22.1 9.06824 22.1H5.52498C3.91204 22.1 2.59998 20.7873 2.59998 19.175V5.52498C2.59998 3.91268 3.91204 2.59998 5.52498 2.59998H20.475C22.0879 2.59998 23.4 3.91268 23.4 5.52498V19.175C23.4 20.7873 22.0879 22.1 20.475 22.1Z"/></mask><g mask="url(#mask0_541_34768)"><rect width="26" height="26" fill="currentColor"/></g></svg>',
  INFO_ICON: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path id="Path_127061" data-name="Path 127061" d="M9,8A1,1,0,0,0,8,9v4a1,1,0,0,0,2,0V9A1,1,0,0,0,9,8Z" fill="currentColor"/><circle id="Ellipse_24720" data-name="Ellipse 24720" cx="1.5" cy="1.5" r="1.5" transform="translate(7.5 4)" fill="currentColor"/><path id="Path_127062" data-name="Path 127062" d="M9,0a9,9,0,1,0,9,9A9,9,0,0,0,9,0ZM9,16a7,7,0,1,1,7-7A7,7,0,0,1,9,16Z" fill="currentColor"/></svg>',
  CLOSE_ICON: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_15746_2423)"><g clip-path="url(#clip1_15746_2423)"><path fill-rule="evenodd" clip-rule="evenodd" d="M17.2381 15.9994L19.6944 13.5434C19.8586 13.3793 19.9509 13.1566 19.9509 12.9245C19.951 12.6923 19.8588 12.4696 19.6946 12.3054C19.5305 12.1412 19.3078 12.0489 19.0757 12.0488C18.8435 12.0488 18.6208 12.141 18.4566 12.3051L16.0002 14.7615L13.5435 12.3051C13.3793 12.141 13.1566 12.0489 12.9245 12.049C12.6923 12.0491 12.4697 12.1414 12.3057 12.3056C12.1416 12.4698 12.0495 12.6925 12.0496 12.9246C12.0497 13.1568 12.142 13.3794 12.3062 13.5434L14.7622 15.9994L12.3062 18.4555C12.1427 18.6197 12.051 18.8421 12.0512 19.0738C12.0515 19.3055 12.1436 19.5277 12.3074 19.6916C12.4711 19.8556 12.6933 19.9478 12.925 19.9482C13.1567 19.9486 13.3791 19.8571 13.5435 19.6938L16.0002 17.2374L18.4566 19.6938C18.6208 19.8579 18.8435 19.9501 19.0756 19.9501C19.3078 19.95 19.5305 19.8577 19.6946 19.6935C19.8588 19.5293 19.9509 19.3066 19.9509 19.0745C19.9509 18.8423 19.8586 18.6196 19.6944 18.4555L17.2381 15.9994Z" fill="white"/></g></g><defs><clipPath id="clip0_15746_2423"><rect width="8" height="8" fill="white" transform="translate(12 12)"/></clipPath><clipPath id="clip1_15746_2423"><rect width="8" height="8" fill="white" transform="translate(12 12)"/></clipPath></defs></svg>',
  ICON_HAND: '<svg xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="0 0 65 65" fill="none"><path d="M53.3013 16.6594C52.1413 16.4619 51.009 16.5983 49.9624 16.9506V14.1204C49.9624 10.3118 46.8648 7.21412 43.0562 7.21412C41.7855 7.21412 40.7714 7.56801 39.957 8.1496C38.735 6.20165 36.5836 4.89404 34.1187 4.89404C30.9798 4.89404 28.3542 7.011 27.5171 9.88331C26.784 9.6175 26.0048 9.4485 25.1812 9.4485C21.3726 9.4485 18.2749 12.5461 18.2749 16.3547V28.3677C17.2244 27.0236 15.7537 26.1111 14.0633 25.8128C12.2383 25.4827 10.407 25.8985 8.90263 26.9553C7.38871 28.0122 6.38261 29.596 6.06206 31.4114C5.74152 33.23 6.14777 35.0613 7.20463 36.5752L16.1421 49.3023C22.128 57.0401 27.7203 60.1028 35.9405 60.1028C36.1182 60.1028 36.296 60.1028 36.4769 60.0996C46.9568 60.0076 54.4121 52.2825 56.4117 39.4729L58.9476 24.6289C59.5855 20.8743 57.0527 17.3006 53.3013 16.6594ZM51.6001 38.689C49.9719 49.1277 44.4431 55.1548 36.4165 55.2246C29.5103 55.3008 25.1653 53.0029 20.0681 46.4109L11.1973 33.7791C10.8863 33.3347 10.7657 32.7952 10.8609 32.2588C10.9561 31.7256 11.2512 31.2591 11.6956 30.948C12.6128 30.3069 13.8823 30.5259 14.5298 31.4527L18.7193 37.4004C19.4968 38.5017 21.0171 38.7747 22.1152 37.9907C22.7246 37.5623 23.0476 36.9037 23.1098 36.2158C23.1332 36.2007 23.1499 36.1484 23.1499 35.9976V16.3547C23.1499 15.2344 24.0608 14.3235 25.1812 14.3235C26.3015 14.3235 27.2124 15.2344 27.2124 16.3547V28.5676C27.2124 29.9133 28.3042 31.0051 29.6499 31.0051C30.9956 31.0051 32.0874 29.9133 32.0874 28.5676V11.8003C32.0874 10.6799 32.9983 9.76904 34.1187 9.76904C35.239 9.76904 36.1499 10.6799 36.1499 11.8003V28.1487C36.1499 29.4944 37.2417 30.5862 38.5874 30.5862C39.9331 30.5862 41.0249 29.4944 41.0249 28.1487V14.1203C41.0249 13 41.9358 12.0891 43.0562 12.0891C44.1765 12.0891 45.0874 13 45.0874 14.1203V23.1308C45.0874 23.2292 45.0846 23.7547 45.0846 23.7547L44.1638 29.1452C43.9385 30.4719 44.8303 31.7319 46.157 31.9572C47.4614 32.2016 48.7405 31.2939 48.969 29.9641L50.137 23.1245C50.3242 22.0231 51.3367 21.2773 52.4824 21.4646C53.5838 21.6518 54.3296 22.7055 54.1423 23.81L51.6001 38.689Z" fill="#131313"/></svg>',
  SUBCOPY_CHECK: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10.0176 18.7836C9.41406 18.7836 8.80567 18.7211 8.20117 18.5942C3.47949 17.601 0.44531 12.9525 1.43652 8.23086C1.91699 5.94375 3.25976 3.98086 5.21679 2.70352C7.17382 1.4252 9.51074 0.986721 11.7988 1.46719C12.4951 1.61367 13.1689 1.84219 13.8027 2.14785C14.1758 2.32851 14.332 2.77676 14.1523 3.1498C13.9717 3.52285 13.5254 3.68105 13.1504 3.49941C12.6269 3.24648 12.0684 3.05605 11.4912 2.93593C9.59668 2.53945 7.65918 2.90077 6.03711 3.95937C4.41504 5.01797 3.30273 6.64394 2.90527 8.53945C2.083 12.4516 4.59765 16.3031 8.50976 17.1254C10.4043 17.5248 12.3408 17.1596 13.9629 16.102C15.585 15.0434 16.6973 13.4164 17.0947 11.5209C17.21 10.975 17.2617 10.4164 17.25 9.86172C17.2412 9.44766 17.5703 9.10488 17.9844 9.0961C18.3613 9.05997 18.7412 9.41641 18.75 9.83048C18.7637 10.4994 18.7012 11.1713 18.5635 11.8295C18.083 14.1166 16.7402 16.0805 14.7832 17.3578C13.3428 18.2973 11.6973 18.7836 10.0176 18.7836Z" fill="currentColor"/><path d="M18.4189 3.46937C18.1172 3.18519 17.6416 3.19984 17.3594 3.50355L9.93018 11.4245L7.46094 8.71547C7.18067 8.40785 6.70703 8.38832 6.40137 8.66567C6.09473 8.94497 6.07325 9.41958 6.35157 9.72524L9.36719 13.0338C9.37427 13.0416 9.38428 13.0441 9.39185 13.0514C9.39893 13.0587 9.40162 13.0687 9.40918 13.0758C9.45142 13.1156 9.50244 13.137 9.55078 13.1651C9.58081 13.1826 9.60669 13.2074 9.63867 13.2206C9.72949 13.2579 9.82544 13.2789 9.92187 13.2789C10.0171 13.2789 10.1113 13.2584 10.2012 13.2224C10.2302 13.2108 10.2541 13.1884 10.282 13.1727C10.3313 13.1452 10.3833 13.1234 10.4268 13.0836C10.4351 13.0761 10.438 13.0656 10.4458 13.0578C10.4526 13.0509 10.4619 13.0488 10.4687 13.0416L18.4531 4.52894C18.7363 4.22718 18.7217 3.75257 18.4189 3.46937Z" fill="currentColor"/></svg>',
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
    || window.mph?.[`verb-widget-cta-${verbConfig?.uploadType}`]
    || 'Upload your resume';
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

function redDirLink(verb) {
  const hostname = window?.location?.hostname;
  const env = getEnv();
  const verbSlug = verb.split('-').join('');
  return hostname !== 'www.adobe.com'
    ? `https://www.adobe.com/go/acrobat-${verbSlug}-${env}`
    : `https://www.adobe.com/go/acrobat-${verbSlug}`;
}

function redDir(verb) {
  window.location.href = redDirLink(verb);
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
    const analyticsModule = await import('./verb-dropzone-analytics.js');
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
      'Analytics failed to initialize correctly: some methods remain no-ops on verb-dropzone block',
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

export default async function init(element) {
  ({ createTag, getConfig } = (await import(`${miloLibs}/utils/utils.js`)));

  element.classList.add('con-block');
  if (isOldBrowser()) {
    window.location.href = EOLBrowserPage;
    return;
  }
  window.mph = window.mph || {};
  await loadPlaceholders(['verb-dropzone', 'verb-widget']);
  const rawVerb = element.classList[1];
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
  const children = element.querySelectorAll(':scope > div');
  const foreground = children[children.length - 1];
  foreground.classList.add('foreground', 'container');
  const headline = foreground.querySelector('h1, h2, h3, h4, h5, h6');

  // Dropzone
  const dropzone = createTag('button', {
    class: 'verb-dropzone-area',
    type: 'button',
    id: 'drop-zone',
    'aria-labelledby': 'verb-dropzone-heading',
    'aria-describedby': 'file-upload-description',
  });
  const dzInner = createTag('div', { class: 'verb-dropzone-inner' });
  const iconWrapper = createTag('div', { class: 'widget-icon' });
  const uploadDocImg = createTag('img', {
    src: new URL('../../icons/upload-document.png', import.meta.url).href,
    alt: '',
    'aria-hidden': 'true',
  });
  iconWrapper.appendChild(uploadDocImg);
  const dzContent = createTag('div', { class: 'verb-dropzone-content' });
  let headingEl;
  if (headline) {
    headline.classList.add('verb-dropzone-heading');
    headingEl = headline;
  } else {
    headingEl = createTag('p', { class: 'verb-dropzone-heading' });
  }
  headingEl.id = 'verb-dropzone-heading';
  const subLine = createTag('p', { class: 'verb-dropzone-sub', id: 'file-upload-description' });
  const dragDesktop = createTag('span', { class: 'verb-dropzone-subcopy-desktop' }, window.mph?.['verb-dropzone-subcopy-desktop'] || 'Click to upload or drag & drop! PDF, DOCX, or DOC, up to 20 MB');
  const dragMobile = createTag('span', { class: 'verb-dropzone-subcopy-mobile' }, window.mph?.['verb-dropzone-subcopy-mobile'] || 'Tap to upload. PDF, DOCX, or DOC, up to 20 MB');
  subLine.append(dragDesktop, dragMobile);
  dzContent.append(headingEl, subLine);
  dzInner.append(iconWrapper, dzContent);

  const ctaButtonLabel = getCTA(VERB);
  const ctaButton = createTag('div', {
    class: 'verb-dropzone-cta',
    'aria-hidden': 'true',
  });
  const uploadIconSvg = createSvgElement('UPLOAD_ICON');
  if (uploadIconSvg) {
    uploadIconSvg.classList.add('upload-icon');
    uploadIconSvg.setAttribute('aria-hidden', 'true');
    ctaButton.appendChild(uploadIconSvg);
  }
  ctaButton.appendChild(createTag('span', { class: 'verb-dropzone-cta-label' }, ctaButtonLabel));
  dropzone.append(dzInner, ctaButton);

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
  const errorCloseBtn = createTag('div', { class: 'verb-dropzone-errorBtn', role: 'button', tabindex: '0', 'aria-label': 'Close error' });
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
  const legalPart1 = mph['verb-dropzone-legal'] || mph['verb-widget-legal'] || 'Your file will be securely handled by Adobe servers and deleted unless you sign in to save it.';
  const legalPart2 = limits?.genAI
    ? (mph['verb-dropzone-legal-2-ai'] || mph['verb-widget-legal-2-ai'] || 'By using this service, you agree to the Adobe Terms of Use, Generative AI User Guidelines, and acknowledge the Privacy Policy.')
    : (mph['verb-dropzone-legal-2'] || mph['verb-widget-legal-2'] || 'By using this service, you agree to the Adobe Terms of Use and acknowledge the Privacy Policy.');
  const legalText = createTag('div', { class: 'verb-dropzone-legal' });
  const legalPart1El = createTag('p', {}, legalPart1);
  const legalPart2El = createTag('p', {}, legalPart2);
  const createLegalLink = (label, url) => `<a class="verb-dropzone-legal-url" target="_blank" href="${url}">${label}</a>`;
  const legalLinks = [
    ['verb-widget-terms-of-use', touURL],
    ['verb-widget-privacy-policy', ppURL],
    ...(limits?.genAI ? [['verb-widget-genai-guidelines', genAIurl]] : []),
  ];
  legalPart2El.innerHTML = legalLinks.reduce(
    (html, [key, url]) => {
      const linkText = key === 'verb-widget-genai-guidelines' ? 'Generative AI User Guidelines' : window.mph?.[key];
      return linkText ? html.replace(linkText, createLegalLink(linkText, url)) : html;
    },
    legalPart2El.textContent,
  );
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
  legalPart2El.append(infoIcon);
  legalText.append(legalPart1El, legalPart2El);
  footer.append(legalText);

  foreground.innerHTML = '';
  foreground.append(dropzone, footer);
  if (fileInput) foreground.append(fileInput);
  element.append(errorState);

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

  function registerTabCloseEvent(eventData, workflowStep) {
    window.addEventListener('beforeunload', (windowEvent) => {
      handleExit(windowEvent, VERB, eventData, false, workflowStep);
    });
  }

  function handleUploadingEvent(data, attempts, cookieExp, canSendDataToSplunk) {
    isUploading = true;
    exitFlag = false;
    prefetchTarget();
    const metadata = mergeData({ ...data, userAttempts: attempts });
    handleAnalyticsEvent('job:uploading', metadata, false, canSendDataToSplunk);
    if (LIMITS[VERB]?.multipleFiles) {
      handleAnalyticsEvent('job:multi-file-uploading', metadata, false, canSendDataToSplunk);
    }
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
    if (LIMITS[VERB]?.multipleFiles) {
      handleAnalyticsEvent('job:multi-file-uploaded', metadata, false, canSendDataToSplunk);
    }
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
    const dragOverlay = buildDragOverlay(window.mph?.['verb-dropzone-drag-overlay'] || 'Drop your file anywhere');
    document.body.append(dragOverlay);
    const hideDragOverlay = () => dragOverlay.classList.remove('is-dragging');
    let dragLeaveTimer = null;

    dropzone.addEventListener('click', () => {
      fileInput.click();
    });
    document.addEventListener('dragenter', (e) => {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      clearTimeout(dragLeaveTimer);
      dragOverlay.classList.add('is-dragging');
    });
    document.addEventListener('dragleave', (e) => {
      if (e.relatedTarget) return;
      dragLeaveTimer = setTimeout(hideDragOverlay, 200);
    });
    document.addEventListener('dragend', hideDragOverlay);
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
  function soloUpload() {
    if (!useFileUpload || !fileInput || !ctaButton) return;
    const uploadLinks = document.querySelectorAll('a[href*="#upload"]');
    uploadLinks.forEach((link) => {
      const labelElement = createTag('label', {
        for: 'file-upload',
        class: 'verb-dropzone-cta verb-dropzone-cta-solo',
        tabindex: 0,
        'daa-ll': ctaButton.textContent,
        'aria-label': ctaButton.textContent,
      });
      labelElement.innerHTML = ctaButton.innerHTML;
      const wrapper = link.closest('div');
      if (!wrapper) return;
      wrapper.append(labelElement);
      link.remove();
      labelElement.addEventListener('click', (data) => {
        soloClicked = true;
        [
          'filepicker:shown',
          'cta:choose-file-clicked',
          'files-selected',
          'entry:clicked',
          'discover:clicked',
        ].forEach((analyticsEvent) => {
          window.analytics.verbAnalytics(analyticsEvent, VERB, { ...data, userAttempts });
        });
      });
    });
  }
  runWhenDocumentIsReady(soloUpload);
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

  async function checkSignedInUser() {
    if (!window.adobeIMS?.isSignedInUser?.()) return;
    let accountType;
    try {
      accountType = window.adobeIMS.getAccountType();
    } catch {
      accountType = (await window.adobeIMS.getProfile()).account_type;
    }
    if (accountType) redDir(VERB);
  }
  await checkSignedInUser();
  window.addEventListener('IMS:Ready', checkSignedInUser);
  window.prefetchTargetUrl = null;
  element.parentNode.style.display = 'block';
  window.addEventListener('pageshow', (event) => {
    const historyTraversal = event.persisted
      || (typeof window.performance !== 'undefined'
        && window.performance.getEntriesByType('navigation')[0].type === 'back_forward');
    if (historyTraversal) {
      window.location.reload();
    }
  });
}
