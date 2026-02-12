import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { ProjectActions } from '../../../../express/code/libs/services/plugins/behance/actions/BehanceActions.js';
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

const mockProjectsResponse = {
  projects: [
    { id: 10001, name: 'Mock Sunset Photography', covers: { size_202: { url: 'https://test.example.com/cover1.jpg' } } },
    { id: 10002, name: 'Mock Urban Design', covers: { size_202: { url: 'https://test.example.com/cover2.jpg' } } },
  ],
};

describe('ProjectActions', () => {
  let actions;
  let mockPlugin;

  beforeEach(() => {
    mockPlugin = {
      get: sinon.stub().resolves(mockProjectsResponse),
      endpoints: { projects: '/projects' },
    };
    actions = new ProjectActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  // ── Structural Correctness ─────────────────────────────────────────

  describe('getHandlers - action routing', () => {
    it('should return a handler for every BehanceTopics.PROJECTS topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(BehanceTopics.PROJECTS);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(BehanceTopics.PROJECTS);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((key) => {
        expect(expectedTopics).to.include(key);
      });
    });
  });

  // ── searchProjects - Delegation Wiring ─────────────────────────────

  describe('searchProjects - delegation wiring', () => {
    it('should call plugin.get with correct endpoint', async () => {
      await actions.searchProjects({ query: 'sunset' });

      expect(mockPlugin.get.calledOnce).to.be.true;
      const [path] = mockPlugin.get.firstCall.args;
      expect(path).to.equal('/projects');
    });

    it('should return data from plugin.get', async () => {
      const result = await actions.searchProjects({ query: 'sunset' });
      expect(result).to.deep.equal(mockProjectsResponse);
    });

    it('should pass query, sort, and page as params', async () => {
      await actions.searchProjects({ query: 'urban', sort: 'appreciations', page: 3 });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params).to.deep.equal({
        q: 'urban',
        sort: 'appreciations',
        page: 3,
      });
    });
  });

  // ── searchProjects - Default Parameters ────────────────────────────

  describe('searchProjects - defaults', () => {
    it('should default sort to "featured_date" and page to 1', async () => {
      await actions.searchProjects({ query: 'test' });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.sort).to.equal('featured_date');
      expect(options.params.page).to.equal(1);
    });

    it('should allow overriding defaults', async () => {
      await actions.searchProjects({ query: 'test', sort: 'views', page: 5 });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.sort).to.equal('views');
      expect(options.params.page).to.equal(5);
    });
  });

  // ── searchProjects - Validation ────────────────────────────────────

  describe('searchProjects - validation', () => {
    [
      { label: 'undefined criteria', input: undefined },
      { label: 'null criteria', input: null },
      { label: 'empty object (no query)', input: {} },
      { label: 'criteria with empty string query', input: { query: '' } },
    ].forEach(({ label, input }) => {
      it(`should throw ValidationError for ${label}`, async () => {
        await expectValidationError(() => actions.searchProjects(input));
      });
    });

    it('should include correct error metadata', async () => {
      await expectValidationError(
        () => actions.searchProjects(null),
        (err) => {
          expect(err.field).to.equal('criteria.query');
          expect(err.serviceName).to.equal('Behance');
          expect(err.topic).to.equal(BehanceTopics.PROJECTS.SEARCH);
        },
      );
    });

    it('should include helpful message text', async () => {
      await expectValidationError(
        () => actions.searchProjects({}),
        (err) => {
          expect(err.message).to.include('query');
        },
      );
    });
  });
});
