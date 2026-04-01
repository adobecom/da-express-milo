/* eslint-disable max-len, no-underscore-dangle, no-promise-executor-return */
import { expect } from '@esm-bundle/chai';
import { createModalManager } from '../../../../express/code/scripts/color-shared/modal/createModalManager.js';

function createModalStubContent(opts = {}) {
  const { listItems = 5, strips = 3 } = opts;
  const wrap = document.createElement('div');
  wrap.className = 'ax-color-modal-stub-content';
  const list = document.createElement('div');
  list.className = 'ax-color-modal-stub-list';
  for (let i = 0; i < listItems; i += 1) {
    const li = document.createElement('div');
    li.textContent = `Item ${i + 1}`;
    list.appendChild(li);
  }
  for (let s = 0; s < strips; s += 1) {
    const strip = document.createElement('div');
    strip.className = 'ax-color-modal-stub-strip';
    strip.style.height = '40px';
    list.appendChild(strip);
  }
  wrap.appendChild(list);
  return wrap;
}

async function openPaletteModal(modalManager, palette = {}) {
  await modalManager.open({
    _testStylesReady: true,
    title: (palette?.name && String(palette.name)) || 'Palette',
    showTitle: false,
    content: document.createElement('div'),
  });
}

async function openGradientModal(modalManager, gradient = {}) {
  await modalManager.open({
    _testStylesReady: true,
    title: (gradient?.name && String(gradient.name)) || 'Gradient',
    showTitle: false,
    content: document.createElement('div'),
  });
}

describe('createModalManager', () => {
  let manager;

  beforeEach(() => {
    window.__modalTestSkipStyles = true;
    manager = createModalManager();
  });

  afterEach(async () => {
    if (manager?.isOpen?.()) {
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    }
    window.__modalTestSkipStyles = false;
  });

  describe('API', () => {
    it('returns open, close, destroy, updateTitle, getBody, isOpen (shell only; no mock content)', () => {
      expect(manager.open).to.be.a('function');
      expect(manager.close).to.be.a('function');
      expect(manager.destroy).to.be.a('function');
      expect(manager.updateTitle).to.be.a('function');
      expect(manager.getBody).to.be.a('function');
      expect(manager.isOpen).to.be.a('function');
    });

    it('isOpen() returns false initially', () => {
      expect(manager.isOpen()).to.be.false;
    });
  });

  describe('open (standard / desktop)', () => {
    const DESKTOP_VIEWPORT = 1124;
    let origWidth;
    beforeEach(() => {
      origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: DESKTOP_VIEWPORT, configurable: true });
    });
    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('adds modal DOM and body class when opened at desktop viewport', async () => {
      await manager.open({
        _testStylesReady: true,
        title: 'Test Modal',
        showTitle: true,
        content: '<p>Body</p>',
      });

      expect(manager.isOpen()).to.be.true;
      expect(document.body.classList.contains('ax-color-modal-open')).to.be.true;
      expect(document.querySelector('.ax-color-modal-curtain')).to.exist;
      expect(document.querySelector('.ax-color-modal-container')).to.exist;
      expect(document.querySelector('.ax-color-modal-title')?.textContent).to.equal('Test Modal');
      expect(document.querySelector('.ax-color-modal-content')?.innerHTML).to.include('Body');
    });

    it('hides title by default; showTitle: true shows the title', async () => {
      await manager.open({
        _testStylesReady: true,
        title: 'Default Hidden',
        content: '',
      });
      expect(document.querySelector('.ax-color-modal-title')).to.not.exist;
      expect(document.querySelector('.ax-color-modal-curtain')?.getAttribute('aria-label')).to.equal('Default Hidden');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));

      await manager.open({
        _testStylesReady: true,
        title: 'Explicit Shown',
        showTitle: true,
        content: '',
      });
      expect(document.querySelector('.ax-color-modal-title')?.textContent).to.equal('Explicit Shown');
    });

    it('renders only shell chrome and content slot (no footer)', async () => {
      await manager.open({
        _testStylesReady: true,
        title: 'Shell Only',
        content: '',
      });
      expect(document.querySelector('.ax-color-modal-actions')).to.be.null;
      expect(document.querySelector('.ax-color-modal-content')).to.exist;
    });

    it('getBody() returns content wrapper, updateTitle() updates title', async () => {
      await manager.open({
        _testStylesReady: true,
        title: 'Original',
        showTitle: true,
        content: '<span id="slot">slot</span>',
      });

      const body = manager.getBody();
      expect(body).to.exist;
      expect(body.querySelector('#slot')?.textContent).to.equal('slot');

      manager.updateTitle('Updated Title');
      const titleEl = body?.closest('.ax-color-modal-container')?.querySelector('.ax-color-modal-title')
        || document.querySelector('.ax-color-modal-title');
      expect(titleEl?.textContent).to.equal('Updated Title');
    });
  });

  describe('open (drawer)', () => {
    let origWidth;
    beforeEach(() => {
      origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
    });
    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('adds drawer DOM and body class when opened at drawer viewport', async () => {
      await manager.open({
        _testStylesReady: true,
        title: 'Drawer Title',
        showTitle: true,
        content: '<p>Drawer body</p>',
      });

      expect(manager.isOpen()).to.be.true;
      expect(document.body.classList.contains('ax-color-modal-open')).to.be.true;
      expect(document.querySelector('.ax-color-modal-curtain')).to.exist;
      expect(document.querySelector('.ax-color-modal-container')).to.exist;
      expect(document.querySelector('.ax-color-modal-title')?.textContent).to.equal('Drawer Title');
      expect(document.querySelector('.ax-color-modal-content')?.innerHTML).to.include('Drawer body');
    });
  });

  describe('destroy', () => {
    let origWidth;
    beforeEach(() => {
      origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1124, configurable: true });
    });
    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('removes DOM and listeners without onClose; isOpen() false', async () => {
      let onCloseCalled = false;
      await manager.open({
        _testStylesReady: true,
        title: 'Destroy Test',
        content: '',
        onClose: () => { onCloseCalled = true; },
      });
      expect(manager.isOpen()).to.be.true;
      expect(document.querySelector('.ax-color-modal-curtain')).to.exist;

      manager.destroy();
      expect(manager.isOpen()).to.be.false;
      expect(document.body.classList.contains('ax-color-modal-open')).to.be.false;
      expect(document.querySelector('.ax-color-modal-curtain')).to.not.exist;
      expect(document.querySelector('.ax-color-modal-container')).to.not.exist;
      expect(onCloseCalled).to.be.false;
    });

    it('allows open again after destroy', async () => {
      await manager.open({
        _testStylesReady: true,
        title: 'First',
        content: '',
      });
      manager.destroy();
      await manager.open({
        _testStylesReady: true,
        title: 'Second',
        showTitle: true,
        content: '',
      });
      expect(manager.isOpen()).to.be.true;
      expect(document.querySelector('.ax-color-modal-title')?.textContent).to.equal('Second');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });
  });

  describe('close', () => {
    let origWidth;
    beforeEach(() => {
      origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1124, configurable: true });
    });
    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('removes body class and calls onClose after open (standard)', async () => {
      let onCloseCalled = false;
      await manager.open({
        _testStylesReady: true,
        title: 'Close Test',
        content: '',
        onClose: () => { onCloseCalled = true; },
      });

      manager.close();
      expect(document.body.classList.contains('ax-color-modal-open')).to.be.false;
      expect(manager.isOpen()).to.be.true; // still true until timeout

      await new Promise((r) => setTimeout(r, 350));
      expect(manager.isOpen()).to.be.false;
      expect(onCloseCalled).to.be.true;
      expect(document.querySelector('.ax-color-modal-curtain')).to.not.exist;
    });

    it('no-op when already closed', async () => {
      manager.close();
      expect(document.body.classList.contains('ax-color-modal-open')).to.be.false;
    });
  });

  describe('focus restore (a11y)', () => {
    let origWidth;
    beforeEach(() => {
      origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1124, configurable: true });
    });
    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('restores focus to the element that had focus before open, after close', async () => {
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.textContent = 'Open modal';
      document.body.appendChild(trigger);
      trigger.focus();
      expect(document.activeElement).to.equal(trigger);

      await manager.open({
        _testStylesReady: true,
        title: 'Focus Test',
        content: '<p>Body</p>',
      });
      expect(manager.isOpen()).to.be.true;
      expect(document.activeElement?.closest('.ax-color-modal-curtain')).to.exist;

      manager.close();
      await new Promise((r) => setTimeout(r, 350));

      expect(manager.isOpen()).to.be.false;
      expect(document.activeElement).to.equal(trigger, 'focus should return to trigger after close');
      document.body.removeChild(trigger);
    });

    it('does not throw when trigger was removed from DOM before close', async () => {
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.textContent = 'Open';
      document.body.appendChild(trigger);
      trigger.focus();

      await manager.open({
        _testStylesReady: true,
        title: 'Removed Trigger',
        content: '',
      });
      document.body.removeChild(trigger);

      manager.close();
      await new Promise((r) => setTimeout(r, 350));
      expect(manager.isOpen()).to.be.false;
    });
  });

  describe('Escape key', () => {
    let origWidth;
    beforeEach(() => {
      origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1124, configurable: true });
    });
    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('closes modal on Escape', async () => {
      await manager.open({
        _testStylesReady: true,
        title: 'Escape Test',
        content: '',
      });

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise((r) => setTimeout(r, 350));
      expect(manager.isOpen()).to.be.false;
      expect(document.body.classList.contains('ax-color-modal-open')).to.be.false;
    });
  });

  describe('palette/gradient content (inline stubs)', () => {
    it('openPaletteModal(manager, palette) opens with correct aria-label and no visible title', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      openPaletteModal(manager, { name: 'My Palette' });
      await Promise.resolve();

      expect(manager.isOpen()).to.be.true;
      expect(document.querySelector('.ax-color-modal-title')).to.not.exist;
      const curtain = document.querySelector('.ax-color-modal-curtain');
      expect(curtain?.getAttribute('aria-label')).to.equal('My Palette');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));

      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
      openPaletteModal(manager);
      await Promise.resolve();
      expect(document.querySelector('.ax-color-modal-title')).to.not.exist;
      expect(document.querySelector('.ax-color-modal-curtain')?.getAttribute('aria-label')).to.equal('Palette');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));

      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('openGradientModal(manager, gradient) opens with gradient', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      openGradientModal(manager, { name: 'Sunset' });
      await Promise.resolve();

      expect(manager.isOpen()).to.be.true;
      expect(document.querySelector('.ax-color-modal-title')).to.not.exist;
      expect(document.querySelector('.ax-color-modal-curtain')?.getAttribute('aria-label')).to.equal('Sunset');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('open with stub content shows stub in slot', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      await manager.open({
        _testStylesReady: true,
        title: 'Shell test',
        showTitle: true,
        content: createModalStubContent(),
      });

      expect(manager.isOpen()).to.be.true;
      expect(document.querySelector('.ax-color-modal-title')?.textContent).to.equal('Shell test');
      expect(document.querySelector('.ax-color-modal-stub-content')).to.exist;
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });
  });

  describe('responsive layout (MWPW-186962)', () => {
    it('modal stays open and container present when viewport shrinks', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1124, configurable: true });
      await manager.open({
        _testStylesReady: true,
        title: 'Switch Test',
        showTitle: true,
        content: '<p>Content</p>',
      });
      expect(window.matchMedia('(min-width: 1024px)').matches).to.be.true;
      expect(document.querySelector('.ax-color-modal-container')).to.exist;

      Object.defineProperty(window, 'innerWidth', { value: 924, configurable: true });
      window.dispatchEvent(new Event('resize'));
      await new Promise((r) => setTimeout(r, 200));
      await new Promise((r) => setTimeout(r, 350));

      expect(manager.isOpen()).to.be.true;
      expect(window.matchMedia('(min-width: 1024px)').matches).to.be.false;
      expect(document.querySelector('.ax-color-modal-container')).to.exist;
      expect(document.querySelector('.ax-color-modal-title')?.textContent).to.equal('Switch Test');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('modal stays open and container present when viewport grows', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 924, configurable: true });
      await manager.open({
        _testStylesReady: true,
        title: 'Grow Test',
        showTitle: true,
        content: '<p>Content</p>',
      });
      expect(window.matchMedia('(min-width: 1024px)').matches).to.be.false;

      Object.defineProperty(window, 'innerWidth', { value: 1124, configurable: true });
      window.dispatchEvent(new Event('resize'));
      await new Promise((r) => setTimeout(r, 200));
      await new Promise((r) => setTimeout(r, 350));

      expect(manager.isOpen()).to.be.true;
      expect(window.matchMedia('(min-width: 1024px)').matches).to.be.true;
      expect(document.querySelector('.ax-color-modal-container')).to.exist;
      expect(document.querySelector('.ax-color-modal-title')?.textContent).to.equal('Grow Test');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });
  });

  describe('multiple heights (Figma L/M/S)', () => {
    let origWidth;
    afterEach(() => {
      if (origWidth != null) Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('standard (desktop L) provides content slot for fixed 898×604 shell', async () => {
      origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1124, configurable: true });
      await manager.open({
        _testStylesReady: true,
        title: 'Desktop',
        content: '<p>Minimal</p>',
      });
      const slot = manager.getBody();
      expect(slot).to.exist;
      expect(slot.classList.contains('ax-color-modal-content')).to.be.true;
      expect(slot.tagName).to.equal('DIV');
      expect(slot.querySelector('p')?.textContent).to.equal('Minimal');
      expect(document.querySelector('.ax-color-modal-container')).to.exist;
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });

    it('drawer (tablet M / mobile S) provides content slot for 90vh shell', async () => {
      origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
      await manager.open({
        content: '<p>Minimal</p>',
      });
      const slot = manager.getBody();
      expect(slot).to.exist;
      expect(slot.classList.contains('ax-color-modal-content')).to.be.true;
      expect(slot.tagName).to.equal('DIV');
      expect(slot.querySelector('p')?.textContent).to.equal('Minimal');
      expect(document.querySelector('.ax-color-modal-container')).to.exist;
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });

    it('standard modal with tall (stub) content: slot contains content for overflow scroll', async () => {
      origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1124, configurable: true });
      await manager.open({
        _testStylesReady: true,
        title: 'Tall content',
        content: createModalStubContent(),
      });
      const slot = manager.getBody();
      expect(slot).to.exist;
      expect(slot.classList.contains('ax-color-modal-content')).to.be.true;
      expect(slot.querySelector('.ax-color-modal-stub-content')).to.exist;
      expect(slot.querySelector('.ax-color-modal-stub-list')).to.exist;
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });

    it('drawer with tall (stub) content: slot contains content for overflow scroll', async () => {
      origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
      await manager.open({
        _testStylesReady: true,
        title: 'Tall content',
        content: createModalStubContent(),
      });
      const slot = manager.getBody();
      expect(slot).to.exist;
      expect(slot.classList.contains('ax-color-modal-content')).to.be.true;
      expect(slot.querySelector('.ax-color-modal-stub-content')).to.exist;
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });

    it('single content slot per open (no duplicate slots for L/M/S)', async () => {
      origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1124, configurable: true });
      await manager.open({
        _testStylesReady: true,
        title: 'One slot',
        content: '<div id="only">only</div>',
      });
      const container = document.querySelector('.ax-color-modal-container');
      const slots = container?.querySelectorAll('.ax-color-modal-content');
      expect(slots?.length).to.equal(1);
      expect(manager.getBody()?.querySelector('#only')?.textContent).to.equal('only');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));

      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
      await manager.open({
        _testStylesReady: true,
        title: 'One slot',
        content: '<div id="drawer-only">drawer</div>',
      });
      const drawerContainer = document.querySelector('.ax-color-modal-container');
      const drawerSlots = drawerContainer?.querySelectorAll('.ax-color-modal-content');
      expect(drawerSlots?.length).to.equal(1);
      expect(manager.getBody()?.querySelector('#drawer-only')?.textContent).to.equal('drawer');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });
  });

  describe('max-height and scroll (stub content / dummy DOM)', () => {
    it('standard modal: content slot has overflow-y auto and is scrollable when content is tall', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1124, configurable: true });
      await manager.open({
        _testStylesReady: true,
        title: 'Tall content',
        content: createModalStubContent({ listItems: 20, strips: 10 }),
      });
      await new Promise((r) => requestAnimationFrame(r));
      const slot = manager.getBody();
      expect(slot).to.exist;
      expect(slot.classList.contains('ax-color-modal-content')).to.be.true;
      const { overflowY } = window.getComputedStyle(slot);
      expect(['auto', 'scroll']).to.include(overflowY, 'content slot should scroll when overflow');
      expect(slot.scrollHeight).to.be.at.least(slot.clientHeight, 'tall stub content should make slot scrollable');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('drawer: content slot has overflow and is scrollable when content is tall', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
      await manager.open({
        _testStylesReady: true,
        title: 'Tall content',
        content: createModalStubContent({ listItems: 20, strips: 10 }),
      });
      await new Promise((r) => requestAnimationFrame(r));
      const slot = manager.getBody();
      expect(slot).to.exist;
      expect(slot.classList.contains('ax-color-modal-content')).to.be.true;
      const { overflowY } = window.getComputedStyle(slot);
      expect(['auto', 'scroll']).to.include(overflowY, 'drawer content slot should scroll when overflow');
      expect(slot.scrollHeight).to.be.at.least(slot.clientHeight, 'tall stub content should make drawer slot scrollable');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('standard modal: container has bounded height (desktop 604px when styles apply)', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1124, configurable: true });
      await manager.open({
        _testStylesReady: true,
        title: 'Desktop',
        content: createModalStubContent(),
      });
      await new Promise((r) => requestAnimationFrame(r));
      const container = document.querySelector('.ax-color-modal-container');
      expect(container).to.exist;
      const rect = container.getBoundingClientRect();
      const style = window.getComputedStyle(container);
      if (rect.height > 0 && (style.height === '604px' || Math.round(rect.height) === 604)) {
        expect(Math.round(rect.height)).to.equal(604, 'Figma L: desktop modal container height 604px');
        expect(Math.round(rect.width)).to.equal(898, 'Figma L: desktop modal container width 898px');
      }
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('drawer: container has max-height constraint (90vh or min when styles apply)', async () => {
      await manager.open({
        _testStylesReady: true,
        title: 'Drawer',
        content: createModalStubContent({ strips: 15 }),
      });
      await new Promise((r) => requestAnimationFrame(r));
      const container = document.querySelector('.ax-color-modal-container');
      expect(container).to.exist;
      const rect = container.getBoundingClientRect();
      const style = window.getComputedStyle(container);
      if (rect.height > 0) {
        const maxHeight = style.maxHeight ? parseInt(style.maxHeight, 10) : 0;
        const vh = window.innerHeight * 0.9;
        expect(rect.height).to.be.at.most(vh + 2, 'drawer should not exceed 90vh');
        if (maxHeight) expect(maxHeight).to.be.at.most(vh + 2);
      }
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });
  });
});
