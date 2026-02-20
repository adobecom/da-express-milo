import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { UrlActions } from '../../../../express/code/libs/services/plugins/universal/actions/UniversalSearchActions.js';
import { UniversalSearchTopics } from '../../../../express/code/libs/services/plugins/universal/topics.js';

describe('UrlActions', () => {
  let actions;
  let mockPlugin;

  beforeEach(() => {
    mockPlugin = {
      serviceConfig: {
        baseUrl: 'https://adobesearch.adobe.io/universal-search/v2',
        endpoints: {
          similarity: '/similarity-search',
          anonymousImageSearch: 'https://search.adobe.io/imageSearch',
        },
      },
      getAuthState: sinon.stub().returns({ isLoggedIn: false }),
    };

    actions = new UrlActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  // ── 1. Structural Correctness ──

  describe('getHandlers - action routing', () => {
    it('should return a handler for every URL topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(UniversalSearchTopics.URL);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(UniversalSearchTopics.URL);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((key) => {
        expect(expectedTopics).to.include(key);
      });
    });
  });

  // ── 2. getSearchUrl — Authenticated Path ──

  describe('getSearchUrl - authenticated', () => {
    it('should return authenticated URL parts when isLoggedIn is true', () => {
      const result = actions.getSearchUrl(true);

      expect(result.fullUrl).to.equal(
        'https://adobesearch.adobe.io/universal-search/v2/similarity-search',
      );
      expect(result.basePath).to.equal('https://adobesearch.adobe.io/universal-search/v2');
      expect(result.api).to.equal('/universal-search/v2');
      expect(result.searchPath).to.equal('/similarity-search');
    });

    it('should strip trailing slash from baseUrl', () => {
      mockPlugin.serviceConfig.baseUrl = 'https://adobesearch.adobe.io/universal-search/v2/';
      actions = new UrlActions(mockPlugin);

      const result = actions.getSearchUrl(true);
      expect(result.basePath).to.equal('https://adobesearch.adobe.io/universal-search/v2');
      expect(result.fullUrl).to.not.include('//similarity');
    });
  });

  // ── 3. getSearchUrl — Anonymous Path ──

  describe('getSearchUrl - anonymous', () => {
    it('should return anonymous URL parts when isLoggedIn is false', () => {
      const result = actions.getSearchUrl(false);

      expect(result.fullUrl).to.equal('https://search.adobe.io/imageSearch');
      expect(result.basePath).to.equal('https://search.adobe.io');
      expect(result.api).to.equal('');
      expect(result.searchPath).to.equal('/imageSearch');
    });
  });

  // ── 4. getSearchUrl — Fallback to Auth State ──

  describe('getSearchUrl - fallback to auth state', () => {
    it('should use plugin auth state when isLoggedIn argument is omitted', () => {
      mockPlugin.getAuthState.returns({ isLoggedIn: true });
      const result = actions.getSearchUrl();

      expect(result.fullUrl).to.include('/similarity-search');
    });

    it('should default to anonymous when isLoggedIn is undefined and auth state is falsy', () => {
      mockPlugin.getAuthState.returns(null);
      const result = actions.getSearchUrl();

      expect(result.fullUrl).to.equal('https://search.adobe.io/imageSearch');
    });

    it('should default to anonymous when isLoggedIn is undefined and auth state has no isLoggedIn', () => {
      mockPlugin.getAuthState.returns({});
      const result = actions.getSearchUrl();

      expect(result.fullUrl).to.equal('https://search.adobe.io/imageSearch');
    });
  });

  // ── 5. getSearchUrl — Config Edge Cases ──

  describe('getSearchUrl - missing config', () => {
    it('should fall back to default similarity path when endpoints.similarity is missing', () => {
      mockPlugin.serviceConfig = { baseUrl: 'https://example.com' };
      actions = new UrlActions(mockPlugin);

      const result = actions.getSearchUrl(true);

      expect(result.fullUrl).to.equal('https://example.com/similarity-search');
      expect(result.searchPath).to.equal('/similarity-search');
    });

    it('should handle missing baseUrl (empty basePath)', () => {
      mockPlugin.serviceConfig = {
        endpoints: { anonymousImageSearch: 'https://search.adobe.io/imageSearch' },
      };
      actions = new UrlActions(mockPlugin);

      const result = actions.getSearchUrl(true);

      expect(result.basePath).to.equal('');
      expect(result.fullUrl).to.equal('/similarity-search');
    });

    it('should handle completely empty serviceConfig', () => {
      mockPlugin.serviceConfig = {};
      actions = new UrlActions(mockPlugin);

      const result = actions.getSearchUrl(false);
      expect(result.fullUrl).to.equal('');
      expect(result.basePath).to.equal('');
    });

    it('should handle undefined serviceConfig', () => {
      mockPlugin.serviceConfig = undefined;
      actions = new UrlActions(mockPlugin);

      const result = actions.getSearchUrl(false);
      expect(result.fullUrl).to.equal('');
    });
  });
});
