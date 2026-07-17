/* eslint-disable max-len, no-underscore-dangle */
/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../../express/code/scripts/utils.js';
import { createColorLibrariesPlaceholders } from '../../../../express/code/scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const {
  createLibraryThemeModalContent,
  ensureLibraryThemeModalStyles,
} = await import('../../../../express/code/scripts/color-shared/modal/createLibraryThemeModalContent.js');

const strings = createColorLibrariesPlaceholders();

const flush = () => new Promise((resolve) => { setTimeout(resolve, 0); });

// A controllable stand-in for the library-variant floating toolbar. It records
// the event handlers the modal registers via `on()` so tests can drive
// save/edit/delete/namechange flows deterministically.
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
  const navSpy = sinon.spy();
  const toastSpy = sinon.spy();
  const content = createLibraryThemeModalContent(item, {
    librariesStrings: strings,
    ...options,
    deps: {
      initFloatingToolbar: initStub,
      navigateToColorTool: navSpy,
      showExpressToast: toastSpy,
    },
  });
  document.body.appendChild(content.element);
  // Let the `initFloatingToolbar(...).then(...)` microtask wire the toolbar.
  await flush();
  return {
    content, fake, initStub, navSpy, toastSpy,
  };
}

describe('createLibraryThemeModalContent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    sinon.restore();
  });

  describe('ensureLibraryThemeModalStyles', () => {
    it('is a function that resolves', async () => {
      expect(ensureLibraryThemeModalStyles).to.be.a('function');
      await ensureLibraryThemeModalStyles();
    });
  });

  describe('structure', () => {
    it('returns element, initNav and destroy', async () => {
      const { content } = await mountContent({ id: 't1', name: 'Ocean', colors: ['#001122', '#334455'] });
      expect(content.element).to.be.instanceOf(HTMLElement);
      expect(content.initNav).to.be.a('function');
      expect(content.destroy).to.be.a('function');
      content.destroy();
    });

    it('renders the modal shell (rail, tags, toolbar mount)', async () => {
      const { content } = await mountContent({ id: 't1', name: 'Ocean', colors: ['#001122', '#334455'] });
      const { element } = content;
      expect(element.classList.contains('modal-library-theme')).to.be.true;
      expect(element.querySelector('.modal-palette-container--color-rail')).to.exist;
      expect(element.querySelector('.modal-lib-tags .ax-drawer-tag-section')).to.exist;
      expect(element.querySelector('.modal-palette-toolbar')).to.exist;
      content.destroy();
    });

    it('mounts the toolbar with the library content variant', async () => {
      const item = { id: 't1', name: 'Ocean', colors: ['#001122'] };
      const { content, initStub } = await mountContent(item);
      expect(initStub.calledOnce).to.be.true;
      const toolbarOptions = initStub.firstCall.args[1];
      expect(toolbarOptions.contentVariant).to.equal('library');
      expect(toolbarOptions.item).to.equal(item);
      content.destroy();
    });

    // Regression guard: the modal's Accessibility tools / Edit theme links need
    // libraryId (alongside item.id) to land on the destination page's URL so the
    // save drawer can offer "Save changes" back to this same item.
    it('passes libraryId through to the toolbar options', async () => {
      const item = { id: 't1', name: 'Ocean', colors: ['#001122'] };
      const { content, initStub } = await mountContent(item, { libraryId: 'lib-1' });
      const toolbarOptions = initStub.firstCall.args[1];
      expect(toolbarOptions.libraryId).to.equal('lib-1');
      content.destroy();
    });
  });

  describe('tags', () => {
    it('pre-populates tags from the item', async () => {
      const { content } = await mountContent({
        id: 't1', name: 'Ocean', colors: ['#001122'], tags: ['warm', 'ocean'],
      });
      const values = [...content.element.querySelectorAll('.ax-tag-pill')].map((p) => p.dataset.tagValue);
      expect(values).to.deep.equal(['warm', 'ocean']);
      content.destroy();
    });

    it('adds a tag on Enter and enables Save (dirty)', async () => {
      const { content, fake } = await mountContent({ id: 't1', name: 'Ocean', colors: ['#001122'], tags: [] });
      const input = content.element.querySelector('.ax-tag-field-input');
      input.value = 'sky';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      const values = [...content.element.querySelectorAll('.ax-tag-pill')].map((p) => p.dataset.tagValue);
      expect(values).to.deep.equal(['sky']);

      // The MutationObserver → refreshDirty runs on a microtask.
      await flush();
      expect(fake.spies.setSaveEnabled.lastCall.args[0]).to.be.true;
      content.destroy();
    });
  });

  describe('dirty tracking', () => {
    it('starts with Save disabled', async () => {
      const { content, fake } = await mountContent({ id: 't1', name: 'Ocean', colors: ['#001122'] });
      expect(fake.spies.setSaveEnabled.called).to.be.true;
      expect(fake.spies.setSaveEnabled.lastCall.args[0]).to.be.false;
      content.destroy();
    });

    it('enables Save when the name changes', async () => {
      const { content, fake } = await mountContent({ id: 't1', name: 'Ocean', colors: ['#001122'] });
      fake.toolbar.emit('namechange', { name: 'Ocean Blue' });
      expect(fake.spies.setSaveEnabled.lastCall.args[0]).to.be.true;
      content.destroy();
    });

    it('keeps Save disabled when the name is emptied', async () => {
      const { content, fake } = await mountContent({ id: 't1', name: 'Ocean', colors: ['#001122'] });
      fake.toolbar.emit('namechange', { name: '   ' });
      expect(fake.spies.setSaveEnabled.lastCall.args[0]).to.be.false;
      content.destroy();
    });
  });

  describe('save changes', () => {
    it('persists via the provider and emits libraries:item-updated', async () => {
      const item = {
        id: 't1', name: 'Ocean', colors: ['#001122', '#334455'], tags: ['warm'],
      };
      const updateTheme = sinon.stub().resolves();
      const updateElementMetadata = sinon.stub().resolves();
      const { content, fake, toastSpy } = await mountContent(item, {
        libraryId: 'lib-1',
        ccLibraryProvider: { updateTheme, updateElementMetadata },
      });

      const updated = sinon.spy();
      content.element.addEventListener('libraries:item-updated', updated);

      fake.toolbar.emit('namechange', { name: 'Ocean Blue' });
      fake.toolbar.emit('save-changes');
      await flush();

      expect(updateTheme.calledOnce).to.be.true;
      const [libId, itemId, payload, themeOpts] = updateTheme.firstCall.args;
      expect(libId).to.equal('lib-1');
      expect(itemId).to.equal('t1');
      expect(payload.name).to.equal('Ocean Blue');
      // throwOnError ensures a real API failure rejects instead of silently "succeeding".
      expect(themeOpts).to.deep.equal({ throwOnError: true });

      // The name persists via the metadata endpoint (representation PUT does not).
      expect(updateElementMetadata.calledOnce).to.be.true;
      expect(updateElementMetadata.firstCall.args[0]).to.equal('lib-1');
      expect(updateElementMetadata.firstCall.args[1]).to.deep.equal([{ id: 't1', name: 'Ocean Blue' }]);
      expect(updateElementMetadata.firstCall.args[2]).to.deep.equal({ throwOnError: true });

      expect(toastSpy.calledWithMatch({ variant: 'positive' })).to.be.true;
      expect(updated.calledOnce).to.be.true;
      expect(fake.spies.setSaving.args.map((a) => a[0])).to.deep.equal([true, false]);
      content.destroy();
    });

    it('shows an error toast when no provider is available', async () => {
      const item = { id: 't1', name: 'Ocean', colors: ['#001122'] };
      const { content, fake, toastSpy } = await mountContent(item, { libraryId: 'lib-1' });
      fake.toolbar.emit('save-changes');
      await flush();
      expect(toastSpy.calledWithMatch({ variant: 'negative' })).to.be.true;
      content.destroy();
    });

    it('shows an error toast when the provider rejects', async () => {
      const item = { id: 't1', name: 'Ocean', colors: ['#001122'] };
      const updateTheme = sinon.stub().rejects(new Error('boom'));
      const updateElementMetadata = sinon.stub().resolves();
      const { content, fake, toastSpy } = await mountContent(item, {
        libraryId: 'lib-1',
        ccLibraryProvider: { updateTheme, updateElementMetadata },
      });
      fake.toolbar.emit('save-changes');
      await flush();
      expect(updateTheme.calledOnce).to.be.true;
      expect(toastSpy.calledWithMatch({ variant: 'negative' })).to.be.true;
      content.destroy();
    });
  });

  describe('edit theme', () => {
    it('navigates to the color wheel with the palette', async () => {
      const item = {
        id: 't1', name: 'Ocean', colors: ['#001122', '#334455'], tags: ['warm'],
      };
      const { content, fake, navSpy } = await mountContent(item, {
        toolHrefs: { colorWheel: '/create/color-wheel' },
      });
      fake.toolbar.emit('edit-theme');
      expect(navSpy.calledOnce).to.be.true;
      const [href, payload] = navSpy.firstCall.args;
      expect(href).to.equal('/create/color-wheel');
      expect(payload.colors).to.deep.equal(['#001122', '#334455']);
      expect(payload.tags).to.deep.equal(['warm']);
      content.destroy();
    });

    it('does nothing when no color wheel href is configured', async () => {
      const { content, fake, navSpy } = await mountContent({ id: 't1', name: 'Ocean', colors: ['#001122'] });
      fake.toolbar.emit('edit-theme');
      expect(navSpy.called).to.be.false;
      content.destroy();
    });
  });

  describe('delete', () => {
    it('emits libraries:item-delete without closing the modal (confirm happens in the block)', async () => {
      const item = { id: 't1', name: 'Ocean', colors: ['#001122'] };
      const requestClose = sinon.spy();
      const { content, fake } = await mountContent(item, { libraryId: 'lib-1', requestClose });

      const deleted = sinon.spy();
      content.element.addEventListener('libraries:item-delete', deleted);
      fake.toolbar.emit('delete');

      expect(deleted.calledOnce).to.be.true;
      expect(deleted.firstCall.args[0].detail.item).to.equal(item);
      expect(deleted.firstCall.args[0].detail.libraryId).to.equal('lib-1');
      // The modal must stay open while the block shows the delete confirm dialog.
      expect(requestClose.called).to.be.false;
      content.destroy();
    });
  });

  describe('destroy', () => {
    it('tears down the toolbar handle', async () => {
      const { content, fake } = await mountContent({ id: 't1', name: 'Ocean', colors: ['#001122'] });
      content.destroy();
      expect(fake.spies.destroy.calledOnce).to.be.true;
    });

    it('stops dirty tracking after destroy', async () => {
      const { content, fake } = await mountContent({ id: 't1', name: 'Ocean', colors: ['#001122'], tags: [] });
      content.destroy();
      const callsBefore = fake.spies.setSaveEnabled.callCount;

      const tagsContainer = content.element.querySelector('.ax-tag-field-tags');
      tagsContainer.appendChild(document.createElement('div'));
      await flush();

      expect(fake.spies.setSaveEnabled.callCount).to.equal(callsBefore);
    });
  });
});
