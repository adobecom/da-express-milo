import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { GraphQLActions } from '../../../../express/code/libs/services/plugins/behance/actions/BehanceActions.js';
import { BehanceTopics } from '../../../../express/code/libs/services/plugins/behance/topics.js';
import {
  DEFAULT_GRAPHIC_DESIGN_SLUG,
  GRAPHIC_DESIGN_QUERY,
} from '../../../../express/code/libs/services/plugins/behance/constants.js';

const mockGraphQLResponse = {
  data: {
    gallery: {
      projects: {
        nodes: [
          { id: '30001', covers: { size_202: { url: 'https://test.example.com/a.jpg' } } },
          { id: '30002', covers: { size_202: { url: 'https://test.example.com/b.jpg' } } },
        ],
      },
    },
  },
};

describe('GraphQLActions', () => {
  let actions;
  let mockPlugin;
  let fetchStub;

  beforeEach(() => {
    mockPlugin = {
      serviceConfig: {
        graphqlBaseUrl: 'https://test-api.example.com/v3',
      },
      endpoints: { graphql: '/graphql' },
      getHeaders: sinon.stub().returns({
        'Content-Type': 'application/json',
        'x-api-key': 'test-mock-key',
      }),
      handleResponse: sinon.stub().resolves(mockGraphQLResponse),
    };

    fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockGraphQLResponse),
    });

    actions = new GraphQLActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  // ── Structural Correctness ─────────────────────────────────────────

  describe('getHandlers - action routing', () => {
    it('should return a handler for every BehanceTopics.GRAPHQL topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(BehanceTopics.GRAPHQL);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(BehanceTopics.GRAPHQL);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
    });
  });

  // ── getGraphQLUrl ──────────────────────────────────────────────────

  describe('getGraphQLUrl', () => {
    it('should build URL from serviceConfig.graphqlBaseUrl and endpoints.graphql', () => {
      const url = actions.getGraphQLUrl();
      expect(url).to.equal('https://test-api.example.com/v3/graphql');
    });

    it('should fall back to default graphql path when endpoints.graphql is missing', () => {
      mockPlugin.endpoints = {};
      const url = actions.getGraphQLUrl();
      expect(url).to.equal('https://test-api.example.com/v3/graphql');
    });

    it('should use custom graphqlBaseUrl when provided', () => {
      mockPlugin.serviceConfig.graphqlBaseUrl = 'https://custom-test.example.com/v3';
      const url = actions.getGraphQLUrl();
      expect(url).to.equal('https://custom-test.example.com/v3/graphql');
    });
  });

  // ── postGraphQL ────────────────────────────────────────────────────

  describe('postGraphQL', () => {
    it('should call fetch with POST method and JSON body', async () => {
      const body = { query: 'query { test }', variables: {} };
      await actions.postGraphQL('https://test-api.example.com/v3/graphql', body);

      expect(fetchStub.calledOnce).to.be.true;
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.equal('https://test-api.example.com/v3/graphql');
      expect(opts.method).to.equal('POST');
      expect(JSON.parse(opts.body)).to.deep.equal(body);
    });

    it('should use headers from plugin.getHeaders()', async () => {
      await actions.postGraphQL('https://test-api.example.com/v3/graphql', {});

      expect(mockPlugin.getHeaders.calledOnce).to.be.true;
      const [, opts] = fetchStub.firstCall.args;
      expect(opts.headers['x-api-key']).to.equal('test-mock-key');
    });

    it('should pass response through plugin.handleResponse', async () => {
      const result = await actions.postGraphQL('https://test-api.example.com/v3/graphql', {});

      expect(mockPlugin.handleResponse.calledOnce).to.be.true;
      expect(result).to.deep.equal(mockGraphQLResponse);
    });
  });

  // ── getGraphicDesignList - Delegation ──────────────────────────────

  describe('getGraphicDesignList - delegation', () => {
    it('should return gallery data from GraphQL response', async () => {
      const result = await actions.getGraphicDesignList();

      expect(result).to.deep.equal(mockGraphQLResponse.data.gallery);
    });

    it('should send correct GraphQL query and default variables', async () => {
      await actions.getGraphicDesignList();

      expect(fetchStub.calledOnce).to.be.true;
      const [, opts] = fetchStub.firstCall.args;
      const body = JSON.parse(opts.body);
      expect(body.query).to.equal(GRAPHIC_DESIGN_QUERY);
      expect(body.variables.slug).to.equal(DEFAULT_GRAPHIC_DESIGN_SLUG);
      expect(body.variables.count).to.equal(10);
    });

    it('should use custom slug and count when provided', async () => {
      await actions.getGraphicDesignList({ slug: 'illustration', count: 5 });

      const [, opts] = fetchStub.firstCall.args;
      const body = JSON.parse(opts.body);
      expect(body.variables.slug).to.equal('illustration');
      expect(body.variables.count).to.equal(5);
    });

    it('should call getGraphQLUrl to build the request URL', async () => {
      await actions.getGraphicDesignList();

      const [url] = fetchStub.firstCall.args;
      expect(url).to.equal('https://test-api.example.com/v3/graphql');
    });
  });

  // ── getGraphicDesignList - Defensive Handling ──────────────────────

  describe('getGraphicDesignList - defensive handling', () => {
    it('should return full response when data.gallery is missing', async () => {
      const oddResponse = { data: { other: 'stuff' } };
      mockPlugin.handleResponse.resolves(oddResponse);

      const result = await actions.getGraphicDesignList();
      // data.gallery is undefined, so ?? falls through to full response
      expect(result).to.deep.equal(oddResponse);
    });

    it('should return full response when data key is missing', async () => {
      const noDataResponse = { errors: [{ message: 'Something failed' }] };
      mockPlugin.handleResponse.resolves(noDataResponse);

      const result = await actions.getGraphicDesignList();
      expect(result).to.deep.equal(noDataResponse);
    });

    it('should return null when response is null', async () => {
      mockPlugin.handleResponse.resolves(null);

      const result = await actions.getGraphicDesignList();
      expect(result).to.be.null;
    });
  });
});
