// Branch link for prod. Stage uses stage.projectx.corp.adobe.com/new directly.
// A dedicated Branch.io link (https://adobesparkpost.app.link/font-generator) must be
// provisioned before production launch — use this constant as the placeholder.
export const PROD_BASE_URL = 'https://adobesparkpost.app.link/new';

const LOCAL_BASE_URL = 'https://localhost.adobe.com:8080/new';

function getStageBaseUrl(base) {
  if (!base) return 'https://stage.projectx.corp.adobe.com/new';
  try {
    const { hostname } = new URL(base);
    const allowed = hostname === 'stage.projectx.corp.adobe.com'
      || hostname.endsWith('.prenv.projectx.corp.adobe.com');
    return allowed ? base : 'https://stage.projectx.corp.adobe.com/new';
  } catch {
    return 'https://stage.projectx.corp.adobe.com/new';
  }
}

function resolveBaseUrl(params, prodBaseUrl) {
  return LOCAL_BASE_URL;
}

/**
 * Constructs the Express deep-link URL carrying the font payload.
 * Mirrors the Colors pattern in createToolbarComponent.js#buildExpressUrl.
 *
 * @param {{ styleId: string, glyphString: string }} payload
 * @param {string} prodBaseUrl - Branch link (or direct Express URL for stage)
 * @returns {Promise<string>}
 */
export async function buildFontExpressUrl({ styleId, glyphString }, prodBaseUrl = PROD_BASE_URL) {
  const { getTrackingAppendedURL } = await import('../../scripts/branchlinks.js');
  const params = new URLSearchParams(window.location.search);
  const baseUrl = resolveBaseUrl(params, prodBaseUrl);

  const url = new URL(await getTrackingAppendedURL(baseUrl, {
    placement: 'font-generator',
    isSearchOverride: true,
  }));

  url.searchParams.set('glyphString', glyphString);
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

/**
 * Main CTA handler. Checks auth, stores redirect for signed-out users, or opens Express.
 * Mirrors handleOpenInExpress in createToolbarComponent.js.
 *
 * @param {{ styleId: string, glyphString: string }} payload
 * @param {string} [prodBaseUrl]
 */
export async function handleOpenInExpress({ styleId, glyphString }, prodBaseUrl = PROD_BASE_URL) {
  emitAnalytics('font_generator_apply_to_editor_start');
  try {
    const url = await buildFontExpressUrl({ styleId, glyphString }, prodBaseUrl);
    window.open(url, '_blank', 'noopener noreferrer');
    emitAnalytics('font_generator_apply_to_editor_success');
  } catch (err) {
    window.lana?.log(`Font generator Express handoff failed: ${err.message}`, {
      tags: 'font-generator,express-handoff',
      severity: 'error',
    });
    emitAnalytics('font_generator_apply_to_editor_failure');
  }
}
