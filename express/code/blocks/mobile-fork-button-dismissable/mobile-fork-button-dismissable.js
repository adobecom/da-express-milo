import { getLibs, getMobileOperatingSystem, getIconElementDeprecated, addTempWrapperDeprecated } from '../../scripts/utils.js';
import { createFloatingButton } from '../../scripts/widgets/floating-cta.js';
import { createMultiFunctionButton, androidCheck, collectFloatingButtonData, createMetadataMap } from '../../scripts/utils/mobile-fork-button-utils.js';

let createTag; let getMetadata;

async function mWebStickyCTA() {
  const newBlock = createTag(
    'div',
    { class: 'floating-button-wrapper' },
    '<div class="floating-button meta-powered"><div>mobile</div></div>',
  );
  const oldBlock = document.querySelector('.mobile-fork-button');
  oldBlock.replaceWith(newBlock);

  const audience = 'mobile';
  const metadataMap = createMetadataMap();
  const extraMainCtaProps = {
    forkStickyMobileHref: metadataMap['cta-1-link'],
    forkStickyMobileText: metadataMap['cta-1-text'],
  };
  const data = collectFloatingButtonData(
    createTag,
    getIconElementDeprecated,
    false,
    extraMainCtaProps,
  );

  data.mainCta.text = data.mainCta.forkStickyMobileText || data.mainCta.text;
  data.mainCta.href = data.mainCta.forkStickyMobileHref || data.mainCta.href;
  await createFloatingButton(oldBlock, audience, data);
  newBlock.remove();
}

function mWebOverlayScroll() {
  const mobileForkButton = document.querySelector('.mobile-fork-button.mweb-mobile-fork');
  if (mobileForkButton
    && window.getComputedStyle(mobileForkButton, null).display !== 'none') {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function mWebBuildElements() {
  const mobileForkButton = document.querySelector('.mobile-fork-button');
  mobileForkButton.classList.add('mweb-mobile-fork');
  const svg = `
    <svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.45455 5.99986L12.1404 1.31442C12.4041 1.05075 12.4041 0.623598 12.1404 0.359925C11.8767 0.0962522 11.4496 0.0962522 11.1859 0.359925L6.5 5.04537L1.81412 0.359925C1.55044 0.0962522 1.12329 0.0962522 0.85962 0.359925C0.595947 0.623598 0.595947 1.05075 0.85962 1.31442L5.54545 5.99986L0.85962 10.6853C0.595947 10.949 0.595947 11.3761 0.85962 11.6398C0.991452 11.7716 1.16416 11.8376 1.33686 11.8376C1.50956 11.8376 1.68227 11.7716 1.81411 11.6398L6.49999 6.95436L11.1859 11.6398C11.3177 11.7716 11.4904 11.8376 11.6631 11.8376C11.8358 11.8376 12.0085 11.7716 12.1404 11.6398C12.404 11.3761 12.404 10.949 12.1404 10.6853L7.45455 5.99986Z" fill="#292929"/>
    </svg>`;
  const closeElement = createTag('a', { class: 'mweb-close' }, svg);
  mobileForkButton.querySelector('div:first-child').prepend(closeElement);
}

function mWebCloseEvents() {
  const closeElements = document.querySelectorAll('.mweb-mobile-fork a[href="#"], .mweb-mobile-fork a.mweb-close');
  closeElements.forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      mWebStickyCTA();
      mWebOverlayScroll();
    });
  });
}

function mWebVariant() {
  if (getMobileOperatingSystem() !== 'Android') return;
  mWebBuildElements();
  mWebCloseEvents();
  mWebOverlayScroll();
}

export default async function decorate(block) {
  ({ createTag, getMetadata } = await import(`${getLibs()}/utils/utils.js`));
  if (!androidCheck(getMetadata, getMobileOperatingSystem)) {
    const { default: decorateNormal } = await import('../floating-button/floating-button.js');
    decorateNormal(block);
    return;
  }
  addTempWrapperDeprecated(block, 'multifunction-button');
  if (!block.classList.contains('meta-powered')) return;

  const audience = block.querySelector(':scope > div').textContent.trim();
  if (audience === 'mobile') {
    block.closest('.section').remove();
  }
  const metadataMap = createMetadataMap();
  const extraMainCtaProps = {
    forkStickyMobileHref: metadataMap['cta-1-link'],
    forkStickyMobileText: metadataMap['cta-1-text'],
  };
  const data = collectFloatingButtonData(
    createTag,
    getIconElementDeprecated,
    false,
    extraMainCtaProps,
  );
  const blockWrapper = await createMultiFunctionButton(
    createTag,
    createFloatingButton,
    block,
    data,
    audience,
    'mobile-fork-button',
  );
  const blockLinks = blockWrapper.querySelectorAll('a');
  if (blockLinks && blockLinks.length > 0) {
    const linksPopulated = new CustomEvent('linkspopulated', { detail: blockLinks });
    document.dispatchEvent(linksPopulated);
  }
  if (data.longText) blockWrapper.classList.add('long-text');
  mWebVariant();
}
