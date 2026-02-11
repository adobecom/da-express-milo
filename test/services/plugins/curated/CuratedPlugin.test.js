/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import CuratedPlugin from '../../../../express/code/libs/services/plugins/curated/CuratedPlugin.js';
import { CuratedActionGroups, CuratedTopics } from '../../../../express/code/libs/services/plugins/curated/topics.js';

/**
 * Create a plugin instance with test defaults.
 * @param {Function} PluginClass - The plugin constructor
 * @param {object} [overrides] - Override serviceConfig or appConfig
 */
function createTestPlugin(PluginClass, overrides = {}) {
  return new PluginClass({
    serviceConfig: {
      baseUrl: 'https://test.com',
      apiKey: 'test-key',
      endpoints: {},
      ...overrides.serviceConfig,
    },
    appConfig: {
      features: {},
      ...overrides.appConfig,
    },
  });
}

describe('CuratedPlugin', () => {
  let plugin;

  beforeEach(() => {
    plugin = createTestPlugin(CuratedPlugin);
  });

  afterEach(() => sinon.restore());

  // ── Feature flag gating ────────────────────────────────────
  describe('isActivated (feature flag)', () => {
    [
      { label: 'ENABLE_CURATED not set', config: { features: {} }, expected: true },
      { label: 'ENABLE_CURATED is true', config: { features: { ENABLE_CURATED: true } }, expected: true },
      { label: 'ENABLE_CURATED is explicitly false', config: { features: { ENABLE_CURATED: false } }, expected: false },
      { label: 'no features key', config: {}, expected: true },
    ].forEach(({ label, config, expected }) => {
      it(`should return ${expected} when ${label}`, () => {
        expect(plugin.isActivated(config)).to.equal(expected);
      });
    });
  });

  // ── Handler registration ───────────────────────────────────
  describe('handler registration', () => {
    it('plugin registers handlers on construction', () => {
      expect(plugin.topicRegistry.size).to.be.greaterThan(0);
    });

    it('plugin registers action groups on construction', () => {
      expect(plugin.getActionGroupNames()).to.deep.equal([CuratedActionGroups.DATA]);
    });

    it('registers a handler for every expected topic with callable functions', () => {
      const handlerKeys = Array.from(plugin.topicRegistry.keys());
      const expectedTopics = Object.values(CuratedTopics.DATA);

      expectedTopics.forEach((topic) => {
        expect(plugin.topicRegistry.has(topic)).to.be.true;
        expect(plugin.topicRegistry.get(topic)).to.be.a('function');
      });

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((topic) => {
        expect(expectedTopics).to.include(topic);
      });
    });
  });
});
