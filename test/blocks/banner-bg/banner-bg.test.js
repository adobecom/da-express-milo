/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/banner-bg/banner-bg.js')]);
const { default: decorate } = imports[1];

const basic = await readFile({ path: './mocks/basic.html' });
const lightBg = await readFile({ path: './mocks/light-bg.html' });
const multiButton = await readFile({ path: './mocks/multi-button.html' });
const withLogo = await readFile({ path: './mocks/with-logo.html' });

describe('Banner Background', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Banner background exists', async () => {
    document.body.innerHTML = basic;
    const banner = document.querySelector('.banner-bg');
    await decorate(banner);
    expect(banner).to.exist;
  });

  it('Banner background has correct elements', async () => {
    document.body.innerHTML = basic;
    const banner = document.querySelector('.banner-bg');
    await decorate(banner);

    const heading = banner.querySelector('h2');
    const button = banner.querySelector('a.button');
    expect(heading).to.exist;
    expect(button).to.exist;
  });

  it('Background image variant creates background container', async () => {
    document.body.innerHTML = lightBg;
    const banner = document.querySelector('.banner-bg');
    await decorate(banner);

    const backgroundContainer = banner.querySelector('.background-container');
    expect(backgroundContainer).to.exist;
    expect(banner.classList.contains('light-bg')).to.be.true;
  });

  it('Background image variant has correct button classes', async () => {
    document.body.innerHTML = lightBg;
    const banner = document.querySelector('.banner-bg');
    await decorate(banner);

    const button = banner.querySelector('a.button');
    expect(button.classList.contains('bg-banner-button')).to.be.true;
    expect(button.classList.contains('accent')).to.be.true;
    expect(button.classList.contains('dark')).to.be.true;
  });

  it('Multi-button banner has correct classes', async () => {
    document.body.innerHTML = multiButton;
    const banner = document.querySelector('.banner-bg');
    await decorate(banner);

    expect(banner.classList.contains('multi-button')).to.be.true;

    const buttons = banner.querySelectorAll('a.button');
    expect(buttons.length).to.be.at.least(2);

    // First button should have primary styling
    expect(buttons[0].classList.contains('bg-banner-button')).to.be.true;

    // Second button should have secondary styling
    expect(buttons[1].classList.contains('bg-banner-button-secondary')).to.be.true;
  });

  it('Logo injection works when metadata is set', async () => {
    document.body.innerHTML = withLogo;
    const banner = document.querySelector('.banner-bg');
    await decorate(banner);

    const logo = banner.querySelector('.express-logo');
    expect(logo).to.exist;
    expect(logo.classList.contains('icon-adobe-express-logo')).to.be.true;
  });

  it('Logo is positioned correctly', async () => {
    document.body.innerHTML = withLogo;
    const banner = document.querySelector('.banner-bg');
    await decorate(banner);

    const h2 = banner.querySelector('h2');
    const logo = h2.parentElement.querySelector('.express-logo');
    expect(logo).to.exist;
  });

  it('Background image classes are detected correctly', async () => {
    const backgroundClasses = [
      'light-bg',
      'blue-green-pink-bg',
      'blue-bg',
      'blue-pink-orange-bg',
      'green-blue-red-bg',
      'blue-purple-gray-bg',
      'yellow-pink-blue-bg',
    ];

    for (const className of backgroundClasses) {
      document.body.innerHTML = `<div class="banner-bg ${className} block" data-block-name="banner-bg">
        <div><div><h2>Test</h2><p class="button-container"><a href="#" class="button">Test</a></p></div></div>
      </div>`;

      const banner = document.querySelector('.banner-bg');
      await decorate(banner);

      expect(banner.classList.contains(className)).to.be.true;
      expect(banner.querySelector('.background-container')).to.exist;
    }
  });

  it('Non-background variant does not create background container', async () => {
    document.body.innerHTML = basic;
    const banner = document.querySelector('.banner-bg');
    await decorate(banner);

    const backgroundContainer = banner.querySelector('.background-container');
    expect(backgroundContainer).to.not.exist;
  });

  it('Button styling is correct for non-background variants', async () => {
    document.body.innerHTML = basic;
    const banner = document.querySelector('.banner-bg');
    await decorate(banner);

    const button = banner.querySelector('a.button');
    expect(button.classList.contains('accent')).to.be.true;
    expect(button.classList.contains('dark')).to.be.true;
    expect(button.classList.contains('bg-banner-button')).to.be.false;
  });

  it('Multi-button styling includes reverse class', async () => {
    document.body.innerHTML = multiButton;
    const banner = document.querySelector('.banner-bg');
    await decorate(banner);

    const buttons = banner.querySelectorAll('a.button');
    buttons.forEach((button) => {
      expect(button.classList.contains('reverse')).to.be.true;
    });
  });
});
