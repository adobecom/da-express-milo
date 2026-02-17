import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { SearchActions } from '../../../../express/code/libs/services/plugins/kuler/actions/KulerActions.js';
import { KulerTopics } from '../../../../express/code/libs/services/plugins/kuler/topics.js';
import { createMockPlugin, stubFetch } from './helpers.js';

describe('SearchActions', () => {
  let actions;
  let mockPlugin;
  let fetchStub;

  beforeEach(() => {
    mockPlugin = createMockPlugin();
    actions = new SearchActions(mockPlugin);
    fetchStub = stubFetch({ themes: [{ id: '1' }] });
  });

  afterEach(() => sinon.restore());

  // ─── getHandlers ──────────────────────────────────────────────────────

  describe('getHandlers', () => {
    it('should map every KulerTopics.SEARCH value to a function', () => {
      const handlers = actions.getHandlers();
      Object.values(KulerTopics.SEARCH).forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should have no extra keys beyond KulerTopics.SEARCH', () => {
      const handlers = actions.getHandlers();
      const expected = Object.values(KulerTopics.SEARCH);
      expect(Object.keys(handlers)).to.have.lengthOf(expected.length);
    });
  });

  // ─── buildKulerQuery (static) ─────────────────────────────────────────

  describe('buildKulerQuery', () => {
    it('should default to "term" when typeOfQuery is absent', () => {
      const result = JSON.parse(SearchActions.buildKulerQuery({ main: 'sunset' }));
      expect(result).to.deep.equal({ term: 'sunset' });
    });

    ['term', 'tag', 'hex', 'similarHex'].forEach((type) => {
      it(`should use "${type}" as the query key`, () => {
        const result = JSON.parse(SearchActions.buildKulerQuery({ main: 'val', typeOfQuery: type }));
        expect(result).to.have.property(type, 'val');
      });
    });

    it('should handle empty string query', () => {
      const result = JSON.parse(SearchActions.buildKulerQuery({ main: '' }));
      expect(result).to.deep.equal({ term: '' });
    });

    it('should handle special characters in query', () => {
      const query = '#FF00FF & "quoted"';
      const result = JSON.parse(SearchActions.buildKulerQuery({ main: query }));
      expect(result.term).to.equal(query);
    });
  });

  // ─── buildSearchUrl ───────────────────────────────────────────────────

  describe('buildSearchUrl', () => {
    it('should construct base URL from plugin.baseUrl + endpoints.search', () => {
      const url = actions.buildSearchUrl({ main: 'test', pageNumber: 1 });
      expect(url).to.match(/^https:\/\/test-kuler\.com\/search\?/);
    });

    it('should encode the query parameter', () => {
      const url = actions.buildSearchUrl({ main: 'sunset', pageNumber: 1 });
      expect(url).to.include('q=%7B%22term%22%3A%22sunset%22%7D');
    });

    it('should default assetType to THEME', () => {
      const url = actions.buildSearchUrl({ main: 'x', pageNumber: 1 });
      expect(url).to.include('assetType=THEME');
    });

    it('should accept GRADIENT assetType', () => {
      const url = actions.buildSearchUrl({ main: 'x', pageNumber: 1 }, 'GRADIENT');
      expect(url).to.include('assetType=GRADIENT');
    });

    it('should include maxNumber=72', () => {
      const url = actions.buildSearchUrl({ main: 'x', pageNumber: 1 });
      expect(url).to.include('maxNumber=72');
    });

    // ── Pagination edge cases ──

    it('should compute startIndex=0 for page 1', () => {
      const url = actions.buildSearchUrl({ main: 'x', pageNumber: 1 });
      expect(url).to.include('startIndex=0');
    });

    it('should compute startIndex=72 for page 2', () => {
      const url = actions.buildSearchUrl({ main: 'x', pageNumber: 2 });
      expect(url).to.include('startIndex=72');
    });

    it('should compute startIndex=144 for page 3', () => {
      const url = actions.buildSearchUrl({ main: 'x', pageNumber: 3 });
      expect(url).to.include('startIndex=144');
    });

    it('should default to page 1 when pageNumber is missing', () => {
      const url = actions.buildSearchUrl({ main: 'x' });
      expect(url).to.include('startIndex=0');
    });

    it('should default to page 1 when pageNumber is null', () => {
      const url = actions.buildSearchUrl({ main: 'x', pageNumber: null });
      expect(url).to.include('startIndex=0');
    });

    it('should handle string pageNumber via parseInt', () => {
      const url = actions.buildSearchUrl({ main: 'x', pageNumber: '3' });
      expect(url).to.include('startIndex=144');
    });

    // ── Auth-dependent metadata ──

    it('should include metadata=all when user is logged in with a valid token', () => {
      mockPlugin.getAuthState.returns({ isLoggedIn: true, token: 'valid-token' });
      const url = actions.buildSearchUrl({ main: 'x', pageNumber: 1 });
      expect(url).to.include('metadata=all');
    });

    it('should NOT include metadata=all when user is logged out', () => {
      const url = actions.buildSearchUrl({ main: 'x', pageNumber: 1 });
      expect(url).to.not.include('metadata=all');
    });

    it('should NOT include metadata=all when logged in but token is missing', () => {
      mockPlugin.getAuthState.returns({ isLoggedIn: true, token: undefined });
      const url = actions.buildSearchUrl({ main: 'x', pageNumber: 1 });
      expect(url).to.not.include('metadata=all');
    });

    it('should place metadata=all before startIndex in URL order', () => {
      mockPlugin.getAuthState.returns({ isLoggedIn: true, token: 'valid-token' });
      const url = actions.buildSearchUrl({ main: 'x', pageNumber: 1 });
      const metaIdx = url.indexOf('metadata=all');
      const startIdx = url.indexOf('startIndex=');
      expect(metaIdx).to.be.lessThan(startIdx);
    });
  });

  // ─── buildPublishedCheckUrl ──────────────────────────────────────────

  describe('buildPublishedCheckUrl', () => {
    it('should construct URL from plugin.baseUrl + endpoints.search', () => {
      const url = actions.buildPublishedCheckUrl('asset-123');
      expect(url).to.match(/^https:\/\/test-kuler\.com\/search\?/);
    });

    it('should encode the asset_id as a JSON query parameter', () => {
      const url = actions.buildPublishedCheckUrl('asset-123');
      const expected = encodeURIComponent(JSON.stringify({ asset_id: 'asset-123' }));
      expect(url).to.include(`q=${expected}`);
    });

    it('should default assetType to GRADIENT', () => {
      const url = actions.buildPublishedCheckUrl('asset-123');
      expect(url).to.include('assetType=GRADIENT');
    });

    it('should accept THEME assetType', () => {
      const url = actions.buildPublishedCheckUrl('asset-123', 'THEME');
      expect(url).to.include('assetType=THEME');
    });

    it('should include maxNumber=1', () => {
      const url = actions.buildPublishedCheckUrl('asset-123');
      expect(url).to.include('maxNumber=1');
    });
  });

  // ─── fetchThemeList ───────────────────────────────────────────────────

  describe('fetchThemeList', () => {
    it('should call fetch with built URL and GET method', async () => {
      await actions.fetchThemeList({ main: 'sunset', pageNumber: 1 });
      expect(fetchStub.calledOnce).to.be.true;

      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('assetType=THEME');
      expect(opts.method).to.equal('GET');
    });

    it('should return parsed response via handleResponse', async () => {
      const result = await actions.fetchThemeList({ main: 'test', pageNumber: 1 });
      expect(result).to.deep.equal({ themes: [{ id: '1' }] });
      expect(mockPlugin.handleResponse.calledOnce).to.be.true;
    });
  });

  // ─── fetchGradientList ────────────────────────────────────────────────

  describe('fetchGradientList', () => {
    it('should delegate to fetchThemeList with GRADIENT assetType', async () => {
      await actions.fetchGradientList({ main: 'blue', pageNumber: 1 });
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('assetType=GRADIENT');
    });
  });

  // ─── makeRequestWithFullUrl ───────────────────────────────────────────

  describe('makeRequestWithFullUrl', () => {
    it('should send headers from plugin.getHeaders()', async () => {
      await actions.makeRequestWithFullUrl('https://api.test/x', 'GET');
      const [, opts] = fetchStub.firstCall.args;
      expect(opts.headers['x-api-key']).to.equal('test-key');
    });

    it('should not attach body for GET even when body arg is provided', async () => {
      await actions.makeRequestWithFullUrl('https://api.test/x', 'GET', { data: 1 });
      const [, opts] = fetchStub.firstCall.args;
      expect(opts.body).to.be.undefined;
    });

    it('should not attach body for DELETE even when body arg is provided', async () => {
      await actions.makeRequestWithFullUrl('https://api.test/x', 'DELETE', { data: 1 });
      const [, opts] = fetchStub.firstCall.args;
      expect(opts.body).to.be.undefined;
    });

    it('should JSON.stringify body for POST', async () => {
      const body = { name: 'theme' };
      await actions.makeRequestWithFullUrl('https://api.test/x', 'POST', body);
      const [, opts] = fetchStub.firstCall.args;
      expect(JSON.parse(opts.body)).to.deep.equal(body);
    });

    it('should JSON.stringify body for PUT', async () => {
      const body = { name: 'updated' };
      await actions.makeRequestWithFullUrl('https://api.test/x', 'PUT', body);
      const [, opts] = fetchStub.firstCall.args;
      expect(JSON.parse(opts.body)).to.deep.equal(body);
    });

    it('should send FormData as-is and remove Content-Type', async () => {
      const formData = new FormData();
      formData.append('file', 'data');
      await actions.makeRequestWithFullUrl('https://api.test/x', 'POST', formData);
      const [, opts] = fetchStub.firstCall.args;
      expect(opts.body).to.be.instanceOf(FormData);
      expect(opts.headers['Content-Type']).to.be.undefined;
    });

    it('should not attach body when body is null for POST', async () => {
      await actions.makeRequestWithFullUrl('https://api.test/x', 'POST', null);
      const [, opts] = fetchStub.firstCall.args;
      expect(opts.body).to.be.undefined;
    });

    it('should delegate response to plugin.handleResponse', async () => {
      await actions.makeRequestWithFullUrl('https://api.test/x', 'GET');
      expect(mockPlugin.handleResponse.calledOnce).to.be.true;
    });
  });

  // ─── searchPublishedTheme ─────────────────────────────────────────────

  describe('searchPublishedTheme', () => {
    it('should prepend baseUrl for relative paths', async () => {
      await actions.searchPublishedTheme('/themes/123');
      const [url] = fetchStub.firstCall.args;
      expect(url).to.equal('https://test-kuler.com/themes/123');
    });

    it('should use full URL as-is for https:// URLs', async () => {
      await actions.searchPublishedTheme('https://custom.com/t/1');
      const [url] = fetchStub.firstCall.args;
      expect(url).to.equal('https://custom.com/t/1');
    });

    it('should use full URL as-is for http:// URLs', async () => {
      await actions.searchPublishedTheme('http://custom.com/t/1');
      const [url] = fetchStub.firstCall.args;
      expect(url).to.equal('http://custom.com/t/1');
    });

    it('should use GET method', async () => {
      await actions.searchPublishedTheme('/themes/123');
      const [, opts] = fetchStub.firstCall.args;
      expect(opts.method).to.equal('GET');
    });

    it('should use buildPublishedCheckUrl when passed { assetId } object', async () => {
      await actions.searchPublishedTheme({ assetId: 'abc-456' });
      const [url] = fetchStub.firstCall.args;
      const expected = encodeURIComponent(JSON.stringify({ asset_id: 'abc-456' }));
      expect(url).to.include(`q=${expected}`);
      expect(url).to.include('assetType=GRADIENT');
    });

    it('should respect assetType from { assetId, assetType } object', async () => {
      await actions.searchPublishedTheme({ assetId: 'abc-456', assetType: 'THEME' });
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('assetType=THEME');
    });

    it('should use GET method for { assetId } path', async () => {
      await actions.searchPublishedTheme({ assetId: 'abc-456' });
      const [, opts] = fetchStub.firstCall.args;
      expect(opts.method).to.equal('GET');
    });
  });
});
