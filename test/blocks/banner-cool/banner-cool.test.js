/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/banner-cool/banner-cool.js'),
]);
const { default: decorate } = imports[1];

const defaultHtml = await readFile({ path: './mocks/default.html' });
const darkHtml = await readFile({ path: './mocks/dark.html' });
const multiButtonHtml = await readFile({ path: './mocks/multi-button.html' });
const phoneHtml = await readFile({ path: './mocks/phone.html' });
const noButtonsHtml = await readFile({ path: './mocks/no-buttons.html' });
const injectLogoOffHtml = await readFile({ path: './mocks/inject-logo-off.html' });

describe('Banner Cool', () => {
  before(() => {
    window.isTestEnv = true;
    if (!window.lana) window.lana = { log: () => {} };
  });

  it('Banner Cool exists', async () => {
    document.body.innerHTML = defaultHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);
    expect(block).to.exist;
  });

  it('Banner Cool default (light) has light and multi-button classes', async () => {
    document.body.innerHTML = defaultHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);
    expect(block.classList.contains('light')).to.be.true;
    expect(block.classList.contains('multi-button')).to.be.true;
  });

  it('Banner Cool has correct wrapper structure', async () => {
    document.body.innerHTML = defaultHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    const wrapper = block.querySelector('.banner-cool-wrapper');
    const inner = block.querySelector('.banner-cool-inner');
    const content = block.querySelector('.banner-cool-content');
    const textWrap = block.querySelector('.banner-cool-text-wrap');
    const actionsFootnote = block.querySelector('.banner-cool-actions-footnote');

    expect(wrapper).to.exist;
    expect(inner).to.exist;
    expect(content).to.exist;
    expect(textWrap).to.exist;
    expect(actionsFootnote).to.exist;
    expect(wrapper.contains(inner)).to.be.true;
    expect(inner.contains(content)).to.be.true;
    expect(content.contains(textWrap)).to.be.true;
    expect(content.contains(actionsFootnote)).to.be.true;
  });

  it('Banner Cool has heading and button elements', async () => {
    document.body.innerHTML = defaultHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    const h2 = block.querySelector('h2');
    const h3 = block.querySelector('h3');
    const h4 = block.querySelector('h4');
    const buttons = block.querySelectorAll('a.button');
    expect(h2).to.exist;
    expect(h3).to.exist;
    expect(h4).to.exist;
    expect(buttons.length).to.be.at.least(2);
  });

  it('Banner Cool has expected heading text', async () => {
    document.body.innerHTML = defaultHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    const h2 = block.querySelector('h2');
    expect(h2.textContent).to.include('Harness your creative powers with Adobe Express');
  });

  it('Banner Cool applies ax heading classes', async () => {
    document.body.innerHTML = defaultHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    const h2 = block.querySelector('h2');
    const h3 = block.querySelector('h3');
    const h4 = block.querySelector('h4');
    expect(h2.classList.contains('ax-heading-xxl')).to.be.true;
    expect(h3.classList.contains('ax-body-xl')).to.be.true;
    expect(h4.classList.contains('ax-body-xs')).to.be.true;
  });

  it('Banner Cool styles buttons with accent, dark, and bg-banner-button', async () => {
    document.body.innerHTML = defaultHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    const button = block.querySelector('a.button');
    expect(button.classList.contains('accent')).to.be.true;
    expect(button.classList.contains('dark')).to.be.true;
    expect(button.classList.contains('bg-banner-button')).to.be.true;
  });

  it('Banner Cool injects logo when section metadata inject-logo is on', async () => {
    document.body.innerHTML = defaultHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    const logo = block.querySelector('.express-logo');
    expect(logo).to.exist;
  });

  it('Banner Cool does not inject logo when inject-logo is not present in html', async () => {
    document.body.innerHTML = multiButtonHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    const logo = block.querySelector('.express-logo');
    expect(logo).to.not.exist;
  });

  it('Banner Cool has Learn More link in h4', async () => {
    document.body.innerHTML = defaultHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    const learnMore = block.querySelector('h4 a.quick-link');
    expect(learnMore).to.exist;
    expect(learnMore.textContent).to.include('Learn More');
  });

  it('Banner Cool dark variant has dark class on block', async () => {
    document.body.innerHTML = darkHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    expect(block.classList.contains('dark')).to.be.true;
  });

  it('Banner Cool multi-button adds secondary button class on second button', async () => {
    document.body.innerHTML = multiButtonHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    expect(block.classList.contains('multi-button')).to.be.true;
    const buttons = block.querySelectorAll('a.button');
    expect(buttons.length).to.be.at.least(2);
    expect(buttons[0].classList.contains('bg-banner-button')).to.be.true;
    expect(buttons[1].classList.contains('bg-banner-button-secondary')).to.be.true;
  });

  it('Banner Cool with phone number has sales link', async () => {
    document.body.innerHTML = phoneHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    const phoneLink = block.querySelector('a[title="{{business-sales-numbers}}"]');
    expect(phoneLink).to.exist;
  });

  it('Banner Cool with no buttons does not add multi-button and completes', async () => {
    document.body.innerHTML = noButtonsHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    expect(block.classList.contains('multi-button')).to.be.false;
    expect(block.querySelector('.banner-cool-wrapper')).to.exist;
  });

  it('Banner Cool does not inject logo when inject-logo is off in section metadata', async () => {
    document.body.innerHTML = injectLogoOffHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    const logo = block.querySelector('.express-logo');
    expect(logo).to.not.exist;
  });

  it('Banner Cool copies section background to block when section has style.background', async () => {
    document.body.innerHTML = defaultHtml;
    const block = document.querySelector('.banner-cool');
    const section = block.closest('.section');
    section.style.background = 'linear-gradient(red, blue)';
    await decorate(block);

    expect(block.style.background).to.equal('linear-gradient(red, blue)');
  });

  it('Banner Cool dark variant uses dark logo icon', async () => {
    document.body.innerHTML = darkHtml;
    const block = document.querySelector('.banner-cool');
    await decorate(block);

    const logo = block.querySelector('.express-logo');
    expect(logo).to.exist;
    const img = logo.querySelector('img');
    if (img) {
      expect(img.classList.contains('icon-adobe-express-logo-white') || img.getAttribute('alt') === 'adobe-express-logo-white').to.be.true;
    } else {
      expect(logo.classList.contains('icon-adobe-express-logo-white') || logo.querySelector('[class*="express-logo-white"]')).to.exist;
    }
  });

  it('Banner Cool formatPhoneNumbers catches and logs when formatSalesPhoneNumber fails', async () => {
    document.body.innerHTML = phoneHtml;
    const block = document.querySelector('.banner-cool');
    const logCalls = [];
    window.lana = { log: (...args) => { logCalls.push(args); } };
    const origFetch = window.fetch;
    window.fetch = () => Promise.reject(new Error('mock fetch failure'));

    await decorate(block);

    window.fetch = origFetch;
    expect(logCalls.some((args) => args[0] && args[0].includes('banner-cool.js'))).to.be.true;
  });
});
