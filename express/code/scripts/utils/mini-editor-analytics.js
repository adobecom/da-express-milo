const EXPORT_EVENT_NAME_AUTH = 'export-project-complete';
const EXPORT_EVENT_NAME_UNAUTH = 'export-project-complete-unauth';

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

export default function trackMiniEditorExport({ exportMethod, uiLocation = 'seo-discover-page' } = {}) {
  if (!exportMethod) return;

  const eventName = isAuthenticatedUser() ? EXPORT_EVENT_NAME_AUTH : EXPORT_EVENT_NAME_UNAUTH;
  const pageUrl = window.location?.href || '';

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
          sdm: {
            event: {
              pagename: eventName,
              url: pageUrl,
            },
            custom: {
              export_method: exportMethod,
              ui: {
                location: uiLocation,
              },
            },
          },
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
