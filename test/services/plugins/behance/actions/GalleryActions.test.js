import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { GalleryActions } from '../../../../express/code/libs/services/plugins/behance/actions/BehanceActions.js';
import { BehanceTopics } from '../../../../express/code/libs/services/plugins/behance/topics.js';
import { ValidationError } from '../../../../express/code/libs/services/core/Errors.js';

async function expectValidationError(fn, extraAssertions = () => {}) {
  try {
    await fn();
    expect.fail('Should have thrown');
  } catch (err) {
    expect(err).to.be.instanceOf(ValidationError);
    extraAssertions(err);
  }
}

const mockGalleryListResponse = {
  categories: [
    { id: '501', name: 'Mock Industrial Design' },
    { id: '502', name: 'Mock Graphic Design' },
  ],
};

const mockGalleryProjectsResponse = {
  gallery: { id: '501', name: 'Mock Graphic Design' },
  entities: [
    { id: 20001, name: 'Mock Brand Identity', covers: {} },
    { id: 20002, name: 'Mock Poster Art', covers: {} },
  ],
};

describe('GalleryActions', () => {
  let actions;
  let mockPlugin;

  beforeEach(() => {
    mockPlugin = {
      get: sinon.stub().resolves(mockGalleryListResponse),
      apiKey: 'test-mock-key',
      endpoints: { galleries: '/galleries' },
    };
    actions = new GalleryActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  // ── Structural Correctness ─────────────────────────────────────────

  describe('getHandlers - action routing', () => {
    it('should return a handler for every BehanceTopics.GALLERIES topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(BehanceTopics.GALLERIES);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(BehanceTopics.GALLERIES);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((key) => {
        expect(expectedTopics).to.include(key);
      });
    });
  });

  // ── getGalleryList - Delegation Wiring ─────────────────────────────

  describe('getGalleryList - delegation wiring', () => {
    it('should call plugin.get with galleries endpoint', async () => {
      await actions.getGalleryList();

      expect(mockPlugin.get.calledOnce).to.be.true;
      const [path] = mockPlugin.get.firstCall.args;
      expect(path).to.equal('/galleries');
    });

    it('should return data from plugin.get', async () => {
      const result = await actions.getGalleryList();
      expect(result).to.deep.equal(mockGalleryListResponse);
    });

    it('should pass api-key and locale as params', async () => {
      await actions.getGalleryList({ locale: 'fr' });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params['api-key']).to.equal('test-mock-key');
      expect(options.params.locale).to.equal('fr');
    });
  });

  // ── getGalleryList - Default Parameters ────────────────────────────

  describe('getGalleryList - defaults', () => {
    it('should default locale to "en"', async () => {
      await actions.getGalleryList();

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.locale).to.equal('en');
    });

    it('should use plugin.apiKey for api-key param', async () => {
      await actions.getGalleryList();

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params['api-key']).to.equal('test-mock-key');
    });
  });

  // ── getGalleryProjects - Delegation Wiring ─────────────────────────

  describe('getGalleryProjects - delegation wiring', () => {
    beforeEach(() => {
      mockPlugin.get.resolves(mockGalleryProjectsResponse);
    });

    it('should call plugin.get with correct gallery projects path', async () => {
      await actions.getGalleryProjects({ galleryId: '501' });

      expect(mockPlugin.get.calledOnce).to.be.true;
      const [path] = mockPlugin.get.firstCall.args;
      expect(path).to.equal('/galleries/501/projects');
    });

    it('should return data from plugin.get', async () => {
      const result = await actions.getGalleryProjects({ galleryId: '501' });
      expect(result).to.deep.equal(mockGalleryProjectsResponse);
    });

    it('should pass correct params including ordinal calculation', async () => {
      await actions.getGalleryProjects({
        galleryId: '501',
        locale: 'de',
        page: 3,
        perPage: 10,
      });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params).to.deep.equal({
        'api-key': 'test-mock-key',
        locale: 'de',
        ordinal: 20, // (3 - 1) * 10
        per_page: 10,
      });
    });
  });

  // ── getGalleryProjects - Default Parameters ────────────────────────

  describe('getGalleryProjects - defaults', () => {
    beforeEach(() => {
      mockPlugin.get.resolves(mockGalleryProjectsResponse);
    });

    it('should default locale to "en", page to 1, perPage to 20', async () => {
      await actions.getGalleryProjects({ galleryId: '100' });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.locale).to.equal('en');
      expect(options.params.ordinal).to.equal(0); // (1 - 1) * 20
      expect(options.params.per_page).to.equal(20);
    });
  });

  // ── getGalleryProjects - Ordinal Calculation ───────────────────────

  describe('getGalleryProjects - ordinal calculation', () => {
    beforeEach(() => {
      mockPlugin.get.resolves(mockGalleryProjectsResponse);
    });

    [
      { page: 1, perPage: 20, expectedOrdinal: 0 },
      { page: 2, perPage: 20, expectedOrdinal: 20 },
      { page: 3, perPage: 10, expectedOrdinal: 20 },
      { page: 5, perPage: 5, expectedOrdinal: 20 },
    ].forEach(({ page, perPage, expectedOrdinal }) => {
      it(`should calculate ordinal as ${expectedOrdinal} for page ${page}, perPage ${perPage}`, async () => {
        await actions.getGalleryProjects({ galleryId: '100', page, perPage });

        const [, options] = mockPlugin.get.firstCall.args;
        expect(options.params.ordinal).to.equal(expectedOrdinal);
      });
    });
  });

  // ── getGalleryProjects - Validation ────────────────────────────────

  describe('getGalleryProjects - validation', () => {
    [
      { label: 'undefined criteria', input: undefined },
      { label: 'null criteria', input: null },
      { label: 'missing galleryId', input: {} },
      { label: 'null galleryId', input: { galleryId: null } },
      { label: 'empty string galleryId', input: { galleryId: '' } },
    ].forEach(({ label, input }) => {
      it(`should throw ValidationError for ${label}`, async () => {
        await expectValidationError(() => actions.getGalleryProjects(input));
      });
    });

    it('should include correct error metadata', async () => {
      await expectValidationError(
        () => actions.getGalleryProjects({}),
        (err) => {
          expect(err.field).to.equal('criteria.galleryId');
          expect(err.serviceName).to.equal('Behance');
          expect(err.topic).to.equal(BehanceTopics.GALLERIES.PROJECTS);
        },
      );
    });

    it('should NOT throw for valid numeric galleryId', async () => {
      mockPlugin.get.resolves(mockGalleryProjectsResponse);
      const result = await actions.getGalleryProjects({ galleryId: 12345 });
      expect(result).to.deep.equal(mockGalleryProjectsResponse);
    });

    it('should NOT throw for valid string galleryId', async () => {
      mockPlugin.get.resolves(mockGalleryProjectsResponse);
      const result = await actions.getGalleryProjects({ galleryId: '12345' });
      expect(result).to.deep.equal(mockGalleryProjectsResponse);
    });

    it('should NOT throw for galleryId of 0 (falsy but valid)', async () => {
      mockPlugin.get.resolves(mockGalleryProjectsResponse);
      const result = await actions.getGalleryProjects({ galleryId: 0 });
      expect(result).to.deep.equal(mockGalleryProjectsResponse);
    });
  });
});
