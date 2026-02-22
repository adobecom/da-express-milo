import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import KulerProvider, { createKulerProvider } from '../../../../express/code/libs/services/providers/KulerProvider.js';
import KulerPlugin from '../../../../express/code/libs/services/plugins/kuler/KulerPlugin.js';

function createTestPlugin(overrides = {}) {
  return new KulerPlugin({
    serviceConfig: {
      baseUrl: 'https://test-kuler.com',
      apiKey: 'test-key',
      endpoints: {
        search: '/search',
        themeBaseUrl: 'https://themes.test.io',
        api: '/api/v2',
        themePath: '/themes',
        gradientBaseUrl: 'https://gradient.test.io',
        gradientPath: '/gradient',
        likeBaseUrl: 'https://asset.test.io',
      },
      ...overrides.serviceConfig,
    },
    appConfig: {
      features: {},
      ...overrides.appConfig,
    },
  });
}

describe('KulerProvider', () => {
  let plugin;
  let provider;
  let fetchStub;

  const mockData = { themes: [{ id: '1', name: 'Sunset' }] };

  beforeEach(() => {
    plugin = createTestPlugin();
    fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    });
    window.adobeIMS = {
      isSignedInUser: sinon.stub().returns(false),
      getAccessToken: sinon.stub().returns(null),
    };
    window.lana = { log: sinon.stub() };
    provider = new KulerProvider(plugin);
  });

  afterEach(() => {
    sinon.restore();
    delete window.adobeIMS;
    delete window.lana;
  });

  // ─── Delegation Wiring ──────────────────────────────────────────────────

  describe('delegation wiring', () => {
    it('searchThemes dispatches to search action and returns data', async () => {
      const result = await provider.searchThemes('sunset');
      expect(fetchStub.calledOnce).to.be.true;
      expect(result).to.deep.equal(mockData);
    });

    it('searchThemes transforms query + options into criteria', async () => {
      await provider.searchThemes('sunset', { page: 2, typeOfQuery: 'tag' });
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('startIndex=72');
      expect(url).to.include(encodeURIComponent('"tag"'));
      expect(url).to.include(encodeURIComponent('"sunset"'));
    });

    it('searchThemes defaults to page 1 and typeOfQuery "term"', async () => {
      await provider.searchThemes('blue');
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('startIndex=0');
      expect(url).to.include(encodeURIComponent('"term"'));
    });

    it('searchGradients dispatches with GRADIENT assetType', async () => {
      await provider.searchGradients('blue');
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('assetType=GRADIENT');
    });

    it('searchGradients transforms params like searchThemes', async () => {
      await provider.searchGradients('warm', { page: 3, typeOfQuery: 'hex' });
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('startIndex=144');
      expect(url).to.include(encodeURIComponent('"hex"'));
    });

    it('getTheme dispatches with themeId', async () => {
      await provider.getTheme('t-123');
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('/themes/t-123');
    });

    it('saveTheme dispatches with themeData and ccLibrariesResponse', async () => {
      const themeData = { name: 'T', swatches: [{ rgb: { r: 0, g: 0, b: 0 } }] };
      const ccResponse = { id: 'a', libraryid: 'l' };
      await provider.saveTheme(themeData, ccResponse);

      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/themes');
      expect(opts.method).to.equal('POST');
    });

    it('deleteTheme dispatches with payload', async () => {
      await provider.deleteTheme({ id: 'del-1', name: 'Old' });
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/themes/del-1');
      expect(opts.method).to.equal('DELETE');
    });

    it('saveGradient dispatches with gradientData', async () => {
      await provider.saveGradient({ name: 'Grad' });
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/gradient');
      expect(opts.method).to.equal('POST');
    });

    it('deleteGradient dispatches with payload', async () => {
      await provider.deleteGradient({ id: 'g-1', name: 'Old Grad' });
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/gradient/g-1');
      expect(opts.method).to.equal('DELETE');
    });

    it('updateLike dispatches like action', async () => {
      await provider.updateLike({ id: 't-1', like: {}, source: 'KULER' });
      expect(fetchStub.calledOnce).to.be.true;
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('/likeDuplicate');
    });

    it('searchPublished dispatches with URL', async () => {
      await provider.searchPublished('/themes/search?q=test');
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/themes/search');
      expect(opts.method).to.equal('GET');
    });

    it('exploreThemes dispatches to explore action and returns data', async () => {
      const result = await provider.exploreThemes();
      expect(fetchStub.calledOnce).to.be.true;
      expect(result).to.deep.equal(mockData);
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/themes');
      expect(opts.method).to.equal('GET');
    });

    it('exploreThemes passes custom filter, sort, time, and page', async () => {
      await provider.exploreThemes({ filter: 'my_themes', sort: 'like_count', time: 'week', page: 2 });
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('filter=my_themes');
      expect(url).to.include('startIndex=72');
    });

    it('exploreGradients dispatches to explore action and returns data', async () => {
      const result = await provider.exploreGradients();
      expect(fetchStub.calledOnce).to.be.true;
      expect(result).to.deep.equal(mockData);
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/gradient');
      expect(opts.method).to.equal('GET');
    });

    it('exploreGradients passes custom options through', async () => {
      await provider.exploreGradients({ sort: 'view_count', time: 'all', page: 3 });
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('sort=view_count');
      expect(url).to.include('time=all');
      expect(url).to.include('startIndex=144');
    });

    it('checkIfPublished dispatches searchPublished with { assetId, assetType }', async () => {
      await provider.checkIfPublished('lib-asset-1', 'GRADIENT');
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include(encodeURIComponent('"asset_id"'));
      expect(url).to.include(encodeURIComponent('"lib-asset-1"'));
      expect(url).to.include('assetType=GRADIENT');
      expect(opts.method).to.equal('GET');
    });

    it('checkIfPublished defaults assetType to GRADIENT', async () => {
      await provider.checkIfPublished('lib-asset-2');
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('assetType=GRADIENT');
    });
  });

  // ─── Error Boundary (safeExecute) ───────────────────────────────────────

  describe('error boundary (safeExecute)', () => {
    it('searchThemes returns null on network error', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.searchThemes('test');
      expect(result).to.be.null;
    });

    it('searchGradients returns null on network error', async () => {
      fetchStub.rejects(new TypeError('Failed to fetch'));
      const result = await provider.searchGradients('test');
      expect(result).to.be.null;
    });

    it('getTheme returns null on validation error (empty themeId)', async () => {
      const result = await provider.getTheme('');
      expect(result).to.be.null;
    });

    it('getTheme returns null on network error', async () => {
      fetchStub.rejects(new Error('timeout'));
      const result = await provider.getTheme('t-1');
      expect(result).to.be.null;
    });

    it('saveTheme returns null when themeData is null', async () => {
      const result = await provider.saveTheme(null, null);
      expect(result).to.be.null;
    });

    it('saveTheme returns null when swatches are empty', async () => {
      const result = await provider.saveTheme({ swatches: [] }, { id: 'a', libraryid: 'l' });
      expect(result).to.be.null;
    });

    it('deleteTheme returns null when payload.id is missing', async () => {
      const result = await provider.deleteTheme({ name: 'x' });
      expect(result).to.be.null;
    });

    it('deleteTheme returns null on network error', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.deleteTheme({ id: 'd-1', name: 'x' });
      expect(result).to.be.null;
    });

    it('saveGradient returns null when gradientData is null', async () => {
      const result = await provider.saveGradient(null);
      expect(result).to.be.null;
    });

    it('saveGradient returns null on network error', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.saveGradient({ name: 'g' });
      expect(result).to.be.null;
    });

    it('deleteGradient returns null when payload.id is missing', async () => {
      const result = await provider.deleteGradient({ name: 'x' });
      expect(result).to.be.null;
    });

    it('updateLike returns null when payload.id is missing', async () => {
      const result = await provider.updateLike({ like: {} });
      expect(result).to.be.null;
    });

    it('updateLike returns null on network error', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.updateLike({ id: 't-1', like: {} });
      expect(result).to.be.null;
    });

    it('searchPublished returns null on network error', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.searchPublished('/themes/search');
      expect(result).to.be.null;
    });

    it('exploreThemes returns null on network error', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.exploreThemes();
      expect(result).to.be.null;
    });

    it('exploreGradients returns null on network error', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.exploreGradients();
      expect(result).to.be.null;
    });

    it('checkIfPublished returns null on network error', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.checkIfPublished('asset-1');
      expect(result).to.be.null;
    });

    it('errors are logged to window.lana', async () => {
      fetchStub.rejects(new Error('boom'));
      await provider.searchThemes('test');
      expect(window.lana.log.calledOnce).to.be.true;
      expect(window.lana.log.firstCall.args[0]).to.include('error');
    });
  });

  // ─── Factory Function ─────────────────────────────────────────────────

  describe('createKulerProvider factory', () => {
    it('should return a KulerProvider instance', () => {
      const instance = createKulerProvider(plugin);
      expect(instance).to.be.instanceOf(KulerProvider);
    });

    it('should return a new instance each call', () => {
      const a = createKulerProvider(plugin);
      const b = createKulerProvider(plugin);
      expect(a).to.not.equal(b);
    });
  });
});
