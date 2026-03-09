import { expect } from '@esm-bundle/chai';
import {
  convertsRGBToLinearRGB,
  convertLinearRGBToXYZ,
  convertXYZtoxyY,
  convertxyYtoXYZ,
  convertXYZtoLinearRGB,
  convertLinearToSRGB,
  convertsRGBtoxyY,
  convertxyYtosRGB,
  deNormalizeRGB,
  isInRGBGamut,
} from '../../../../express/code/blocks/contrast-checker/services/contrastConversions.js';

describe('contrastConversions', () => {
  describe('convertsRGBToLinearRGB', () => {
    it('converts black to black', () => {
      const result = convertsRGBToLinearRGB({ r: 0, g: 0, b: 0 });
      expect(result.r).to.equal(0);
      expect(result.g).to.equal(0);
      expect(result.b).to.equal(0);
    });

    it('converts white to white', () => {
      const result = convertsRGBToLinearRGB({ r: 1, g: 1, b: 1 });
      expect(result.r).to.be.closeTo(1, 0.001);
      expect(result.g).to.be.closeTo(1, 0.001);
      expect(result.b).to.be.closeTo(1, 0.001);
    });

    it('uses low-range formula for values at or below 0.04045', () => {
      const result = convertsRGBToLinearRGB({ r: 0.04, g: 0, b: 0 });
      expect(result.r).to.be.closeTo(0.04 / 12.92, 0.0001);
    });

    it('uses gamma formula for mid-range values', () => {
      const result = convertsRGBToLinearRGB({ r: 0.5, g: 0, b: 0 });
      const expected = ((0.5 + 0.055) / 1.055) ** 2.4;
      expect(result.r).to.be.closeTo(expected, 0.001);
    });
  });

  describe('convertLinearRGBToXYZ', () => {
    it('converts black to origin', () => {
      const result = convertLinearRGBToXYZ({ r: 0, g: 0, b: 0 });
      expect(result.x).to.equal(0);
      expect(result.y).to.equal(0);
      expect(result.z).to.equal(0);
    });

    it('converts linear white to D65 reference', () => {
      const result = convertLinearRGBToXYZ({ r: 1, g: 1, b: 1 });
      expect(result.x).to.be.closeTo(0.9505, 0.001);
      expect(result.y).to.be.closeTo(1, 0.001);
      expect(result.z).to.be.closeTo(1.089, 0.001);
    });

    it('converts pure linear red', () => {
      const result = convertLinearRGBToXYZ({ r: 1, g: 0, b: 0 });
      expect(result.x).to.be.closeTo(0.4125, 0.001);
      expect(result.y).to.be.closeTo(0.2127, 0.001);
      expect(result.z).to.be.closeTo(0.0193, 0.001);
    });
  });

  describe('convertXYZtoxyY', () => {
    it('returns zeros for black', () => {
      const result = convertXYZtoxyY({ x: 0, y: 0, z: 0 });
      expect(result.x).to.equal(0);
      expect(result.y).to.equal(0);
      expect(result.Y).to.equal(0);
    });

    it('returns D65 chromaticity for white-ish XYZ', () => {
      const result = convertXYZtoxyY({ x: 0.9505, y: 1, z: 1.089 });
      expect(result.x).to.be.closeTo(0.3127, 0.001);
      expect(result.y).to.be.closeTo(0.329, 0.001);
      expect(result.Y).to.be.closeTo(1, 0.001);
    });
  });

  describe('convertxyYtoXYZ', () => {
    it('returns zeros when y chromaticity is zero', () => {
      const result = convertxyYtoXYZ({ x: 0.3, y: 0, Y: 0.5 });
      expect(result.x).to.equal(0);
      expect(result.y).to.equal(0);
      expect(result.z).to.equal(0);
    });

    it('round-trips with convertXYZtoxyY', () => {
      const original = { x: 0.4, y: 0.3, z: 0.2 };
      const xyY = convertXYZtoxyY(original);
      const back = convertxyYtoXYZ(xyY);
      expect(back.x).to.be.closeTo(original.x, 0.001);
      expect(back.y).to.be.closeTo(original.y, 0.001);
      expect(back.z).to.be.closeTo(original.z, 0.001);
    });
  });

  describe('convertLinearToSRGB', () => {
    it('converts black to black', () => {
      const result = convertLinearToSRGB({ r: 0, g: 0, b: 0 });
      expect(result.r).to.equal(0);
      expect(result.g).to.equal(0);
      expect(result.b).to.equal(0);
    });

    it('converts white to white', () => {
      const result = convertLinearToSRGB({ r: 1, g: 1, b: 1 });
      expect(result.r).to.be.closeTo(1, 0.001);
      expect(result.g).to.be.closeTo(1, 0.001);
      expect(result.b).to.be.closeTo(1, 0.001);
    });

    it('uses low-range formula for small values', () => {
      const result = convertLinearToSRGB({ r: 0.002, g: 0, b: 0 });
      expect(result.r).to.be.closeTo(12.92 * 0.002, 0.0001);
    });
  });

  describe('round-trip sRGB → xyY → sRGB', () => {
    const testColors = [
      { name: 'white', color: { r: 1, g: 1, b: 1 } },
      { name: 'red', color: { r: 1, g: 0, b: 0 } },
      { name: 'green', color: { r: 0, g: 1, b: 0 } },
      { name: 'blue', color: { r: 0, g: 0, b: 1 } },
      { name: 'mid-gray', color: { r: 0.5, g: 0.5, b: 0.5 } },
      { name: 'arbitrary', color: { r: 0.6, g: 0.3, b: 0.8 } },
    ];

    testColors.forEach(({ name, color }) => {
      it(`preserves ${name} within ±0.001`, () => {
        const xyY = convertsRGBtoxyY(color);
        const back = convertxyYtosRGB(xyY);
        expect(back.r).to.be.closeTo(color.r, 0.001);
        expect(back.g).to.be.closeTo(color.g, 0.001);
        expect(back.b).to.be.closeTo(color.b, 0.001);
      });
    });
  });

  describe('round-trip linearRGB → XYZ → linearRGB', () => {
    it('preserves mid-value linear RGB', () => {
      const original = { r: 0.3, g: 0.5, b: 0.7 };
      const xyz = convertLinearRGBToXYZ(original);
      const back = convertXYZtoLinearRGB(xyz);
      expect(back.r).to.be.closeTo(original.r, 0.001);
      expect(back.g).to.be.closeTo(original.g, 0.001);
      expect(back.b).to.be.closeTo(original.b, 0.001);
    });
  });

  describe('deNormalizeRGB', () => {
    it('scales 0-1 to 0-255', () => {
      const result = deNormalizeRGB({ r: 1, g: 0, b: 0.5 });
      expect(result).to.deep.equal({ r: 255, g: 0, b: 128 });
    });

    it('clamps out-of-range values', () => {
      const result = deNormalizeRGB({ r: 1.1, g: -0.1, b: 0.5 });
      expect(result).to.deep.equal({ r: 255, g: 0, b: 128 });
    });
  });

  describe('isInRGBGamut', () => {
    it('returns true for mid-range values', () => {
      expect(isInRGBGamut({ r: 0.5, g: 0.5, b: 0.5 })).to.be.true;
    });

    it('returns false when a channel exceeds 1 beyond epsilon', () => {
      expect(isInRGBGamut({ r: 1.1, g: 0, b: 0 })).to.be.false;
    });

    it('returns false when a channel is below 0 beyond epsilon', () => {
      expect(isInRGBGamut({ r: -0.1, g: 0, b: 0 })).to.be.false;
    });

    it('returns true for values within epsilon tolerance', () => {
      expect(isInRGBGamut({ r: 1.0005, g: 0, b: 0 })).to.be.true;
    });

    it('returns true for exact boundary values', () => {
      expect(isInRGBGamut({ r: 0, g: 0, b: 0 })).to.be.true;
      expect(isInRGBGamut({ r: 1, g: 1, b: 1 })).to.be.true;
    });
  });
});
