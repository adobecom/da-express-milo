import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { ExploreActions } from '../../../../express/code/libs/services/plugins/kuler/actions/KulerActions.js';
import { KulerTopics } from '../../../../express/code/libs/services/plugins/kuler/topics.js';
import { createMockPlugin, stubFetch } from './helpers.js';

describe('ExploreActions', () => {
  let actions;
  let mockPlugin;
  let fetchStub;

  beforeEach(() => {
    mockPlugin = createMockPlugin({
      endpoints: {
        exploreBaseUrl: 'https://themesb3.test.io',
        api: '/api/v2',
        themePath: '/themes',
        gradientPath: '/gradient',
      },
    });
    actions = new ExploreActions(mockPlugin);
    fetchStub = stubFetch({ themes: [{ id: 'e-1' }] });
  });

  afterEach(() => sinon.restore());

  // ─── getHandlers ──────────────────────────────────────────────────────

  describe('getHandlers', () => {
    it('should map every KulerTopics.EXPLORE value to a function', () => {
      const handlers = actions.getHandlers();
      Object.values(KulerTopics.EXPLORE).forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should have no extra keys beyond KulerTopics.EXPLORE', () => {
      const handlers = actions.getHandlers();
      const expected = Object.values(KulerTopics.EXPLORE);
      expect(Object.keys(handlers)).to.have.lengthOf(expected.length);
    });
  });

  // ─── buildExploreUrl ──────────────────────────────────────────────────

  describe('buildExploreUrl', () => {
    it('should construct base URL from exploreBaseUrl + api + assetPath', () => {
      const url = actions.buildExploreUrl('/themes');
      expect(url).to.match(/^https:\/\/themesb3\.test\.io\/api\/v2\/themes\?/);
    });

    it('should default to https://themesb3.adobe.io when exploreBaseUrl is absent', () => {
      mockPlugin.endpoints.exploreBaseUrl = undefined;
      const url = actions.buildExploreUrl('/themes');
      expect(url).to.match(/^https:\/\/themesb3\.adobe\.io\/api\/v2\/themes\?/);
    });

    it('should default api to /api/v2 when endpoint is absent', () => {
      mockPlugin.endpoints.api = undefined;
      const url = actions.buildExploreUrl('/themes');
      expect(url).to.include('/api/v2/themes');
    });

    it('should default filter to "public"', () => {
      const url = actions.buildExploreUrl('/themes');
      expect(url).to.include('filter=public');
    });

    it('should default sort to "create_time"', () => {
      const url = actions.buildExploreUrl('/themes');
      expect(url).to.include('sort=create_time');
    });

    it('should default time to "month"', () => {
      const url = actions.buildExploreUrl('/themes');
      expect(url).to.include('time=month');
    });

    it('should accept custom filter, sort, and time criteria', () => {
      const url = actions.buildExploreUrl('/themes', {
        filter: 'all',
        sort: 'like_count',
        time: 'week',
      });
      expect(url).to.include('filter=all');
      expect(url).to.include('sort=like_count');
      expect(url).to.include('time=week');
    });

    // ── my_themes filter branch ──

    it('should omit sort and time when filter is "my_themes"', () => {
      const url = actions.buildExploreUrl('/themes', { filter: 'my_themes' });
      expect(url).to.include('filter=my_themes');
      expect(url).to.not.include('sort=');
      expect(url).to.not.include('time=');
    });

    // ── Pagination ──

    it('should compute startIndex=0 for page 1', () => {
      const url = actions.buildExploreUrl('/themes', { pageNumber: 1 });
      expect(url).to.include('startIndex=0');
    });

    it('should compute startIndex=72 for page 2', () => {
      const url = actions.buildExploreUrl('/themes', { pageNumber: 2 });
      expect(url).to.include('startIndex=72');
    });

    it('should compute startIndex=144 for page 3', () => {
      const url = actions.buildExploreUrl('/themes', { pageNumber: 3 });
      expect(url).to.include('startIndex=144');
    });

    it('should default to page 1 when pageNumber is missing', () => {
      const url = actions.buildExploreUrl('/themes');
      expect(url).to.include('startIndex=0');
    });

    it('should include maxNumber=72', () => {
      const url = actions.buildExploreUrl('/themes');
      expect(url).to.include('maxNumber=72');
    });

    it('should handle string pageNumber via parseInt', () => {
      const url = actions.buildExploreUrl('/themes', { pageNumber: '3' });
      expect(url).to.include('startIndex=144');
    });

    // ── Auth-dependent metadata ──

    it('should include metadata=all when user is logged in', () => {
      mockPlugin.getAuthState.returns({ isLoggedIn: true });
      const url = actions.buildExploreUrl('/themes');
      expect(url).to.include('metadata=all');
    });

    it('should NOT include metadata=all when user is logged out', () => {
      const url = actions.buildExploreUrl('/themes');
      expect(url).to.not.include('metadata=all');
    });

    it('should place metadata=all before startIndex in URL order', () => {
      mockPlugin.getAuthState.returns({ isLoggedIn: true });
      const url = actions.buildExploreUrl('/themes');
      const metaIdx = url.indexOf('metadata=all');
      const startIdx = url.indexOf('startIndex=');
      expect(metaIdx).to.be.lessThan(startIdx);
    });
  });

  // ─── fetchExploreThemes ───────────────────────────────────────────────

  describe('fetchExploreThemes', () => {
    it('should call fetchWithFullUrl with built URL and GET method', async () => {
      await actions.fetchExploreThemes({ filter: 'public', pageNumber: 1 });
      expect(mockPlugin.handleResponse.calledOnce).to.be.true;
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/themes');
      expect(opts.method).to.equal('GET');
    });

    it('should use configured themePath', async () => {
      await actions.fetchExploreThemes();
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('/api/v2/themes');
    });

    it('should default themePath to /themes when endpoint is absent', async () => {
      mockPlugin.endpoints.themePath = undefined;
      await actions.fetchExploreThemes();
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('/api/v2/themes');
    });

    it('should return parsed response via handleResponse', async () => {
      const result = await actions.fetchExploreThemes();
      expect(result).to.deep.equal({ themes: [{ id: 'e-1' }] });
    });
  });

  // ─── fetchExploreGradients ────────────────────────────────────────────

  describe('fetchExploreGradients', () => {
    it('should call fetchWithFullUrl with gradient path and GET method', async () => {
      await actions.fetchExploreGradients({ filter: 'public', pageNumber: 1 });
      expect(mockPlugin.handleResponse.calledOnce).to.be.true;
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/gradient');
      expect(opts.method).to.equal('GET');
    });

    it('should use configured gradientPath', async () => {
      await actions.fetchExploreGradients();
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('/api/v2/gradient');
    });

    it('should default gradientPath to /gradient when endpoint is absent', async () => {
      mockPlugin.endpoints.gradientPath = undefined;
      await actions.fetchExploreGradients();
      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('/api/v2/gradient');
    });

    it('should return parsed response via handleResponse', async () => {
      const result = await actions.fetchExploreGradients();
      expect(result).to.deep.equal({ themes: [{ id: 'e-1' }] });
    });
  });
});
