export const PROD_BASE_URL = 'https://adobesparkpost.app.link/new';
export const FG_ASSET_REF_PARAM = 'fg_asset_ref';
export const FG_ASSET_DL_PARAM = 'fg_asset_dl';

function getStageBaseUrl(base) {
  if (!base) return 'https://stage.projectx.corp.adobe.com/new';
  try {
    const { hostname } = new URL(base);
    const isAllowed = hostname === 'stage.projectx.corp.adobe.com'
      || hostname.endsWith('.prenv.projectx.corp.adobe.com');
    return isAllowed ? base : 'https://stage.projectx.corp.adobe.com/new';
  } catch {
    return 'https://stage.projectx.corp.adobe.com/new';
  }
}

export async function buildFontExpressUrl({ styleId, glyphString }, prodBaseUrl = PROD_BASE_URL) {
  const { getTrackingAppendedURL } = await import('../../scripts/branchlinks.js');
  const params = new URLSearchParams(window.location.search);
  const baseUrl = params.get('hzenv') === 'stage' ? getStageBaseUrl(params.get('base')) : prodBaseUrl;

  const url = new URL(await getTrackingAppendedURL(baseUrl, {
    placement: 'font-generator',
    isSearchOverride: true,
  }));

  // Carry the glyph text via ACP: signed-in users get an IMS-gated download link,
  // guests get a presigned URL. Inline the text directly if the upload fails.
  try {
    const { uploadFontTextToAcp } = await import('./fontTextUpload.js');
    const { type, value } = await uploadFontTextToAcp(glyphString);
    url.searchParams.set(type === 'user' ? FG_ASSET_DL_PARAM : FG_ASSET_REF_PARAM, value);
  } catch (err) {
    window.lana?.log(`[font-generator] ACP text upload failed, inlining glyphString: ${err.message}`, {
      tags: 'font-generator,acp-upload',
      severity: 'error',
    });
    url.searchParams.set('glyphString', glyphString);
  }

  url.searchParams.set('styleId', styleId);
  url.searchParams.set('referrer', 'express-font-generator');
  url.searchParams.set('entryPoint', 'font-generator');
  url.searchParams.set('feature-enable', 'font-generator-product-entry');
  url.searchParams.set('category', 'yourStuff');

  return url.toString();
}

function emitAnalytics(eventName) {
  const send = () => {
    window._satellite?.track('event', {
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
          digitalData: {
            primaryEvent: {
              eventInfo: { eventName },
            },
          },
        },
      },
    });
  };

  if (window._satellite?.track) {
    send();
  } else {
    window.addEventListener('alloy_sendEvent', send, { once: true });
  }
}

export async function handleOpenInExpress({ styleId, glyphString }, prodBaseUrl = PROD_BASE_URL) {
  emitAnalytics('font_generator_apply_to_editor_start');
  try {
    const url = await buildFontExpressUrl({ styleId, glyphString }, prodBaseUrl);
    const newTab = window.open(url, '_blank', 'noopener noreferrer');
    emitAnalytics(newTab
      ? 'font_generator_apply_to_editor_success'
      : 'font_generator_apply_to_editor_failure');
  } catch (err) {
    window.lana?.log(`Font generator Express handoff failed: ${err.message}`, {
      tags: 'font-generator,express-handoff',
      severity: 'error',
    });
    emitAnalytics('font_generator_apply_to_editor_failure');
  }
}
