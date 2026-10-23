import { getLibs, decorateButtonsDeprecated } from './utils.js';
import BlockMediator from './block-mediator.min.js';

let createTag; let getMetadata;
let getConfig; let loadStyle;
const EXPRESS_ORIGIN = 'https://express.adobe.com';
const PREWARM_SESSION_KEY = 'express.prewarm.ready';
const DESKTOP_PLATFORMS = ['Windows', 'macOS', 'Linux', 'Chrome OS'];
let prewarmScheduled = false;

export function getDestination() {
  const pepDestinationMeta = getMetadata('pep-destination');
  return pepDestinationMeta || BlockMediator.get('primaryCtaUrl')
      || document.querySelector('a.button.xlarge.same-fcta, a.primaryCTA, a.con-button.button-xxl.same-fcta, a.con-button.xxl-button.same-fcta')?.href;
}

function preloadSUSILight() {
  const config = getConfig();
  if (!getMetadata('preload-susi-light')) return;
  const preloadTag = createTag('meta', {
    name: 'susi-sentry-preload',
    content: 'edu-express',
    'data-locale': config.locale.ietf.toLowerCase(),
  });
  if (config.env.name !== 'prod') {
    preloadTag.setAttribute('data-stage', 'true');
  }
  import('../blocks/susi-light/susi-light.js')
    .then((mod) => mod.SUSIUtils.loadSUSIScripts())
    .then(() => {
      document.head.append(preloadTag);
    });
  loadStyle('/express/code/blocks/susi-light/susi-light.css');
  import(`${getLibs()}/blocks/fragment/fragment.js`);
}

// userAgentData exists only in Chromium; allowlist desktop platforms so tablets never qualify.
function isDesktopChromium() {
  const uaData = navigator.userAgentData;
  return !!uaData?.brands?.some(({ brand }) => brand === 'Chromium')
    && !uaData.mobile && DESKTOP_PLATFORMS.includes(uaData.platform);
}

// Loads Express's hidden preload page after this page has loaded so the Express Service Worker
// installs before the user opens the editor. Runs at most once per tab session.
function prewarmExpress() {
  if (prewarmScheduled || !getMetadata('prewarm-express')) return;
  if (!isDesktopChromium() || navigator.connection?.saveData) return;
  try {
    if (sessionStorage.getItem(PREWARM_SESSION_KEY)) return;
  } catch {
    // Storage blocked: pre-warm anyway.
  }
  prewarmScheduled = true;

  const start = () => {
    const iframe = createTag('iframe', {
      src: `${EXPRESS_ORIGIN}/static/preload.html`,
      style: 'display:none',
      'aria-hidden': 'true',
      tabindex: '-1',
      title: 'Adobe Express preload',
    });
    const listener = new AbortController();
    let timeout;

    const cleanup = () => {
      window.clearTimeout(timeout);
      listener.abort();
      iframe.remove();
    };

    window.addEventListener('message', (event) => {
      if (event.source !== iframe.contentWindow || event.origin !== EXPRESS_ORIGIN) return;
      const { type, status } = event.data || {};
      if (type !== 'express-prewarm-done') return;
      if (!['ready', 'error', 'unsupported'].includes(status)) return;
      if (status === 'ready') {
        try {
          sessionStorage.setItem(PREWARM_SESSION_KEY, 'true');
        } catch {
          // Storage blocked: the next page will pre-warm again.
        }
      }
      cleanup();
    }, { signal: listener.signal });

    timeout = window.setTimeout(cleanup, 60000);
    document.body.append(iframe);
  };

  if (document.readyState === 'complete') {
    start();
  } else {
    window.addEventListener('load', start, { once: true });
  }
}

function turnContentLinksIntoButtons() {
  document.querySelectorAll('.section > .content').forEach((content) => {
    const links = content.querySelectorAll('a');
    links.forEach((link) => {
      const linkText = link.textContent.trim();
      link.title = link.title || linkText;
      const $up = link.parentElement;
      const $twoup = link.parentElement.parentElement;
      if (!link.querySelector('img')) {
        if ($up.childNodes.length === 1 && ($up.tagName === 'P' || $up.tagName === 'DIV')) {
          decorateButtonsDeprecated($up);
        }
        if ($up.childNodes.length === 1 && $up.tagName === 'STRONG'
            && $twoup.children.length === 1 && $twoup.tagName === 'P') {
          decorateButtonsDeprecated($twoup);
        }
        if ($up.childNodes.length === 1 && $up.tagName === 'EM'
            && $twoup.children.length === 1 && $twoup.tagName === 'P') {
          decorateButtonsDeprecated($twoup);
        }
      }
    });
  });
}

async function addJapaneseSectionHeaderSizing() {
  if (getConfig().locale.region === 'jp') {
    const { addHeaderSizing } = await import('./utils/location-utils.js');
    document.body.querySelectorAll('body:not(.blog) .section .content').forEach((el) => {
      addHeaderSizing(el, getConfig);
    });
  }
}

/**
 * Executes everything that happens a lot later, without impacting the user experience.
 */
export default async function loadDelayed() {
  try {
    await Promise.all([import(`${getLibs()}/utils/utils.js`)]).then(([utils]) => {
      ({ createTag, getMetadata, getConfig, loadStyle } = utils);
    });
    addJapaneseSectionHeaderSizing();
    turnContentLinksIntoButtons();
    preloadSUSILight();
    prewarmExpress();
    return null;
  } catch (error) {
    window.lana?.log(`Express-Delayed Error: ${error?.message || error?.detail || error}`, { tags: 'express-delayed', severity: 'error' });
    return null;
  }
}
