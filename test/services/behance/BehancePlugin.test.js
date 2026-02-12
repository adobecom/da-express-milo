import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import BehancePlugin from '../../../express/code/libs/services/plugins/behance/BehancePlugin.js';
import { BehanceTopics, BehanceActionGroups } from '../../../express/code/libs/services/plugins/behance/topics.js';

function createTestPlugin(PluginClass, overrides = {}) {
  return new PluginClass({
    serviceConfig: {
      baseUrl: 'https://test-api.example.com/v2',
      apiKey: 'test-mock-key',
      endpoints: {
        projects: '/projects',
        galleries: '/galleries',
        graphql: '/graphql',
      },
      graphqlBaseUrl: 'https://test-api.example.com/v3',
      ...overrides.serviceConfig,
    },
    appConfig: {
      features: {},
      ...overrides.appConfig,
    },
  });
}

describe('BehancePlugin', () => {
  let plugin;

  beforeEach(() => {
    plugin = createTestPlugin(BehancePlugin);
  });

  afterEach(() => sinon.restore());

  // ── Feature Flag Gating ────────────────────────────────────────────

  describe('isActivated (feature flag)', () => {
    [
      { label: 'ENABLE_BEHANCE not set', config: { features: {} }, expected: true },
      { label: 'ENABLE_BEHANCE is true', config: { features: { ENABLE_BEHANCE: true } }, expected: true },
      { label: 'ENABLE_BEHANCE is explicitly false', config: { features: { ENABLE_BEHANCE: false } }, expected: false },
      { label: 'no features key', config: {}, expected: true },
      { label: 'config is undefined', config: undefined, expected: true },
      { label: 'config is null', config: null, expected: true },
    ].forEach(({ label, config, expected }) => {
      it(`should return ${expected} when ${label}`, () => {
        expect(plugin.isActivated(config)).to.equal(expected);
      });
    });
  });

  // ── Handler Registration ───────────────────────────────────────────

  describe('handler registration', () => {
    it('should register handlers on construction (topicRegistry populated)', () => {
      expect(plugin.topicRegistry.size).to.be.greaterThan(0);
    });

    it('should register action groups on construction', () => {
      expect(plugin.getActionGroupNames()).to.have.length.greaterThan(0);
    });

    it('should register all three expected action groups', () => {
      const names = plugin.getActionGroupNames();
      const expected = Object.values(BehanceActionGroups);

      expected.forEach((groupName) => {
        expect(names).to.include(groupName);
      });
    });

    it('should not contain unexpected action groups', () => {
      const names = plugin.getActionGroupNames();
      const expected = Object.values(BehanceActionGroups);

      expect(names).to.have.lengthOf(expected.length);
    });

    it('should register a handler for every Behance topic', () => {
      const allTopics = [
        ...Object.values(BehanceTopics.PROJECTS),
        ...Object.values(BehanceTopics.GALLERIES),
        ...Object.values(BehanceTopics.GRAPHQL),
      ];

      allTopics.forEach((topic) => {
        expect(plugin.topicRegistry.has(topic)).to.be.true;
        expect(plugin.topicRegistry.get(topic)).to.be.a('function');
      });
    });

    it('should not have unexpected topics registered', () => {
      const allTopics = [
        ...Object.values(BehanceTopics.PROJECTS),
        ...Object.values(BehanceTopics.GALLERIES),
        ...Object.values(BehanceTopics.GRAPHQL),
      ];

      expect(plugin.topicRegistry.size).to.equal(allTopics.length);
    });
  });

  // ── Static Properties ──────────────────────────────────────────────

  describe('static properties', () => {
    it('should have serviceName "Behance"', () => {
      expect(BehancePlugin.serviceName).to.equal('Behance');
    });
  });
});
