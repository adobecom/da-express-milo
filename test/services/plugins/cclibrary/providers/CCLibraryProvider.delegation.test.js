/* global globalThis */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import CCLibraryProvider, {
  createCCLibraryProvider,
} from '../../../../../express/code/libs/services/providers/CCLibraryProvider.js';
import CCLibraryPlugin from '../../../../../express/code/libs/services/plugins/cclibrary/CCLibraryPlugin.js';

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

describe('CCLibraryProvider - delegation & errors', () => {
  let plugin;
  let provider;
  let fetchStub;

  const mockLibraries = { total_count: 1, libraries: [{ id: 'lib-1', name: 'Lib' }] };
  const mockElements = { total_count: 1, elements: [{ id: 'elem-1' }] };
  const mockCreated = { id: 'lib-new', name: 'New' };
  const mockSaved = { elements: [{ id: 'elem-new' }] };
  const mockEmpty = {};

  beforeEach(() => {
    fetchStub = sinon.stub(globalThis, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockLibraries),
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

  // 1. Delegation Wiring
  describe('delegation wiring', () => {
    it('createLibrary delegates to plugin and returns result', async () => {
      fetchStub.resolves({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockCreated),
      });

      const result = await provider.createLibrary('New Library');

      expect(result).to.deep.equal(mockCreated);
      expect(fetchStub.calledOnce).to.be.true;
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/libraries');
      expect(opts.method).to.equal('POST');
      expect(JSON.parse(opts.body)).to.deep.equal({ name: 'New Library' });
    });

    it('fetchLibraries delegates to plugin and returns result', async () => {
      const result = await provider.fetchLibraries();

      expect(result).to.deep.equal(mockLibraries);
      expect(fetchStub.calledOnce).to.be.true;
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/libraries');
      expect(opts.method).to.equal('GET');
    });

    it('fetchLibraries passes params correctly', async () => {
      await provider.fetchLibraries({ owner: 'private', limit: 10 });

      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('owner=private');
      expect(url).to.include('limit=10');
    });

    it('fetchUserLibraries delegates with owner=private', async () => {
      await provider.fetchUserLibraries({ limit: 20 });

      expect(fetchStub.calledOnce).to.be.true;
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/libraries');
      expect(url).to.include('owner=private');
      expect(url).to.include('limit=20');
      expect(opts.method).to.equal('GET');
    });

    it('fetchUserLibraries returns data from plugin', async () => {
      const result = await provider.fetchUserLibraries();

      expect(result).to.deep.equal(mockLibraries);
    });

    it('fetchUserLibraries overrides owner even if caller passes one', async () => {
      await provider.fetchUserLibraries({ owner: 'all', limit: 5 });

      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('owner=private');
      expect(url).to.include('limit=5');
    });

    it('fetchLibraryElements delegates to plugin with libraryId', async () => {
      fetchStub.resolves({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockElements),
      });

      const result = await provider.fetchLibraryElements('lib-123');

      expect(result).to.deep.equal(mockElements);
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('/libraries/lib-123/elements');
    });

    it('saveTheme delegates to plugin with libraryId and themeData', async () => {
      fetchStub.resolves({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSaved),
      });

      const themeData = { name: 'Theme', type: 'colortheme' };
      const result = await provider.saveTheme('lib-123', themeData);

      expect(result).to.deep.equal(mockSaved);
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/libraries/lib-123/elements');
      expect(opts.method).to.equal('POST');
    });

    it('saveGradient delegates to plugin with libraryId and gradientData', async () => {
      fetchStub.resolves({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSaved),
      });

      const gradientData = { name: 'Gradient', type: 'gradient' };
      const result = await provider.saveGradient('lib-123', gradientData);

      expect(result).to.deep.equal(mockSaved);
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/libraries/lib-123/elements');
      expect(opts.method).to.equal('POST');
    });

    it('deleteTheme delegates to plugin with libraryId and themeId', async () => {
      fetchStub.resolves({
        ok: true,
        status: 204,
      });

      const result = await provider.deleteTheme('lib-123', 'elem-456');

      expect(result).to.deep.equal(mockEmpty);
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/libraries/lib-123/elements/elem-456');
      expect(opts.method).to.equal('DELETE');
    });

    it('updateTheme delegates to plugin with libraryId, elementId, and payload', async () => {
      const updateResponse = { id: 'elem-456', representations: [] };
      fetchStub.resolves({
        ok: true,
        status: 200,
        json: () => Promise.resolve(updateResponse),
      });

      const payload = { client: 'express', type: 'colortheme' };
      const result = await provider.updateTheme('lib-123', 'elem-456', payload);

      expect(result).to.deep.equal(updateResponse);
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/libraries/lib-123/elements/elem-456/representations');
      expect(opts.method).to.equal('PUT');
    });

    it('updateElementMetadata delegates to plugin with libraryId and elements', async () => {
      fetchStub.resolves({
        ok: true,
        status: 204,
      });

      const elements = [{ id: 'elem-1', name: 'Renamed' }];
      const result = await provider.updateElementMetadata('lib-123', elements);

      expect(result).to.deep.equal(mockEmpty);
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/libraries/lib-123/elements/metadata');
      expect(opts.method).to.equal('PUT');
    });
  });

  // 2. Error Boundary (safeExecute)
  describe('error boundary (safeExecute)', () => {
    it('createLibrary returns null when fetch throws', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.createLibrary('Test');
      expect(result).to.be.null;
    });

    it('fetchLibraries returns null when fetch throws', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.fetchLibraries();
      expect(result).to.be.null;
    });

    it('fetchLibraryElements returns null when fetch throws', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.fetchLibraryElements('lib-1');
      expect(result).to.be.null;
    });

    it('saveTheme returns null when fetch throws', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.saveTheme('lib-1', { name: 't' });
      expect(result).to.be.null;
    });

    it('saveGradient returns null when fetch throws', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.saveGradient('lib-1', { name: 'g' });
      expect(result).to.be.null;
    });

    it('deleteTheme returns null when fetch throws', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.deleteTheme('lib-1', 'elem-1');
      expect(result).to.be.null;
    });

    it('updateTheme returns null when fetch throws', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.updateTheme('lib-1', 'elem-1', { data: true });
      expect(result).to.be.null;
    });

    it('updateElementMetadata returns null when fetch throws', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.updateElementMetadata('lib-1', [{ id: 'e1' }]);
      expect(result).to.be.null;
    });

    it('fetchUserLibraries returns null when fetch throws', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.fetchUserLibraries();
      expect(result).to.be.null;
    });

    it('returns null for validation errors (e.g. missing libraryId)', async () => {
      const result = await provider.fetchLibraryElements(null);
      expect(result).to.be.null;
    });

    it('returns null when API returns non-OK response', async () => {
      fetchStub.resolves({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error'),
      });

      const result = await provider.fetchLibraries();
      expect(result).to.be.null;
    });
  });

  // 3. Factory Function
  describe('createCCLibraryProvider factory', () => {
    it('should return a CCLibraryProvider instance', () => {
      const instance = createCCLibraryProvider(plugin);
      expect(instance).to.be.instanceOf(CCLibraryProvider);
    });
  });

  // 4. isAvailable
  describe('isAvailable', () => {
    it('should return true when plugin is provided', () => {
      expect(provider.isAvailable).to.be.true;
    });
  });

  // 5. StorageFullError through safeExecute
  describe('StorageFullError through safeExecute', () => {
    it('should return null when API returns 507 (storage full)', async () => {
      fetchStub.resolves({
        ok: false,
        status: 507,
        statusText: 'Insufficient Storage',
        text: () => Promise.resolve('Storage quota exceeded'),
      });

      const result = await provider.saveTheme('lib-1', { name: 'theme' });
      expect(result).to.be.null;
    });

    it('should log StorageFullError with correct error type', async () => {
      fetchStub.resolves({
        ok: false,
        status: 507,
        statusText: 'Insufficient Storage',
        text: () => Promise.resolve('Storage quota exceeded'),
      });

      await provider.saveTheme('lib-1', { name: 'theme' });

      expect(globalThis.lana.log.calledOnce).to.be.true;
      const [message, opts] = globalThis.lana.log.firstCall.args;
      expect(message).to.include('error');
      expect(opts.errorType).to.equal('StorageFullError');
    });
  });
});
