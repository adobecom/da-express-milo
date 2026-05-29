/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/banner/banner.js')]);
const { default: decorate } = imports[1];

const body = await readFile({ path: './mocks/body.html' });
const light = await readFile({ path: './mocks/light.html' });
const standout = await readFile({ path: './mocks/standout.html' });
const cool = await readFile({ path: './mocks/cool.html' });
const multiButton = await readFile({ path: './mocks/multi-button.html' });

describe('Banner', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Banner exists', async () => {
    document.body.innerHTML = body;
    const banner = document.querySelector('.banner');
    await decorate(banner);
    expect(banner).to.exist;
  });

  it('Banner has correct elements', async () => {
    document.body.innerHTML = body;
    const banner = document.querySelector('.banner');
    await decorate(banner);

    const heading = banner.querySelector('h2');
    const button = banner.querySelector('a.button');
    expect(heading).to.exist;
    expect(button).to.exist;
  });

  it('Banner standout variant has correct elements', async () => {
    document.body.innerHTML = standout;
    const banner = document.querySelector('.banner');
    await decorate(banner);

    const contentContainer = banner.querySelector('.content-container');
    expect(contentContainer).to.exist;

    const button = banner.querySelector('a.button');

    ['large', 'primary'].forEach((className) => {
      expect(button.classList.contains(className)).to.be.true;
    });

    ['accent', 'reverse'].forEach((className) => {
      expect(button.classList.contains(className)).to.be.false;
    });
  });

  it('creates a Banner cool variant block with correct elements', async () => {
    document.body.innerHTML = cool;
    const banner = document.querySelector('.banner');
    await decorate(banner);

    const contentContainer = banner.querySelector('.content-container');
    expect(contentContainer).to.exist;

    const button = banner.querySelector('a.button');

    ['large', 'primary'].forEach((className) => {
      expect(button.classList.contains(className)).to.be.true;
    });

    ['accent', 'reverse'].forEach((className) => {
      expect(button.classList.contains(className)).to.be.false;
    });
  });

  it('Banner light variant has correct elements', async () => {
    document.body.innerHTML = light;
    const banner = document.querySelector('.banner');
    await decorate(banner);

    const button = banner.querySelector('a.button');
    expect(button.classList.contains('large', 'primary', 'reverse')).to.be.true;
  });

  it('Banner dark variant has correct elements', async () => {
    document.body.innerHTML = body;
    const banner = document.querySelector('.banner');
    await decorate(banner);

    const button = banner.querySelector('a.button');
    expect(button.classList.contains('dark', 'accent')).to.be.true;
  });

  it('Banner multi-button has correct elements', async () => {
    document.body.innerHTML = multiButton;
    const banner = document.querySelector('.banner');
    await decorate(banner);

    const button = banner.querySelector('a.button');
    expect(button.classList.contains('reverse')).to.be.true;
    const buttons = banner.querySelectorAll('a.button');
    expect(buttons.length).to.be.at.least(2);
  });

  it('If phone number exists', async () => {
    document.body.innerHTML = body;
    const banner = document.querySelector('.banner');
    await decorate(banner);

    const phoneNumber = banner.querySelector('a[title="{{business-sales-numbers}}"]');
    expect(phoneNumber).to.exist;
  });
});
