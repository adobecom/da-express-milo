/* global globalThis */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  SearchActions,
  GalleryActions,
  DataActions,
  RedirectActions,
} from '../../../../../express/code/libs/services/plugins/stock/actions/StockActions.js';
import { StockTopics } from '../../../../../express/code/libs/services/plugins/stock/topics.js';
import { ValidationError } from '../../../../../express/code/libs/services/core/Errors.js';
import { STOCK_DEFAULT_BATCH_SIZE, CURATED_GALLERIES_STOCK } from '../../../../../express/code/libs/services/plugins/stock/constants.js';

async function expectValidationError(fn, extraAssertions = () => {}) {
  try {
    await fn();
    expect.fail('Should have thrown');
  } catch (err) {
    expect(err).to.be.instanceOf(ValidationError);
    extraAssertions(err);
  }
}

// ---------------------------------------------------------------------------
// SearchActions
// ---------------------------------------------------------------------------

const mockSearchResponse = {
  files: [{ id: 1, title: 'sunset' }, { id: 2, title: 'beach' }],
  nb_results: 100,
};

describe('SearchActions', () => {
  let actions;
  let mockPlugin;

  beforeEach(() => {
    mockPlugin = {
      get: sinon.stub().resolves(mockSearchResponse),
      endpoints: { search: '/Search/Files' },
    };
    actions = new SearchActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  describe('getHandlers - action routing', () => {
    it('should return a handler for every StockTopics.SEARCH topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(StockTopics.SEARCH);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(StockTopics.SEARCH);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((key) => {
        expect(expectedTopics).to.include(key);
      });
    });
  });

  describe('searchFiles - delegation', () => {
    it('should call plugin.get with search endpoint', async () => {
      await actions.searchFiles({ main: 'sunset' });
      expect(mockPlugin.get.calledOnce).to.be.true;
      expect(mockPlugin.get.firstCall.args[0]).to.equal('/Search/Files');
    });

    it('should pass built params to plugin.get', async () => {
      await actions.searchFiles({ main: 'sunset', pageNumber: 2 });
      const [, opts] = mockPlugin.get.firstCall.args;
      expect(opts.params['search_parameters[words]']).to.equal('sunset');
      expect(opts.params['search_parameters[offset]']).to.equal(String(STOCK_DEFAULT_BATCH_SIZE));
    });
  });

  describe('searchFiles - validation', () => {
    [
      { label: 'undefined criteria', input: undefined },
      { label: 'null criteria', input: null },
      { label: 'empty object (no main/query)', input: {} },
    ].forEach(({ label, input }) => {
      it(`should throw ValidationError for ${label}`, async () => {
        await expectValidationError(() => actions.searchFiles(input));
      });
    });

    it('should set correct error metadata on ValidationError', async () => {
      await expectValidationError(
        () => actions.searchFiles({}),
        (err) => {
          expect(err.field).to.equal('criteria.main | criteria.query');
          expect(err.serviceName).to.equal('Stock');
          expect(err.topic).to.equal(StockTopics.SEARCH.FILES);
        },
      );
    });
  });

  describe('searchFiles - data transformation', () => {
    it('should rename "files" to "themes" in response', async () => {
      const result = await actions.searchFiles({ main: 'sunset' });
      expect(result).to.have.property('themes').that.is.an('array');
      expect(result.themes).to.have.lengthOf(2);
      expect(result).to.not.have.property('files');
    });

    it('should preserve nb_results', async () => {
      const result = await actions.searchFiles({ main: 'sunset' });
      expect(result.nb_results).to.equal(100);
    });

    it('should return empty themes when files is missing', async () => {
      mockPlugin.get.resolves({ nb_results: 0 });
      const result = await actions.searchFiles({ main: 'test' });
      expect(result.themes).to.deep.equal([]);
    });
  });

  describe('searchFiles - accepts query alias', () => {
    it('should accept criteria.query as an alternative to criteria.main', async () => {
      await actions.searchFiles({ query: 'mountains' });
      const [, opts] = mockPlugin.get.firstCall.args;
      expect(opts.params['search_parameters[words]']).to.equal('mountains');
    });
  });

  describe('buildSearchParams', () => {
    it('should default to page 1 offset 0', () => {
      const params = SearchActions.buildSearchParams({ main: 'test' });
      expect(params['search_parameters[offset]']).to.equal('0');
      expect(params['search_parameters[limit]']).to.equal(String(STOCK_DEFAULT_BATCH_SIZE));
    });

    it('should calculate offset for page 3', () => {
      const params = SearchActions.buildSearchParams({ main: 'test', pageNumber: 3 });
      const expectedOffset = (3 - 1) * STOCK_DEFAULT_BATCH_SIZE;
      expect(params['search_parameters[offset]']).to.equal(String(expectedOffset));
    });

    it('should set locale to en-US', () => {
      const params = SearchActions.buildSearchParams({ main: 'test' });
      expect(params.locale).to.equal('en-US');
    });

    it('should set content_type:photo filter to 1', () => {
      const params = SearchActions.buildSearchParams({ main: 'test' });
      expect(params['search_parameters[filters][content_type:photo]']).to.equal('1');
    });

    it('should set premium filter to false', () => {
      const params = SearchActions.buildSearchParams({ main: 'test' });
      expect(params['search_parameters[filters][premium]']).to.equal('false');
    });
  });
});

// ---------------------------------------------------------------------------
// GalleryActions
// ---------------------------------------------------------------------------

const mockSearchResult = {
  themes: [{ id: 1, title: 'Wilderness photo' }],
  nb_results: 50,
};

describe('GalleryActions', () => {
  let actions;
  let mockPlugin;

  beforeEach(() => {
    mockPlugin = {
      dispatch: sinon.stub().resolves(mockSearchResult),
    };
    actions = new GalleryActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  describe('getHandlers - action routing', () => {
    it('should return a handler for every StockTopics.GALLERY topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(StockTopics.GALLERY);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(StockTopics.GALLERY);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((key) => {
        expect(expectedTopics).to.include(key);
      });
    });
  });

  describe('getCuratedList', () => {
    it('should return an object with themes array', () => {
      const result = actions.getCuratedList();
      expect(result).to.have.property('themes').that.is.an('array');
    });

    it('should return all curated gallery names', () => {
      const result = actions.getCuratedList();
      const titles = result.themes.map((t) => t.title);
      expect(titles).to.deep.equal(CURATED_GALLERIES_STOCK);
    });

    it('should wrap each gallery name in an object with title property', () => {
      const result = actions.getCuratedList();
      result.themes.forEach((theme) => {
        expect(theme).to.have.property('title').that.is.a('string');
      });
    });
  });

  describe('getByName', () => {
    it('should dispatch SEARCH.FILES for a valid curated gallery name', async () => {
      const name = CURATED_GALLERIES_STOCK[0]; // 'Wilderness'
      await actions.getByName({ main: name });

      expect(mockPlugin.dispatch.calledOnce).to.be.true;
      expect(mockPlugin.dispatch.firstCall.args[0]).to.equal(StockTopics.SEARCH.FILES);
    });

    it('should pass criteria with main and query set to gallery name', async () => {
      const name = 'Wilderness';
      await actions.getByName({ main: name });

      const criteria = mockPlugin.dispatch.firstCall.args[1];
      expect(criteria.main).to.equal(name);
      expect(criteria.query).to.equal(name);
    });

    it('should return search results for a valid curated name', async () => {
      const result = await actions.getByName({ main: 'Wilderness' });
      expect(result).to.deep.equal(mockSearchResult);
    });

    it('should return undefined for a non-curated gallery name', async () => {
      const result = await actions.getByName({ main: 'NonExistentGallery' });
      expect(result).to.be.undefined;
      expect(mockPlugin.dispatch.called).to.be.false;
    });

    it('should accept criteria.query as an alias for main', async () => {
      await actions.getByName({ query: 'Flavour' });
      expect(mockPlugin.dispatch.calledOnce).to.be.true;
    });

    it('should return undefined when criteria is empty', async () => {
      const result = await actions.getByName({});
      expect(result).to.be.undefined;
    });

    it('should return undefined when criteria is null', async () => {
      const result = await actions.getByName(null);
      expect(result).to.be.undefined;
    });
  });
});

// ---------------------------------------------------------------------------
// DataActions
// ---------------------------------------------------------------------------

describe('DataActions', () => {
  let actions;
  let mockPlugin;
  let fetchStub;

  beforeEach(() => {
    mockPlugin = {
      getHeaders: sinon.stub().returns({
        'Content-Type': 'application/json',
        'x-api-key': 'test-key',
        'x-product': 'AdobeColor/4.0',
      }),
    };
    actions = new DataActions(mockPlugin);

    fetchStub = sinon.stub(globalThis, 'fetch');
  });

  afterEach(() => sinon.restore());

  describe('getHandlers - action routing', () => {
    it('should return a handler for every StockTopics.DATA topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(StockTopics.DATA);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(StockTopics.DATA);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
    });
  });

  describe('checkAvailability', () => {
    it('should return true when response has files', async () => {
      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ files: [{ id: 1 }] }),
      });

      const result = await actions.checkAvailability('https://stock.adobe.io/Search/Files?q=test');
      expect(result).to.be.true;
    });

    it('should return false when response has empty files', async () => {
      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ files: [] }),
      });

      const result = await actions.checkAvailability('https://stock.adobe.io/Search/Files?q=test');
      expect(result).to.be.false;
    });

    it('should return false when response has no files property', async () => {
      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await actions.checkAvailability('https://stock.adobe.io/Search/Files?q=test');
      expect(result).to.be.false;
    });

    it('should return false on non-OK response', async () => {
      fetchStub.resolves({ ok: false, status: 404, statusText: 'Not Found' });

      const result = await actions.checkAvailability('https://stock.adobe.io/bad-url');
      expect(result).to.be.false;
    });

    it('should return false on network failure', async () => {
      fetchStub.rejects(new TypeError('Failed to fetch'));

      const result = await actions.checkAvailability('https://stock.adobe.io/Search/Files');
      expect(result).to.be.false;
    });

    it('should call fetch with plugin headers', async () => {
      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ files: [{ id: 1 }] }),
      });

      await actions.checkAvailability('https://stock.adobe.io/Search/Files');

      expect(fetchStub.calledOnce).to.be.true;
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.equal('https://stock.adobe.io/Search/Files');
      expect(opts.method).to.equal('GET');
      expect(opts.headers['x-api-key']).to.equal('test-key');
      expect(opts.headers['x-product']).to.equal('AdobeColor/4.0');
    });
  });
});

// ---------------------------------------------------------------------------
// RedirectActions
// ---------------------------------------------------------------------------

describe('RedirectActions', () => {
  let actions;
  let mockPlugin;

  beforeEach(() => {
    mockPlugin = {
      endpoints: {
        redirect: 'https://stock.adobe.com',
        contributor: '/contributor',
      },
    };
    actions = new RedirectActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  describe('getHandlers - action routing', () => {
    it('should return a handler for every StockTopics.REDIRECT topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(StockTopics.REDIRECT);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(StockTopics.REDIRECT);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((key) => {
        expect(expectedTopics).to.include(key);
      });
    });
  });

  describe('getFileUrl', () => {
    it('should return correct URL for a numeric file ID', () => {
      const url = actions.getFileUrl(123456);
      expect(url).to.equal('https://stock.adobe.com/images/id/123456');
    });

    it('should return correct URL for a string file ID', () => {
      const url = actions.getFileUrl('789');
      expect(url).to.equal('https://stock.adobe.com/images/id/789');
    });

    it('should use default base when endpoints.redirect is missing', () => {
      mockPlugin.endpoints = {};
      const url = actions.getFileUrl(123);
      expect(url).to.equal('https://stock.adobe.com/images/id/123');
    });

    // Validation
    [
      { label: 'undefined', input: undefined },
      { label: 'null', input: null },
      { label: 'empty string', input: '' },
    ].forEach(({ label, input }) => {
      it(`should throw ValidationError for ${label} fileId`, async () => {
        await expectValidationError(() => actions.getFileUrl(input));
      });
    });

    it('should set correct error metadata on ValidationError', async () => {
      await expectValidationError(
        () => actions.getFileUrl(undefined),
        (err) => {
          expect(err.field).to.equal('fileId');
          expect(err.serviceName).to.equal('Stock');
          expect(err.topic).to.equal(StockTopics.REDIRECT.GET_FILE_URL);
        },
      );
    });
  });

  describe('getContributorUrl', () => {
    it('should return correct URL for a numeric creator ID', () => {
      const url = actions.getContributorUrl(42);
      expect(url).to.equal('https://stock.adobe.com/contributor/42');
    });

    it('should return correct URL for a string creator ID', () => {
      const url = actions.getContributorUrl('99');
      expect(url).to.equal('https://stock.adobe.com/contributor/99');
    });

    it('should use default base when endpoints.redirect is missing', () => {
      mockPlugin.endpoints = {};
      const url = actions.getContributorUrl(42);
      expect(url).to.equal('https://stock.adobe.com/contributor/42');
    });

    it('should use default contributor path when endpoints.contributor is missing', () => {
      delete mockPlugin.endpoints.contributor;
      const url = actions.getContributorUrl(42);
      expect(url).to.equal('https://stock.adobe.com/contributor/42');
    });

    // Validation
    [
      { label: 'undefined', input: undefined },
      { label: 'null', input: null },
      { label: 'empty string', input: '' },
    ].forEach(({ label, input }) => {
      it(`should throw ValidationError for ${label} creatorId`, async () => {
        await expectValidationError(() => actions.getContributorUrl(input));
      });
    });

    it('should set correct error metadata on ValidationError', async () => {
      await expectValidationError(
        () => actions.getContributorUrl(undefined),
        (err) => {
          expect(err.field).to.equal('creatorId');
          expect(err.serviceName).to.equal('Stock');
          expect(err.topic).to.equal(StockTopics.REDIRECT.GET_CONTRIBUTOR_URL);
        },
      );
    });
  });
});
