import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import CCLibraryPlugin from '../../../../express/code/libs/services/plugins/cclibrary/CCLibraryPlugin.js';
import { CCLibraryActionGroups } from '../../../../express/code/libs/services/plugins/cclibrary/topics.js';

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

describe('CCLibraryPlugin', () => {
  let plugin;

  beforeEach(() => {
    plugin = createTestPlugin(CCLibraryPlugin);
  });

  afterEach(() => sinon.restore());

  describe('serviceName', () => {
    it('should return "CCLibrary"', () => {
      expect(CCLibraryPlugin.serviceName).to.equal('CCLibrary');
    });
  });

  describe('isActivated (feature flag)', () => {
    [
      { label: 'ENABLE_CCLIBRARY not set', config: { features: {} }, expected: true },
      { label: 'ENABLE_CCLIBRARY is true', config: { features: { ENABLE_CCLIBRARY: true } }, expected: true },
      { label: 'ENABLE_CCLIBRARY is explicitly false', config: { features: { ENABLE_CCLIBRARY: false } }, expected: false },
      { label: 'no features key', config: {}, expected: true },
      { label: 'null config', config: null, expected: true },
      { label: 'undefined config', config: undefined, expected: true },
    ].forEach(({ label, config, expected }) => {
      it(`should return ${expected} when ${label}`, () => {
        expect(plugin.isActivated(config)).to.equal(expected);
      });
    });
  });

  describe('baseUrl resolution', () => {
    it('should resolve baseUrl from melvilleBasePath', () => {
      expect(plugin.baseUrl).to.equal('https://libraries.test.io/api/v1');
    });

    it('should fall back to serviceConfig.baseUrl when melvilleBasePath is missing', () => {
      const fallbackPlugin = createTestPlugin(CCLibraryPlugin, {
        serviceConfig: {
          baseUrl: 'https://fallback.com',
          melvilleBasePath: undefined,
          endpoints: { libraries: '/libraries', themes: '/elements', metadata: '/metadata' },
        },
      });
      expect(fallbackPlugin.baseUrl).to.equal('https://fallback.com');
    });
  });

  describe('handler registration', () => {
    it('should register handlers on construction', () => {
      expect(plugin.topicRegistry.size).to.be.greaterThan(0);
    });

    it('should register action groups on construction', () => {
      expect(plugin.getActionGroupNames()).to.have.length.greaterThan(0);
    });

    it('should register the "library" action group', () => {
      expect(plugin.getActionGroupNames()).to.include(CCLibraryActionGroups.LIBRARY);
    });

    it('should register the "theme" action group', () => {
      expect(plugin.getActionGroupNames()).to.include(CCLibraryActionGroups.THEME);
    });

    it('should register exactly 2 action groups', () => {
      expect(plugin.getActionGroupNames()).to.have.lengthOf(2);
    });

    it('should register 8 topic handlers total (3 library + 5 theme)', () => {
      expect(plugin.topicRegistry.size).to.equal(8);
    });
  });
});
