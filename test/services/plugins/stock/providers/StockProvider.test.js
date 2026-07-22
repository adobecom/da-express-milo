/* global globalThis */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import StockProvider, { createStockProvider } from '../../../../../express/code/libs/services/providers/StockProvider.js';
import StockPlugin from '../../../../../express/code/libs/services/plugins/stock/StockPlugin.js';
import { CURATED_GALLERIES_STOCK } from '../../../../../express/code/libs/services/plugins/stock/constants.js';
import { StockTopics } from '../../../../../express/code/libs/services/plugins/stock/topics.js';

function createTestPlugin(PluginClass, overrides = {}) {
  return new PluginClass({
    serviceConfig: {
      baseUrl: 'https://test.com',
      apiKey: 'test-key',
      endpoints: {
        search: '/Search/Files',
        redirect: 'https://stock.adobe.com',
        contributor: '/contributor',
      },
      ...overrides.serviceConfig,
    },
    appConfig: {
      features: {},
      ...overrides.appConfig,
    },
  });
}

describe('StockProvider', () => {
  let plugin;
  let provider;
  let fetchStub;
  let dispatchSpy;

  beforeEach(() => {
    plugin = createTestPlugin(StockPlugin);
    dispatchSpy = sinon.spy(plugin, 'dispatch');

    // Stub global fetch for all HTTP-based actions
    fetchStub = sinon.stub(globalThis, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        files: [{ id: 1, title: 'test image' }],
        nb_results: 1,
      }),
    });

    provider = new StockProvider(plugin);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('delegation wiring', () => {
    it('searchThemes should return search results', async () => {
      const result = await provider.searchThemes('sunset');
      expect(result).to.have.property('themes').that.is.an('array');
      expect(result.themes).to.have.lengthOf(1);
      expect(dispatchSpy.calledOnce).to.be.true;
      expect(dispatchSpy.firstCall.args[0]).to.equal(StockTopics.SEARCH.FILES);
      expect(dispatchSpy.firstCall.args[1]).to.deep.equal({
        main: 'sunset',
        query: 'sunset',
        pageNumber: 1,
      });
    });

    it('getCuratedGalleries should return gallery list', async () => {
      const result = await provider.getCuratedGalleries();
      expect(result).to.have.property('themes').that.is.an('array');
      const titles = result.themes.map((t) => t.title);
      expect(titles).to.deep.equal(CURATED_GALLERIES_STOCK);
      expect(dispatchSpy.calledOnce).to.be.true;
      expect(dispatchSpy.firstCall.args[0]).to.equal(StockTopics.GALLERY.GET_CURATED_LIST);
    });

    it('getGalleryByName should return results for a valid gallery name', async () => {
      const result = await provider.getGalleryByName('Wilderness');
      expect(result).to.have.property('themes');
      expect(dispatchSpy.calledTwice).to.be.true;
      expect(dispatchSpy.firstCall.args[0]).to.equal(StockTopics.GALLERY.GET_BY_NAME);
      expect(dispatchSpy.firstCall.args[1]).to.deep.equal({
        main: 'Wilderness',
        query: 'Wilderness',
        pageNumber: 1,
      });
      expect(dispatchSpy.secondCall.args[0]).to.equal(StockTopics.SEARCH.FILES);
      expect(dispatchSpy.secondCall.args[1]).to.deep.equal({
        main: 'Wilderness',
        query: 'Wilderness',
        pageNumber: 1,
      });
    });

    it('getGalleryByName should return undefined for unknown gallery', async () => {
      const result = await provider.getGalleryByName('UnknownGallery');
      expect(result).to.be.undefined;
    });

    it('checkDataAvailability should return true when data exists', async () => {
      const endpoint = 'https://stock.adobe.io/Search/Files?q=test';
      const result = await provider.checkDataAvailability(endpoint);
      expect(result).to.be.true;
      expect(dispatchSpy.calledOnce).to.be.true;
      expect(dispatchSpy.firstCall.args[0]).to.equal(StockTopics.DATA.CHECK_AVAILABILITY);
      expect(dispatchSpy.firstCall.args[1]).to.equal(endpoint);
    });

    it('getFileRedirectUrl should return a URL string', async () => {
      const result = await provider.getFileRedirectUrl(123456);
      expect(result).to.be.a('string');
      expect(result).to.include('/images/id/123456');
    });

    it('getContributorUrl should return a URL string', async () => {
      const result = await provider.getContributorUrl(42);
      expect(result).to.be.a('string');
      expect(result).to.include('/contributor/42');
    });
  });

  describe('error boundary (safeExecute)', () => {
    it('searchThemes should return null when fetch fails', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.searchThemes('sunset');
      expect(result).to.be.null;
    });

    it('checkDataAvailability should return false when fetch fails', async () => {
      fetchStub.rejects(new TypeError('Failed to fetch'));
      // DataActions.checkAvailability catches internally and returns false,
      // so safeExecute returns false (not null) here
      const result = await provider.checkDataAvailability('https://bad-url');
      expect(result).to.be.false;
    });

    it('getFileRedirectUrl should return null for invalid input', async () => {
      const result = await provider.getFileRedirectUrl(undefined);
      expect(result).to.be.null;
    });

    it('getContributorUrl should return null for invalid input', async () => {
      const result = await provider.getContributorUrl(null);
      expect(result).to.be.null;
    });
  });

  describe('createStockProvider factory', () => {
    it('should return a StockProvider instance', () => {
      const instance = createStockProvider(plugin);
      expect(instance).to.be.instanceOf(StockProvider);
    });
  });
});
