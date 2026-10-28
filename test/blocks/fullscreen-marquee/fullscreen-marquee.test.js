import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/fullscreen-marquee/fullscreen-marquee.js'),
]);

const { default: decorate } = imports[1];
const testBody = await readFile({ path: './mocks/body.html' });

describe('Fullscreen Marquee', () => {
  beforeEach(() => {
    document.body.innerHTML = testBody;
    window.placeholders = {
      'fullscreen-marquee-desktop-video-app': 'https://main--express--adobecom.aem.page/express/media_11ffe376e21cc1f2437a2c5c9c875a2c478b51d9a.png',
      'fullscreen-marquee-desktop-image-app': 'https://main--express--adobecom.aem.page/express/media_1460fa1227fa59f6d998556d97df3d709f53c92b8.png',
      'fullscreen-marquee-desktop-video-editor': 'https://main--express--adobecom.aem.page/express/media_11e5c3128ea43f271fd2a565c1e4d68cd1d62c985.png',
      'fullscreen-marquee-desktop-image-editor': 'https://main--express--adobecom.aem.page/express/media_1efec67aa1be9ac7f56eddbf1dd44dbbe4292d10d.png',
    };
  });

  afterEach(() => {
    document.body.removeAttribute('data-device');
    window.placeholders = undefined;
  });

  it('should have all things on desktop', async () => {
    document.body.dataset.device = 'desktop';
    const block = document.querySelector('.fullscreen-marquee.image');
    await decorate(block);
    expect(block).to.exist;
    expect(block.querySelector('.fullscreen-marquee-heading')).to.exist;
    expect(block.querySelector('.fullscreen-marquee-app-frame')).to.exist;
  });

  it('should not have app frame on mobile', async () => {
    document.body.dataset.device = 'mobile';
    const block = document.querySelector('.fullscreen-marquee.image');
    await decorate(block);
    expect(block).to.exist;
    expect(block.querySelector('.fullscreen-marquee-heading')).to.exist;
    expect(block.querySelector('.fullscreen-marquee-app-frame')).to.not.exist;
  });

  it('video version loads a video into the app frame', async () => {
    document.body.dataset.device = 'desktop';
    const block = document.querySelector('.fullscreen-marquee.video');
    await decorate(block);
    expect(block.querySelector('.fullscreen-marquee-app-content-container video')).to.exist;
  });

  it('video loaded triggers thumbnails loading', async () => {
    document.body.dataset.device = 'desktop';
    const block = document.querySelector('.fullscreen-marquee.video');
    await decorate(block);
    const video = block.querySelector('.fullscreen-marquee-app-content-container video');
    expect(video).to.exist;

    video.dispatchEvent(new Event('loadedmetadata'));
    expect(block.querySelector('.fullscreen-marquee-app-frames-container')).to.exist;

    const videoThumbnail = block.querySelector('.fullscreen-marquee-app-thumbnail-container video');
    videoThumbnail.dispatchEvent(new Event('loadedmetadata'));
    expect(videoThumbnail.paused).to.be.true;
  });

  it('can render a background', async () => {
    document.body.dataset.device = 'desktop';
    const block = document.querySelector('.fullscreen-marquee.video.with-background');
    await decorate(block);
    expect(block.classList.contains('has-background')).to.be.true;

    window.dispatchEvent(new Event('scroll'));
    const bg = block.querySelector('.fullscreen-marquee-background');
    expect(bg.style.opacity !== '').to.be.true;
  });

  it('should only have 1 CTA in the header', async () => {
    document.body.dataset.device = 'desktop';
    const block = document.querySelector('.fullscreen-marquee.double-cta');
    await decorate(block);
    expect(Array.from(block.querySelectorAll('p a')).filter((a) => a.classList.contains('hyperlink')).length === 1);
    expect(Array.from(block.querySelectorAll('p a')).filter((a) => a.classList.contains('button')).length === 1);
  });
});
