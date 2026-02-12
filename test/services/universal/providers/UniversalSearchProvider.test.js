/* global globalThis */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import UniversalSearchProvider, {
  createUniversalSearchProvider,
} from '../../../../express/code/libs/services/providers/UniversalSearchProvider.js';
import UniversalSearchPlugin from '../../../../express/code/libs/services/plugins/universal/UniversalSearchPlugin.js';

// ── Helpers ──

function createTestPlugin(PluginClass, overrides = {}) {
  return new PluginClass({
    serviceConfig: {
      baseUrl: 'https://test.com/universal-search/v2',
      apiKey: 'API_KEY',
      anonymousApiKey: 'API_KEY',
      endpoints: {
        similarity: '/similarity-search',
        anonymousImageSearch: 'https://test.com/imageSearch',
      },
      ...overrides.serviceConfig,
    },
    appConfig: {
      features: {},
      ...overrides.appConfig,
    },
  });
}

function createMockFile(name = 'test.jpg', type = 'image/jpeg') {
  return new File(['fake-image-data'], name, { type });
}

// ── Mock Data ──

const mockSearchItems = [
  { id: 'stock-001', title: 'Mountain Landscape' },
  { id: 'stock-002', title: 'Ocean Sunset' },
];

const mockApiResponse = {
  result_sets: [{ items: mockSearchItems, total_results: 42 }],
};

describe('UniversalSearchProvider', () => {
  let plugin;
  let provider;
  let fetchStub;

  beforeEach(() => {
    plugin = createTestPlugin(UniversalSearchPlugin);

    fetchStub = sinon.stub(globalThis, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockApiResponse),
    });

    window.adobeIMS = {
      isSignedInUser: sinon.stub().returns(true),
      getAccessToken: sinon.stub().returns({ token: 'mock-token' }),
    };

    window.lana = { log: sinon.stub() };

    provider = new UniversalSearchProvider(plugin);
  });

  afterEach(() => {
    sinon.restore();
    delete window.adobeIMS;
    delete window.lana;
  });

  // ── 1. Delegation Wiring ──

  describe('delegation wiring', () => {
    it('searchByImage should return parsed search data from plugin', async () => {
      const imageFile = createMockFile();
      const result = await provider.searchByImage(imageFile);

      expect(result).to.have.property('themes');
      expect(result.themes).to.have.lengthOf(2);
      expect(fetchStub.calledOnce).to.be.true;
    });

    it('searchByImage should pass limit option correctly', async () => {
      const imageFile = createMockFile();
      await provider.searchByImage(imageFile, { limit: 10 });

      const [, opts] = fetchStub.firstCall.args;
      const requestJson = JSON.parse(opts.body.get('request'));

      expect(requestJson.limit).to.equal(10);
    });

    it('searchByImage should pass startIndex option correctly', async () => {
      const imageFile = createMockFile();
      await provider.searchByImage(imageFile, { startIndex: 30 });

      const [, opts] = fetchStub.firstCall.args;
      const requestJson = JSON.parse(opts.body.get('request'));

      expect(requestJson.start_index).to.equal(30);
    });

    it('searchByImage should pass page option as pageNumber', async () => {
      const imageFile = createMockFile();
      await provider.searchByImage(imageFile, { page: 2, limit: 10 });

      const [, opts] = fetchStub.firstCall.args;
      const requestJson = JSON.parse(opts.body.get('request'));

      // (2 - 1) * 10 = 10
      expect(requestJson.start_index).to.equal(10);
    });

    it('checkDataAvailability should return true when results exist', async () => {
      const imageFile = createMockFile();
      const result = await provider.checkDataAvailability(imageFile);

      expect(result).to.be.true;
    });

    it('checkDataAvailability should return false when no results', async () => {
      fetchStub.resolves({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ result_sets: [{ items: [], total_results: 0 }] }),
      });

      const imageFile = createMockFile();
      const result = await provider.checkDataAvailability(imageFile);

      expect(result).to.be.false;
    });

    it('getSearchUrl should return URL info for authenticated user', async () => {
      const result = await provider.getSearchUrl(true);

      expect(result).to.have.property('fullUrl');
      expect(result.fullUrl).to.include('/similarity-search');
      expect(result).to.have.property('basePath');
      expect(result).to.have.property('api');
      expect(result).to.have.property('searchPath');
    });

    it('getSearchUrl should return URL info for anonymous user', async () => {
      const result = await provider.getSearchUrl(false);

      expect(result.fullUrl).to.include('/imageSearch');
    });

    it('getSearchUrl should use current auth state when no argument', async () => {
      const result = await provider.getSearchUrl();

      expect(result).to.have.property('fullUrl');
      expect(result).to.not.be.null;
    });
  });

  // ── 2. Error Boundary (safeExecute) ──

  describe('error boundary (safeExecute)', () => {
    it('searchByImage should return null when fetch throws network error', async () => {
      fetchStub.rejects(new TypeError('Failed to fetch'));

      const imageFile = createMockFile();
      const result = await provider.searchByImage(imageFile);

      expect(result).to.be.null;
    });

    it('searchByImage should return null when API returns non-OK status', async () => {
      fetchStub.resolves({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      const imageFile = createMockFile();
      const result = await provider.searchByImage(imageFile);

      expect(result).to.be.null;
    });

    it('checkDataAvailability should return false for non-File imageFile', async () => {
      const result = await provider.checkDataAvailability('not-a-file');
      expect(result).to.be.false;
    });

    it('checkDataAvailability should return false for null imageFile', async () => {
      const result = await provider.checkDataAvailability(null);
      expect(result).to.be.false;
    });

    it('checkDataAvailability should return false for undefined imageFile', async () => {
      const result = await provider.checkDataAvailability(undefined);
      expect(result).to.be.false;
    });

    it('checkDataAvailability should return false when plugin throws', async () => {
      fetchStub.rejects(new Error('Server error'));

      const imageFile = createMockFile();
      const result = await provider.checkDataAvailability(imageFile);

      // safeExecute catches → returns null, ?? false yields false
      expect(result).to.be.false;
    });
  });

  // ── 3. Factory Function ──

  describe('createUniversalSearchProvider factory', () => {
    it('should return a UniversalSearchProvider instance', () => {
      const instance = createUniversalSearchProvider(plugin);
      expect(instance).to.be.instanceOf(UniversalSearchProvider);
    });
  });

  // ── 4. Error Logging ──

  describe('error logging', () => {
    it('should log to window.lana when searchByImage fails', async () => {
      fetchStub.rejects(new Error('Network failure'));

      const imageFile = createMockFile();
      await provider.searchByImage(imageFile);

      expect(window.lana.log.calledOnce).to.be.true;
      expect(window.lana.log.firstCall.args[0]).to.include('error');
    });

    it('should include service name in log message', async () => {
      fetchStub.rejects(new Error('Timeout'));

      const imageFile = createMockFile();
      await provider.searchByImage(imageFile);

      expect(window.lana.log.firstCall.args[0]).to.include('UniversalSearch');
    });

    it('should not log when operation succeeds', async () => {
      const imageFile = createMockFile();
      await provider.searchByImage(imageFile);

      expect(window.lana.log.called).to.be.false;
    });
  });
});
