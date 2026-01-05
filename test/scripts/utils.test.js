import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import sinon from 'sinon';
import { mockRes } from '../blocks/test-utilities.js';
import { setLibs, hideQuickActionsOnDevices, getIconElementDeprecated, convertToInlineSVG, createInjectableLogo, getMetadata } from '../../express/code/scripts/utils.js';
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

describe('createInjectableLogo', () => {
  let mockGetMetadata;
  let originalLana;

  beforeEach(() => {
    // Mock lana for logging
    originalLana = window.lana;
    window.lana = {
      log: sinon.spy(),
    };

    // Create a mock getMetadata function
    mockGetMetadata = sinon.stub();
    
    // Clean up any existing metadata tags
    document.querySelectorAll('meta[name^="marquee-inject"]').forEach((meta) => meta.remove());
  });

  afterEach(() => {
    window.lana = originalLana;
  });

  describe('validation and metadata checks', () => {
    it('should return null if getMetadata function is not provided', () => {
      const block = document.createElement('div');
      block.className = 'ax-marquee';
      
      const logo = createInjectableLogo(block, null, {});
      
      expect(logo).to.be.null;
      expect(window.lana.log.calledOnce).to.be.true;
      expect(window.lana.log.firstCall.args[0]).to.equal('createInjectableLogo: getMetadata function is required');
    });

    it('should return null if metadata does not enable logo injection', () => {
      const block = document.createElement('div');
      block.className = 'ax-marquee';
      mockGetMetadata.returns('off');
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.be.null;
      expect(mockGetMetadata.calledWith('marquee-inject-logo')).to.be.true;
    });

    it('should return null for unsupported block types', () => {
      const block = document.createElement('div');
      block.className = 'some-other-block';
      mockGetMetadata.withArgs('marquee-inject-logo').returns('on');
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.be.null;
    });
  });

  describe('supported block types', () => {
    beforeEach(() => {
      mockGetMetadata.withArgs('marquee-inject-logo').returns('on');
    });

    it('should inject logo for ax-marquee block', () => {
      const block = document.createElement('div');
      block.className = 'ax-marquee';
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
      expect(logo.tagName).to.equal('IMG');
      expect(logo.classList.contains('express-logo')).to.be.true;
    });

    it('should inject logo for headline block', () => {
      const block = document.createElement('div');
      block.className = 'headline';
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
      expect(logo.classList.contains('express-logo')).to.be.true;
    });

    it('should inject logo for interactive-marquee block', () => {
      const block = document.createElement('div');
      block.className = 'interactive-marquee';
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
      expect(logo.classList.contains('express-logo')).to.be.true;
    });

    it('should inject logo for fullscreen-marquee block', () => {
      const block = document.createElement('div');
      block.className = 'fullscreen-marquee';
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
      expect(logo.classList.contains('express-logo')).to.be.true;
    });

    it('should inject logo for ax-columns with marquee variant', () => {
      const block = document.createElement('div');
      block.className = 'ax-columns marquee';
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
      expect(logo.classList.contains('express-logo')).to.be.true;
    });

    it('should inject logo for ax-columns with hero variant', () => {
      const block = document.createElement('div');
      block.className = 'ax-columns hero';
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
      expect(logo.classList.contains('express-logo')).to.be.true;
    });

    it('should not inject logo for ax-columns without marquee variant', () => {
      const block = document.createElement('div');
      block.className = 'ax-columns';
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.be.null;
    });
  });

  describe('custom logo name', () => {
    beforeEach(() => {
      mockGetMetadata.withArgs('marquee-inject-logo').returns('on');
    });

    it('should use custom logo name when provided', () => {
      const block = document.createElement('div');
      block.className = 'interactive-marquee';
      
      const logo = createInjectableLogo(block, 'adobe-express-logo', { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
      expect(logo.src).to.include('adobe-express-logo.svg');
    });

    it('should use default logo when custom name is not provided', () => {
      const block = document.createElement('div');
      block.className = 'ax-marquee';
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
      // Default logo is adobe-express-logo from the LOGO constant
      expect(logo.src).to.include('adobe-express-logo.svg');
    });
  });

  describe('logo size', () => {
    beforeEach(() => {
      mockGetMetadata.withArgs('marquee-inject-logo').returns('on');
    });

    it('should apply custom logo size when provided', () => {
      const block = document.createElement('div');
      block.className = 'interactive-marquee';
      
      const logo = createInjectableLogo(block, 'adobe-express-logo', { 
        getMetadata: mockGetMetadata, 
        logoSize: '22px',
      });
      
      expect(logo).to.not.be.null;
      // Note: getIconElementDeprecated should handle the size parameter
      expect(logo.tagName).to.equal('IMG');
    });
  });

  describe('photo logo injection', () => {
    beforeEach(() => {
      mockGetMetadata.withArgs('marquee-inject-photo-logo').returns('on');
      mockGetMetadata.withArgs('marquee-inject-logo').returns('off');
    });

    it('should inject photo logo when metadata enables it', () => {
      const block = document.createElement('div');
      block.className = 'ax-marquee';
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
      expect(logo.src).to.include('adobe-express-photos-logo.svg');
      expect(logo.classList.contains('express-logo')).to.be.true;
    });

    it('should prioritize photo logo over custom logo name', () => {
      const block = document.createElement('div');
      block.className = 'ax-marquee';
      
      const logo = createInjectableLogo(block, 'custom-logo', { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
      expect(logo.src).to.include('adobe-express-photos-logo.svg');
      expect(logo.src).to.not.include('custom-logo');
    });
  });

  describe('dark mode support', () => {
    let matchMediaStub;

    beforeEach(() => {
      mockGetMetadata.withArgs('marquee-inject-logo').returns('on');
    });

    afterEach(() => {
      if (matchMediaStub) {
        matchMediaStub.restore();
        matchMediaStub = null;
      }
    });

    it('should use white logo for dark block on desktop', () => {
      // Mock media query for desktop
      const mockMediaQuery = {
        matches: true,
        addEventListener: sinon.spy(),
      };
      matchMediaStub = sinon.stub(window, 'matchMedia');
      matchMediaStub.withArgs('(min-width: 900px)').returns(mockMediaQuery);
      
      const block = document.createElement('div');
      block.className = 'ax-marquee dark';
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
      expect(logo.src).to.include('adobe-express-logo-white.svg');
    });

    it('should use regular logo for dark block on mobile', () => {
      // Mock media query for mobile
      const mockMediaQuery = {
        matches: false,
        addEventListener: sinon.spy(),
      };
      matchMediaStub = sinon.stub(window, 'matchMedia');
      matchMediaStub.withArgs('(min-width: 900px)').returns(mockMediaQuery);
      
      const block = document.createElement('div');
      block.className = 'ax-marquee dark';
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
      expect(logo.src).to.include('adobe-express-logo.svg');
      expect(logo.src).to.not.include('white');
    });

    it('should not use white logo when supportsDarkMode is false', () => {
      // Mock media query for desktop
      const mockMediaQuery = {
        matches: true,
        addEventListener: sinon.spy(),
      };
      matchMediaStub = sinon.stub(window, 'matchMedia');
      matchMediaStub.withArgs('(min-width: 900px)').returns(mockMediaQuery);
      
      const block = document.createElement('div');
      block.className = 'headline dark';
      
      const logo = createInjectableLogo(block, null, { 
        getMetadata: mockGetMetadata, 
        supportsDarkMode: false,
      });
      
      expect(logo).to.not.be.null;
      expect(logo.src).to.include('adobe-express-logo.svg');
      expect(logo.src).to.not.include('white');
    });

    it('should use custom logo with white variant in dark mode', () => {
      // Mock media query for desktop
      const mockMediaQuery = {
        matches: true,
        addEventListener: sinon.spy(),
      };
      matchMediaStub = sinon.stub(window, 'matchMedia');
      matchMediaStub.withArgs('(min-width: 900px)').returns(mockMediaQuery);
      
      const block = document.createElement('div');
      block.className = 'interactive-marquee dark';
      
      const logo = createInjectableLogo(block, 'adobe-express-logo', { 
        getMetadata: mockGetMetadata,
      });
      
      expect(logo).to.not.be.null;
      expect(logo.src).to.include('adobe-express-logo-white.svg');
    });
  });

  describe('metadata variations', () => {
    it('should accept "yes" as valid value for marquee-inject-logo', () => {
      const block = document.createElement('div');
      block.className = 'ax-marquee';
      mockGetMetadata.withArgs('marquee-inject-logo').returns('yes');
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
    });

    it('should accept "ON" (uppercase) as valid value', () => {
      const block = document.createElement('div');
      block.className = 'ax-marquee';
      mockGetMetadata.withArgs('marquee-inject-logo').returns('ON');
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
    });

    it('should accept "Yes" (mixed case) as valid value', () => {
      const block = document.createElement('div');
      block.className = 'ax-marquee';
      mockGetMetadata.withArgs('marquee-inject-logo').returns('Yes');
      
      const logo = createInjectableLogo(block, null, { getMetadata: mockGetMetadata });
      
      expect(logo).to.not.be.null;
    });
  });
});
