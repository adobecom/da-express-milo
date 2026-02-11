import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import SearchActions from '../../../../plugins/stock/actions/SearchActions.js';
import { StockTopics } from '../../../../plugins/stock/topics.js';
import { ValidationError } from '../../../../core/Errors.js';
import { STOCK_DEFAULT_BATCH_SIZE } from '../../../../plugins/stock/constants.js';

const mockSearchResponse = {
  files: [{ id: 1, title: 'sunset' }, { id: 2, title: 'beach' }],
  nb_results: 100,
};

async function expectValidationError(fn, extraAssertions = () => {}) {
  try {
    await fn();
    expect.fail('Should have thrown');
  } catch (err) {
    expect(err).to.be.instanceOf(ValidationError);
    extraAssertions(err);
  }
}

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
          expect(err.topic).to.equal('SEARCH.FILES');
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
