import { expect } from '@esm-bundle/chai';
import { normalizeHeadings, formatSmartBlockLinks } from '../../../express/code/blocks/link-list/link-list.js';

// NOTE: This file tests only the pure utility functions from link-list.js
// Complex integration tests (decorate, loadSpreadsheetData, carousel) are covered by Nala E2E
// See: test/nala/blocks/link-list.test.js for full integration coverage

describe('Link List Utility Functions', () => {
  describe('normalizeHeadings', () => {
    let testBlock;

    beforeEach(() => {
      testBlock = document.createElement('div');
      document.body.appendChild(testBlock);
    });

    afterEach(() => {
      if (testBlock && testBlock.parentNode) {
        testBlock.parentNode.removeChild(testBlock);
      }
    });

    it('should handle empty block', () => {
      normalizeHeadings(testBlock, ['h3']);
      expect(testBlock.innerHTML).to.equal('');
    });

    it('should not modify allowed headings', () => {
      testBlock.innerHTML = '<h3>Allowed heading</h3>';
      normalizeHeadings(testBlock, ['h3']);
      expect(testBlock.innerHTML).to.equal('<h3>Allowed heading</h3>');
    });

    it('should promote h4 to h3 when h3 is allowed', () => {
      testBlock.innerHTML = '<h4>Should be promoted</h4>';
      normalizeHeadings(testBlock, ['h3']);
      expect(testBlock.innerHTML).to.equal('<h3>Should be promoted</h3>');
    });

    it('should demote h2 to h3 when h3 is allowed', () => {
      testBlock.innerHTML = '<h2>Should be demoted</h2>';
      normalizeHeadings(testBlock, ['h3']);
      expect(testBlock.innerHTML).to.equal('<h3>Should be demoted</h3>');
    });

    it('should handle multiple headings', () => {
      testBlock.innerHTML = '<h2>First</h2><h4>Second</h4><h3>Third</h3>';
      normalizeHeadings(testBlock, ['h3']);
      expect(testBlock.innerHTML).to.equal('<h3>First</h3><h3>Second</h3><h3>Third</h3>');
    });

    it('should handle multiple allowed heading levels', () => {
      testBlock.innerHTML = '<h1>Title</h1><h4>Subtitle</h4>';
      normalizeHeadings(testBlock, ['h2', 'h3']);
      expect(testBlock.innerHTML).to.equal('<h2>Title</h2><h3>Subtitle</h3>');
    });

    it('should trim whitespace from heading content', () => {
      testBlock.innerHTML = '<h4>  Spaced content  </h4>';
      normalizeHeadings(testBlock, ['h3']);
      expect(testBlock.innerHTML).to.equal('<h3>Spaced content</h3>');
    });
  });

  describe('formatSmartBlockLinks', () => {
    let mockLinks;

    beforeEach(() => {
      // Create mock DOM elements for testing
      mockLinks = [
        {
          querySelector: () => ({
            title: 'logo templates',
            href: '',
            classList: { add: () => {} },
          }),
        },
        {
          querySelector: () => ({
            title: 'business card templates',
            href: '',
            classList: { add: () => {} },
          }),
        },
      ];
    });

    it('should handle null or undefined links', () => {
      expect(() => formatSmartBlockLinks(null, 'https://example.com')).to.not.throw();
      expect(() => formatSmartBlockLinks(undefined, 'https://example.com')).to.not.throw();
    });

    it('should handle null or undefined baseURL', () => {
      expect(() => formatSmartBlockLinks(mockLinks, null)).to.not.throw();
      expect(() => formatSmartBlockLinks(mockLinks, undefined)).to.not.throw();
    });

    it('should format URLs correctly with single baseURL', () => {
      const baseURL = 'https://express.adobe.com/templates';
      const expectedBase = `${baseURL}?acomx-dno=true&category=templates`;

      // Mock the anchor elements to capture href changes
      const mockAnchors = [];
      mockLinks.forEach((link, index) => {
        const mockAnchor = {
          title: index === 0 ? 'logo templates' : 'business card templates',
          href: '',
          classList: { add: () => {} },
        };
        mockAnchors.push(mockAnchor);
        link.querySelector = () => mockAnchor;
      });

      formatSmartBlockLinks(mockLinks, baseURL);

      expect(mockAnchors[0].href).to.equal(`${expectedBase}&q=logo templates`);
      expect(mockAnchors[1].href).to.equal(`${expectedBase}&q=business card templates`);
    });

    it('should use first URL from comma-separated list', () => {
      const baseURL = 'https://first.com, https://second.com, https://third.com';
      const expectedBase = 'https://first.com?acomx-dno=true&category=templates';

      const mockAnchor = {
        title: 'test template',
        href: '',
        classList: { add: () => {} },
      };

      mockLinks[0].querySelector = () => mockAnchor;

      formatSmartBlockLinks([mockLinks[0]], baseURL);

      expect(mockAnchor.href).to.equal(`${expectedBase}&q=test template`);
    });

    it('should handle baseURL with spaces in comma-separated list', () => {
      const baseURL = ' https://first.com , https://second.com ';
      const expectedBase = 'https://first.com?acomx-dno=true&category=templates';

      const mockAnchor = {
        title: 'test template',
        href: '',
        classList: { add: () => {} },
      };

      mockLinks[0].querySelector = () => mockAnchor;

      formatSmartBlockLinks([mockLinks[0]], baseURL);

      expect(mockAnchor.href).to.equal(`${expectedBase}&q=test template`);
    });

    it('should add floating-cta-ignore class to anchors', () => {
      const baseURL = 'https://example.com';
      let classAdded = false;

      const mockAnchor = {
        title: 'test template',
        href: '',
        classList: {
          add: (className) => {
            if (className === 'floating-cta-ignore') {
              classAdded = true;
            }
          },
        },
      };

      mockLinks[0].querySelector = () => mockAnchor;

      formatSmartBlockLinks([mockLinks[0]], baseURL);

      expect(classAdded).to.be.true;
    });

    it('should return early if baseURL results in empty array after processing', () => {
      const baseURL = '';
      const mockAnchor = {
        title: 'test template',
        href: 'original-href',
        classList: { add: () => {} },
      };

      mockLinks[0].querySelector = () => mockAnchor;

      formatSmartBlockLinks([mockLinks[0]], baseURL);

      // href should remain unchanged if baseURL is empty
      expect(mockAnchor.href).to.equal('original-href');
    });
  });
});
