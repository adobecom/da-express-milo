import { expect } from '@esm-bundle/chai';
import {
  extractTemplateMetadata,
  getBlockStylingConfig,
  determineTemplateRouting,
} from '../../../express/code/blocks/template-x-promo/template-x-promo-utils.js';

describe('Template X Promo Utility Functions', () => {
  describe('extractTemplateMetadata', () => {
    it('should extract metadata from template data with all fields', () => {
      const templateData = {
        customLinks: { branchUrl: 'https://custom.branch.url' },
        thumbnail: { url: 'https://thumbnail.url' },
        'dc:title': { 'i-default': 'Test Template' },
        licensingCategory: 'free',
      };

      const result = extractTemplateMetadata(templateData);

      expect(result).to.deep.equal({
        editUrl: 'https://custom.branch.url',
        imageUrl: 'https://thumbnail.url',
        title: 'Test Template',
        isFree: true,
        isPremium: false,
      });
    });

    it('should fallback to branchUrl when customLinks.branchUrl is not available', () => {
      const templateData = {
        branchUrl: 'https://fallback.branch.url',
        thumbnail: 'https://thumbnail.url',
        title: { 'i-default': 'Test Template' },
        licensingCategory: 'premium',
      };

      const result = extractTemplateMetadata(templateData);

      expect(result.editUrl).to.equal('https://fallback.branch.url');
      expect(result.isFree).to.be.false;
      expect(result.isPremium).to.be.true;
    });

    it('should fallback to # when no edit URL is available', () => {
      const templateData = {
        thumbnail: 'https://thumbnail.url',
        title: 'Test Template',
        licensingCategory: 'free',
      };

      const result = extractTemplateMetadata(templateData);

      expect(result.editUrl).to.equal('#');
    });

    it('should handle string thumbnail directly', () => {
      const templateData = {
        thumbnail: 'https://direct.thumbnail.url',
        title: 'Test Template',
        licensingCategory: 'free',
      };

      const result = extractTemplateMetadata(templateData);

      expect(result.imageUrl).to.equal('https://direct.thumbnail.url');
    });

    it('should fallback to _links rendition for imageUrl', () => {
      const templateData = {
        _links: {
          'http://ns.adobe.com/adobecloud/rel/rendition': {
            href: 'https://rendition.url',
          },
        },
        title: 'Test Template',
        licensingCategory: 'free',
      };

      const result = extractTemplateMetadata(templateData);

      expect(result.imageUrl).to.equal('https://rendition.url');
    });

    it('should handle string title directly', () => {
      const templateData = {
        title: 'Direct String Title',
        licensingCategory: 'free',
      };

      const result = extractTemplateMetadata(templateData);

      expect(result.title).to.equal('Direct String Title');
    });

    it('should return empty string for missing title', () => {
      const templateData = {
        licensingCategory: 'free',
      };

      const result = extractTemplateMetadata(templateData);

      expect(result.title).to.equal('');
    });

    it('should handle premium licensing category', () => {
      const templateData = {
        licensingCategory: 'premium',
        title: 'Premium Template',
      };

      const result = extractTemplateMetadata(templateData);

      expect(result.isFree).to.be.false;
      expect(result.isPremium).to.be.true;
    });

    it('should handle undefined licensing category as premium', () => {
      const templateData = {
        title: 'Unknown License Template',
      };

      const result = extractTemplateMetadata(templateData);

      expect(result.isFree).to.be.false;
      expect(result.isPremium).to.be.true;
    });
  });

  describe('getBlockStylingConfig', () => {
    let testBlock;

    beforeEach(() => {
      testBlock = document.createElement('div');
      testBlock.className = 'template-x-promo multiple-up two-up';
      document.body.appendChild(testBlock);
    });

    afterEach(() => {
      if (testBlock && testBlock.parentNode) {
        testBlock.parentNode.removeChild(testBlock);
      }
    });

    it('should return config with shouldApply true when block has parent', () => {
      const result = getBlockStylingConfig(testBlock);

      expect(result).to.deep.equal({
        parentClasses: ['ax-template-x-promo'],
        shouldApply: true,
      });
    });

    it('should return config with shouldApply false when block has no parent', () => {
      const orphanBlock = document.createElement('div');
      orphanBlock.className = 'template-x-promo single-up';

      const result = getBlockStylingConfig(orphanBlock);

      expect(result).to.deep.equal({
        parentClasses: ['ax-template-x-promo'],
        shouldApply: false,
      });
    });

    it('should handle block with no classes', () => {
      testBlock.className = '';

      const result = getBlockStylingConfig(testBlock);

      expect(result).to.deep.equal({
        parentClasses: ['ax-template-x-promo'],
        shouldApply: true,
      });
    });

    it('should handle null block', () => {
      const result = getBlockStylingConfig(null);

      expect(result).to.deep.equal({
        parentClasses: ['ax-template-x-promo'],
        shouldApply: false,
      });
    });
  });

  describe('determineTemplateRouting', () => {
    it('should return none strategy for empty templates array', () => {
      const result = determineTemplateRouting([]);

      expect(result).to.deep.equal({
        strategy: 'none',
        reason: 'No templates available',
      });
    });

    it('should return none strategy for null templates', () => {
      const result = determineTemplateRouting(null);

      expect(result).to.deep.equal({
        strategy: 'none',
        reason: 'No templates available',
      });
    });

    it('should return none strategy for undefined templates', () => {
      const result = determineTemplateRouting(undefined);

      expect(result).to.deep.equal({
        strategy: 'none',
        reason: 'No templates available',
      });
    });

    it('should return one-up strategy for single template', () => {
      const templates = [{ id: 'template1', title: 'Test Template' }];
      const result = determineTemplateRouting(templates);

      expect(result).to.deep.equal({
        strategy: 'one-up',
        template: templates[0],
        reason: 'Single template display',
      });
    });

    it('should return carousel strategy for multiple templates', () => {
      const templates = [
        { id: 'template1', title: 'Test Template 1' },
        { id: 'template2', title: 'Test Template 2' },
      ];
      const result = determineTemplateRouting(templates);

      expect(result).to.deep.equal({
        strategy: 'carousel',
        templates,
        reason: 'Multiple templates - carousel display',
      });
    });

    it('should return carousel strategy for many templates', () => {
      const templates = Array.from({ length: 10 }, (_, i) => ({
        id: `template${i + 1}`,
        title: `Test Template ${i + 1}`,
      }));
      const result = determineTemplateRouting(templates);

      expect(result).to.deep.equal({
        strategy: 'carousel',
        templates,
        reason: 'Multiple templates - carousel display',
      });
    });
  });
});
