/* eslint-disable no-underscore-dangle */
import { getMobileOperatingSystem } from '../../scripts/utils.js';
import { showAppModal, isAppModalDismissed } from './expressAppModal.js';

const APP_BRANCH_URL = 'https://adobesparkpost.app.link/new';
const PROD_EDITOR_URL = 'https://new.express.adobe.com/new';
const STAGE_EDITOR_URL = 'https://stage.projectx.corp.adobe.com/new';
function resolveEditorUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('hzenv') !== 'stage') return PROD_EDITOR_URL;
  const base = params.get('base');
  if (!base) return STAGE_EDITOR_URL;
  try {
    const { hostname } = new URL(base);
    const isAllowed = hostname === 'stage.projectx.corp.adobe.com'
      || hostname.endsWith('.prenv.projectx.corp.adobe.com');
    return isAllowed ? base : STAGE_EDITOR_URL;
  } catch {
    return STAGE_EDITOR_URL;
  }
}

// Square (1:1) canvas — the /new route reads these to size the new document.
const CANVAS_WIDTH = '1080';
const CANVAS_HEIGHT = '1080';
const CANVAS_UNIT = 'px';

const FEATURE_FLAGS = ['font-generator-product-entry'];
const FONT_FAMILY_BY_ID = { 'noto-sans': 'Noto Sans', 'gothic-a1': 'Gothic A1' };
const DEFAULT_FONT_FAMILY = 'Noto Sans';

function applyFontHandoffParams(url, { styleId, text, fontSupported, fontSize }) {
  url.searchParams.set('glyphString', text);
  url.searchParams.set('styleId', styleId);
  url.searchParams.set('width', CANVAS_WIDTH);
  url.searchParams.set('height', CANVAS_HEIGHT);
  url.searchParams.set('unit', CANVAS_UNIT);
  url.searchParams.set('aspectRatioLock', 'true');
  url.searchParams.set('fontFamily', FONT_FAMILY_BY_ID[fontSupported] ?? DEFAULT_FONT_FAMILY);
  if (fontSize) url.searchParams.set('fontSize', String(fontSize));
  url.searchParams.set('referrer', '<refferer>');
  url.searchParams.set('entryPoint', 'font-generator');
  url.searchParams.set('feature-enable', FEATURE_FLAGS.join(','));
  url.searchParams.set('category', 'yourStuff');
  url.searchParams.set('hideLoeWelcomeModal', 'true');
  return url;
}

// Web: the editor /new URL with tracking + handoff params.
async function buildWebUrl(params) {
  const { getTrackingAppendedURL } = await import('../../scripts/branchlinks.js');
  const url = new URL(await getTrackingAppendedURL(resolveEditorUrl(), {
    placement: 'font-generator',
    isSearchOverride: true,
  }));
  return applyFontHandoffParams(url, params).toString();
}

// iOS: a Branch link opening the app (installed or deferred) at the editor, else the App Store.
async function buildAppBranchUrl(params) {
  const { getTrackingAppendedURL } = await import('../../scripts/branchlinks.js');
  const url = new URL(await getTrackingAppendedURL(APP_BRANCH_URL, {
    placement: 'font-generator',
    isSearchOverride: true,
  }));
  const destUrl = applyFontHandoffParams(new URL(resolveEditorUrl()), params).toString();
  const dest = encodeURIComponent(destUrl);
  // Branch reserved keys route the app to the editor; $desktop_url is the no-app fallback.
  // Keys are appended literally (searchParams would encode '$'); value single-encoded for Branch.
  const sep = url.search ? '&' : '?';
  return `${url.toString()}${sep}$deeplink_path=${dest}&$ios_deeplink_path=${dest}&$desktop_url=${dest}`;
}

function emitAnalytics(eventName) {
  const send = () => {
    window._satellite?.track('event', {
      xdm: {},
      data: {
        eventType: 'web.webinteraction.linkClicks',
        web: { webInteraction: { name: eventName, linkClicks: { value: 1 }, type: 'other' } },
        _adobe_corpnew: { digitalData: { primaryEvent: { eventInfo: { eventName } } } },
      },
    });
  };
  if (window._satellite?.track) send();
  else window.addEventListener('alloy_sendEvent', send, { once: true });
}

async function openInApp({ strings = {}, ...params }) {
  const appUrl = await buildAppBranchUrl(params);
  // Already dismissed this session: skip the modal but still route to the app / App Store.
  if (isAppModalDismissed()) {
    window.location.assign(appUrl);
    return;
  }
  await showAppModal({
    title: strings.appModalTitle,
    body: strings.appModalBody,
    ctaLabel: strings.appModalCta,
    appUrl,
  });
}

export default async function handleOpenInExpress({
  styleId, text, fontSupported, fontSize, strings,
}) {
  const params = { styleId, text, fontSupported, fontSize };
  emitAnalytics('font_generator_apply_to_editor_start');

  if (getMobileOperatingSystem() === 'iOS') {
    await openInApp({ ...params, strings });
    return;
  }

  // Open the tab synchronously in the click gesture so popup blockers allow it; set its URL once
  // the async tracking URL resolves. 'noopener' nulls the handle, so we null the opener instead.
  const newTab = window.open('', '_blank');
  if (!newTab) {
    emitAnalytics('font_generator_apply_to_editor_failure');
    return;
  }
  newTab.opener = null;
  try {
    newTab.location = await buildWebUrl(params);
    emitAnalytics('font_generator_apply_to_editor_success');
  } catch (err) {
    newTab.close();
    window.lana?.log(`Font generator Express handoff failed: ${err.message}`, {
      tags: 'font-generator,express-handoff',
      severity: 'error',
    });
    emitAnalytics('font_generator_apply_to_editor_failure');
  }
}
