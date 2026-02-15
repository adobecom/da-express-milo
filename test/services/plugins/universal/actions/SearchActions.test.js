/* global globalThis */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { SearchActions } from '../../../../../express/code/libs/services/plugins/universal/actions/UniversalSearchActions.js';
import { UniversalSearchTopics } from '../../../../../express/code/libs/services/plugins/universal/topics.js';
import { ValidationError } from '../../../../../express/code/libs/services/core/Errors.js';
import {
  DEFAULT_BATCH_SIZE,
  AVAILABILITY_CHECK_BATCH_SIZE,
  FORM_FIELD_REQUEST,
  HEADER_X_PRODUCT,
  HEADER_X_PRODUCT_LOCATION,
  PRODUCT_NAME,
  PRODUCT_LOCATION,
  ERROR_IMAGE_REQUIRED_SEARCH,
  ERROR_IMAGE_REQUIRED_CHECK,
  ERROR_FIELD_IMAGE,
} from '../../../../../express/code/libs/services/plugins/universal/constants.js';

// ── Shared Helpers ──

async function expectValidationError(fn, extraAssertions = () => {}) {
  try {
    await fn();
    expect.fail('Should have thrown');
  } catch (err) {
    expect(err).to.be.instanceOf(ValidationError);
    extraAssertions(err);
  }
}

function createMockFile(name = 'test.jpg', type = 'image/jpeg') {
  return new File(['fake-image-data'], name, { type });
}

// ── Mock API Responses ──

const mockSearchResponse = {
  result_sets: [
    {
      items: [
        { id: 'stock-001', title: 'Mountain Landscape', thumbnail_url: 'https://stock.adobe.com/thumb/001.jpg' },
        { id: 'stock-002', title: 'Ocean Sunset', thumbnail_url: 'https://stock.adobe.com/thumb/002.jpg' },
        { id: 'stock-003', title: 'City Skyline', thumbnail_url: 'https://stock.adobe.com/thumb/003.jpg' },
      ],
      total_results: 42,
    },
  ],
};

const mockEmptySearchResponse = {
  result_sets: [{ items: [], total_results: 0 }],
};

// ═══════════════════════════════════════════════════════
//  SearchActions
// ═══════════════════════════════════════════════════════

describe('SearchActions', () => {
  let actions;
  let mockPlugin;
  let fetchStub;

  beforeEach(() => {
    mockPlugin = {
      serviceName: 'UniversalSearch',
      serviceConfig: {
        baseUrl: 'https://adobesearch.adobe.io/universal-search/v2',
        apiKey: 'TEST_API_KEY',
        anonymousApiKey: 'TEST_ANON_API_KEY',
        endpoints: {
          similarity: '/similarity-search',
          anonymousImageSearch: 'https://search.adobe.io/imageSearch',
        },
      },
      getAuthState: sinon.stub().returns({ isLoggedIn: true, token: 'mock-token' }),
      handleResponse: sinon.stub().resolves(mockSearchResponse),
    };

    fetchStub = sinon.stub(globalThis, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockSearchResponse),
    });

    actions = new SearchActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  // ── 1. Structural Correctness ──

  describe('getHandlers - action routing', () => {
    it('should return a handler for every SEARCH topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(UniversalSearchTopics.SEARCH);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(UniversalSearchTopics.SEARCH);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((key) => {
        expect(expectedTopics).to.include(key);
      });
    });
  });

  // ── 2. searchByImage — Validation ──

  describe('searchByImage - validation', () => {
    [
      { label: 'undefined criteria', input: undefined },
      { label: 'null criteria', input: null },
      { label: 'no imageFile property', input: {} },
      { label: 'imageFile is a string', input: { imageFile: 'not-a-file' } },
      { label: 'imageFile is a number', input: { imageFile: 123 } },
      { label: 'imageFile is a plain object', input: { imageFile: { name: 'fake' } } },
      { label: 'imageFile is null', input: { imageFile: null } },
    ].forEach(({ label, input }) => {
      it(`should throw ValidationError for ${label}`, async () => {
        await expectValidationError(() => actions.searchByImage(input));
      });
    });

    it('should include correct error message for missing imageFile', async () => {
      await expectValidationError(
        () => actions.searchByImage({}),
        (err) => {
          expect(err.message).to.equal(ERROR_IMAGE_REQUIRED_SEARCH);
        },
      );
    });

    it('should set correct error metadata on ValidationError', async () => {
      await expectValidationError(
        () => actions.searchByImage({}),
        (err) => {
          expect(err.field).to.equal(ERROR_FIELD_IMAGE);
          expect(err.serviceName).to.equal('UniversalSearch');
          expect(err.topic).to.equal(UniversalSearchTopics.SEARCH.BY_IMAGE);
        },
      );
    });

    it('should NOT throw when imageFile is a valid File instance', async () => {
      const imageFile = createMockFile();
      const result = await actions.searchByImage({ imageFile });
      expect(result).to.have.property('themes');
    });
  });

  // ── 3. searchByImage — Delegation Wiring ──

  describe('searchByImage - delegation', () => {
    it('should call fetch with POST method and FormData body', async () => {
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile });

      expect(fetchStub.calledOnce).to.be.true;
      const [, opts] = fetchStub.firstCall.args;
      expect(opts.method).to.equal('POST');
      expect(opts.body).to.be.instanceOf(FormData);
    });

    it('should call authenticated endpoint when logged in', async () => {
      mockPlugin.getAuthState.returns({ isLoggedIn: true, token: 'mock-token' });
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile });

      const [url] = fetchStub.firstCall.args;
      expect(url).to.include('adobesearch.adobe.io');
      expect(url).to.include('/similarity-search');
    });

    it('should call anonymous endpoint when not logged in', async () => {
      mockPlugin.getAuthState.returns({ isLoggedIn: false, token: null });
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile });

      const [url] = fetchStub.firstCall.args;
      expect(url).to.equal('https://search.adobe.io/imageSearch');
    });

    it('should include Authorization header when authenticated', async () => {
      mockPlugin.getAuthState.returns({ isLoggedIn: true, token: 'test-bearer-token' });
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile });

      const [, opts] = fetchStub.firstCall.args;
      expect(opts.headers.Authorization).to.equal('Bearer test-bearer-token');
    });

    it('should omit Authorization header when anonymous', async () => {
      mockPlugin.getAuthState.returns({ isLoggedIn: false, token: null });
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile });

      const [, opts] = fetchStub.firstCall.args;
      expect(opts.headers.Authorization).to.be.undefined;
    });

    it('should include x-product and x-product-location headers', async () => {
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile });

      const [, opts] = fetchStub.firstCall.args;
      expect(opts.headers[HEADER_X_PRODUCT]).to.equal(PRODUCT_NAME);
      expect(opts.headers[HEADER_X_PRODUCT_LOCATION]).to.equal(PRODUCT_LOCATION);
    });

    it('should include authenticated x-api-key when logged in', async () => {
      mockPlugin.getAuthState.returns({ isLoggedIn: true, token: 'tok' });
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile });

      const [, opts] = fetchStub.firstCall.args;
      expect(opts.headers['x-api-key']).to.equal('TEST_API_KEY');
    });

    it('should use anonymousApiKey when not logged in', async () => {
      mockPlugin.getAuthState.returns({ isLoggedIn: false, token: null });
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile });

      const [, opts] = fetchStub.firstCall.args;
      expect(opts.headers['x-api-key']).to.equal('TEST_ANON_API_KEY');
    });

    it('should call handleResponse with the fetch response', async () => {
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile });

      expect(mockPlugin.handleResponse.calledOnce).to.be.true;
    });
  });

  // ── 4. searchByImage — Pagination / Defaults ──

  describe('searchByImage - pagination defaults', () => {
    it('should default to page 1 and batch size 20', async () => {
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile });

      const [, opts] = fetchStub.firstCall.args;
      const requestJson = JSON.parse(opts.body.get(FORM_FIELD_REQUEST));

      expect(requestJson.limit).to.equal(DEFAULT_BATCH_SIZE);
      expect(requestJson.start_index).to.equal(0);
    });

    it('should respect custom batchSize', async () => {
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile, batchSize: 10 });

      const [, opts] = fetchStub.firstCall.args;
      const requestJson = JSON.parse(opts.body.get(FORM_FIELD_REQUEST));

      expect(requestJson.limit).to.equal(10);
    });

    it('should respect limit as alias for batchSize', async () => {
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile, limit: 5 });

      const [, opts] = fetchStub.firstCall.args;
      const requestJson = JSON.parse(opts.body.get(FORM_FIELD_REQUEST));

      expect(requestJson.limit).to.equal(5);
    });

    it('should prefer batchSize over limit', async () => {
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile, batchSize: 15, limit: 5 });

      const [, opts] = fetchStub.firstCall.args;
      const requestJson = JSON.parse(opts.body.get(FORM_FIELD_REQUEST));

      expect(requestJson.limit).to.equal(15);
    });

    it('should use explicit startIndex when provided', async () => {
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile, startIndex: 40 });

      const [, opts] = fetchStub.firstCall.args;
      const requestJson = JSON.parse(opts.body.get(FORM_FIELD_REQUEST));

      expect(requestJson.start_index).to.equal(40);
    });

    it('should calculate startIndex from pageNumber when startIndex is absent', async () => {
      const imageFile = createMockFile();
      await actions.searchByImage({ imageFile, pageNumber: 3, batchSize: 10 });

      const [, opts] = fetchStub.firstCall.args;
      const requestJson = JSON.parse(opts.body.get(FORM_FIELD_REQUEST));

      // (3 - 1) * 10 = 20
      expect(requestJson.start_index).to.equal(20);
    });
  });

  // ── 5. searchByImage — Data Transformation ──

  describe('searchByImage - data transformation', () => {
    it('should return parsed data with themes array', async () => {
      const imageFile = createMockFile();
      const result = await actions.searchByImage({ imageFile });

      expect(result.themes).to.have.lengthOf(3);
      expect(result.total_results).to.equal(42);
    });

    it('should return empty themes for response with no items', async () => {
      mockPlugin.handleResponse.resolves(mockEmptySearchResponse);
      const imageFile = createMockFile();
      const result = await actions.searchByImage({ imageFile });

      expect(result.themes).to.deep.equal([]);
      expect(result.total_results).to.equal(0);
    });
  });

  // ── 6. searchByImage — Defensive Data Handling ──

  describe('searchByImage - malformed API responses', () => {
    [
      { label: 'empty object', data: {} },
      { label: 'null result_sets', data: { result_sets: null } },
      { label: 'empty result_sets array', data: { result_sets: [] } },
      { label: 'result_sets with empty first entry', data: { result_sets: [{}] } },
      { label: 'missing items in first result_set', data: { result_sets: [{ total_results: 5 }] } },
    ].forEach(({ label, data }) => {
      it(`should handle ${label} gracefully`, async () => {
        mockPlugin.handleResponse.resolves(data);
        const imageFile = createMockFile();
        const result = await actions.searchByImage({ imageFile });

        expect(result.themes).to.deep.equal([]);
      });
    });
  });

  // ── 7. checkDataAvailability — Validation ──

  describe('checkDataAvailability - validation', () => {
    [
      { label: 'undefined criteria', input: undefined },
      { label: 'null criteria', input: null },
      { label: 'no imageFile', input: {} },
      { label: 'imageFile is a string', input: { imageFile: 'not-a-file' } },
      { label: 'imageFile is null', input: { imageFile: null } },
    ].forEach(({ label, input }) => {
      it(`should throw ValidationError for ${label}`, async () => {
        await expectValidationError(() => actions.checkDataAvailability(input));
      });
    });

    it('should set correct error metadata', async () => {
      await expectValidationError(
        () => actions.checkDataAvailability({}),
        (err) => {
          expect(err.message).to.equal(ERROR_IMAGE_REQUIRED_CHECK);
          expect(err.field).to.equal(ERROR_FIELD_IMAGE);
          expect(err.topic).to.equal(UniversalSearchTopics.SEARCH.CHECK_AVAILABILITY);
        },
      );
    });
  });

  // ── 8. checkDataAvailability — Behavior ──

  describe('checkDataAvailability - behavior', () => {
    it('should return true when search yields results', async () => {
      const imageFile = createMockFile();
      const result = await actions.checkDataAvailability({ imageFile });

      expect(result).to.be.true;
    });

    it('should return false when search yields no results', async () => {
      mockPlugin.handleResponse.resolves(mockEmptySearchResponse);
      const imageFile = createMockFile();
      const result = await actions.checkDataAvailability({ imageFile });

      expect(result).to.be.false;
    });

    it('should use AVAILABILITY_CHECK_BATCH_SIZE (1) for the probe', async () => {
      const imageFile = createMockFile();
      await actions.checkDataAvailability({ imageFile });

      const [, opts] = fetchStub.firstCall.args;
      const requestJson = JSON.parse(opts.body.get(FORM_FIELD_REQUEST));

      expect(requestJson.limit).to.equal(AVAILABILITY_CHECK_BATCH_SIZE);
    });

    it('should return false when fetch throws a network error', async () => {
      fetchStub.rejects(new TypeError('Failed to fetch'));

      const imageFile = createMockFile();
      const result = await actions.checkDataAvailability({ imageFile });

      expect(result).to.be.false;
    });

    it('should return false when handleResponse throws an ApiError', async () => {
      mockPlugin.handleResponse.rejects(new Error('500 Internal Server Error'));

      const imageFile = createMockFile();
      const result = await actions.checkDataAvailability({ imageFile });

      expect(result).to.be.false;
    });
  });
});
