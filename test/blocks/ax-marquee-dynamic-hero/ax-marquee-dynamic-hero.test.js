/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
window.isTestEnv = true;

describe('ax-marquee-dynamic-hero', () => {
  let decorate;

  before(async () => {
    // Setup imports
    const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
    const { getLibs } = imports[0];

    await import(`${getLibs()}/utils/utils.js`).then((mod) => {
      const conf = { locales };
      mod.setConfig(conf);
    });

    // Import the decorate function
    const module = await import('../../../express/code/blocks/ax-marquee-dynamic-hero/ax-marquee-dynamic-hero.js');
    decorate = module.default;
  });

  it('Should load basic HTML mock', async () => {
    const basic = await readFile({ path: './mocks/basic.html' });
    expect(basic).to.contain('ax-marquee-dynamic-hero');
  });

  it('Should render basic marquee dynamic hero', async () => {
    const basic = await readFile({ path: './mocks/basic.html' });
    document.body.innerHTML = basic;
    const block = document.querySelector('.ax-marquee-dynamic-hero');
    await decorate(block);
    expect(block).to.exist;
  });

  it('Should add button-container class to p tag with link', async () => {
    const basic = await readFile({ path: './mocks/basic.html' });
    document.body.innerHTML = basic;
    const block = document.querySelector('.ax-marquee-dynamic-hero');
    await decorate(block);

    const pWithLink = block.querySelector('p:has(a)');
    expect(pWithLink.classList.contains('button-container')).to.be.true;
  });

  it('Should add button classes to the link', async () => {
    const basic = await readFile({ path: './mocks/basic.html' });
    document.body.innerHTML = basic;
    const block = document.querySelector('.ax-marquee-dynamic-hero');
    await decorate(block);

    const link = block.querySelector('a');
    expect(link.classList.contains('quick-link')).to.be.true;
    expect(link.classList.contains('button')).to.be.true;
    expect(link.classList.contains('accent')).to.be.true;
  });

  it('Should handle missing h1 gracefully', async () => {
    const noH1 = await readFile({ path: './mocks/no-h1.html' });
    document.body.innerHTML = noH1;
    const block = document.querySelector('.ax-marquee-dynamic-hero');
    await decorate(block);

    // Should not throw error
    expect(block.querySelector('a')).to.exist;
  });

  it('Should add hero-animation-overlay class to video parent', async () => {
    const video = await readFile({ path: './mocks/video.html' });
    document.body.innerHTML = video;
    const block = document.querySelector('.ax-marquee-dynamic-hero');

    await decorate(block);

    // After createAccessibilityVideoControls, the video is moved into a video-container
    // The hero-animation-overlay class should be on the parent of the video-container
    const videoContainer = block.querySelector('.video-container');

    if (videoContainer) {
      const heroAnimationOverlay = videoContainer.closest('.hero-animation-overlay');
      expect(heroAnimationOverlay).to.exist;
    } else {
      // Fallback: check if the original video parent has the class
      const videoParent = block.querySelector('video').closest('div');
      expect(videoParent.classList.contains('hero-animation-overlay')).to.be.true;
    }
  });

  it('Should place logo when marquee-inject-logo is on', async () => {
    const basic = await readFile({ path: './mocks/basic.html' });
    document.body.innerHTML = basic;
    const block = document.querySelector('.ax-marquee-dynamic-hero');

    const meta = document.createElement('meta');
    meta.name = 'marquee-inject-logo';
    meta.content = 'on';
    document.head.append(meta);

    await decorate(block);

    const logo = block.querySelector('.express-logo');
    expect(logo).to.exist;

    meta.remove();
  });

  it('Should place logo before h1', async () => {
    const basic = await readFile({ path: './mocks/basic.html' });
    document.body.innerHTML = basic;
    const block = document.querySelector('.ax-marquee-dynamic-hero');

    const meta = document.createElement('meta');
    meta.name = 'marquee-inject-logo';
    meta.content = 'on';
    document.head.append(meta);

    await decorate(block);

    const h1 = block.querySelector('h1');
    const logo = block.querySelector('.express-logo');
    const h1Parent = h1.parentElement;

    expect(h1Parent.firstElementChild).to.equal(logo);

    meta.remove();
  });

  it('Should work with hero-top variant', async () => {
    const heroTop = await readFile({ path: './mocks/hero-top.html' });
    document.body.innerHTML = heroTop;
    const block = document.querySelector('.ax-marquee-dynamic-hero');

    const meta = document.createElement('meta');
    meta.name = 'marquee-inject-logo';
    meta.content = 'on';
    document.head.append(meta);

    await decorate(block);

    const logo = block.querySelector('.express-logo');
    expect(logo).to.exist;
    expect(block.classList.contains('hero-top-mobile')).to.be.true;

    meta.remove();
  });

  it('Should handle video elements', async () => {
    const video = await readFile({ path: './mocks/video.html' });
    document.body.innerHTML = video;
    const block = document.querySelector('.ax-marquee-dynamic-hero');
    await decorate(block);

    const videoElement = block.querySelector('video');
    expect(videoElement).to.exist;
  });
});
