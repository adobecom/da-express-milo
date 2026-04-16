/* eslint-disable max-len, no-promise-executor-return */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../../express/code/scripts/utils.js';
import { createDrawer } from '../../../../express/code/scripts/color-shared/toolbar/createDrawerComponent.js';
import { MOCK_PALETTE, MOCK_GRADIENT, MOCK_LIBRARIES } from './mocks/palette.js';
import { createMockCCLibraryProvider } from './mocks/stubs.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const signedOutDeps = { checkAuth: () => false, loadDeps: () => {} };
const signedInDeps = { checkAuth: () => true, loadDeps: () => {} };

function waitForRaf() {
  return new Promise((r) => requestAnimationFrame(r));
}

function waitForClose() {
  return new Promise((r) => setTimeout(r, 300));
}

function createAnchor() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Open drawer';
  btn.style.cssText = 'position:fixed;top:100px;left:400px;width:40px;height:40px;';
  document.body.appendChild(btn);
  return btn;
}

function defaultOptions(overrides = {}) {
  return {
    paletteData: MOCK_PALETTE,
    type: 'palette',
    anchorElement: overrides.anchorElement ?? createAnchor(),
    onSave: overrides.onSave ?? sinon.stub(),
    onClose: overrides.onClose ?? sinon.stub(),
    libraries: overrides.libraries ?? [],
    ccLibraryProvider: overrides.ccLibraryProvider ?? null,
    onLibraryCreated: overrides.onLibraryCreated ?? sinon.stub(),
    deps: overrides.deps ?? signedOutDeps,
    ...overrides,
  };
}

async function openDrawer(drawer) {
  await drawer.open();
  await waitForRaf();
  await waitForRaf();
}

// Fix tests MWPW-192264
describe.skip('createDrawer', function drawerSuite() {
  this.timeout(10000);

  let origWidth;
  let anchor;

  beforeEach(() => {
    origWidth = window.innerWidth;
  });

  afterEach(async () => {
    sinon.restore();
    document.querySelectorAll('.ax-drawer-panel, .ax-drawer-curtain').forEach((el) => el.remove());
    document.body.classList.remove('ax-drawer-body-locked');
    if (anchor && anchor.parentNode) anchor.remove();
    anchor = null;
    Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    await new Promise((r) => setTimeout(r, 300));
  });

  describe('API', () => {
    it('returns { open, close, destroy, isOpen } with correct types', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      expect(drawer.open).to.be.a('function');
      expect(drawer.close).to.be.a('function');
      expect(drawer.destroy).to.be.a('function');
      expect(typeof drawer.isOpen).to.equal('boolean');
    });

    it('isOpen is false initially', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      expect(drawer.isOpen).to.be.false;
    });
  });

  describe('open — desktop', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('renders .ax-drawer-panel[role="dialog"][aria-modal="true"] in document.body', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const panel = document.querySelector('.ax-drawer-panel');
      expect(panel).to.exist;
      expect(panel.getAttribute('role')).to.equal('dialog');
      expect(panel.getAttribute('aria-modal')).to.equal('true');
      expect(panel.parentNode).to.equal(document.body);

      drawer.close();
      await waitForClose();
    });

    it('sets isOpen to true', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      expect(drawer.isOpen).to.be.true;

      drawer.close();
      await waitForClose();
    });

    it('renders title "Save to Creative Cloud Libraries"', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const title = document.querySelector('h2.ax-drawer-title');
      expect(title).to.exist;
      expect(title.textContent).to.equal('Save to Creative Cloud Libraries');
      expect(title.id).to.equal('ax-drawer-title');

      drawer.close();
      await waitForClose();
    });

    it('renders palette name input with correct value', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const input = document.querySelector('#ax-drawer-palette-name');
      expect(input).to.exist;
      expect(input.value).to.equal('Test Palette');

      drawer.close();
      await waitForClose();
    });

    it('does NOT render curtain in body on desktop', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const curtain = document.querySelector('.ax-drawer-curtain');
      expect(curtain).to.not.exist;

      drawer.close();
      await waitForClose();
    });

    it('does NOT add .ax-drawer-mobile class', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const panel = document.querySelector('.ax-drawer-panel');
      expect(panel.classList.contains('ax-drawer-mobile')).to.be.false;

      drawer.close();
      await waitForClose();
    });
  });

  describe('open — mobile', () => {
    let origMatchMedia;

    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
      origMatchMedia = window.matchMedia;
      sinon.stub(window, 'matchMedia').callsFake((query) => {
        if (query === '(max-width: 599px)') {
          return { matches: true, media: query, addEventListener: sinon.stub(), removeEventListener: sinon.stub(), addListener: sinon.stub(), removeListener: sinon.stub() };
        }
        return origMatchMedia.call(window, query);
      });
    });

    it('renders .ax-drawer-mobile on panel', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const panel = document.querySelector('.ax-drawer-panel');
      expect(panel).to.exist;
      expect(panel.classList.contains('ax-drawer-mobile')).to.be.true;

      drawer.close();
      await waitForClose();
    });

    it('renders curtain and appends to body', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const curtain = document.querySelector('.ax-drawer-curtain');
      expect(curtain).to.exist;
      expect(curtain.parentNode).to.equal(document.body);

      drawer.close();
      await waitForClose();
    });

    it('locks body scroll', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      expect(document.body.classList.contains('ax-drawer-body-locked')).to.be.true;

      drawer.close();
      await waitForClose();
    });

    it('renders drag line for bottom sheet (.ax-drawer-line)', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const line = document.querySelector('.ax-drawer-line');
      expect(line).to.exist;

      drawer.close();
      await waitForClose();
    });

    it('panel has correct aria-labelledby pointing to title', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const panel = document.querySelector('.ax-drawer-panel');
      expect(panel.getAttribute('aria-labelledby')).to.equal('ax-drawer-title');
      const titleEl = document.getElementById('ax-drawer-title');
      expect(titleEl).to.exist;
      expect(titleEl.textContent).to.equal('Save to Creative Cloud Libraries');

      drawer.close();
      await waitForClose();
    });
  });

  describe('close', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('sets isOpen to false', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);
      expect(drawer.isOpen).to.be.true;

      drawer.close();
      expect(drawer.isOpen).to.be.false;
      await waitForClose();
    });

    it('removes panel from DOM after timeout', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      drawer.close();
      expect(document.querySelector('.ax-drawer-panel')).to.exist;

      await waitForClose();
      expect(document.querySelector('.ax-drawer-panel')).to.not.exist;
    });

    it('unlocks body scroll', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
      const origMM = window.matchMedia;
      if (!window.matchMedia.isSinonProxy) {
        sinon.stub(window, 'matchMedia').callsFake((query) => {
          if (query === '(max-width: 599px)') {
            return { matches: true, media: query, addEventListener: sinon.stub(), removeEventListener: sinon.stub(), addListener: sinon.stub(), removeListener: sinon.stub() };
          }
          return origMM.call(window, query);
        });
      }
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);
      expect(document.body.classList.contains('ax-drawer-body-locked')).to.be.true;

      drawer.close();
      expect(document.body.classList.contains('ax-drawer-body-locked')).to.be.false;
      await waitForClose();
    });

    it('calls onClose callback', async () => {
      anchor = createAnchor();
      const onClose = sinon.stub();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor, onClose }));
      await openDrawer(drawer);

      drawer.close();
      expect(onClose.calledOnce).to.be.true;
      await waitForClose();
    });

    it('no-op when already closed — callback called only once', async () => {
      anchor = createAnchor();
      const onClose = sinon.stub();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor, onClose }));
      await openDrawer(drawer);

      drawer.close();
      drawer.close();
      drawer.close();
      expect(onClose.calledOnce).to.be.true;
      await waitForClose();
    });
  });

  describe('destroy', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('calls close and removes all DOM', async () => {
      anchor = createAnchor();
      const onClose = sinon.stub();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor, onClose }));
      await openDrawer(drawer);

      drawer.destroy();
      expect(drawer.isOpen).to.be.false;
      await waitForClose();
      expect(document.querySelector('.ax-drawer-panel')).to.not.exist;
      expect(document.querySelector('.ax-drawer-curtain')).to.not.exist;
    });

    it('can open again after destroy', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      drawer.destroy();
      await waitForClose();
      expect(drawer.isOpen).to.be.false;

      await openDrawer(drawer);
      expect(drawer.isOpen).to.be.true;
      expect(document.querySelector('.ax-drawer-panel')).to.exist;

      drawer.close();
      await waitForClose();
    });
  });

  describe('library picker — signed in', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('renders trigger showing first library name', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const triggerLabel = document.querySelector('.ax-lib-picker-trigger-label');
      expect(triggerLabel).to.exist;
      expect(triggerLabel.textContent).to.equal('My Library');

      drawer.close();
      await waitForClose();
    });

    it('clicking trigger toggles popover open/closed', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const trigger = document.querySelector('.ax-lib-picker-trigger');
      const popover = document.querySelector('.ax-lib-picker-popover');
      expect(popover.classList.contains('ax-lib-picker-popover-open')).to.be.false;

      trigger.click();
      expect(popover.classList.contains('ax-lib-picker-popover-open')).to.be.true;

      trigger.click();
      expect(popover.classList.contains('ax-lib-picker-popover-open')).to.be.false;

      drawer.close();
      await waitForClose();
    });

    it('clicking menu item selects library and closes popover', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const trigger = document.querySelector('.ax-lib-picker-trigger');
      trigger.click();

      const items = document.querySelectorAll('.ax-lib-picker-popover sp-menu-item');
      expect(items.length).to.be.at.least(2);

      items[1].click();

      const triggerLabel = document.querySelector('.ax-lib-picker-trigger-label');
      expect(triggerLabel.textContent).to.equal('Brand Colors');
      const popover = document.querySelector('.ax-lib-picker-popover');
      expect(popover.classList.contains('ax-lib-picker-popover-open')).to.be.false;

      drawer.close();
      await waitForClose();
    });

    it('"Create" button calls ccLibraryProvider.createLibrary with input text', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const trigger = document.querySelector('.ax-lib-picker-trigger');
      trigger.click();

      const createInput = document.querySelector('.ax-lib-picker-create-input');
      createInput.value = 'My New Library';
      const createBtn = document.querySelector('.ax-lib-picker-create-btn');
      createBtn.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(provider.createLibrary.calledOnce).to.be.true;
      expect(provider.createLibrary.firstCall.args[0]).to.equal('My New Library');

      drawer.close();
      await waitForClose();
    });
  });

  describe('library picker — signed out', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('renders disabled picker trigger', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const trigger = document.querySelector('.ax-lib-picker-trigger-disabled');
      expect(trigger).to.exist;
      expect(trigger.hasAttribute('disabled')).to.be.true;

      drawer.close();
      await waitForClose();
    });

    it('save button shows "Sign in to save"', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const saveBtn = document.querySelector('.ax-drawer-save-btn');
      expect(saveBtn).to.exist;
      expect(saveBtn.textContent).to.equal('Sign in to save');

      drawer.close();
      await waitForClose();
    });
  });

  describe('tags field', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('renders initial tags from palette data as tag chips', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const tags = document.querySelectorAll('.ax-tag-field-tags .ax-tag-pill');
      expect(tags.length).to.equal(2);
      expect(tags[0].dataset.tagValue).to.equal('bold');
      expect(tags[1].dataset.tagValue).to.equal('bright');

      drawer.close();
      await waitForClose();
    });

    it('pressing Enter in input adds a new tag chip', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const tagsInput = document.querySelector('.ax-drawer-tag-section .ax-tag-field-input');
      expect(tagsInput).to.exist;

      tagsInput.value = 'NewTag';
      tagsInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      const tags = document.querySelectorAll('.ax-tag-field-tags .ax-tag-pill');
      expect(tags.length).to.equal(3);
      expect(tags[2].dataset.tagValue).to.equal('NewTag');
      expect(tagsInput.value).to.equal('');

      drawer.close();
      await waitForClose();
    });

    it('clicking close icon on tag chip removes it', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      let tags = document.querySelectorAll('.ax-tag-field-tags .ax-tag-pill');
      expect(tags.length).to.equal(2);

      const closeBtn = tags[0].querySelector('.ax-tag-pill-close');
      expect(closeBtn).to.exist;
      closeBtn.click();

      tags = document.querySelectorAll('.ax-tag-field-tags .ax-tag-pill');
      expect(tags.length).to.equal(1);
      expect(tags[0].dataset.tagValue).to.equal('bright');

      drawer.close();
      await waitForClose();
    });
  });

  describe('keyword suggestions', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('renders 5 keyword suggestion buttons', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const suggestions = document.querySelector('.ax-drawer-keyword-suggestions');
      expect(suggestions).to.exist;
      expect(suggestions.children.length).to.equal(5);

      const labels = [...suggestions.children].map((btn) => btn.textContent);
      expect(labels).to.include('Blue');
      expect(labels).to.include('Green');
      expect(labels).to.include('Bold');
      expect(labels).to.include('Bright');
      expect(labels).to.include('Beige');

      drawer.close();
      await waitForClose();
    });
  });

  describe('save payload — tag extraction', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('palette save payload includes initial tags from palette data', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        type: 'palette',
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const saveBtn = document.querySelector('.ax-drawer-save-btn');
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(provider.saveTheme.calledOnce).to.be.true;
      const [, payload] = provider.saveTheme.firstCall.args;
      const { tags } = payload.representations[0]['colortheme#data'];
      expect(tags).to.deep.equal(['bold', 'bright']);

      await waitForClose();
    });

    it('palette save payload includes tags added via Enter key', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        type: 'palette',
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const tagsInput = document.querySelector('.ax-drawer-tag-section input');
      tagsInput.value = 'NewTag';
      tagsInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      const saveBtn = document.querySelector('.ax-drawer-save-btn');
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 50));

      const [, payload] = provider.saveTheme.firstCall.args;
      const { tags } = payload.representations[0]['colortheme#data'];
      expect(tags).to.include('NewTag');
      expect(tags).to.include('bold');
      expect(tags).to.include('bright');

      await waitForClose();
    });

    it('contrast save payload includes tags from contrast palette data', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const contrastPalette = {
        name: 'Contrast Pair',
        colors: ['#1B1B1B', '#FFFFFF'],
        tags: ['ContrastChecked', 'VisualAccessibility'],
        accessibilityData: { wcagLevel: 'AAA' },
      };
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        type: 'contrast',
        paletteData: contrastPalette,
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const saveBtn = document.querySelector('.ax-drawer-save-btn');
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 50));

      const [, payload] = provider.saveTheme.firstCall.args;
      const { tags } = payload.representations[0]['colortheme#data'];
      expect(tags).to.deep.equal(['ContrastChecked', 'VisualAccessibility']);

      await waitForClose();
    });

    it('tag removal is reflected in saved payload', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        type: 'palette',
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      // Remove the first tag
      const tags = document.querySelectorAll('.ax-drawer-tag-section [data-tag-value]');
      expect(tags.length).to.be.at.least(1);
      const closeIcon = tags[0].querySelector('sp-icon-cross75') || tags[0].querySelector('.ax-tag-pill-close');
      if (closeIcon) closeIcon.click();

      const saveBtn = document.querySelector('.ax-drawer-save-btn');
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 50));

      const [, payload] = provider.saveTheme.firstCall.args;
      const savedTags = payload.representations[0]['colortheme#data'].tags;
      expect(savedTags).to.not.include('bold');
      expect(savedTags).to.include('bright');

      await waitForClose();
    });

    it('empty tag input on Enter does not add a tag to the payload', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        type: 'palette',
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const tagsInput = document.querySelector('.ax-drawer-tag-section input');
      tagsInput.value = '   ';
      tagsInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      const saveBtn = document.querySelector('.ax-drawer-save-btn');
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 50));

      const [, payload] = provider.saveTheme.firstCall.args;
      const { tags } = payload.representations[0]['colortheme#data'];
      expect(tags).to.deep.equal(['bold', 'bright']);

      await waitForClose();
    });
  });

  describe('tag field structure', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('tags render inside .ax-tag-field-tags within .ax-tag-field', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const field = document.querySelector('.ax-tag-field');
      expect(field).to.exist;
      const tagsContainer = field.querySelector('.ax-tag-field-tags');
      expect(tagsContainer).to.exist;
      const pills = tagsContainer.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(2);

      drawer.close();
      await waitForClose();
    });

    it('input is inside .ax-tag-field as .ax-tag-field-input', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const field = document.querySelector('.ax-tag-field');
      const input = field.querySelector('.ax-tag-field-input');
      expect(input).to.exist;
      expect(input.type).to.equal('text');

      drawer.close();
      await waitForClose();
    });

    it('tag pills have data-tag-value attribute', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills[0].dataset.tagValue).to.equal('bold');
      expect(pills[1].dataset.tagValue).to.equal('bright');

      drawer.close();
      await waitForClose();
    });

    it('helper text element exists with ax-tag-field-help class', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const help = document.querySelector('.ax-tag-field-help');
      expect(help).to.exist;

      drawer.close();
      await waitForClose();
    });

    it('label is associated with input via for/id', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const label = document.querySelector('.ax-drawer-tag-section .ax-drawer-field-label');
      const input = document.querySelector('.ax-tag-field-input');
      expect(label.getAttribute('for')).to.equal(input.id);

      drawer.close();
      await waitForClose();
    });
  });

  describe('tag field interactions', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('Enter creates a tag pill and clears input', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const input = document.querySelector('.ax-tag-field-input');
      input.value = 'Custom';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      const pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(3);
      expect(pills[2].dataset.tagValue).to.equal('Custom');
      expect(input.value).to.equal('');

      drawer.close();
      await waitForClose();
    });

    it('blank and whitespace-only input does not create tags', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const input = document.querySelector('.ax-tag-field-input');
      input.value = '   ';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      const pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(2);

      drawer.close();
      await waitForClose();
    });

    it('Backspace on empty input removes the last tag pill', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const input = document.querySelector('.ax-tag-field-input');
      expect(input.value).to.equal('');

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));

      const pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(1);
      expect(pills[0].dataset.tagValue).to.equal('bold');

      drawer.close();
      await waitForClose();
    });

    it('Backspace with text in input does not remove a tag pill', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const input = document.querySelector('.ax-tag-field-input');
      input.value = 'typ';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));

      const pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(2);

      drawer.close();
      await waitForClose();
    });

    it('Backspace on empty input with no tags does not throw', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        paletteData: { ...MOCK_PALETTE, tags: [] },
      }));
      await openDrawer(drawer);

      const input = document.querySelector('.ax-tag-field-input');
      expect(() => {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
      }).to.not.throw();

      const pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(0);

      drawer.close();
      await waitForClose();
    });

    it('clicking a keyword suggestion adds a tag pill', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const suggestions = document.querySelectorAll('.ax-drawer-keyword-suggestions .ax-drawer-tag-btn');
      suggestions[0].click();

      const pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(3);
      expect(pills[2].dataset.tagValue).to.equal('Blue');

      drawer.close();
      await waitForClose();
    });

    it('clicking .ax-tag-pill-close removes the tag', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      let pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(2);

      pills[0].querySelector('.ax-tag-pill-close').click();

      pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(1);
      expect(pills[0].dataset.tagValue).to.equal('bright');

      drawer.close();
      await waitForClose();
    });

    it('tag pill close button is a real <button> with aria-label', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const closeBtn = document.querySelector('.ax-tag-pill-close');
      expect(closeBtn).to.exist;
      expect(closeBtn.tagName.toLowerCase()).to.equal('button');
      expect(closeBtn.type).to.equal('button');
      expect(closeBtn.getAttribute('aria-label')).to.be.a('string').and.not.be.empty;

      drawer.close();
      await waitForClose();
    });

    it('input has aria-describedby pointing to helper text', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const input = document.querySelector('.ax-tag-field-input');
      const help = document.querySelector('.ax-tag-field-help');
      expect(input.getAttribute('aria-describedby')).to.equal(help.id);

      drawer.close();
      await waitForClose();
    });

    it('clicking a keyword suggestion hides it from the suggestions list', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const suggestionsContainer = document.querySelector('.ax-drawer-keyword-suggestions');
      const initialCount = suggestionsContainer.children.length;
      const firstBtn = suggestionsContainer.children[0];

      expect(firstBtn.hidden).to.be.false;
      firstBtn.click();

      expect(suggestionsContainer.children.length).to.equal(initialCount);
      expect(firstBtn.hidden).to.be.true;

      drawer.close();
      await waitForClose();
    });

    it('removing a suggestion pill via close button re-adds its suggestion button', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const suggestionsContainer = document.querySelector('.ax-drawer-keyword-suggestions');
      const btn = suggestionsContainer.children[0];
      btn.click();
      expect(btn.hidden).to.be.true;

      const pill = [...document.querySelectorAll('div.ax-tag-pill')]
        .find((p) => p.dataset.tagValue === 'Blue');
      expect(pill).to.exist;
      pill.querySelector('.ax-tag-pill-close').click();

      expect(btn.hidden).to.be.false;

      drawer.close();
      await waitForClose();
    });

    it('removing a suggestion pill via backspace re-adds its suggestion button', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const suggestionsContainer = document.querySelector('.ax-drawer-keyword-suggestions');
      const btn = suggestionsContainer.children[0];
      btn.click();
      expect(btn.hidden).to.be.true;

      // Backspace on empty input should remove the last pill (which is the suggestion pill)
      const input = document.querySelector('.ax-tag-field-input');
      expect(input.value).to.equal('');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));

      expect(btn.hidden).to.be.false;

      drawer.close();
      await waitForClose();
    });

    it('does not add more than 10 tags via Enter key', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const input = document.querySelector('.ax-tag-field-input');

      // MOCK_PALETTE starts with 2 tags ('bold', 'bright'), add 8 more to reach the limit
      for (let i = 0; i < 8; i += 1) {
        input.value = `tag${i}`;
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }

      let pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(10);

      // Attempting to add an 11th tag should be ignored
      input.value = 'overflow';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(10);

      drawer.close();
      await waitForClose();
    });

    it('does not add more than 10 tags via keyword suggestion click', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);

      const input = document.querySelector('.ax-tag-field-input');

      // Fill to 9 tags via input (2 existing + 7 new)
      for (let i = 0; i < 7; i += 1) {
        input.value = `tag${i}`;
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }

      // Click a suggestion to reach 10 (Blue is the first suggestion and not yet added)
      const suggestionsContainer = document.querySelector('.ax-drawer-keyword-suggestions');
      suggestionsContainer.children[0].click();

      let pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(10);

      // The next visible suggestion click should be ignored (limit reached)
      const visibleBtn = [...suggestionsContainer.children].find((b) => !b.hidden);
      if (visibleBtn) visibleBtn.click();

      pills = document.querySelectorAll('div.ax-tag-pill');
      expect(pills.length).to.equal(10);

      drawer.close();
      await waitForClose();
    });
  });

  describe('save flow', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('save calls ccLibraryProvider.saveTheme for palette type', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        type: 'palette',
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const saveBtn = document.querySelector('.ax-drawer-save-btn');
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(provider.saveTheme.calledOnce).to.be.true;
      const [libId, payload] = provider.saveTheme.firstCall.args;
      expect(libId).to.equal('lib-1');
      expect(payload).to.have.property('representations');

      await waitForClose();
    });

    it('save calls ccLibraryProvider.saveGradient for gradient type', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        type: 'gradient',
        paletteData: MOCK_GRADIENT,
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const saveBtn = document.querySelector('.ax-drawer-save-btn');
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(provider.buildGradientPayload.calledOnce).to.be.true;
      expect(provider.saveGradient.calledOnce).to.be.true;

      await waitForClose();
    });

    // Fix test MWPW-192264
    it.skip('save failure closes drawer and announces error to screen reader', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      provider.saveTheme.rejects(new Error('Network error'));
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        type: 'palette',
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const saveBtn = document.querySelector('.ax-drawer-save-btn');
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 100));

      expect(drawer.isOpen).to.be.false;
      await waitForRaf();
      const liveRegion = document.getElementById('express-spectrum-live-region');
      if (liveRegion) {
        expect(liveRegion.textContent).to.include('Failed to save');
      }

      await waitForClose();
    });
  });

  describe('focus & a11y', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('Escape key closes drawer', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);
      expect(drawer.isOpen).to.be.true;

      const panel = document.querySelector('.ax-drawer-panel');
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(drawer.isOpen).to.be.false;
      await waitForClose();
    });

    it('focus restored to previous element after close', async () => {
      anchor = createAnchor();
      anchor.focus();
      expect(document.activeElement).to.equal(anchor);

      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);
      expect(drawer.isOpen).to.be.true;

      drawer.close();
      await waitForClose();

      expect(document.activeElement).to.equal(anchor);
    });
  });

  describe('save flow — contrast type', () => {
    const MOCK_CONTRAST_PALETTE = {
      name: 'Contrast Pair',
      colors: ['#1B1B1B', '#FFFFFF'],
      tags: ['ContrastChecked', 'VisualAccessibility', 'CreativityForAll'],
      accessibilityData: { wcagLevel: 'AAA' },
    };

    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('pads 2 contrast swatches to 5 in theme payload [fg, fg, bg, bg, bg]', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        type: 'contrast',
        paletteData: MOCK_CONTRAST_PALETTE,
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const saveBtn = document.querySelector('.ax-drawer-save-btn');
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(provider.saveTheme.calledOnce).to.be.true;
      const [, payload] = provider.saveTheme.firstCall.args;
      const { swatches } = payload.representations[0]['colortheme#data'];
      expect(swatches.length).to.equal(5);

      drawer.close();
      await waitForClose();
    });

    it('includes accessibilityData in payload for contrast type', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        type: 'contrast',
        paletteData: MOCK_CONTRAST_PALETTE,
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const saveBtn = document.querySelector('.ax-drawer-save-btn');
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(provider.saveTheme.calledOnce).to.be.true;
      const [, payload] = provider.saveTheme.firstCall.args;
      expect(payload.accessibilityData).to.deep.equal({ wcagLevel: 'AAA' });

      drawer.close();
      await waitForClose();
    });

    it('renders contrast tags as tag chips in drawer', async () => {
      anchor = createAnchor();
      const provider = createMockCCLibraryProvider();
      const drawer = await createDrawer(defaultOptions({
        anchorElement: anchor,
        type: 'contrast',
        paletteData: MOCK_CONTRAST_PALETTE,
        libraries: MOCK_LIBRARIES,
        ccLibraryProvider: provider,
        deps: signedInDeps,
      }));
      await openDrawer(drawer);

      const tags = document.querySelectorAll('.ax-tag-field-tags .ax-tag-pill');
      expect(tags.length).to.equal(3);
      expect(tags[0].dataset.tagValue).to.equal('ContrastChecked');
      expect(tags[1].dataset.tagValue).to.equal('VisualAccessibility');
      expect(tags[2].dataset.tagValue).to.equal('CreativityForAll');

      drawer.close();
      await waitForClose();
    });
  });

  describe('outside click — desktop', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('click outside panel and anchor closes drawer', async () => {
      anchor = createAnchor();
      const drawer = await createDrawer(defaultOptions({ anchorElement: anchor }));
      await openDrawer(drawer);
      expect(drawer.isOpen).to.be.true;

      await waitForRaf();
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(drawer.isOpen).to.be.false;
      await waitForClose();
    });
  });
});
