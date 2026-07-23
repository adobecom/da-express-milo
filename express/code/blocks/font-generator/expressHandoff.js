/* eslint-disable no-underscore-dangle */
import { getMobileOperatingSystem } from '../../scripts/utils.js';
import { showAppModal, isAppModalDismissed } from './expressAppModal.js';

// Pre-configured Branch links. Their Branch-dashboard config owns the
// platform routing (deep-link into the app on mobile, else the web editor) and
// the express.adobe.com/new destination with the static canvas/category params
// baked in — which is what makes the handoff conserve the text on mobile, where
// the raw editor URL did not. We only append the dynamic, per-card params.
const BRANCH_LINK_PROD = 'https://adobesparkpost.app.link/V3Tavfhr04b';
// Stage uses Branch's test domain (test-app.link) + a separate link id.
const BRANCH_LINK_STAGE = 'https://adobesparkpost.test-app.link/5Nq0ZDWc04b';

// Gated on the same ?hzenv=stage override the rest of the block uses to target
// stage (see how the editor host was resolved previously).
function resolveBranchLink() {
  const stage = new URLSearchParams(window.location.search).get('hzenv') === 'stage';
  return stage ? BRANCH_LINK_STAGE : BRANCH_LINK_PROD;
}

const FEATURE_FLAGS = ['font-generator-product-entry'];
const FONT_FAMILY_BY_ID = { 'noto-sans': 'Noto Sans', 'gothic-a1': 'Gothic A1' };
const DEFAULT_FONT_FAMILY = 'Noto Sans';

// The dynamic per-card params appended to the Branch link. Everything else
// (canvas size/unit, aspectRatioLock, category, tab, hideLoeWelcomeModal and the
// editor host) is baked into the Branch link's dashboard config.
function applyFontHandoffParams(url, { styleId, text, fontSupported, fontSize }) {
  url.searchParams.set('glyphString', text);
  url.searchParams.set('styleId', styleId);
  url.searchParams.set('fontFamily', FONT_FAMILY_BY_ID[fontSupported] ?? DEFAULT_FONT_FAMILY);
  if (fontSize) url.searchParams.set('fontSize', String(fontSize));
  url.searchParams.set('feature-enable', FEATURE_FLAGS.join(','));
  return url;
}

// The env-gated Branch handoff URL for a card — where the CTA points and where a
// click navigates. Branch deep-links into the app on mobile / opens the web
// editor otherwise, preserving these params either way.
export function buildEditorHandoffUrl(params) {
  return applyFontHandoffParams(new URL(resolveBranchLink()), params).toString();
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
  const appUrl = buildEditorHandoffUrl(params);
  // Already dismissed this session: skip the modal but still route to the app.
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

  // iOS keeps the "continue in the app" prompt; its CTA is the same Branch link.
  if (getMobileOperatingSystem() === 'iOS') {
    await openInApp({ ...params, strings });
    return;
  }

  // Open in a new tab synchronously within the click gesture so popup blockers
  // allow it; 'noopener' semantics via nulling opener (keeping the handle so we
  // can tell success from a blocked popup for analytics).
  const newTab = window.open(buildEditorHandoffUrl(params), '_blank');
  if (newTab) {
    newTab.opener = null;
    emitAnalytics('font_generator_apply_to_editor_success');
  } else {
    emitAnalytics('font_generator_apply_to_editor_failure');
  }
}
