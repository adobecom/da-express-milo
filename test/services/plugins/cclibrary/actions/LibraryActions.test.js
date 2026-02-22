import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  LibraryActions,
} from '../../../../../express/code/libs/services/plugins/cclibrary/actions/CCLibraryActions.js';
import { CCLibraryTopics } from '../../../../../express/code/libs/services/plugins/cclibrary/topics.js';
import { ValidationError } from '../../../../../express/code/libs/services/core/Errors.js';
import {
  ALL_COLOR_ELEMENT_TYPES,
  LIBRARIES_PAGE_SIZE,
  ELEMENTS_PAGE_SIZE,
  LIBRARY_OWNER_SCOPE,
} from '../../../../../express/code/libs/services/plugins/cclibrary/constants.js';

async function expectValidationError(fn, extraAssertions = () => {}) {
  try {
    await fn();
    expect.fail('Should have thrown');
  } catch (err) {
    expect(err).to.be.instanceOf(ValidationError);
    extraAssertions(err);
  }
}

describe('LibraryActions', () => {
  let actions;
  let mockPlugin;

  const mockLibrariesResponse = {
    total_count: 2,
    libraries: [
      { id: 'lib-1', name: 'My Library' },
      { id: 'lib-2', name: 'Another Library' },
    ],
    _links: {},
  };

  const mockElementsResponse = {
    total_count: 2,
    elements: [
      { id: 'elem-1', name: 'Theme A', type: 'colortheme' },
      { id: 'elem-2', name: 'Gradient B', type: 'gradient' },
    ],
  };

  const mockCreatedLibrary = { id: 'lib-new', name: 'New Library' };

  beforeEach(() => {
    mockPlugin = {
      get: sinon.stub().resolves(mockLibrariesResponse),
      post: sinon.stub().resolves(mockCreatedLibrary),
      endpoints: {
        libraries: '/libraries',
        themes: '/elements',
        metadata: '/metadata',
      },
    };
    actions = new LibraryActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  // 1. Structural Correctness
  describe('getHandlers - action routing', () => {
    it('should return a handler for every CCLibraryTopics.LIBRARY topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(CCLibraryTopics.LIBRARY);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(CCLibraryTopics.LIBRARY);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((key) => {
        expect(expectedTopics).to.include(key);
      });
    });
  });

  // 2. Delegation Wiring — createLibrary
  describe('createLibrary', () => {
    it('should call plugin.post with the correct path and body', async () => {
      await actions.createLibrary('My Library');

      expect(mockPlugin.post.calledOnce).to.be.true;
      const [path, body] = mockPlugin.post.firstCall.args;
      expect(path).to.equal('/libraries');
      expect(body).to.deep.equal({ name: 'My Library' });
    });

    it('should return the created library data', async () => {
      const result = await actions.createLibrary('New Library');
      expect(result).to.deep.equal(mockCreatedLibrary);
    });
  });

  // 3. Validation — createLibrary
  describe('createLibrary - validation', () => {
    [
      { label: 'null', input: null },
      { label: 'undefined', input: undefined },
      { label: 'empty string', input: '' },
      { label: 'whitespace only', input: '   ' },
      { label: 'number', input: 123 },
      { label: 'boolean', input: true },
    ].forEach(({ label, input }) => {
      it(`should throw ValidationError for ${label}`, async () => {
        await expectValidationError(() => actions.createLibrary(input));
      });
    });

    it('should set correct error metadata on ValidationError', async () => {
      await expectValidationError(
        () => actions.createLibrary(''),
        (err) => {
          expect(err.field).to.equal('name');
          expect(err.serviceName).to.equal('CCLibrary');
          expect(err.topic).to.equal(CCLibraryTopics.LIBRARY.CREATE);
        },
      );
    });

    it('should NOT throw for a valid name', async () => {
      const result = await actions.createLibrary('Valid Name');
      expect(result).to.deep.equal(mockCreatedLibrary);
    });
  });

  // 2. Delegation Wiring — fetchLibraries
  describe('fetchLibraries', () => {
    it('should call plugin.get with default query params', async () => {
      await actions.fetchLibraries();

      expect(mockPlugin.get.calledOnce).to.be.true;
      const [path, options] = mockPlugin.get.firstCall.args;
      expect(path).to.equal('/libraries');
      expect(options.params).to.deep.equal({
        owner: LIBRARY_OWNER_SCOPE.ALL,
        start: 0,
        limit: LIBRARIES_PAGE_SIZE,
        selector: 'details',
        orderBy: '-modified_date',
        toolkit: 'none',
      });
    });

    it('should allow overriding default query params', async () => {
      await actions.fetchLibraries({ owner: 'private', limit: 10, start: 20 });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.owner).to.equal('private');
      expect(options.params.limit).to.equal(10);
      expect(options.params.start).to.equal(20);
    });

    it('should accept comma-separated owner scopes', async () => {
      await actions.fetchLibraries({ owner: 'private,incoming' });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.owner).to.equal('private,incoming');
    });

    it('should preserve non-overridden defaults when some params are provided', async () => {
      await actions.fetchLibraries({ owner: 'incoming' });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.owner).to.equal('incoming');
      expect(options.params.start).to.equal(0);
      expect(options.params.limit).to.equal(40);
      expect(options.params.selector).to.equal('details');
      expect(options.params.orderBy).to.equal('-modified_date');
      expect(options.params.toolkit).to.equal('none');
    });

    it('should return libraries data from plugin', async () => {
      const result = await actions.fetchLibraries();
      expect(result).to.deep.equal(mockLibrariesResponse);
    });
  });

  // 2. Delegation Wiring — fetchLibraryElements
  describe('fetchLibraryElements', () => {
    beforeEach(() => {
      mockPlugin.get.resolves(mockElementsResponse);
    });

    it('should call plugin.get with the correct path and default params', async () => {
      await actions.fetchLibraryElements('lib-123');

      expect(mockPlugin.get.calledOnce).to.be.true;
      const [path, options] = mockPlugin.get.firstCall.args;
      expect(path).to.equal('/libraries/lib-123/elements');
      expect(options.params).to.deep.equal({
        start: 0,
        limit: ELEMENTS_PAGE_SIZE,
        selector: 'representations',
        type: ALL_COLOR_ELEMENT_TYPES,
      });
    });

    it('should default type to ALL_COLOR_ELEMENT_TYPES when not provided', async () => {
      await actions.fetchLibraryElements('lib-123');

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.type).to.equal(ALL_COLOR_ELEMENT_TYPES);
    });

    it('should allow overriding type param', async () => {
      await actions.fetchLibraryElements('lib-123', { type: 'application/vnd.adobe.element.colortheme+dcx' });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.type).to.equal('application/vnd.adobe.element.colortheme+dcx');
    });

    it('should allow overriding default params', async () => {
      await actions.fetchLibraryElements('lib-123', { start: 10, limit: 25, selector: 'full' });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.start).to.equal(10);
      expect(options.params.limit).to.equal(25);
      expect(options.params.selector).to.equal('full');
    });

    it('should return elements data from plugin', async () => {
      const result = await actions.fetchLibraryElements('lib-123');
      expect(result).to.deep.equal(mockElementsResponse);
    });
  });

  // 3. Validation — fetchLibraryElements
  describe('fetchLibraryElements - validation', () => {
    [
      { label: 'null', input: null },
      { label: 'undefined', input: undefined },
      { label: 'empty string', input: '' },
    ].forEach(({ label, input }) => {
      it(`should throw ValidationError for libraryId = ${label}`, async () => {
        await expectValidationError(() => actions.fetchLibraryElements(input));
      });
    });

    it('should set correct error metadata on ValidationError', async () => {
      await expectValidationError(
        () => actions.fetchLibraryElements(null),
        (err) => {
          expect(err.field).to.equal('libraryId');
          expect(err.serviceName).to.equal('CCLibrary');
          expect(err.topic).to.equal(CCLibraryTopics.LIBRARY.ELEMENTS);
        },
      );
    });
  });
});
