import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  LibraryActions,
  LibraryThemeActions,
} from '../../../../../express/code/libs/services/plugins/cclibrary/actions/CCLibraryActions.js';
import { CCLibraryTopics } from '../../../../../express/code/libs/services/plugins/cclibrary/topics.js';
import { ValidationError } from '../../../../../express/code/libs/services/core/Errors.js';

async function expectValidationError(fn, extraAssertions = () => {}) {
  try {
    await fn();
    expect.fail('Should have thrown');
  } catch (err) {
    expect(err).to.be.instanceOf(ValidationError);
    extraAssertions(err);
  }
}

// --- LibraryActions ---

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
        owner: 'all',
        start: 0,
        limit: 40,
        selector: 'details',
        orderBy: '-modified',
        toolkit: 'none',
      });
    });

    it('should allow overriding default query params', async () => {
      await actions.fetchLibraries({ owner: 'self', limit: 10, start: 20 });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.owner).to.equal('self');
      expect(options.params.limit).to.equal(10);
      expect(options.params.start).to.equal(20);
    });

    it('should preserve non-overridden defaults when some params are provided', async () => {
      await actions.fetchLibraries({ owner: 'shared' });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.owner).to.equal('shared');
      expect(options.params.start).to.equal(0);
      expect(options.params.limit).to.equal(40);
      expect(options.params.selector).to.equal('details');
      expect(options.params.orderBy).to.equal('-modified');
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
        limit: 50,
        selector: 'representations',
      });
    });

    it('should include type param when provided', async () => {
      await actions.fetchLibraryElements('lib-123', { type: 'application/vnd.adobe.element+dcx' });

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params.type).to.equal('application/vnd.adobe.element+dcx');
    });

    it('should omit type param when not provided', async () => {
      await actions.fetchLibraryElements('lib-123');

      const [, options] = mockPlugin.get.firstCall.args;
      expect(options.params).to.not.have.property('type');
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

// --- LibraryThemeActions ---

describe('LibraryThemeActions', () => {
  let actions;
  let mockPlugin;

  const mockSaveResponse = { elements: [{ id: 'elem-1', name: 'New Theme', type: 'colortheme' }] };
  const mockEmptyResponse = {};

  beforeEach(() => {
    mockPlugin = {
      get: sinon.stub().resolves({}),
      post: sinon.stub().resolves(mockSaveResponse),
      put: sinon.stub().resolves(mockEmptyResponse),
      delete: sinon.stub().resolves(mockEmptyResponse),
      endpoints: {
        libraries: '/libraries',
        themes: '/elements',
        metadata: '/metadata',
      },
    };
    actions = new LibraryThemeActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  // 1. Structural Correctness
  describe('getHandlers - action routing', () => {
    it('should return a handler for every CCLibraryTopics.THEME topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(CCLibraryTopics.THEME);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(CCLibraryTopics.THEME);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((key) => {
        expect(expectedTopics).to.include(key);
      });
    });
  });

  // --- saveTheme ---
  describe('saveTheme', () => {
    const themeData = { name: 'My Theme', type: 'colortheme', representations: [] };

    it('should call plugin.post with the correct path and body', async () => {
      await actions.saveTheme('lib-123', themeData);

      expect(mockPlugin.post.calledOnce).to.be.true;
      const [path, body] = mockPlugin.post.firstCall.args;
      expect(path).to.equal('/libraries/lib-123/elements');
      expect(body).to.deep.equal(themeData);
    });

    it('should return saved theme data from plugin', async () => {
      const result = await actions.saveTheme('lib-123', themeData);
      expect(result).to.deep.equal(mockSaveResponse);
    });
  });

  describe('saveTheme - validation', () => {
    [
      { label: 'null libraryId', args: [null, { name: 'theme' }], field: 'libraryId' },
      { label: 'empty libraryId', args: ['', { name: 'theme' }], field: 'libraryId' },
      { label: 'undefined libraryId', args: [undefined, { name: 'theme' }], field: 'libraryId' },
      { label: 'null themeData', args: ['lib-1', null], field: 'themeData' },
      { label: 'undefined themeData', args: ['lib-1', undefined], field: 'themeData' },
      { label: 'string themeData', args: ['lib-1', 'not-an-object'], field: 'themeData' },
      { label: 'number themeData', args: ['lib-1', 42], field: 'themeData' },
    ].forEach(({ label, args, field }) => {
      it(`should throw ValidationError for ${label}`, async () => {
        await expectValidationError(
          () => actions.saveTheme(...args),
          (err) => {
            expect(err.field).to.equal(field);
            expect(err.serviceName).to.equal('CCLibrary');
            expect(err.topic).to.equal(CCLibraryTopics.THEME.SAVE);
          },
        );
      });
    });
  });

  // --- saveGradient ---
  describe('saveGradient', () => {
    const gradientData = { name: 'My Gradient', type: 'gradient', representations: [] };

    it('should call plugin.post with the correct path and body', async () => {
      await actions.saveGradient('lib-123', gradientData);

      expect(mockPlugin.post.calledOnce).to.be.true;
      const [path, body] = mockPlugin.post.firstCall.args;
      expect(path).to.equal('/libraries/lib-123/elements');
      expect(body).to.deep.equal(gradientData);
    });

    it('should return saved gradient data from plugin', async () => {
      const result = await actions.saveGradient('lib-123', gradientData);
      expect(result).to.deep.equal(mockSaveResponse);
    });
  });

  describe('saveGradient - validation', () => {
    [
      { label: 'null libraryId', args: [null, { name: 'grad' }], field: 'libraryId' },
      { label: 'empty libraryId', args: ['', { name: 'grad' }], field: 'libraryId' },
      { label: 'null gradientData', args: ['lib-1', null], field: 'gradientData' },
      { label: 'undefined gradientData', args: ['lib-1', undefined], field: 'gradientData' },
      { label: 'string gradientData', args: ['lib-1', 'not-an-object'], field: 'gradientData' },
    ].forEach(({ label, args, field }) => {
      it(`should throw ValidationError for ${label}`, async () => {
        await expectValidationError(
          () => actions.saveGradient(...args),
          (err) => {
            expect(err.field).to.equal(field);
            expect(err.serviceName).to.equal('CCLibrary');
            expect(err.topic).to.equal(CCLibraryTopics.THEME.SAVE_GRADIENT);
          },
        );
      });
    });
  });

  // --- deleteTheme ---
  describe('deleteTheme', () => {
    it('should call plugin.delete with the correct path', async () => {
      await actions.deleteTheme('lib-123', 'elem-456');

      expect(mockPlugin.delete.calledOnce).to.be.true;
      const [path] = mockPlugin.delete.firstCall.args;
      expect(path).to.equal('/libraries/lib-123/elements/elem-456');
    });

    it('should return empty object from plugin', async () => {
      const result = await actions.deleteTheme('lib-123', 'elem-456');
      expect(result).to.deep.equal(mockEmptyResponse);
    });
  });

  describe('deleteTheme - validation', () => {
    [
      { label: 'null libraryId', args: [null, 'elem-1'], field: 'libraryId' },
      { label: 'empty libraryId', args: ['', 'elem-1'], field: 'libraryId' },
      { label: 'null elementId', args: ['lib-1', null], field: 'elementId' },
      { label: 'empty elementId', args: ['lib-1', ''], field: 'elementId' },
      { label: 'undefined elementId', args: ['lib-1', undefined], field: 'elementId' },
    ].forEach(({ label, args, field }) => {
      it(`should throw ValidationError for ${label}`, async () => {
        await expectValidationError(
          () => actions.deleteTheme(...args),
          (err) => {
            expect(err.field).to.equal(field);
            expect(err.serviceName).to.equal('CCLibrary');
            expect(err.topic).to.equal(CCLibraryTopics.THEME.DELETE);
          },
        );
      });
    });
  });

  // --- updateTheme ---
  describe('updateTheme', () => {
    const updatePayload = { client: 'express', type: 'colortheme', representations: [] };

    it('should call plugin.put with the correct path and body', async () => {
      await actions.updateTheme('lib-123', 'elem-456', updatePayload);

      expect(mockPlugin.put.calledOnce).to.be.true;
      const [path, body] = mockPlugin.put.firstCall.args;
      expect(path).to.equal('/libraries/lib-123/elements/elem-456/representations');
      expect(body).to.deep.equal(updatePayload);
    });

    it('should return update response from plugin', async () => {
      const result = await actions.updateTheme('lib-123', 'elem-456', updatePayload);
      expect(result).to.deep.equal(mockEmptyResponse);
    });
  });

  describe('updateTheme - validation', () => {
    [
      { label: 'null libraryId', args: [null, 'elem-1', { data: true }], field: 'libraryId' },
      { label: 'empty libraryId', args: ['', 'elem-1', { data: true }], field: 'libraryId' },
      { label: 'null elementId', args: ['lib-1', null, { data: true }], field: 'elementId' },
      { label: 'empty elementId', args: ['lib-1', '', { data: true }], field: 'elementId' },
      { label: 'null payload', args: ['lib-1', 'elem-1', null], field: 'payload' },
      { label: 'undefined payload', args: ['lib-1', 'elem-1', undefined], field: 'payload' },
      { label: 'string payload', args: ['lib-1', 'elem-1', 'not-object'], field: 'payload' },
    ].forEach(({ label, args, field }) => {
      it(`should throw ValidationError for ${label}`, async () => {
        await expectValidationError(
          () => actions.updateTheme(...args),
          (err) => {
            expect(err.field).to.equal(field);
            expect(err.serviceName).to.equal('CCLibrary');
            expect(err.topic).to.equal(CCLibraryTopics.THEME.UPDATE);
          },
        );
      });
    });
  });

  // --- updateElementMetadata ---
  describe('updateElementMetadata', () => {
    const elements = [{ id: 'elem-1', name: 'Renamed Theme' }];

    it('should call plugin.put with the correct path and body', async () => {
      await actions.updateElementMetadata('lib-123', elements);

      expect(mockPlugin.put.calledOnce).to.be.true;
      const [path, body] = mockPlugin.put.firstCall.args;
      expect(path).to.equal('/libraries/lib-123/elements/metadata');
      expect(body).to.deep.equal({ elements });
    });

    it('should return response from plugin', async () => {
      const result = await actions.updateElementMetadata('lib-123', elements);
      expect(result).to.deep.equal(mockEmptyResponse);
    });
  });

  describe('updateElementMetadata - validation', () => {
    [
      { label: 'null libraryId', args: [null, [{ id: 'e1' }]], field: 'libraryId' },
      { label: 'empty libraryId', args: ['', [{ id: 'e1' }]], field: 'libraryId' },
      { label: 'null elements', args: ['lib-1', null], field: 'elements' },
      { label: 'undefined elements', args: ['lib-1', undefined], field: 'elements' },
      { label: 'empty array elements', args: ['lib-1', []], field: 'elements' },
      { label: 'non-array elements (string)', args: ['lib-1', 'not-array'], field: 'elements' },
      { label: 'non-array elements (object)', args: ['lib-1', { id: 'e1' }], field: 'elements' },
    ].forEach(({ label, args, field }) => {
      it(`should throw ValidationError for ${label}`, async () => {
        await expectValidationError(
          () => actions.updateElementMetadata(...args),
          (err) => {
            expect(err.field).to.equal(field);
            expect(err.serviceName).to.equal('CCLibrary');
            expect(err.topic).to.equal(CCLibraryTopics.THEME.UPDATE_METADATA);
          },
        );
      });
    });
  });
});
