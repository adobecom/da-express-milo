import { getLibs, decorateButtonsDeprecated } from './utils.js';
import BlockMediator from './block-mediator.min.js';

let createTag; let getMetadata;
let getConfig; let loadStyle;
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
    return null;
  } catch (err) {
    window.lana?.log(`Express-Delayed Error: ${err}`);
    return null;
  }
}
