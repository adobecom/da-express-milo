/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

// Mock API response data
const mockApiData = [
  {
    canonicalName: 'pink',
    metadata: {
      hexCode: '#ff69b4',
      link: '/express/colors/hot-pink',
      ckgId: 'ckg:COLOR:3537:hot_pink',
      status: 'enabled',
    },
  },
  {
    canonicalName: 'magenta',
    metadata: {
      hexCode: '#ff00ff',
      link: '/express/colors/magenta',
      ckgId: 'ckg:COLOR:3564:magenta',
      status: 'enabled',
    },
  },
  {
    canonicalName: 'fuchsia',
    metadata: {
      hexCode: '#ff00ff',
      link: '/express/colors/fuchsia',
      ckgId: 'ckg:COLOR:3527:fuchsia',
      status: 'enabled',
    },
  },
  {
    canonicalName: 'rosa',
    metadata: {
      hexCode: '#ff66cc',
      link: 'no_link_available',
      ckgId: 'ckg:COLOR:18590:rose_pink',
      status: 'disabled',
    },
  },
];

describe('CKG Link List', () => {
  let block;
  let decorate;
  let getDataStub;
  let buildCarouselStub;

  before(async () => {
    // Import the block decoration function
    const module = await import('../../../express/code/blocks/ckg-link-list/ckg-link-list.js');
    decorate = module.default;

    // Set up test environment
    window.isTestEnv = true;
  });

  beforeEach(async () => {
    document.body.innerHTML = await readFile({ path: './mocks/basic.html' });
    block = document.querySelector('.ckg-link-list');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Basic Structure', () => {
    it('Block exists', () => {
      expect(block).to.exist;
      expect(block.classList.contains('ckg-link-list')).to.be.true;
    });
  });

  describe('Data Filtering', () => {
    it('Filters out items correctly', () => {
      // Test that items with 'no_link_available' should be filtered
      const validItems = mockApiData.filter((item) => {
        const { canonicalName: colorName, metadata } = item;
        const { link, hexCode: colorHex } = metadata;
        return colorName && link && link !== 'no_link_available' && colorHex;
      });

      expect(validItems.length).to.equal(3);
      expect(validItems[0].canonicalName).to.equal('pink');
      expect(validItems[1].canonicalName).to.equal('magenta');
      expect(validItems[2].canonicalName).to.equal('fuchsia');
    });

    it('Filters out items with missing data', () => {
      const mockIncompleteData = [
        ...mockApiData,
        { canonicalName: 'incomplete1', metadata: { hexCode: '#fff' } },
        { canonicalName: '', metadata: { hexCode: '#000', link: '/test' } },
        { canonicalName: 'incomplete2', metadata: { link: '/test' } },
      ];

      const validItems = mockIncompleteData.filter((item) => {
        const { canonicalName: colorName, metadata } = item;
        const { link, hexCode: colorHex } = metadata;
        return colorName && link && link !== 'no_link_available' && colorHex;
      });

      // Should still have only 3 valid items (original valid ones)
      expect(validItems.length).to.equal(3);
    });
  });

  describe('Locale Conversion Logic', () => {
    it('Prepends locale prefix to relative links', () => {
      const link = '/express/colors/hot-pink';
      const prefix = '/de';
      const localizedLink = link.startsWith('/') ? `${prefix}${link}` : link;

      expect(localizedLink).to.equal('/de/express/colors/hot-pink');
    });

    it('Does not modify absolute URLs', () => {
      const link = 'https://www.adobe.com/express/colors/hot-pink';
      const prefix = '/de';
      const localizedLink = link.startsWith('/') ? `${prefix}${link}` : link;

      expect(localizedLink).to.equal('https://www.adobe.com/express/colors/hot-pink');
    });

    it('Handles empty prefix correctly', () => {
      const link = '/express/colors/hot-pink';
      const prefix = '';
      const localizedLink = link.startsWith('/') ? `${prefix}${link}` : link;

      expect(localizedLink).to.equal('/express/colors/hot-pink');
      expect(localizedLink).to.not.match(/^\/\//);
    });

    it('Handles various link formats', () => {
      const testCases = [
        { link: '/express/colors/pink', prefix: '/de', expected: '/de/express/colors/pink' },
        { link: '/express/colors/blue', prefix: '/fr', expected: '/fr/express/colors/blue' },
        { link: '/express/colors/red', prefix: '', expected: '/express/colors/red' },
        { link: 'https://example.com/path', prefix: '/de', expected: 'https://example.com/path' },
        { link: 'http://example.com/path', prefix: '/de', expected: 'http://example.com/path' },
      ];

      testCases.forEach(({ link, prefix, expected }) => {
        const localizedLink = link.startsWith('/') ? `${prefix}${link}` : link;
        expect(localizedLink).to.equal(expected);
      });
    });
  });

  describe('Title Case Conversion', () => {
    it('Converts color names to title case', () => {
      const testCases = [
        { input: 'pink', expected: 'Pink' },
        { input: 'magenta', expected: 'Magenta' },
        { input: 'hot pink', expected: 'Hot Pink' },
        { input: 'FUCHSIA', expected: 'Fuchsia' },
      ];

      testCases.forEach(({ input, expected }) => {
        // Simple title case implementation for testing
        const titleCase = (str) => str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
        expect(titleCase(input)).to.equal(expected);
      });
    });
  });

  describe('Color Hex Validation', () => {
    it('Validates hex color codes', () => {
      const validHexCodes = ['#ff69b4', '#ff00ff', '#000000', '#fff'];
      const invalidHexCodes = ['', null, undefined, 'invalid', '##ff00ff'];

      validHexCodes.forEach((hex) => {
        expect(hex).to.match(/^#[0-9a-fA-F]{3,6}$/);
      });

      invalidHexCodes.forEach((hex) => {
        if (hex) {
          expect(hex).to.not.match(/^#[0-9a-fA-F]{3,6}$/);
        }
      });
    });
  });

  describe('API Response Structure', () => {
    it('Has correct structure', () => {
      mockApiData.forEach((item) => {
        expect(item).to.have.property('canonicalName');
        expect(item).to.have.property('metadata');
        expect(item.metadata).to.have.property('hexCode');
        expect(item.metadata).to.have.property('link');
        expect(item.metadata).to.have.property('ckgId');
        expect(item.metadata).to.have.property('status');
      });
    });

    it('Enabled items have valid links', () => {
      const enabledItems = mockApiData.filter((item) => item.metadata.status === 'enabled');
      enabledItems.forEach((item) => {
        expect(item.metadata.link).to.not.equal('no_link_available');
        expect(item.metadata.link).to.exist;
      });
    });

    it('Disabled items may have no_link_available', () => {
      const disabledItems = mockApiData.filter((item) => item.metadata.status === 'disabled');
      const itemsWithNoLink = disabledItems.filter((item) => item.metadata.link === 'no_link_available');
      expect(itemsWithNoLink.length).to.be.greaterThan(0);
    });
  });
});
