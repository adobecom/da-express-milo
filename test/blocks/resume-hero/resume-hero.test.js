/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

window.isTestEnv = true;

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({
    codeRoot: '/express/code',
    locales: { '': { ietf: 'en-US', tk: 'hah7vzn.css' } },
  });
});

const { default: decorate } = await import('../../../express/code/blocks/resume-hero/resume-hero.js');
const splitLayout = await readFile({ path: './mocks/split-layout.html' });

describe('resume-hero / split-row authoring', () => {
  let block;

  before(async () => {
    sinon.stub(window, 'fetch').resolves({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
    window.lana = { log: sinon.stub() };
    window.mph = {
      'resume-hero-heading': 'Upload your resume',
      'resume-hero-subcopy-desktop': 'Drag and drop your resume here.',
      'resume-hero-subcopy-mobile': 'Choose a resume to upload.',
      'resume-hero-upload-cta': 'Upload resume',
    };
    document.body.innerHTML = splitLayout;
    block = document.querySelector('.resume-hero');
    await decorate(block);
  });

  after(() => {
    sinon.restore();
    delete window.lana;
    delete window.mph;
  });

  it('combines the text and image cells into the layout container', () => {
    const content = block.querySelector(':scope > .resume-hero-content');
    expect(content).to.exist;
    expect(content.children).to.have.length(2);
    expect(content.children[1].classList.contains('media')).to.be.true;
    expect(content.querySelector('.media picture')).to.exist;
  });

  it('applies and removes the authored background value', () => {
    expect(block.style.background).to.equal('rgb(245, 245, 245)');
    expect(block.textContent).not.to.include('#F5F5F5');
  });

  it('groups separately authored CTAs', () => {
    const group = block.querySelector('.button-group');
    expect(group).to.exist;
    expect(group.querySelectorAll('.button-container')).to.have.length(2);
    expect(group.querySelectorAll('a.button.accent')).to.have.length(2);
  });

  it('inserts the resume dropzone in the media cell with resume-hero placeholders', () => {
    const dropzone = block.querySelector('.media .verb-dropzone');
    expect(dropzone).to.exist;
    expect(dropzone.querySelector('.verb-dropzone-heading').textContent)
      .to.equal('Upload your resume');
    expect(dropzone.querySelector('.verb-dropzone-subcopy-desktop').textContent)
      .to.equal('Drag and drop your resume here.');
    expect(dropzone.querySelector('.verb-dropzone-subcopy-mobile').textContent)
      .to.equal('Choose a resume to upload.');
    expect(dropzone.querySelector('.verb-dropzone-cta-label').textContent)
      .to.equal('Upload resume');
  });

  it('uses the authored media picture as the dropzone background', () => {
    const media = block.querySelector('.media');
    const background = media.querySelector('.verb-dropzone-background');
    expect(background).to.exist;
    expect(background.querySelector('picture img').getAttribute('alt'))
      .to.equal('Resume preview');
    expect(media.querySelector(':scope > picture')).to.not.exist;
  });

  it('preserves the trailing disclaimer', () => {
    expect(block.textContent).to.include('Free to use. No credit card required.');
  });
});
