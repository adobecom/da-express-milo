import { generateGuid, getAccessCountry, getDeviceInfo } from './device-info.js';
import { getMetadata } from '../utils.js';

const EXPORT_EVENT_NAME_AUTH = 'export-project-complete';
const EXPORT_EVENT_NAME_UNAUTH = 'export-project-complete-unauth';
const SOURCE_NAME = 'CCEX';
const SOURCE_CLIENT_ID = 'projectx_webapp';
const UI_LOCATION = 'seo-discover-page';

function getPageNameFromPathname() {
  const pathSegments = window.location.pathname.replace(/^\//, '').split('/').filter(Boolean);
  return `adobe.com:${pathSegments.join(':')}`;
}

function isMobileWeb() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '');
}

function getLanguage() {
  return document.documentElement?.lang || 'en';
}

function getMiniEditorTaskName() {
  return getMetadata('messagetype')?.trim() || 'quote';
}

function addIfDefined(target, key, value) {
  if (value !== undefined && value !== null && value !== '') {
    target[key] = value;
  }
}

function isAuthenticatedUser() {
  try {
    return !!window.adobeIMS?.isSignedInUser?.();
  } catch {
    return false;
  }
}

function safelyTrackEvent(callback) {
  // eslint-disable-next-line no-underscore-dangle
  const satellite = window._satellite;
  if (satellite?.track) {
    callback();
    return;
  }
  window.addEventListener('alloy_sendEvent', callback, { once: true });
}

function toAttachedFormat(properties, prefix = '') {
  return Object.entries(properties).flatMap(([propertyName, propertyValue]) => {
    if (propertyValue && typeof propertyValue === 'object' && !Array.isArray(propertyValue)) {
      return toAttachedFormat(propertyValue, `${prefix}${propertyName}.`);
    }

    return [{
      propertyName: `${prefix}${propertyName}`,
      propertyValue,
      propertyType: typeof propertyValue,
    }];
  });
}

function toAttachedFormatForMiniEditor(properties) {
  return toAttachedFormat(properties).map((entry) => {
    if (entry.propertyName === 'event.event_date') {
      return {
        ...entry,
        propertyName: 'event_date',
      };
    }

    return entry;
  });
}

export default async function trackMiniEditorExport({ exportMethod } = {}) {
  let userAccountType = 'unknown';

  if (!exportMethod) return;

  const isAuthenticated = isAuthenticatedUser();
  const eventName = isAuthenticated ? EXPORT_EVENT_NAME_AUTH : EXPORT_EVENT_NAME_UNAUTH;
  const isMobile = isMobileWeb();
  const pageUrl = window.location?.href || '';
  const dtsStart = new Date().toISOString();
  const eventDate = dtsStart.slice(0, 10);
  const language = getLanguage();
  // eslint-disable-next-line no-underscore-dangle
  const corpnewData = window.alloy_all?.data?._adobe_corpnew?.digitalData;
  const pageName = corpnewData?.page?.pageInfo?.pageName
    || getPageNameFromPathname();
  const workflow = 'export';
  const type = 'success';
  const subtype = 'export-project';
  const category = 'WEB';
  const subcategory = 'document';
  const mcidGuid = window.ecid || corpnewData?.event?.identifiers?.ECID || corpnewData?.ECID;
  const guid = generateGuid();
  const accessCountry = await getAccessCountry();
  const deviceInfo = await getDeviceInfo();
  let userGuid = '';
  if (isAuthenticated && window.adobeIMS?.getProfile) {
    try {
      const profile = await window.adobeIMS.getProfile();
      userGuid = profile?.userId || '';
    } catch {
      userGuid = '';
    }
  }
  try {
    userAccountType = window.adobeIMS?.getAccountType?.();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Error:', e);
  }

  const sdmPayload = {
    event: {
      pagename: eventName,
      platform_name: isMobile ? 'mobile-web' : 'desktop-web',
      aa: {
        page_name: pageName,
      },
      url: pageUrl,
      event_date: eventDate,
      dts_start: dtsStart,
      user_agent: navigator.userAgent,
      guid,
      user_guid: userGuid,
      category,
      subcategory,
      subtype,
      type,
      workflow,
      is_authenticated: isAuthenticated,
      mcid_guid: mcidGuid,
    },
    user: {
      aa: {
        post_page_url: pageUrl,
      },
    },
    source: {
      name: SOURCE_NAME,
      client_id: SOURCE_CLIENT_ID,
    },
    hz: {
      source_platform_type: isMobile ? 'mobile-web' : 'desktop-web',
      device_name: deviceInfo.deviceName,
      user: {
        access_country: accessCountry,
        os_name: deviceInfo.osName,
        os_version: deviceInfo.osVersion,
      },
    },
    custom: {
      export_method: exportMethod,
      ui: {
        location: UI_LOCATION,
      },
      displayedLanguage: language,
      task: {
        name: getMiniEditorTaskName(),
      },
    },
  };

  addIfDefined(sdmPayload.hz.user, 'account_type', userAccountType);

  const fireEvent = () => {
    // eslint-disable-next-line no-underscore-dangle
    window._satellite.track('event', {
      xdm: {},
      data: {
        eventType: 'web.webinteraction.linkClicks',
        web: {
          webInteraction: {
            name: eventName,
            linkClicks: { value: 1 },
            type: 'other',
          },
        },
        _adobe_corpnew: {
          sdm: sdmPayload,
          custom: toAttachedFormatForMiniEditor(sdmPayload),
        },
      },
    });
  };

  try {
    safelyTrackEvent(fireEvent);
  } catch (error) {
    window.lana?.log(`Mini-editor analytics event failed: ${error?.message || error}`, {
      tags: 'mini-editor,analytics',
      severity: 'warning',
    });
  }
}
