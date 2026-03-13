import { expect } from '@esm-bundle/chai';
import createRecommendationService from '../../../../express/code/blocks/contrast-checker/services/createRecommendationService.js';
import createContrastDataService from '../../../../express/code/blocks/contrast-checker/services/createContrastDataService.js';

describe('createRecommendationService', () => {
  let service;
  let dataService;

  beforeEach(() => {
    service = createRecommendationService();
    dataService = createContrastDataService();
  });

  describe('solveContrastRatio', () => {
    it('returns a valid result for black on white at 4.5:1', () => {
      const result = service.solveContrastRatio('#FFFFFF', '#000000', 4.5);
      expect(result.valid).to.be.true;
      expect(result.outsRGB).to.have.keys('r', 'g', 'b');
    });

    it('produces a color that achieves the target ratio', () => {
      const target = 4.5;
      const bgHex = '#FFFFFF';
      const result = service.solveContrastRatio(bgHex, '#777777', target);
      if (result.valid) {
        const { r, g, b } = result.outsRGB;
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
        const ratio = dataService.calculateRatio(hex, bgHex);
        expect(ratio).to.be.at.least(target);
      }
    });

    it('handles an already-passing pair', () => {
      const result = service.solveContrastRatio('#FFFFFF', '#000000', 3);
      expect(result.valid).to.be.true;
    });

    it('returns invalid for an impossible luminance target', () => {
      const result = service.solveContrastRatio('#808080', '#7F7F7F', 21);
      expect(result.valid).to.be.false;
    });
  });

  describe('findContrastingColor', () => {
    it('returns a valid result for a basic pair', () => {
      const result = service.findContrastingColor('#666666', '#FFFFFF', 4.5);
      expect(result.valid).to.be.true;
    });

    it('returns invalid for an extreme target ratio', () => {
      const result = service.findContrastingColor('#808080', '#7E7E7E', 100);
      expect(result.valid).to.be.false;
    });

    it('returned color meets the target ratio', () => {
      const bgHex = '#FFFFFF';
      const result = service.findContrastingColor('#999999', bgHex, 4.5);
      if (result.valid) {
        const { r, g, b } = result.outsRGB;
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
        const ratio = dataService.calculateRatio(hex, bgHex);
        expect(ratio).to.be.at.least(4.5);
      }
    });
  });

  describe('getSuggestedColors', () => {
    it('returns at most 3 suggestions', () => {
      const suggestions = service.getSuggestedColors(3, '#FFFFFF', '#999999');
      expect(suggestions).to.be.an('array');
      expect(suggestions.length).to.be.at.most(3);
    });

    it('each suggestion has fg, bg, and ratio properties', () => {
      const suggestions = service.getSuggestedColors(3, '#FFFFFF', '#999999');
      suggestions.forEach((s) => {
        expect(s).to.have.property('fg');
        expect(s).to.have.property('bg');
        expect(s).to.have.property('ratio');
      });
    });

    it('all suggestion ratios meet or exceed their target thresholds', () => {
      const currentRatio = 3;
      const suggestions = service.getSuggestedColors(currentRatio, '#FFFFFF', '#999999');
      const startRatio = Math.ceil(currentRatio) + 1;
      suggestions.forEach((s, i) => {
        expect(s.ratio).to.be.at.least(startRatio + i);
      });
    });

    it('returns empty array when contrast is already maximal', () => {
      const suggestions = service.getSuggestedColors(21, '#FFFFFF', '#000000');
      expect(suggestions).to.be.an('array');
      expect(suggestions.length).to.equal(0);
    });

    it('returns suggestions for a medium-contrast pair', () => {
      const suggestions = service.getSuggestedColors(2.5, '#DDDDDD', '#AAAAAA');
      expect(suggestions).to.be.an('array');
      expect(suggestions.length).to.be.greaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles same color for fg and bg', () => {
      const suggestions = service.getSuggestedColors(1, '#888888', '#888888');
      expect(suggestions).to.be.an('array');
    });

    it('handles very dark fg and bg', () => {
      const result = service.findContrastingColor('#111111', '#222222', 4.5);
      expect(result).to.have.property('valid');
      expect(result).to.have.property('outsRGB');
    });
  });
});
