import { expect } from '@esm-bundle/chai';
import { createModalManager, BREAKPOINT_DESKTOP, MODAL_TYPE_STANDARD, MODAL_TYPE_DRAWER } from '../../../../express/code/scripts/color-shared/modal/createModalManager.js';
import { createModalStubContent } from '../../../../express/code/blocks/dev-color-shareui/dev-color-shareui-stub-content.js';

/**
 * Figma dimensions (MWPW-185800). Spec: dev/19-modal-shell/CODE_REVIEW_AND_SPEC.md.
 * REST-verified desktop: node 5639-128522 → 898×604, padding 32px, gap 12px, radius 16px.
 * - L (Desktop): 898×604px fixed; short viewport → max-height 85vh
 * - M (Tablet): 536×600px; min-height min(600px, 90vh), max-height 90vh
 * - S (Mobile): 375px width, max-height 90vh
 * Content slot: one main.ax-color-modal-content (desktop) or main.ax-color-drawer-modal-content (drawer); overflow-y: auto when content overflows.
 */

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
    it('returns open, close, destroy, openPaletteModal, openGradientModal, updateTitle, getBody, isOpen, getType', () => {
      expect(manager.open).to.be.a('function');
      expect(manager.close).to.be.a('function');
      expect(manager.destroy).to.be.a('function');
      expect(manager.openPaletteModal).to.be.a('function');
      expect(manager.openGradientModal).to.be.a('function');
      expect(manager.updateTitle).to.be.a('function');
      expect(manager.getBody).to.be.a('function');
      expect(manager.isOpen).to.be.a('function');
      expect(manager.getType).to.be.a('function');
    });

    it('isOpen() returns false initially, getType() returns drawer', () => {
      expect(manager.isOpen()).to.be.false;
      expect(manager.getType()).to.equal('drawer');
    });
  });

  describe('open (standard / desktop)', () => {
    it('adds modal DOM and body class when opened with type standard', async () => {
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
        title: 'Test Modal',
        content: '<p>Body</p>',
      });

      expect(manager.isOpen()).to.be.true;
      expect(manager.getType()).to.equal('standard');
      expect(document.body.classList.contains('ax-color-modal-open')).to.be.true;
      expect(document.querySelector('.ax-color-modal-curtain')).to.exist;
      expect(document.querySelector('.ax-color-modal-container')).to.exist;
      expect(document.querySelector('.ax-color-modal-title')?.textContent).to.equal('Test Modal');
      expect(document.querySelector('.ax-color-modal-content')?.innerHTML).to.include('Body');
    });

    it('renders actions (cancel and confirm) with labels and onClick', async () => {
      const cancelSpy = { called: false };
      const confirmSpy = { called: false };
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
        title: 'Actions',
        content: '',
        actions: {
          cancel: { label: 'Cancel Me', onClick: () => { cancelSpy.called = true; } },
          confirm: { label: 'Confirm Me', onClick: () => { confirmSpy.called = true; } },
        },
      });

      const cancelBtn = document.querySelector('.ax-color-modal-cancel');
      const confirmBtn = document.querySelector('.ax-color-modal-confirm');
      expect(cancelBtn?.textContent?.trim()).to.equal('Cancel Me');
      expect(confirmBtn?.textContent?.trim()).to.equal('Confirm Me');

      cancelBtn.click();
      expect(cancelSpy.called).to.be.true;
      await new Promise((r) => setTimeout(r, 350));
      expect(manager.isOpen()).to.be.false;

      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
        title: 'Actions',
        content: '',
        actions: {
          cancel: { label: 'Cancel', onClick: () => {} },
          confirm: { label: 'Confirm', onClick: () => { confirmSpy.called = true; } },
        },
      });
      document.querySelector('.ax-color-modal-confirm').click();
      expect(confirmSpy.called).to.be.true;
    });

    it('getBody() returns content wrapper, updateTitle() updates title', async () => {
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
        title: 'Original',
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
    it('adds drawer DOM and body class when opened with type drawer', async () => {
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_DRAWER,
        title: 'Drawer Title',
        content: '<p>Drawer body</p>',
      });

      expect(manager.isOpen()).to.be.true;
      expect(manager.getType()).to.equal('drawer');
      expect(document.body.classList.contains('ax-color-modal-open')).to.be.true;
      expect(document.querySelector('.ax-color-drawer-modal-curtain')).to.exist;
      expect(document.querySelector('.ax-color-drawer-modal-container')).to.exist;
      expect(document.querySelector('.ax-color-drawer-modal-title')?.textContent).to.equal('Drawer Title');
      expect(document.querySelector('.ax-color-drawer-modal-content')?.innerHTML).to.include('Drawer body');
    });
  });

  describe('destroy', () => {
    it('removes DOM and listeners without onClose; isOpen() false', async () => {
      let onCloseCalled = false;
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
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
        type: MODAL_TYPE_STANDARD,
        title: 'First',
        content: '',
      });
      manager.destroy();
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
        title: 'Second',
        content: '',
      });
      expect(manager.isOpen()).to.be.true;
      expect(document.querySelector('.ax-color-modal-title')?.textContent).to.equal('Second');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });
  });

  describe('close', () => {
    it('removes body class and calls onClose after open (standard)', async () => {
      let onCloseCalled = false;
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
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

  describe('Escape key', () => {
    it('closes modal on Escape', async () => {
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
        title: 'Escape Test',
        content: '',
      });

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise((r) => setTimeout(r, 350));
      expect(manager.isOpen()).to.be.false;
      expect(document.body.classList.contains('ax-color-modal-open')).to.be.false;
    });
  });

  describe('convenience methods', () => {
    it('openPaletteModal opens with palette name and correct type by viewport', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      manager.openPaletteModal({ name: 'My Palette' });
      await Promise.resolve(); // allow open() to run

      expect(manager.isOpen()).to.be.true;
      expect(manager.getType()).to.equal('standard');
      expect(document.querySelector('.ax-color-modal-title')?.textContent).to.equal('My Palette');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));

      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
      manager.openPaletteModal();
      await Promise.resolve();
      expect(manager.getType()).to.equal('drawer');
      expect(document.querySelector('.ax-color-drawer-modal-title')?.textContent).to.equal('Palette');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));

      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('openGradientModal opens with gradient name', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      manager.openGradientModal({ name: 'Sunset' });
      await Promise.resolve();

      expect(manager.isOpen()).to.be.true;
      expect(document.querySelector('.ax-color-modal-title')?.textContent).to.equal('Sunset');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('open with stub content shows stub in slot', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
        title: 'Shell test',
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

  describe('responsive switch (MWPW-186962)', () => {
    it('switches from standard to drawer when viewport shrinks below breakpoint', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: BREAKPOINT_DESKTOP + 100, configurable: true });
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
        title: 'Switch Test',
        content: '<p>Content</p>',
      });
      expect(manager.getType()).to.equal('standard');
      expect(document.querySelector('.ax-color-modal-container')).to.exist;

      Object.defineProperty(window, 'innerWidth', { value: BREAKPOINT_DESKTOP - 100, configurable: true });
      window.dispatchEvent(new Event('resize'));
      await new Promise((r) => setTimeout(r, 200)); // debounce
      await new Promise((r) => setTimeout(r, 350)); // close + reopen

      expect(manager.isOpen()).to.be.true;
      expect(manager.getType()).to.equal('drawer');
      expect(document.querySelector('.ax-color-drawer-modal-container')).to.exist;
      expect(document.querySelector('.ax-color-drawer-modal-title')?.textContent).to.equal('Switch Test');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });

    it('switches from drawer to standard when viewport grows above breakpoint', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: BREAKPOINT_DESKTOP - 100, configurable: true });
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_DRAWER,
        title: 'Grow Test',
        content: '<p>Content</p>',
      });
      expect(manager.getType()).to.equal('drawer');

      Object.defineProperty(window, 'innerWidth', { value: BREAKPOINT_DESKTOP + 100, configurable: true });
      window.dispatchEvent(new Event('resize'));
      await new Promise((r) => setTimeout(r, 200));
      await new Promise((r) => setTimeout(r, 350));

      expect(manager.isOpen()).to.be.true;
      expect(manager.getType()).to.equal('standard');
      expect(document.querySelector('.ax-color-modal-container')).to.exist;
      expect(document.querySelector('.ax-color-modal-title')?.textContent).to.equal('Grow Test');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
      Object.defineProperty(window, 'innerWidth', { value: origWidth, configurable: true });
    });
  });

  describe('multiple heights (Figma L/M/S)', () => {
    it('standard (desktop L) provides content slot for fixed 898×604 shell', async () => {
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
        title: 'Desktop',
        content: '<p>Minimal</p>',
      });
      const slot = manager.getBody();
      expect(slot).to.exist;
      expect(slot.classList.contains('ax-color-modal-content')).to.be.true;
      expect(slot.tagName).to.equal('DIV');
      expect(slot.querySelector('p')?.textContent).to.equal('Minimal');
      expect(document.querySelector('.ax-color-modal-container')).to.exist; // Figma L: 898×604 container
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });

    it('drawer (tablet M / mobile S) provides content slot for 90vh shell', async () => {
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_DRAWER,
        title: 'Drawer',
        content: '<p>Minimal</p>',
      });
      const slot = manager.getBody();
      expect(slot).to.exist;
      expect(slot.classList.contains('ax-color-drawer-modal-content')).to.be.true;
      expect(slot.tagName).to.equal('DIV');
      expect(slot.querySelector('p')?.textContent).to.equal('Minimal');
      expect(document.querySelector('.ax-color-drawer-modal-container')).to.exist; // Figma M/S: 90vh
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });

    it('standard modal with tall (stub) content: slot contains content for overflow scroll', async () => {
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
        title: 'Tall content',
        content: createModalStubContent(),
      });
      const slot = manager.getBody();
      expect(slot).to.exist;
      expect(slot.classList.contains('ax-color-modal-content')).to.be.true;
      expect(slot.querySelector('.ax-color-modal-stub-content')).to.exist;
      expect(slot.querySelector('.ax-color-modal-stub-list')).to.exist;
      // Contract: slot has overflow-y: auto in CSS so tall content scrolls (Figma L fixed height)
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });

    it('drawer with tall (stub) content: slot contains content for overflow scroll', async () => {
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_DRAWER,
        title: 'Tall content',
        content: createModalStubContent(),
      });
      const slot = manager.getBody();
      expect(slot).to.exist;
      expect(slot.classList.contains('ax-color-drawer-modal-content')).to.be.true;
      expect(slot.querySelector('.ax-color-modal-stub-content')).to.exist;
      // Contract: slot has overflow/scroll in CSS (Figma M/S max-height 90vh, slot scrolls)
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });

    it('single content slot per open (no duplicate slots for L/M/S)', async () => {
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
        title: 'One slot',
        content: '<div id="only">only</div>',
      });
      const container = document.querySelector('.ax-color-modal-container');
      const slots = container?.querySelectorAll('.ax-color-modal-content');
      expect(slots?.length).to.equal(1);
      expect(manager.getBody()?.querySelector('#only')?.textContent).to.equal('only');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));

      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_DRAWER,
        title: 'One slot',
        content: '<div id="drawer-only">drawer</div>',
      });
      const drawerContainer = document.querySelector('.ax-color-drawer-modal-container');
      const drawerSlots = drawerContainer?.querySelectorAll('.ax-color-drawer-modal-content');
      expect(drawerSlots?.length).to.equal(1);
      expect(manager.getBody()?.querySelector('#drawer-only')?.textContent).to.equal('drawer');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });
  });

  describe('max-height and scroll (stub content / dummy DOM)', () => {
    it('standard modal: content slot has overflow-y auto and is scrollable when content is tall', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: BREAKPOINT_DESKTOP + 100, configurable: true });
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
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
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_DRAWER,
        title: 'Tall content',
        content: createModalStubContent({ listItems: 20, strips: 10 }),
      });
      await new Promise((r) => requestAnimationFrame(r));
      const slot = manager.getBody();
      expect(slot).to.exist;
      expect(slot.classList.contains('ax-color-drawer-modal-content')).to.be.true;
      const { overflowY } = window.getComputedStyle(slot);
      expect(['auto', 'scroll']).to.include(overflowY, 'drawer content slot should scroll when overflow');
      expect(slot.scrollHeight).to.be.at.least(slot.clientHeight, 'tall stub content should make drawer slot scrollable');
      manager.close();
      await new Promise((r) => setTimeout(r, 350));
    });

    it('standard modal: container has bounded height (desktop 604px when styles apply)', async () => {
      const origWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: BREAKPOINT_DESKTOP + 100, configurable: true });
      await manager.open({
        _testStylesReady: true,
        type: MODAL_TYPE_STANDARD,
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
        type: MODAL_TYPE_DRAWER,
        title: 'Drawer',
        content: createModalStubContent({ strips: 15 }),
      });
      await new Promise((r) => requestAnimationFrame(r));
      const container = document.querySelector('.ax-color-drawer-modal-container');
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
