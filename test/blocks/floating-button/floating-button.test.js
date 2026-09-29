/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/floating-button/floating-button.js'),
]);
const { default: decorate } = imports[1];

describe('Floating Button', () => {
  before(() => {
    window.isTestEnv = true;
    window.hlx = {};
    window.floatingCta = [
      {
        path: 'default',
        live: 'Y',
      },
    ];
    window.placeholders = { 'see-more': 'See More' };
    document.head.innerHTML = `${document.head.innerHTML}<meta name="floating-cta-live" content="Y">
    <meta name="desktop-floating-cta" content="floating-button">
    <meta name="mobile-floating-cta" content="floating-button">
    <meta name="show-floating-cta-app-store-badge" content="Y">
    <meta name="use-floating-cta-lottie-arrow" content="N">
    <meta name="floating-cta-bubble-sheet" content="fallback-bubbles-sheet">
    <meta name="ctas-above-divider" content="2">
    <meta name="main-cta-link" content="https://main--express--adobecom.aem.page/express/fragments/susi-light-teacher#susi-light-2">
    <meta name="main-cta-text" content="Create now">
    <meta name="cta-1-icon" content="download-app-icon-22">
    <meta name="cta-1-link" content="https://adobesparkpost.app.link/c4bWARQhWAb">
    <meta name="cta-1-text" content="Download App">
    <meta name="cta-2-icon" content="browse-icon-22">
    <meta name="cta-2-link" content="https://adobesparkpost.app.link/lQEQ4Pi1YHb">
    <meta name="cta-2-text" content="Browse all templates">
    <meta name="cta-3-icon" content="scratch-icon-22">
    <meta name="cta-3-link" content="https://adobesparkpost.app.link/c4bWARQhWAb">
    <meta name="cta-3-text" content="Start from scratch">
    <meta name="desktop-floating-cta-text" content="Get Adobe Express for free">
    <meta name="mobile-floating-cta-text" content="Get Adobe Express for free">
    <meta name="theme" content="No Brand Header">
    <meta name="show-floating-cta" content="Yes">`;
  });

  it('Floating Button exists', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const floatingButton = document.querySelector('.floating-button');
    decorate(floatingButton);
    expect(floatingButton).to.exist;
  });

  it('suppresses the desktop floating CTA on iPad until the hero viewport passes', async () => {
    const platformDescriptor = Object.getOwnPropertyDescriptor(navigator, 'platform');
    const touchPointsDescriptor = Object.getOwnPropertyDescriptor(navigator, 'maxTouchPoints');
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true });
    document.body.innerHTML = `<main>
      <div class="verb-express-hero"></div>
      <div class="section">
        <div class="floating-button meta-powered"><div>desktop</div></div>
      </div>
    </main>`;
    const main = document.querySelector('main');
    const append = main.append.bind(main);
    let suppressedWhenInserted = false;
    main.append = (...nodes) => {
      const wrapper = nodes.find((node) => node.classList?.contains('floating-button-wrapper'));
      if (wrapper) suppressedWhenInserted = wrapper.classList.contains('floating-button--hero-suppressed');
      append(...nodes);
    };

    try {
      await decorate(document.querySelector('.floating-button'));
      const wrapper = document.querySelector('.floating-button-wrapper[data-audience="desktop"]');

      expect(suppressedWhenInserted).to.be.true;
      expect(wrapper).to.exist;
      expect(wrapper.classList.contains('floating-button--hero-suppressed')).to.be.true;
      expect(wrapper.getAttribute('aria-hidden')).to.equal('true');
    } finally {
      if (platformDescriptor) Object.defineProperty(navigator, 'platform', platformDescriptor);
      else delete navigator.platform;
      if (touchPointsDescriptor) Object.defineProperty(navigator, 'maxTouchPoints', touchPointsDescriptor);
      else delete navigator.maxTouchPoints;
    }
  });

  it('Floating Button has the right elements and if mobile, .section should be removed', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    const floatingButton = document.querySelector('.floating-button');
    decorate(floatingButton);

    const closestSection = floatingButton.closest('.section');
    const blockLinks = floatingButton.querySelectorAll('a');
    expect(closestSection).to.exist;
    expect(document.contains(closestSection)).to.be.false;
    expect(blockLinks).to.exist;
  });

  it('Parent element should be removed if there is no link', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/no-link.html' });
    const floatingButton = document.querySelector('.floating-button');
    decorate(floatingButton);

    const { parentElement } = floatingButton;
    const blockLinks = floatingButton.querySelectorAll('a');
    expect(document.contains(parentElement)).to.be.false;
    expect(blockLinks).to.be.empty;
  });
});
