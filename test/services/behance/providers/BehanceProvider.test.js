import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import BehanceProvider, {
  createBehanceProvider,
} from '../../../../express/code/libs/services/providers/BehanceProvider.js';
import BehancePlugin from '../../../../express/code/libs/services/plugins/behance/BehancePlugin.js';

function createTestPlugin(PluginClass, overrides = {}) {
  return new PluginClass({
    serviceConfig: {
      baseUrl: 'https://test-api.example.com/v2',
      apiKey: 'test-mock-key',
      endpoints: {
        projects: '/projects',
        galleries: '/galleries',
        graphql: '/graphql',
      },
      graphqlBaseUrl: 'https://test-api.example.com/v3',
      ...overrides.serviceConfig,
    },
    appConfig: {
      features: {},
      ...overrides.appConfig,
    },
  });
}

// ── Mock Response Data ─────────────────────────────────────────────

const mockSearchResults = {
  projects: [
    { id: 10001, name: 'Mock Sunset Photography' },
    { id: 10002, name: 'Mock Urban Design' },
  ],
};

const mockGalleryList = {
  categories: [
    { id: '501', name: 'Mock Industrial Design' },
    { id: '502', name: 'Mock Graphic Design' },
  ],
};

const mockGalleryProjects = {
  gallery: { id: '501', name: 'Mock Graphic Design' },
  entities: [{ id: 20001, name: 'Mock Brand Identity' }],
};

const mockGraphicDesign = {
  projects: {
    nodes: [
      { id: '30001', covers: { size_202: { url: 'https://test.example.com/a.jpg' } } },
    ],
  },
};

describe('BehanceProvider', () => {
  let plugin;
  let provider;
  let fetchStub;

  beforeEach(() => {
    plugin = createTestPlugin(BehancePlugin);

    fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockSearchResults),
    });

    provider = new BehanceProvider(plugin);

    // Suppress lana logging in tests
    window.lana = { log: sinon.stub() };
  });

  afterEach(() => {
    sinon.restore();
    delete window.lana;
  });

  // ── searchProjects ─────────────────────────────────────────────────

  describe('searchProjects - delegation wiring', () => {
    it('should call through to the plugin and return results', async () => {
      const result = await provider.searchProjects('sunset');
      expect(result).to.deep.equal(mockSearchResults);
    });

    it('should pass query as param in the fetch URL', async () => {
      await provider.searchProjects('urban', { sort: 'appreciations', page: 2 });

      const url = fetchStub.firstCall.args[0];
      expect(url).to.include('q=urban');
      expect(url).to.include('sort=appreciations');
      expect(url).to.include('page=2');
    });

    it('should default sort to "featured_date" and page to 1', async () => {
      await provider.searchProjects('test');

      const url = fetchStub.firstCall.args[0];
      expect(url).to.include('sort=featured_date');
      expect(url).to.include('page=1');
    });
  });

  describe('searchProjects - error boundary', () => {
    it('should return null when plugin throws (network error)', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.searchProjects('sunset');
      expect(result).to.be.null;
    });

    it('should return null for invalid input (missing query triggers ValidationError)', async () => {
      const result = await provider.searchProjects(undefined);
      expect(result).to.be.null;
    });

    it('should return null for empty string query', async () => {
      const result = await provider.searchProjects('');
      expect(result).to.be.null;
    });
  });

  // ── getGalleryList ─────────────────────────────────────────────────

  describe('getGalleryList - delegation wiring', () => {
    beforeEach(() => {
      fetchStub.resolves({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockGalleryList),
      });
    });

    it('should call through to the plugin and return results', async () => {
      const result = await provider.getGalleryList();
      expect(result).to.deep.equal(mockGalleryList);
    });

    it('should pass locale option in the fetch URL', async () => {
      await provider.getGalleryList({ locale: 'ja' });

      const url = fetchStub.firstCall.args[0];
      expect(url).to.include('locale=ja');
    });
  });

  describe('getGalleryList - error boundary', () => {
    it('should return null when plugin throws', async () => {
      fetchStub.rejects(new Error('API down'));
      const result = await provider.getGalleryList();
      expect(result).to.be.null;
    });
  });

  // ── getGalleryProjects ─────────────────────────────────────────────

  describe('getGalleryProjects - delegation wiring', () => {
    beforeEach(() => {
      fetchStub.resolves({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockGalleryProjects),
      });
    });

    it('should call through to the plugin and return results', async () => {
      const result = await provider.getGalleryProjects('501');
      expect(result).to.deep.equal(mockGalleryProjects);
    });

    it('should pass galleryId in the fetch URL path', async () => {
      await provider.getGalleryProjects('99', { locale: 'fr', page: 2, perPage: 10 });

      const url = fetchStub.firstCall.args[0];
      expect(url).to.include('/galleries/99/projects');
      expect(url).to.include('locale=fr');
    });
  });

  describe('getGalleryProjects - error boundary', () => {
    it('should return null when plugin throws (network error)', async () => {
      fetchStub.rejects(new Error('Network error'));
      const result = await provider.getGalleryProjects('501');
      expect(result).to.be.null;
    });

    it('should return null for invalid input (missing galleryId)', async () => {
      const result = await provider.getGalleryProjects(null);
      expect(result).to.be.null;
    });

    it('should return null for empty string galleryId', async () => {
      const result = await provider.getGalleryProjects('');
      expect(result).to.be.null;
    });
  });

  // ── getGraphicDesignList ───────────────────────────────────────────

  describe('getGraphicDesignList - delegation wiring', () => {
    beforeEach(() => {
      // GraphQL uses fetch directly via postGraphQL, not plugin.get
      fetchStub.resolves({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: { gallery: mockGraphicDesign },
        }),
      });
    });

    it('should call through to the plugin and return GraphQL result', async () => {
      const result = await provider.getGraphicDesignList();
      expect(result).to.have.property('projects');
    });

    it('should pass slug and count options in the request body', async () => {
      await provider.getGraphicDesignList({ slug: 'illustration', count: 5 });

      const [, opts] = fetchStub.firstCall.args;
      const body = JSON.parse(opts.body);
      expect(body.variables.slug).to.equal('illustration');
      expect(body.variables.count).to.equal(5);
    });
  });

  describe('getGraphicDesignList - error boundary', () => {
    it('should return null when fetch throws', async () => {
      fetchStub.rejects(new Error('GraphQL endpoint down'));
      const result = await provider.getGraphicDesignList();
      expect(result).to.be.null;
    });
  });

  // ── Factory Function ───────────────────────────────────────────────

  describe('createBehanceProvider factory', () => {
    it('should return a BehanceProvider instance', () => {
      const instance = createBehanceProvider(plugin);
      expect(instance).to.be.instanceOf(BehanceProvider);
    });
  });
});
