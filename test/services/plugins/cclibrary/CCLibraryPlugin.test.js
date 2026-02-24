import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import CCLibraryPlugin from '../../../../express/code/libs/services/plugins/cclibrary/CCLibraryPlugin.js';
import { CCLibraryActionGroups } from '../../../../express/code/libs/services/plugins/cclibrary/topics.js';
import { StorageFullError, ApiError } from '../../../../express/code/libs/services/core/Errors.js';
import { HTTP_STATUS } from '../../../../express/code/libs/services/plugins/cclibrary/constants.js';

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

  describe('handleResponse', () => {
    it('should throw StorageFullError when status is 507', async () => {
      const response = {
        ok: false,
        status: HTTP_STATUS.STORAGE_FULL,
        statusText: 'Insufficient Storage',
        text: () => Promise.resolve('Storage quota exceeded'),
      };

      try {
        await plugin.handleResponse(response);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(StorageFullError);
        expect(err.message).to.equal('CC Libraries storage is full');
        expect(err.statusCode).to.equal(507);
        expect(err.name).to.equal('StorageFullError');
        expect(err.serviceName).to.equal('CCLibrary');
      }
    });

    it('should include the response body in StorageFullError', async () => {
      const errorBody = '{"error":"quota_exceeded","message":"Storage limit reached"}';
      const response = {
        ok: false,
        status: 507,
        statusText: 'Insufficient Storage',
        text: () => Promise.resolve(errorBody),
      };

      try {
        await plugin.handleResponse(response);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(StorageFullError);
        expect(err.responseBody).to.equal(errorBody);
      }
    });

    it('should throw ApiError for non-507 error responses (delegates to super)', async () => {
      const response = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error'),
      };

      try {
        await plugin.handleResponse(response);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect(err).to.not.be.instanceOf(StorageFullError);
        expect(err.statusCode).to.equal(500);
      }
    });

    it('should return parsed JSON for 200 OK responses (delegates to super)', async () => {
      const responseData = { total_count: 1, libraries: [{ id: 'lib-1' }] };
      const response = {
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseData),
      };

      const result = await plugin.handleResponse(response);
      expect(result).to.deep.equal(responseData);
    });

    it('should return empty object for 204 No Content (delegates to super)', async () => {
      const response = {
        ok: true,
        status: 204,
      };

      const result = await plugin.handleResponse(response);
      expect(result).to.deep.equal({});
    });
  });
});
