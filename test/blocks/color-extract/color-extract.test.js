/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/color-extract/color-extract.js'),
]);
const { default: decorate } = imports[1];

const basic = await readFile({ path: './mocks/basic.html' });
const gradient = await readFile({ path: './mocks/gradient.html' });

describe('Color Extract', () => {
  before(() => {
    window.isTestEnv = true;
  });

  beforeEach(() => {
    document.body.innerHTML = basic;
  });

  it('decorates without throwing', async () => {
    const block = document.querySelector('.color-extract');
    let error;
    try {
      await decorate(block);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.undefined;
  });

  it('builds suggestion images from row 0', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-suggestions')).to.exist;
  });

  it('builds the edit stage from rows 1 and 2', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-edit')).to.exist;
  });

  it('builds the landing stage', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-landing')).to.exist;
  });

  it('does not produce a hero element (new markup has no hero row)', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-hero')).to.not.exist;
  });

  it('places dropzone inside the landing content', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    const landing = block.querySelector('.color-extract-landing-content');
    expect(landing.querySelector('.image-upload-dropzone-container')).to.exist;
  });

  it('suggestion list contains the expected number of images', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    const suggestions = block.querySelectorAll('.color-extract-suggestion');
    // mock HTML has 2 suggestion images
    expect(suggestions.length).to.equal(2);
  });
});

describe('Color Extract — gradient variant', () => {
  before(() => {
    window.isTestEnv = true;
  });

  beforeEach(() => {
    document.body.innerHTML = gradient;
  });

  it('decorates without throwing', async () => {
    const block = document.querySelector('.color-extract');
    let error;
    try {
      await decorate(block);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.undefined;
  });

  it('builds suggestion images from row 0', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-suggestions')).to.exist;
  });

  it('builds the gradient edit stage', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-edit-stage--gradient')).to.exist;
  });

  it('builds the landing stage', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-landing')).to.exist;
  });

  it('places dropzone inside the landing content', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    const landing = block.querySelector('.color-extract-landing-content');
    expect(landing.querySelector('.image-upload-dropzone-container')).to.exist;
  });

  it('suggestion list contains the expected number of images', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    const suggestions = block.querySelectorAll('.color-extract-suggestion');
    // gradient mock HTML has 2 suggestion images
    expect(suggestions.length).to.equal(2);
  });
});
