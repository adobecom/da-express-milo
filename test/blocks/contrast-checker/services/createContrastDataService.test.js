import { expect } from '@esm-bundle/chai';
import createContrastDataService from '../../../../express/code/blocks/contrast-checker/services/createContrastDataService.js';

describe('createContrastDataService', () => {
  let service;

  beforeEach(() => {
    service = createContrastDataService();
  });

  describe('hexToRGB', () => {
    it('converts pure red', () => {
      expect(service.hexToRGB('#FF0000')).to.deep.equal({ r: 255, g: 0, b: 0 });
    });

    it('converts pure green', () => {
      expect(service.hexToRGB('#00FF00')).to.deep.equal({ r: 0, g: 255, b: 0 });
    });

    it('converts pure blue', () => {
      expect(service.hexToRGB('#0000FF')).to.deep.equal({ r: 0, g: 0, b: 255 });
    });

    it('converts white', () => {
      expect(service.hexToRGB('#FFFFFF')).to.deep.equal({ r: 255, g: 255, b: 255 });
    });

    it('converts black', () => {
      expect(service.hexToRGB('#000000')).to.deep.equal({ r: 0, g: 0, b: 0 });
    });

    it('handles hex without hash prefix', () => {
      expect(service.hexToRGB('FF0000')).to.deep.equal({ r: 255, g: 0, b: 0 });
    });
  });

  describe('linearize', () => {
    it('is accessible via the service API', () => {
      expect(service.linearize).to.be.a('function');
    });

    it('returns 0 for channel value 0', () => {
      expect(service.linearize(0)).to.equal(0);
    });

    it('returns 1 for channel value 255', () => {
      expect(service.linearize(255)).to.equal(1);
    });

    it('uses the low-range formula for values at or below the 0.04045 threshold', () => {
      const result = service.linearize(10);
      expect(result).to.be.lessThan(0.004);
    });
  });

  describe('getRelativeLuminance', () => {
    it('returns 1.0 for white', () => {
      const lum = service.getRelativeLuminance({ r: 255, g: 255, b: 255 });
      expect(lum).to.equal(1);
    });

    it('returns 0.0 for black', () => {
      const lum = service.getRelativeLuminance({ r: 0, g: 0, b: 0 });
      expect(lum).to.equal(0);
    });

    it('gives red a luminance around 0.2126', () => {
      const lum = service.getRelativeLuminance({ r: 255, g: 0, b: 0 });
      expect(lum).to.be.closeTo(0.2126, 0.001);
    });
  });

  describe('isValidHex', () => {
    it('accepts 6-digit hex with hash', () => {
      expect(service.isValidHex('#AABBCC')).to.be.true;
    });

    it('accepts 6-digit hex without hash', () => {
      expect(service.isValidHex('AABBCC')).to.be.true;
    });

    it('accepts lowercase hex', () => {
      expect(service.isValidHex('#aabbcc')).to.be.true;
    });

    it('rejects invalid hex characters', () => {
      expect(service.isValidHex('#GGGGGG')).to.be.false;
    });

    it('rejects 3-digit shorthand hex', () => {
      expect(service.isValidHex('#ABC')).to.be.false;
    });

    it('rejects empty string', () => {
      expect(service.isValidHex('')).to.be.false;
    });
  });

  describe('calculateRatio', () => {
    it('returns 21 for black on white', () => {
      const ratio = service.calculateRatio('#000000', '#FFFFFF');
      expect(ratio).to.equal(21);
    });

    it('returns 1 for identical colors', () => {
      const ratio = service.calculateRatio('#FF0000', '#FF0000');
      expect(ratio).to.equal(1);
    });

    it('returns the same ratio regardless of argument order', () => {
      const r1 = service.calculateRatio('#000000', '#FFFFFF');
      const r2 = service.calculateRatio('#FFFFFF', '#000000');
      expect(r1).to.equal(r2);
    });

    it('returns a ratio >= 1', () => {
      const ratio = service.calculateRatio('#FFFFFF', '#000000');
      expect(ratio).to.be.at.least(1);
    });
  });

  describe('calculateRatioDirectional', () => {
    it('returns same ratio as calculateRatio when fg is darker than bg', () => {
      const directional = service.calculateRatioDirectional('#000000', '#FFFFFF');
      const standard = service.calculateRatio('#000000', '#FFFFFF');
      expect(directional).to.equal(standard);
    });

    it('returns ratio < 1 when fg is lighter than bg', () => {
      const ratio = service.calculateRatioDirectional('#FFFFFF', '#000000');
      expect(ratio).to.be.lessThan(1);
    });

    it('is the inverse of the swapped-argument ratio', () => {
      const r1 = service.calculateRatioDirectional('#336699', '#CCDDEE');
      const r2 = service.calculateRatioDirectional('#CCDDEE', '#336699');
      expect(r1 * r2).to.be.closeTo(1, 0.1);
    });

    it('returns 1 for identical colors', () => {
      const ratio = service.calculateRatioDirectional('#888888', '#888888');
      expect(ratio).to.equal(1);
    });
  });

  describe('checkWCAG', () => {
    it('passes all thresholds for black on white (21:1)', () => {
      const result = service.checkWCAG('#000000', '#FFFFFF');
      expect(result.ratio).to.equal(21);
      expect(result.normalAA).to.be.true;
      expect(result.largeAA).to.be.true;
      expect(result.normalAAA).to.be.true;
      expect(result.largeAAA).to.be.true;
      expect(result.uiComponents).to.be.true;
    });

    it('fails all thresholds for identical colors (1:1)', () => {
      const result = service.checkWCAG('#FFFFFF', '#FFFFFF');
      expect(result.ratio).to.equal(1);
      expect(result.normalAA).to.be.false;
      expect(result.largeAA).to.be.false;
      expect(result.normalAAA).to.be.false;
      expect(result.largeAAA).to.be.false;
      expect(result.uiComponents).to.be.false;
    });
  });

  describe('getWCAGLevel', () => {
    it('returns AAA when ratio is 7.0+ (e.g. black on white)', () => {
      const results = service.checkWCAG('#000000', '#FFFFFF');
      expect(service.getWCAGLevel(results)).to.equal('AAA');
    });

    it('returns AA when ratio is between 4.5 and 7.0', () => {
      const results = {
        normalAA: true,
        largeAA: true,
        normalAAA: false,
        largeAAA: true,
        uiComponents: true,
        ratio: 5,
      };
      expect(service.getWCAGLevel(results)).to.equal('AA');
    });

    it('returns FAIL when ratio is below 3.0', () => {
      const results = {
        normalAA: false,
        largeAA: false,
        normalAAA: false,
        largeAAA: false,
        uiComponents: false,
        ratio: 1.5,
      };
      expect(service.getWCAGLevel(results)).to.equal('FAIL');
    });

    it('returns AA when large text passes AAA but normal only passes AA', () => {
      const results = {
        normalAA: true,
        largeAA: true,
        normalAAA: false,
        largeAAA: true,
        uiComponents: true,
        ratio: 5,
      };
      expect(service.getWCAGLevel(results)).to.equal('AA');
    });

    it('returns AA at exact 4.5 ratio boundary', () => {
      const results = {
        normalAA: true,
        largeAA: true,
        normalAAA: false,
        largeAAA: true,
        uiComponents: true,
        ratio: 4.5,
      };
      expect(service.getWCAGLevel(results)).to.equal('AA');
    });

    it('returns AAA at exact 7.0 ratio boundary', () => {
      const results = {
        normalAA: true,
        largeAA: true,
        normalAAA: true,
        largeAAA: true,
        uiComponents: true,
        ratio: 7,
      };
      expect(service.getWCAGLevel(results)).to.equal('AAA');
    });

    it('returns FAIL when uiComponents fails even if normalAA and largeAA pass', () => {
      const results = {
        normalAA: true,
        largeAA: true,
        normalAAA: false,
        largeAAA: false,
        uiComponents: false,
        ratio: 4.5,
      };
      expect(service.getWCAGLevel(results)).to.equal('FAIL');
    });
  });

  describe('clearCache', () => {
    it('resets the internal cache without errors', () => {
      service.calculateRatio('#000000', '#FFFFFF');
      expect(() => service.clearCache()).to.not.throw();
    });
  });
});
