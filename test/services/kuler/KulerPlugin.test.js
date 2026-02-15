import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import KulerPlugin from '../../../express/code/libs/services/plugins/kuler/KulerPlugin.js';
import { KulerTopics, KulerActionGroups } from '../../../express/code/libs/services/plugins/kuler/topics.js';

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

describe('KulerPlugin', () => {
  afterEach(() => sinon.restore());

  // ─── Feature Flag Gating ────────────────────────────────────────────────

  describe('isActivated (feature flag)', () => {
    let plugin;

    beforeEach(() => {
      plugin = createTestPlugin(KulerPlugin);
    });

    [
      { label: 'ENABLE_KULER not set', config: { features: {} }, expected: true },
      { label: 'ENABLE_KULER is true', config: { features: { ENABLE_KULER: true } }, expected: true },
      { label: 'ENABLE_KULER is explicitly false', config: { features: { ENABLE_KULER: false } }, expected: false },
      { label: 'no features key', config: {}, expected: true },
      { label: 'null appConfig', config: null, expected: true },
      { label: 'undefined appConfig', config: undefined, expected: true },
      { label: 'features is null', config: { features: null }, expected: true },
    ].forEach(({ label, config, expected }) => {
      it(`should return ${expected} when ${label}`, () => {
        expect(plugin.isActivated(config)).to.equal(expected);
      });
    });
  });

  // ─── Action Group Registration ──────────────────────────────────────────

  describe('action group registration', () => {
    let plugin;

    beforeEach(() => {
      plugin = createTestPlugin(KulerPlugin);
    });

    it('should register exactly the four expected action groups', () => {
      const expected = Object.values(KulerActionGroups);
      const registered = plugin.getActionGroupNames();

      expect(registered).to.have.lengthOf(expected.length);
      expected.forEach((group) => {
        expect(registered).to.include(group);
      });
    });

    it('should register a callable handler for every handled topic', () => {
      // THEME.NAMES is defined in topics.js but intentionally unhandled
      const handledTopics = [
        ...Object.values(KulerTopics.SEARCH),
        KulerTopics.THEME.GET,
        KulerTopics.THEME.SAVE,
        KulerTopics.THEME.DELETE,
        ...Object.values(KulerTopics.GRADIENT),
        ...Object.values(KulerTopics.LIKE),
      ];

      handledTopics.forEach((topic) => {
        const handler = plugin.topicRegistry.get(topic);
        expect(handler, `missing handler for topic "${topic}"`).to.be.a('function');
      });
    });

    it('should not register stale THEME.NAMES topic (defined in topics.js but unhandled)', () => {
      expect(plugin.topicRegistry.has(KulerTopics.THEME.NAMES)).to.be.false;
    });

    it('should have exactly the right number of registered topics (9)', () => {
      // SEARCH: 3, THEME: 3 (GET/SAVE/DELETE, not NAMES), GRADIENT: 2, LIKE: 1
      const expectedCount = 3 + 3 + 2 + 1;
      expect(plugin.topicRegistry.size).to.equal(expectedCount);
    });
  });

  // ─── serviceName ────────────────────────────────────────────────────────

  describe('serviceName', () => {
    it('should return "Kuler"', () => {
      expect(KulerPlugin.serviceName).to.equal('Kuler');
    });
  });
});
