/* eslint-disable max-len, no-underscore-dangle */
/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../../express/code/scripts/utils.js';
import { createColorLibrariesPlaceholders } from '../../../../express/code/scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const {
  createLibraryGradientModalContent,
  ensureLibraryGradientModalStyles,
} = await import('../../../../express/code/scripts/color-shared/modal/createLibraryGradientModalContent.js');

const strings = createColorLibrariesPlaceholders();

const flush = () => new Promise((resolve) => { setTimeout(resolve, 0); });

const gradientItem = (overrides = {}) => ({
  id: 'g1',
  type: 'gradient',
  name: 'Sunset',
  angle: 90,
  colorStops: [
    { color: [{ mode: 'RGB', value: { r: 255, g: 0, b: 0 } }], offset: 0 },
    { color: [{ mode: 'RGB', value: { r: 0, g: 0, b: 255 } }], offset: 1 },
  ],
  ...overrides,
});

// A controllable stand-in for the library-variant floating toolbar. It records
// the event handlers the modal registers via `on()` so tests can drive
// save/delete/namechange flows deterministically.
function createFakeToolbar() {
  const listeners = {};
  const spies = {
    setSaveEnabled: sinon.spy(),
    setSaving: sinon.spy(),
    updateName: sinon.spy(),
    destroy: sinon.spy(),
  };
  const toolbar = {
    on(event, cb) { (listeners[event] = listeners[event] || []).push(cb); },
    emit(event, detail) { (listeners[event] || []).forEach((cb) => cb(detail)); },
    setSaveEnabled: spies.setSaveEnabled,
    setSaving: spies.setSaving,
    updateName: spies.updateName,
  };
  return { toolbar, listeners, spies };
}

async function mountContent(item, options = {}) {
  const fake = createFakeToolbar();
  const initStub = sinon.stub().resolves({ toolbar: fake.toolbar, destroy: fake.spies.destroy });
  const toastSpy = sinon.spy();
  const content = createLibraryGradientModalContent(item, {
    librariesStrings: strings,
    ...options,
    deps: {
      initFloatingToolbar: initStub,
      showExpressToast: toastSpy,
    },
  });
  document.body.appendChild(content.element);
  // Let the `initFloatingToolbar(...).then(...)` microtask wire the toolbar.
  await flush();
  return {
    content, fake, initStub, toastSpy,
  };
}

// Echoing provider stub: buildGradientPayload nests name + tags in gradient#data
// exactly as the real provider does, so tests can assert the round-tripped tags.
function createProvider() {
  const updateTheme = sinon.stub().resolves();
  const updateElementMetadata = sinon.stub().resolves();
  const buildGradientPayload = sinon.stub().callsFake(({ name, tags = [] }) => ({
    name,
    type: 'application/vnd.adobe.element.gradient+dcx',
    representations: [{ 'gradient#data': { tags } }],
  }));
  return { updateTheme, updateElementMetadata, buildGradientPayload };
}

describe('createLibraryGradientModalContent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    sinon.restore();
  });

  describe('ensureLibraryGradientModalStyles', () => {
    it('is a function that resolves', async () => {
      expect(ensureLibraryGradientModalStyles).to.be.a('function');
      await ensureLibraryGradientModalStyles();
    });
  });

  describe('structure', () => {
    it('returns element, initNav and destroy', async () => {
      const { content } = await mountContent(gradientItem());
      expect(content.element).to.be.instanceOf(HTMLElement);
      expect(content.initNav).to.be.a('function');
      expect(content.destroy).to.be.a('function');
      content.destroy();
    });

    it('renders the modal shell (preview, rail, tags, toolbar mount)', async () => {
      const { content } = await mountContent(gradientItem());
      const { element } = content;
      expect(element.classList.contains('modal-library-gradient')).to.be.true;
      expect(element.querySelector('.modal-gradient-preview')).to.exist;
      expect(element.querySelector('.modal-palette-container--color-rail')).to.exist;
      expect(element.querySelector('.modal-lib-tags .ax-drawer-tag-section')).to.exist;
      expect(element.querySelector('.modal-palette-toolbar')).to.exist;
      content.destroy();
    });

    it('mounts the toolbar as a gradient library variant with Edit hidden', async () => {
      const item = gradientItem();
      const { content, initStub } = await mountContent(item);
      expect(initStub.calledOnce).to.be.true;
      const toolbarOptions = initStub.firstCall.args[1];
      expect(toolbarOptions.contentVariant).to.equal('library');
      expect(toolbarOptions.type).to.equal('gradient');
      expect(toolbarOptions.showEdit).to.be.false;
      expect(toolbarOptions.item).to.equal(item);
      content.destroy();
    });
  });

  describe('tags', () => {
    it('pre-populates tags from the item', async () => {
      const { content } = await mountContent(gradientItem({ tags: ['warm', 'sunset'] }));
      const values = [...content.element.querySelectorAll('.ax-tag-pill')].map((p) => p.dataset.tagValue);
      expect(values).to.deep.equal(['warm', 'sunset']);
      content.destroy();
    });

    it('adds a tag on Enter and enables Save (dirty)', async () => {
      const { content, fake } = await mountContent(gradientItem({ tags: [] }));
      const input = content.element.querySelector('.ax-tag-field-input');
      input.value = 'sky';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      const values = [...content.element.querySelectorAll('.ax-tag-pill')].map((p) => p.dataset.tagValue);
      expect(values).to.deep.equal(['sky']);

      await flush();
      expect(fake.spies.setSaveEnabled.lastCall.args[0]).to.be.true;
      content.destroy();
    });
  });

  describe('dirty tracking', () => {
    it('starts with Save disabled', async () => {
      const { content, fake } = await mountContent(gradientItem());
      expect(fake.spies.setSaveEnabled.called).to.be.true;
      expect(fake.spies.setSaveEnabled.lastCall.args[0]).to.be.false;
      content.destroy();
    });

    it('enables Save when the name changes', async () => {
      const { content, fake } = await mountContent(gradientItem());
      fake.toolbar.emit('namechange', { name: 'Sunset Glow' });
      expect(fake.spies.setSaveEnabled.lastCall.args[0]).to.be.true;
      content.destroy();
    });

    it('keeps Save disabled when the name is emptied', async () => {
      const { content, fake } = await mountContent(gradientItem());
      fake.toolbar.emit('namechange', { name: '   ' });
      expect(fake.spies.setSaveEnabled.lastCall.args[0]).to.be.false;
      content.destroy();
    });
  });

  describe('save changes', () => {
    it('persists name + tags via the provider and emits libraries:item-updated', async () => {
      const item = gradientItem({ tags: ['warm'] });
      const provider = createProvider();
      const { content, fake, toastSpy } = await mountContent(item, {
        libraryId: 'lib-1',
        ccLibraryProvider: provider,
      });

      const updated = sinon.spy();
      content.element.addEventListener('libraries:item-updated', updated);

      // Add a tag so both name and tags are dirty, then save.
      const input = content.element.querySelector('.ax-tag-field-input');
      input.value = 'sky';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fake.toolbar.emit('namechange', { name: 'Sunset Glow' });
      fake.toolbar.emit('save-changes');
      await flush();

      expect(provider.buildGradientPayload.calledOnce).to.be.true;
      const payloadArgs = provider.buildGradientPayload.firstCall.args[0];
      expect(payloadArgs.name).to.equal('Sunset Glow');
      expect(payloadArgs.tags).to.deep.equal(['warm', 'sky']);

      expect(provider.updateTheme.calledOnce).to.be.true;
      const [libId, itemId, payload] = provider.updateTheme.firstCall.args;
      expect(libId).to.equal('lib-1');
      expect(itemId).to.equal('g1');
      expect(payload.name).to.equal('Sunset Glow');
      expect(payload.representations[0]['gradient#data'].tags).to.deep.equal(['warm', 'sky']);

      // The name persists via the metadata endpoint (representation PUT does not).
      expect(provider.updateElementMetadata.calledOnce).to.be.true;
      const [metaLibId, metaElements] = provider.updateElementMetadata.firstCall.args;
      expect(metaLibId).to.equal('lib-1');
      expect(metaElements).to.deep.equal([{ id: 'g1', name: 'Sunset Glow' }]);

      expect(toastSpy.calledWithMatch({ variant: 'positive' })).to.be.true;
      expect(updated.calledOnce).to.be.true;
      expect(fake.spies.setSaving.args.map((a) => a[0])).to.deep.equal([true, false]);
      content.destroy();
    });

    it('shows an error toast when no provider is available', async () => {
      const { content, fake, toastSpy } = await mountContent(gradientItem(), { libraryId: 'lib-1' });
      fake.toolbar.emit('save-changes');
      await flush();
      expect(toastSpy.calledWithMatch({ variant: 'negative' })).to.be.true;
      content.destroy();
    });

    it('shows an error toast when the provider rejects', async () => {
      const provider = createProvider();
      provider.updateTheme.rejects(new Error('boom'));
      const { content, fake, toastSpy } = await mountContent(gradientItem(), {
        libraryId: 'lib-1',
        ccLibraryProvider: provider,
      });
      fake.toolbar.emit('namechange', { name: 'Sunset Glow' });
      fake.toolbar.emit('save-changes');
      await flush();
      expect(provider.updateTheme.calledOnce).to.be.true;
      expect(toastSpy.calledWithMatch({ variant: 'negative' })).to.be.true;
      content.destroy();
    });
  });

  describe('delete', () => {
    it('emits libraries:item-delete and requests close', async () => {
      const item = gradientItem();
      const requestClose = sinon.spy();
      const { content, fake } = await mountContent(item, { libraryId: 'lib-1', requestClose });

      const deleted = sinon.spy();
      content.element.addEventListener('libraries:item-delete', deleted);
      fake.toolbar.emit('delete');

      expect(deleted.calledOnce).to.be.true;
      expect(deleted.firstCall.args[0].detail.item).to.equal(item);
      expect(deleted.firstCall.args[0].detail.libraryId).to.equal('lib-1');
      expect(requestClose.calledOnce).to.be.true;
      content.destroy();
    });
  });

  describe('destroy', () => {
    it('tears down the toolbar handle', async () => {
      const { content, fake } = await mountContent(gradientItem());
      content.destroy();
      expect(fake.spies.destroy.calledOnce).to.be.true;
    });

    it('stops dirty tracking after destroy', async () => {
      const { content, fake } = await mountContent(gradientItem({ tags: [] }));
      content.destroy();
      const callsBefore = fake.spies.setSaveEnabled.callCount;

      const tagsContainer = content.element.querySelector('.ax-tag-field-tags');
      tagsContainer.appendChild(document.createElement('div'));
      await flush();

      expect(fake.spies.setSaveEnabled.callCount).to.equal(callsBefore);
    });
  });
});
