import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import UniversalSearchPlugin from '../../../express/code/libs/services/plugins/universal/UniversalSearchPlugin.js';
import { UniversalSearchActionGroups } from '../../../express/code/libs/services/plugins/universal/topics.js';

function createTestPlugin(PluginClass, overrides = {}) {
  return new PluginClass({
    serviceConfig: {
      baseUrl: 'https://adobesearch.adobe.io/universal-search/v2',
      apiKey: 'TEST_API_KEY',
      anonymousApiKey: 'TEST_ANON_API_KEY',
      endpoints: {
        similarity: '/similarity-search',
        anonymousImageSearch: 'https://search.adobe.io/imageSearch',
      },
      ...overrides.serviceConfig,
    },
    appConfig: {
      features: {},
      ...overrides.appConfig,
    },
  });
}

describe('UniversalSearchPlugin', () => {
  let plugin;

  beforeEach(() => {
    plugin = createTestPlugin(UniversalSearchPlugin);
  });

  afterEach(() => sinon.restore());

  // ── Feature Flag Gating ──

  describe('isActivated (feature flag)', () => {
    [
      { label: 'ENABLE_UNIVERSAL not set', config: { features: {} }, expected: true },
      { label: 'ENABLE_UNIVERSAL is true', config: { features: { ENABLE_UNIVERSAL: true } }, expected: true },
      { label: 'ENABLE_UNIVERSAL is explicitly false', config: { features: { ENABLE_UNIVERSAL: false } }, expected: false },
      { label: 'no features key', config: {}, expected: true },
    ].forEach(({ label, config, expected }) => {
      it(`should return ${expected} when ${label}`, () => {
        expect(plugin.isActivated(config)).to.equal(expected);
      });
    });
  });

  // ── Handler Registration ──

  describe('handler registration', () => {
    it('should register handlers on construction (topicRegistry.size > 0)', () => {
      expect(plugin.topicRegistry.size).to.be.greaterThan(0);
    });

    it('should register action groups on construction', () => {
      const groupNames = plugin.getActionGroupNames();
      expect(groupNames).to.have.length.greaterThan(0);
    });

    it('should register all expected action groups', () => {
      const groupNames = plugin.getActionGroupNames();
      const expectedGroups = Object.values(UniversalSearchActionGroups);

      expectedGroups.forEach((group) => {
        expect(groupNames).to.include(group);
      });
    });

    it('should not contain unexpected action groups', () => {
      const groupNames = plugin.getActionGroupNames();
      const expectedGroups = Object.values(UniversalSearchActionGroups);

      expect(groupNames).to.have.lengthOf(expectedGroups.length);
      groupNames.forEach((name) => {
        expect(expectedGroups).to.include(name);
      });
    });
  });

  // ── Static serviceName ──

  describe('serviceName', () => {
    it('should return "UniversalSearch"', () => {
      expect(UniversalSearchPlugin.serviceName).to.equal('UniversalSearch');
    });
  });
});
