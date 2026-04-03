/* global globalThis */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import CCLibraryProvider from '../../../../../express/code/libs/services/providers/CCLibraryProvider.js';
import CCLibraryPlugin from '../../../../../express/code/libs/services/plugins/cclibrary/CCLibraryPlugin.js';
import {
  GRADIENT_ELEMENT_TYPE,
  GRADIENT_REPRESENTATION_TYPE,
  CC_LIBRARY_COLOR_MODE,
  getClientInfo,
  COLOR_PROFILE,
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

describe('CCLibraryProvider - gradient payload', () => {
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

    globalThis.adobeUserProfile = { userId: 'testuser123@AdobeID' };

    plugin = createTestPlugin(CCLibraryPlugin);
    provider = new CCLibraryProvider(plugin);
  });

  afterEach(() => {
    sinon.restore();
    delete globalThis.adobeIMS;
    delete globalThis.adobeUserProfile;
    delete globalThis.lana;
  });

  describe('buildGradientPayload', () => {
    it('should build a basic gradient payload with defaults', () => {
      const result = provider.buildGradientPayload({
        name: 'Test Gradient',
        stops: [
          { color: '#FF0000', position: 0 },
          { color: '#0000FF', position: 1 },
        ],
      });

      expect(result.name).to.equal('Test Gradient');
      expect(result.type).to.equal(GRADIENT_ELEMENT_TYPE);
      expect(result.client).to.deep.equal(getClientInfo());
      expect(result.representations).to.have.lengthOf(1);
    });

    it('should use "rel" field (not "relationship") on representations', () => {
      const result = provider.buildGradientPayload({
        name: 'Test',
        stops: [],
      });

      const rep = result.representations[0];
      expect(rep.rel).to.equal('primary');
      expect(rep).to.not.have.property('relationship');
    });

    it('should set correct representation type', () => {
      const result = provider.buildGradientPayload({
        name: 'Test',
        stops: [],
      });

      expect(result.representations[0].type).to.equal(GRADIENT_REPRESENTATION_TYPE);
    });

    it('should apply default gradient data values', () => {
      const result = provider.buildGradientPayload({
        name: 'Test',
        stops: [],
      });

      const gradientData = result.representations[0]['gradient#data'];
      expect(gradientData.angle).to.equal(90);
      expect(gradientData.aspectRatio).to.equal(1);
      expect(gradientData.interpolation).to.equal('linear');
      expect(gradientData.type).to.equal('linear');
      expect(gradientData.opacityStops).to.deep.equal([]);
    });

    it('should accept custom angle, aspectRatio, interpolation, and type', () => {
      const result = provider.buildGradientPayload({
        name: 'Custom',
        angle: 45,
        aspectRatio: 2,
        interpolation: 'ease',
        type: 'radial',
        stops: [],
      });

      const gradientData = result.representations[0]['gradient#data'];
      expect(gradientData.angle).to.equal(45);
      expect(gradientData.aspectRatio).to.equal(2);
      expect(gradientData.interpolation).to.equal('ease');
      expect(gradientData.type).to.equal('radial');
    });

    it('should default name to "Untitled gradient" when empty', () => {
      const result = provider.buildGradientPayload({ stops: [] });
      expect(result.name).to.equal('Untitled gradient');
    });

    it('should parse hex color stops correctly', () => {
      const result = provider.buildGradientPayload({
        name: 'Hex Test',
        stops: [{ color: '#FF5733', position: 0.5 }],
      });

      const stop = result.representations[0]['gradient#data'].stops[0];
      expect(stop.color).to.have.lengthOf(1);
      expect(stop.color[0].mode).to.equal(CC_LIBRARY_COLOR_MODE.RGB);
      expect(stop.color[0].value).to.deep.equal({ r: 255, g: 87, b: 51 });
      expect(stop.color[0].profileName).to.equal(COLOR_PROFILE);
      expect(stop.offset).to.equal(0.5);
      expect(stop.opacity).to.equal(1);
    });

    it('should parse 3-digit hex color stops', () => {
      const result = provider.buildGradientPayload({
        name: 'Short Hex',
        stops: [{ color: '#F00', position: 0 }],
      });

      const stop = result.representations[0]['gradient#data'].stops[0];
      expect(stop.color[0].value).to.deep.equal({ r: 255, g: 0, b: 0 });
    });

    it('should parse rgb() color stops', () => {
      const result = provider.buildGradientPayload({
        name: 'RGB Test',
        stops: [{ color: 'rgb(100, 200, 50)', position: 1 }],
      });

      const stop = result.representations[0]['gradient#data'].stops[0];
      expect(stop.color[0].value).to.deep.equal({ r: 100, g: 200, b: 50 });
    });

    it('should parse rgba() color stops', () => {
      const result = provider.buildGradientPayload({
        name: 'RGBA Test',
        stops: [{ color: 'rgba(10, 20, 30, 0.5)', position: 0 }],
      });

      const stop = result.representations[0]['gradient#data'].stops[0];
      expect(stop.color[0].value).to.deep.equal({ r: 10, g: 20, b: 30 });
    });

    it('should fallback to black for invalid color strings', () => {
      const result = provider.buildGradientPayload({
        name: 'Invalid',
        stops: [{ color: 'not-a-color', position: 0 }],
      });

      const stop = result.representations[0]['gradient#data'].stops[0];
      expect(stop.color[0].value).to.deep.equal({ r: 0, g: 0, b: 0 });
    });

    it('should fallback to black for null color', () => {
      const result = provider.buildGradientPayload({
        name: 'Null',
        stops: [{ color: null, position: 0 }],
      });

      const stop = result.representations[0]['gradient#data'].stops[0];
      expect(stop.color[0].value).to.deep.equal({ r: 0, g: 0, b: 0 });
    });

    it('should handle multiple stops', () => {
      const result = provider.buildGradientPayload({
        name: 'Multi',
        stops: [
          { color: '#FF0000', position: 0 },
          { color: '#00FF00', position: 0.5 },
          { color: '#0000FF', position: 1 },
        ],
      });

      const stops = result.representations[0]['gradient#data'].stops;
      expect(stops).to.have.lengthOf(3);
      expect(stops[0].offset).to.equal(0);
      expect(stops[1].offset).to.equal(0.5);
      expect(stops[2].offset).to.equal(1);
    });

    it('should handle empty stops array', () => {
      const result = provider.buildGradientPayload({
        name: 'Empty',
        stops: [],
      });

      const stops = result.representations[0]['gradient#data'].stops;
      expect(stops).to.deep.equal([]);
    });
  });
});
