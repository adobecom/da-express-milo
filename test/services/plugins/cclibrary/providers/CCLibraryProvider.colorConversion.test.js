/* global globalThis */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import CCLibraryProvider from '../../../../../express/code/libs/services/providers/CCLibraryProvider.js';
import CCLibraryPlugin from '../../../../../express/code/libs/services/plugins/cclibrary/CCLibraryPlugin.js';
import {
  COLOR_MODE,
} from '../../../../../express/code/libs/services/plugins/cclibrary/constants.js';

function createTestPlugin(PluginClass, overrides = {}) {
  return new PluginClass({
    serviceConfig: {
      baseUrl: 'https://test.com',
      melvilleBasePath: 'https://libraries.test.io/api/v1',
      apiKey: 'test-key',
      endpoints: {
        libraries: '/libraries',
        themes: '/elements',
        metadata: '/metadata',
      },
      ...overrides.serviceConfig,
    },
    appConfig: {
      features: {},
      ...overrides.appConfig,
    },
  });
}

describe('CCLibraryProvider - color conversion', () => {
  let plugin;
  let provider;

  beforeEach(() => {
    sinon.stub(globalThis, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    globalThis.adobeIMS = {
      isSignedInUser: sinon.stub().returns(true),
      getAccessToken: sinon.stub().returns({ token: 'mock-token' }),
    };

    globalThis.lana = { log: sinon.stub() };

    plugin = createTestPlugin(CCLibraryPlugin);
    provider = new CCLibraryProvider(plugin);
  });

  afterEach(() => {
    sinon.restore();
    delete globalThis.adobeIMS;
    delete globalThis.lana;
  });

  // convertSwatchToCCFormat
  describe('convertSwatchToCCFormat', () => {
    it('should return a single RGB entry for RGB color mode', () => {
      const swatch = { rgb: { r: 0.5, g: 0.25, b: 0.75 } };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.RGB);

      expect(result).to.have.lengthOf(1);
      expect(result[0].mode).to.equal(COLOR_MODE.RGB);
      expect(result[0].value).to.deep.equal({ r: 128, g: 64, b: 191 });
    });

    it('should scale RGB 0-1 floats to 0-255 integers', () => {
      const swatch = { rgb: { r: 0, g: 1, b: 0.5 } };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.RGB);

      expect(result[0].value).to.deep.equal({ r: 0, g: 255, b: 128 });
    });

    it('should return CMYK entry + RGB entry for CMYK color mode', () => {
      const swatch = {
        rgb: { r: 0.5, g: 0.5, b: 0.5 },
        cmyk: { c: 10, m: 20, y: 30, k: 40 },
      };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.CMYK);

      expect(result).to.have.lengthOf(2);
      expect(result[0].mode).to.equal(COLOR_MODE.CMYK);
      expect(result[0].value).to.deep.equal({ c: 10, m: 20, y: 30, k: 40 });
      expect(result[1].mode).to.equal(COLOR_MODE.RGB);
    });

    it('should return HSB entry + RGB entry for HSB color mode', () => {
      const swatch = {
        rgb: { r: 0.5, g: 0.5, b: 0.5 },
        hsb: { h: 180, s: 50, b: 75 },
      };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.HSB);

      expect(result).to.have.lengthOf(2);
      expect(result[0].mode).to.equal(COLOR_MODE.HSB);
      expect(result[0].value).to.deep.equal({ h: 180, s: 50, b: 75 });
      expect(result[1].mode).to.equal(COLOR_MODE.RGB);
    });

    it('should return LAB entry + RGB entry for LAB color mode', () => {
      const swatch = {
        rgb: { r: 0.5, g: 0.5, b: 0.5 },
        lab: { l: 50, a: -10, b: 20 },
      };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.LAB);

      expect(result).to.have.lengthOf(2);
      expect(result[0].mode).to.equal(COLOR_MODE.LAB);
      expect(result[0].value).to.deep.equal({ l: 50, a: -10, b: 20 });
      expect(result[1].mode).to.equal(COLOR_MODE.RGB);
    });

    it('should round CMYK values to integers', () => {
      const swatch = {
        rgb: { r: 0.5, g: 0.5, b: 0.5 },
        cmyk: { c: 10.6, m: 20.3, y: 30.9, k: 40.1 },
      };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.CMYK);

      expect(result[0].value).to.deep.equal({ c: 11, m: 20, y: 31, k: 40 });
    });

    it('should return only RGB entry when CMYK mode but cmyk data is missing', () => {
      const swatch = { rgb: { r: 0.5, g: 0.5, b: 0.5 } };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.CMYK);

      expect(result).to.have.lengthOf(1);
      expect(result[0].mode).to.equal(COLOR_MODE.RGB);
    });

    it('should return only RGB entry when HSB mode but hsb data is missing', () => {
      const swatch = { rgb: { r: 0.5, g: 0.5, b: 0.5 } };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.HSB);

      expect(result).to.have.lengthOf(1);
      expect(result[0].mode).to.equal(COLOR_MODE.RGB);
    });

    it('should return only RGB entry when LAB mode but lab data is missing', () => {
      const swatch = { rgb: { r: 0.5, g: 0.5, b: 0.5 } };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.LAB);

      expect(result).to.have.lengthOf(1);
      expect(result[0].mode).to.equal(COLOR_MODE.RGB);
    });

    it('should add pantone spot color info to RGB entry', () => {
      const swatch = {
        rgb: { r: 0.5, g: 0.5, b: 0.5 },
        pantone: '185 C',
        isSpotColor: true,
      };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.RGB);

      expect(result).to.have.lengthOf(1);
      expect(result[0].type).to.equal('spot');
      expect(result[0].spotColorName).to.equal('PANTONE 185 C');
    });

    it('should add pantone process color info to RGB entry', () => {
      const swatch = {
        rgb: { r: 0.5, g: 0.5, b: 0.5 },
        pantone: '300 C',
        isSpotColor: false,
      };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.RGB);

      expect(result[0].type).to.equal('process');
      expect(result[0].spotColorName).to.equal('PANTONE 300 C');
    });

    it('should not add pantone info when pantone is absent', () => {
      const swatch = { rgb: { r: 0.5, g: 0.5, b: 0.5 } };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.RGB);

      expect(result[0]).to.not.have.property('type');
      expect(result[0]).to.not.have.property('spotColorName');
    });

    it('should include pantone info on RGB entry even in non-RGB color modes', () => {
      const swatch = {
        rgb: { r: 0.5, g: 0.5, b: 0.5 },
        cmyk: { c: 10, m: 20, y: 30, k: 40 },
        pantone: '185 C',
        isSpotColor: true,
      };
      const result = provider.convertSwatchToCCFormat(swatch, COLOR_MODE.CMYK);

      expect(result).to.have.lengthOf(2);
      // CMYK entry should not have pantone info
      expect(result[0]).to.not.have.property('type');
      // RGB entry should have pantone info
      expect(result[1].type).to.equal('spot');
      expect(result[1].spotColorName).to.equal('PANTONE 185 C');
    });
  });

  // convertSwatchesToCCFormat
  describe('convertSwatchesToCCFormat', () => {
    it('should return empty array for null input', () => {
      expect(provider.convertSwatchesToCCFormat(null, COLOR_MODE.RGB)).to.deep.equal([]);
    });

    it('should return empty array for undefined input', () => {
      expect(provider.convertSwatchesToCCFormat(undefined, COLOR_MODE.RGB)).to.deep.equal([]);
    });

    it('should return empty array for non-array input', () => {
      expect(provider.convertSwatchesToCCFormat('not-array', COLOR_MODE.RGB)).to.deep.equal([]);
    });

    it('should handle empty array', () => {
      expect(provider.convertSwatchesToCCFormat([], COLOR_MODE.RGB)).to.deep.equal([]);
    });

    it('should convert an array of swatches', () => {
      const swatches = [
        { rgb: { r: 1, g: 0, b: 0 } },
        { rgb: { r: 0, g: 1, b: 0 } },
        { rgb: { r: 0, g: 0, b: 1 } },
      ];
      const result = provider.convertSwatchesToCCFormat(swatches, COLOR_MODE.RGB);

      expect(result).to.have.lengthOf(3);
      expect(result[0][0].value).to.deep.equal({ r: 255, g: 0, b: 0 });
      expect(result[1][0].value).to.deep.equal({ r: 0, g: 255, b: 0 });
      expect(result[2][0].value).to.deep.equal({ r: 0, g: 0, b: 255 });
    });

    it('should produce multi-entry arrays for non-RGB color mode', () => {
      const swatches = [
        { rgb: { r: 0.5, g: 0.5, b: 0.5 }, cmyk: { c: 0, m: 0, y: 0, k: 50 } },
      ];
      const result = provider.convertSwatchesToCCFormat(swatches, COLOR_MODE.CMYK);

      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.lengthOf(2);
      expect(result[0][0].mode).to.equal(COLOR_MODE.CMYK);
      expect(result[0][1].mode).to.equal(COLOR_MODE.RGB);
    });
  });
});
