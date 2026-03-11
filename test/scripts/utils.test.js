import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import sinon from 'sinon';
import { mockRes } from '../blocks/test-utilities.js';
import { setLibs, hideQuickActionsOnDevices, getIconElementDeprecated, convertToInlineSVG } from '../../express/code/scripts/utils.js';
import { transformLinkToAnimation } from '../../express/code/scripts/utils/media.js';

describe('Libs', () => {
  it('Default Libs', () => {
    const libs = setLibs('/libs');
    expect(libs).to.equal('https://main--milo--adobecom.aem.live/libs');
  });

  it('Does not support milolibs query param on prod', () => {
    const location = {
      hostname: 'business.adobe.com',
      search: '?milolibs=foo',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('/libs');
  });

  it('Supports milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      search: '?milolibs=foo',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('https://foo--milo--adobecom.aem.live/libs');
  });

  it('Supports local milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      search: '?milolibs=local',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('http://localhost:6456/libs');
  });

  it('Supports forked milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      search: '?milolibs=awesome--milo--forkedowner',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('https://awesome--milo--forkedowner.aem.live/libs');
  });
});

describe('Label Metadata for Frictionless Legacy', () => {
  beforeEach(() => {
    document.querySelector('meta[name="fqa-non-qualified"]')?.remove();
    document.querySelector('meta[name="fqa-qualified-desktop"]')?.remove();
    document.querySelector('meta[name="fqa-qualified-mobile"]')?.remove();
    document.querySelector('meta[name="fqa-on"]')?.remove();
    document.querySelector('meta[name="fqa-off"]')?.remove();
  });
  it('labels iOS as fqa-non-qualified', () => {
    hideQuickActionsOnDevices('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
    expect(document.querySelector('meta[name="fqa-non-qualified"]')).to.exist;
  });
  it('labels desktop Safari as fqa-non-qualified', () => {
    hideQuickActionsOnDevices('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15');
    expect(document.querySelector('meta[name="fqa-non-qualified"]')).to.exist;
  });
  it('labels Android phone as fqa-qualified-mobile', () => {
    hideQuickActionsOnDevices('Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36');
    expect(document.querySelector('meta[name="fqa-qualified-mobile"]')).to.exist;
  });
  it('labels non-Safari desktop as fqa-qualified-desktop', () => {
    hideQuickActionsOnDevices('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36');
    expect(document.querySelector('meta[name="fqa-qualified-desktop"]')).to.exist;
  });
});

describe('Label Metadata for Frictionless with Metadata: frictionless-safari', () => {
  beforeEach(() => {
    document.querySelector('meta[name="fqa-non-qualified"]')?.remove();
    document.querySelector('meta[name="fqa-qualified-desktop"]')?.remove();
    document.querySelector('meta[name="fqa-qualified-mobile"]')?.remove();
    document.querySelector('meta[name="fqa-on"]')?.remove();
    document.querySelector('meta[name="fqa-off"]')?.remove();
    if (document.querySelector('meta[frictionless-safari="on"]')) {
      return;
    }
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'frictionless-safari');
    meta.setAttribute('content', 'on');
    document.head.append(meta);
  });
  it('labels iOS as fqa-qualified-mobile', () => {
    hideQuickActionsOnDevices('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
    expect(document.querySelector('meta[name="fqa-qualified-mobile"]')).to.exist;
  });
  it('labels desktop Safari as fqa-qualified-desktop', () => {
    hideQuickActionsOnDevices('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15');
    expect(document.querySelector('meta[name="fqa-qualified-desktop"]')).to.exist;
  });
  it('labels Android phone as fqa-qualified-mobile', () => {
    hideQuickActionsOnDevices('Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36');
    expect(document.querySelector('meta[name="fqa-qualified-mobile"]')).to.exist;
  });
  it('labels non-Safari desktop as fqa-qualified-desktop', () => {
    hideQuickActionsOnDevices('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36');
    expect(document.querySelector('meta[name="fqa-qualified-desktop"]')).to.exist;
  });
});

describe('SVG Inline Conversion', () => {
  let oldFetch;
  before(async () => {
    oldFetch = window.fetch;
    const svgContent = await readFile({ path: '../../express/code/icons/template-lightning.svg' });
    sinon.stub(window, 'fetch').callsFake(async (url) => {
      console.log('url', url);
      return mockRes({ payload: svgContent });
    });
  });
  after(() => {
    window.fetch = oldFetch;
  });
  it('converts img to inline svg', async () => {
    const icon = getIconElementDeprecated('template-lightning');
    icon.setAttribute('data-test', 'ha');
    const svg = await convertToInlineSVG(icon);
    expect(svg.tagName).to.equal('svg');
    expect(svg.classList.contains('icon')).to.be.true;
    expect(svg.classList.contains('icon-template-lightning')).to.be.true;
    expect(svg.getAttribute('width')).to.equal('18');
    expect(svg.getAttribute('height')).to.equal('18');
    expect(svg.getAttribute('data-test')).equal('ha');
  });
});

describe('transformLinkToAnimation', () => {
  beforeEach(async () => {
    document.body.innerHTML = await readFile({ path: './mocks/transform-link-to-animation.html' });
  });

  it('should extract video title from section metadata and set it on video element', () => {
    const videoLink = document.body.querySelector('a[href="test-video.mp4"]');
    const video = transformLinkToAnimation(videoLink);

    expect(video).to.not.be.null;
    expect(video.tagName).to.equal('VIDEO');
    expect(video.getAttribute('title')).to.equal('Video Animation Title with Spaces');
  });

  it('should handle missing section metadata gracefully', () => {
    // Remove section metadata
    const metadata = document.body.querySelector('.section-metadata');
    metadata.remove();

    const videoLink = document.body.querySelector('a[href="test-video.mp4"]');
    const video = transformLinkToAnimation(videoLink);

    expect(video).to.not.be.null;
    expect(video.tagName).to.equal('VIDEO');
    expect(video.getAttribute('title')).to.be.null;
  });

  it('should handle missing animation-alt-text gracefully', () => {
    // Remove the animation-alt-text div
    const metadata = document.body.querySelector('.section-metadata');
    const altTextDiv = metadata.children[1];
    altTextDiv.remove();

    const videoLink = document.body.querySelector('a[href="test-video.mp4"]');
    const video = transformLinkToAnimation(videoLink);

    expect(video).to.not.be.null;
    expect(video.tagName).to.equal('VIDEO');
    expect(video.getAttribute('title')).to.be.null;
  });

  it('should trim whitespace from video title', () => {
    const videoLink = document.body.querySelector('a[href="test-video.mp4"]');
    const video = transformLinkToAnimation(videoLink);

    expect(video).to.not.be.null;
    expect(video.getAttribute('title')).to.equal('Video Animation Title with Spaces');
    // Verify it's trimmed (no leading/trailing spaces)
    expect(video.getAttribute('title')).to.not.include('  ');
  });

  it('should return null for non-video links', () => {
    const imageLink = document.createElement('a');
    imageLink.href = 'test-image.jpg';

    const result = transformLinkToAnimation(imageLink);
    expect(result).to.be.null;
  });

  it('should return null for invalid input', () => {
    expect(transformLinkToAnimation(null)).to.be.null;
    expect(transformLinkToAnimation(undefined)).to.be.null;
    expect(transformLinkToAnimation({})).to.be.null;
  });

  it('should handle URL parsing errors gracefully', () => {
    // Mock lana to ensure the logging line is covered
    const originalLana = window.lana;
    window.lana = {
      log: sinon.spy(),
    };

    // Mock URL constructor to throw an error
    const originalURL = window.URL;
    window.URL = class {
      constructor() {
        throw new Error('Invalid URL for testing');
      }
    };

    const invalidLink = document.createElement('a');
    invalidLink.href = 'test-video.mp4';

    const result = transformLinkToAnimation(invalidLink);
    expect(result).to.be.null;
    expect(window.lana.log.calledOnce).to.be.true;
    expect(window.lana.log.firstCall.args[0]).to.equal('Invalid video URL in transformLinkToAnimation:');

    // Restore original lana and URL
    window.lana = originalLana;
    window.URL = originalURL;
  });

  it('should handle general errors gracefully', () => {
    // Mock lana to ensure the logging line is covered
    const originalLana = window.lana;
    window.lana = {
      log: sinon.spy(),
    };

    // Create a link that will cause an error in the function
    const problematicLink = document.createElement('a');
    problematicLink.href = 'test-video.mp4';
    // Remove the href property to cause an error when trying to access it
    Object.defineProperty(problematicLink, 'href', {
      get() {
        throw new Error('Mock error for testing');
      },
    });

    const result = transformLinkToAnimation(problematicLink);
    expect(result).to.be.null;
    expect(window.lana.log.calledOnce).to.be.true;
    expect(window.lana.log.firstCall.args[0]).to.equal('Error in transformLinkToAnimation:');

    // Restore original lana
    window.lana = originalLana;
  });
});
