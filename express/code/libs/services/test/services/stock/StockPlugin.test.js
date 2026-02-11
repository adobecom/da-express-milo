import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import StockPlugin from '../../../plugins/stock/StockPlugin.js';
import { StockTopics, StockActionGroups } from '../../../plugins/stock/topics.js';

function createTestPlugin(PluginClass, overrides = {}) {
  return new PluginClass({
    serviceConfig: {
      baseUrl: 'https://test.com',
      apiKey: 'test-key',
      endpoints: { search: '/Search/Files' },
      ...overrides.serviceConfig,
    },
    appConfig: {
      features: {},
      ...overrides.appConfig,
    },
  });
}

describe('StockPlugin', () => {
  let plugin;

  beforeEach(() => {
    plugin = createTestPlugin(StockPlugin);
  });

  afterEach(() => sinon.restore());

  describe('serviceName', () => {
    it('should return "Stock"', () => {
      expect(StockPlugin.serviceName).to.equal('Stock');
    });
  });

  describe('isActivated (feature flag)', () => {
    [
      { label: 'ENABLE_STOCK not set', config: { features: {} }, expected: true },
      { label: 'ENABLE_STOCK is true', config: { features: { ENABLE_STOCK: true } }, expected: true },
      { label: 'ENABLE_STOCK is explicitly false', config: { features: { ENABLE_STOCK: false } }, expected: false },
      { label: 'no features key', config: {}, expected: true },
    ].forEach(({ label, config, expected }) => {
      it(`should return ${expected} when ${label}`, () => {
        expect(plugin.isActivated(config)).to.equal(expected);
      });
    });
  });

  describe('handler registration', () => {
    it('should register handlers on construction', () => {
      expect(plugin.topicRegistry.size).to.be.greaterThan(0);
    });

    it('should register action groups on construction', () => {
      const groupNames = Array.from(plugin.actionGroups.keys());
      expect(groupNames).to.have.length.greaterThan(0);
    });

    it('should register all expected action groups', () => {
      const expectedGroups = Object.values(StockActionGroups);
      expectedGroups.forEach((name) => {
        expect(plugin.actionGroups.has(name)).to.be.true;
      });
    });

    it('should register handlers for all Stock topics', () => {
      const allTopics = [
        ...Object.values(StockTopics.SEARCH),
        ...Object.values(StockTopics.GALLERY),
        ...Object.values(StockTopics.DATA),
        ...Object.values(StockTopics.REDIRECT),
      ];
      allTopics.forEach((topic) => {
        expect(plugin.topicRegistry.has(topic)).to.be.true;
      });
    });
  });

  describe('getHeaders', () => {
    it('should include x-product header for Stock', () => {
      const headers = plugin.getHeaders();
      expect(headers['x-product']).to.equal('AdobeColor/4.0');
    });

    it('should include base headers (Content-Type, Accept)', () => {
      const headers = plugin.getHeaders();
      expect(headers['Content-Type']).to.equal('application/json');
      expect(headers.Accept).to.equal('application/json');
    });

    it('should include x-api-key from config', () => {
      const headers = plugin.getHeaders();
      expect(headers['x-api-key']).to.equal('test-key');
    });
  });
});
