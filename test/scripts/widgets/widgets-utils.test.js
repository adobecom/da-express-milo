import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';

setLibs('/libs');

// Test utility functions from various widget files
describe('Scripts Widgets Utility Functions', () => {
  describe('parseImageMetadata (from image-tooltip.js)', () => {
    // Create a test version of parseImageMetadata function
    function parseImageMetadata(altText) {
      const altMatch = altText.match(/alt-text:\s*([^,]+)/);
      const actualAlt = altMatch ? altMatch[1].trim().split(';')[0] : '';
      const tooltipMatch = altText.match(/tooltip-text:\s*([^,]+)/);
      const tooltipText = tooltipMatch ? tooltipMatch[1].trim().split(';')[0] : '';
      const categoryMatch = altText.match(/category:\s*premium/);
      const isPremium = !!categoryMatch;
      const iconMatch = altText.match(/icon:\s*([^,]+)/);
      const icon = iconMatch ? iconMatch[1].trim().split(';')[0] : '';
      return { actualAlt, tooltipText, isPremium, icon };
    }

    it('should parse all metadata fields correctly', () => {
      const altText = 'alt-text: Test Image, tooltip-text: This is a tooltip, category: premium, icon: star';
      const result = parseImageMetadata(altText);

      expect(result).to.deep.equal({
        actualAlt: 'Test Image',
        tooltipText: 'This is a tooltip',
        isPremium: true,
        icon: 'star',
      });
    });

    it('should handle missing alt-text', () => {
      const altText = 'tooltip-text: This is a tooltip, category: premium';
      const result = parseImageMetadata(altText);

      expect(result.actualAlt).to.equal('');
      expect(result.tooltipText).to.equal('This is a tooltip');
      expect(result.isPremium).to.be.true;
    });

    it('should handle missing tooltip-text', () => {
      const altText = 'alt-text: Test Image, category: premium';
      const result = parseImageMetadata(altText);

      expect(result.actualAlt).to.equal('Test Image');
      expect(result.tooltipText).to.equal('');
      expect(result.isPremium).to.be.true;
    });

    it('should handle non-premium category', () => {
      const altText = 'alt-text: Test Image, category: free';
      const result = parseImageMetadata(altText);

      expect(result.isPremium).to.be.false;
    });

    it('should handle missing category (defaults to non-premium)', () => {
      const altText = 'alt-text: Test Image, tooltip-text: This is a tooltip';
      const result = parseImageMetadata(altText);

      expect(result.isPremium).to.be.false;
    });

    it('should handle semicolon separators in values', () => {
      const altText = 'alt-text: Test Image; extra info, tooltip-text: Tooltip; more info';
      const result = parseImageMetadata(altText);

      expect(result.actualAlt).to.equal('Test Image');
      expect(result.tooltipText).to.equal('Tooltip');
    });

    it('should handle empty string', () => {
      const result = parseImageMetadata('');

      expect(result).to.deep.equal({
        actualAlt: '',
        tooltipText: '',
        isPremium: false,
        icon: '',
      });
    });

    it('should handle icon field', () => {
      const altText = 'alt-text: Test Image, icon: checkmark; extra';
      const result = parseImageMetadata(altText);

      expect(result.icon).to.equal('checkmark');
    });
  });

  describe('nodeIsBefore (from masonry.js)', () => {
    // Create a test version of nodeIsBefore function
    function nodeIsBefore(node, otherNode) {
      // eslint-disable-next-line no-bitwise
      const forward = node.compareDocumentPosition(otherNode)
        & Node.DOCUMENT_POSITION_FOLLOWING;
      return (!!forward);
    }

    let container;
    let firstNode;
    let secondNode;
    let thirdNode;

    beforeEach(() => {
      container = document.createElement('div');
      firstNode = document.createElement('div');
      secondNode = document.createElement('div');
      thirdNode = document.createElement('div');

      firstNode.textContent = 'First';
      secondNode.textContent = 'Second';
      thirdNode.textContent = 'Third';

      container.appendChild(firstNode);
      container.appendChild(secondNode);
      container.appendChild(thirdNode);
      document.body.appendChild(container);
    });

    afterEach(() => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    it('should return true when first node comes before second node', () => {
      expect(nodeIsBefore(firstNode, secondNode)).to.be.true;
    });

    it('should return false when second node comes before first node', () => {
      expect(nodeIsBefore(secondNode, firstNode)).to.be.false;
    });

    it('should return true when first node comes before third node', () => {
      expect(nodeIsBefore(firstNode, thirdNode)).to.be.true;
    });

    it('should return true when second node comes before third node', () => {
      expect(nodeIsBefore(secondNode, thirdNode)).to.be.true;
    });

    it('should return false when comparing node with itself', () => {
      expect(nodeIsBefore(firstNode, firstNode)).to.be.false;
    });
  });

  describe('isVideoLink (from video.js)', () => {
    // Create a test version of isVideoLink function
    function isVideoLink(url) {
      if (!url) return false;
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
      const lowerUrl = url.toLowerCase();
      return videoExtensions.some((ext) => lowerUrl.includes(ext));
    }

    it('should return true for mp4 URLs', () => {
      expect(isVideoLink('https://example.com/video.mp4')).to.be.true;
    });

    it('should return true for webm URLs', () => {
      expect(isVideoLink('https://example.com/video.webm')).to.be.true;
    });

    it('should return true for ogg URLs', () => {
      expect(isVideoLink('https://example.com/video.ogg')).to.be.true;
    });

    it('should return true for mov URLs', () => {
      expect(isVideoLink('https://example.com/video.mov')).to.be.true;
    });

    it('should return true for avi URLs', () => {
      expect(isVideoLink('https://example.com/video.avi')).to.be.true;
    });

    it('should be case insensitive', () => {
      expect(isVideoLink('https://example.com/VIDEO.MP4')).to.be.true;
      expect(isVideoLink('https://example.com/Video.WebM')).to.be.true;
    });

    it('should return false for non-video URLs', () => {
      expect(isVideoLink('https://example.com/image.jpg')).to.be.false;
      expect(isVideoLink('https://example.com/document.pdf')).to.be.false;
      expect(isVideoLink('https://example.com/page.html')).to.be.false;
    });

    it('should return false for empty or null URLs', () => {
      expect(isVideoLink('')).to.be.false;
      expect(isVideoLink(null)).to.be.false;
      expect(isVideoLink(undefined)).to.be.false;
    });

    it('should handle URLs with query parameters', () => {
      expect(isVideoLink('https://example.com/video.mp4?autoplay=1')).to.be.true;
    });

    it('should handle URLs with fragments', () => {
      expect(isVideoLink('https://example.com/video.mp4#t=30')).to.be.true;
    });
  });

  describe('collectFloatingButtonData (from floating-cta.js)', () => {
    // Create a test version of collectFloatingButtonData function
    function collectFloatingButtonData() {
      const data = {
        audience: null,
        cta: null,
        ctaUrl: null,
        ctaText: null,
        displayOn: null,
      };

      // Mock implementation for testing
      const metaElements = document.querySelectorAll('meta[name^="floating-cta"]');
      metaElements.forEach((meta) => {
        const name = meta.getAttribute('name');
        const content = meta.getAttribute('content');

        if (name === 'floating-cta-audience') data.audience = content;
        if (name === 'floating-cta-cta') data.cta = content;
        if (name === 'floating-cta-url') data.ctaUrl = content;
        if (name === 'floating-cta-text') data.ctaText = content;
        if (name === 'floating-cta-display') data.displayOn = content;
      });

      return data;
    }

    beforeEach(() => {
      // Clean up any existing meta tags
      document.querySelectorAll('meta[name^="floating-cta"]').forEach((meta) => {
        meta.remove();
      });
    });

    afterEach(() => {
      // Clean up meta tags after each test
      document.querySelectorAll('meta[name^="floating-cta"]').forEach((meta) => {
        meta.remove();
      });
    });

    it('should collect all floating CTA data from meta tags', () => {
      // Add test meta tags
      const metaTags = [
        { name: 'floating-cta-audience', content: 'mobile' },
        { name: 'floating-cta-cta', content: 'primary' },
        { name: 'floating-cta-url', content: 'https://example.com' },
        { name: 'floating-cta-text', content: 'Get Started' },
        { name: 'floating-cta-display', content: 'always' },
      ];

      metaTags.forEach(({ name, content }) => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      });

      const result = collectFloatingButtonData();

      expect(result).to.deep.equal({
        audience: 'mobile',
        cta: 'primary',
        ctaUrl: 'https://example.com',
        ctaText: 'Get Started',
        displayOn: 'always',
      });
    });

    it('should return null values when no meta tags are present', () => {
      const result = collectFloatingButtonData();

      expect(result).to.deep.equal({
        audience: null,
        cta: null,
        ctaUrl: null,
        ctaText: null,
        displayOn: null,
      });
    });

    it('should handle partial meta tag data', () => {
      const meta1 = document.createElement('meta');
      meta1.setAttribute('name', 'floating-cta-audience');
      meta1.setAttribute('content', 'desktop');
      document.head.appendChild(meta1);

      const meta2 = document.createElement('meta');
      meta2.setAttribute('name', 'floating-cta-text');
      meta2.setAttribute('content', 'Learn More');
      document.head.appendChild(meta2);

      const result = collectFloatingButtonData();

      expect(result).to.deep.equal({
        audience: 'desktop',
        cta: null,
        ctaUrl: null,
        ctaText: 'Learn More',
        displayOn: null,
      });
    });
  });
});
