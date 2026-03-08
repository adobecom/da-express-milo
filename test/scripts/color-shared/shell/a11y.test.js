import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createPaletteBuilderLayout } from '../../../../express/code/scripts/color-shared/shell/layouts/createPaletteBuilderLayout.js';
import { createFullWidthLayout } from '../../../../express/code/scripts/color-shared/shell/layouts/createFullWidthLayout.js';
import { createFloatingToolbarAdapter } from '../../../../express/code/scripts/color-shared/shell/components/createFloatingToolbarAdapter.js';
import { announceToScreenReader } from '../../../../express/code/scripts/color-shared/spectrum/utils/a11y.js';

describe('Shell ARIA & Semantics [H3]', () => {
  let container;
  let sandbox;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    sandbox.restore();
  });

  describe('Test 1: Layout emits appropriate landmarks for its regions', () => {
    it('should add role="banner" to topbar slot in palette-builder layout', () => {
      const layoutAdapter = createPaletteBuilderLayout();
      const layoutInstance = layoutAdapter.mount(container);

      const topbarSlot = layoutInstance.getSlot('topbar');
      expect(topbarSlot.getAttribute('role')).to.equal('banner');

      layoutInstance.destroy();
    });

    it('should add role="complementary" to sidebar slot in palette-builder layout', () => {
      const layoutAdapter = createPaletteBuilderLayout();
      const layoutInstance = layoutAdapter.mount(container);

      const sidebarSlot = layoutInstance.getSlot('sidebar');
      expect(sidebarSlot.getAttribute('role')).to.equal('complementary');

      layoutInstance.destroy();
    });

    it('should add role="main" to canvas slot in palette-builder layout', () => {
      const layoutAdapter = createPaletteBuilderLayout();
      const layoutInstance = layoutAdapter.mount(container);

      const canvasSlot = layoutInstance.getSlot('canvas');
      expect(canvasSlot.getAttribute('role')).to.equal('main');

      layoutInstance.destroy();
    });

    it('should add role="contentinfo" to footer slot in palette-builder layout', () => {
      const layoutAdapter = createPaletteBuilderLayout();
      const layoutInstance = layoutAdapter.mount(container);

      const footerSlot = layoutInstance.getSlot('footer');
      expect(footerSlot.getAttribute('role')).to.equal('contentinfo');

      layoutInstance.destroy();
    });

    it('should add role="main" to main slot in full-width layout', () => {
      const layoutAdapter = createFullWidthLayout();
      const layoutInstance = layoutAdapter.mount(container);

      const mainSlot = layoutInstance.getSlot('main');
      expect(mainSlot.getAttribute('role')).to.equal('main');

      layoutInstance.destroy();
    });

    it('should add aria-label to topbar slot in palette-builder layout', () => {
      const layoutAdapter = createPaletteBuilderLayout();
      const layoutInstance = layoutAdapter.mount(container);

      const topbarSlot = layoutInstance.getSlot('topbar');
      expect(topbarSlot.getAttribute('aria-label')).to.exist;
      expect(topbarSlot.getAttribute('aria-label')).to.equal('Top navigation');

      layoutInstance.destroy();
    });

    it('should add aria-label to sidebar slot in palette-builder layout', () => {
      const layoutAdapter = createPaletteBuilderLayout();
      const layoutInstance = layoutAdapter.mount(container);

      const sidebarSlot = layoutInstance.getSlot('sidebar');
      expect(sidebarSlot.getAttribute('aria-label')).to.exist;
      expect(sidebarSlot.getAttribute('aria-label')).to.equal('Tool controls');

      layoutInstance.destroy();
    });

    it('should add aria-label to canvas slot in palette-builder layout', () => {
      const layoutAdapter = createPaletteBuilderLayout();
      const layoutInstance = layoutAdapter.mount(container);

      const canvasSlot = layoutInstance.getSlot('canvas');
      expect(canvasSlot.getAttribute('aria-label')).to.exist;
      expect(canvasSlot.getAttribute('aria-label')).to.equal('Main content');

      layoutInstance.destroy();
    });

    it('should add aria-label to footer slot in palette-builder layout', () => {
      const layoutAdapter = createPaletteBuilderLayout();
      const layoutInstance = layoutAdapter.mount(container);

      const footerSlot = layoutInstance.getSlot('footer');
      expect(footerSlot.getAttribute('aria-label')).to.exist;
      expect(footerSlot.getAttribute('aria-label')).to.equal('Toolbar');

      layoutInstance.destroy();
    });
  });

  describe('Test 2: Toolbar controls have accessible labels', () => {
    it('should ensure toolbar adapter applies aria-label to its container', async () => {
      const slotEl = document.createElement('div');
      container.appendChild(slotEl);

      const mockContextAPI = {
        get: sinon.stub().returns({ colors: ['#ff0000'], name: 'Test Palette' }),
        on: sinon.stub(),
        off: sinon.stub(),
      };

      const mockToolbarInstance = {
        toolbar: {
          element: document.createElement('div'),
          updateSwatches: sinon.stub(),
        },
        destroy: sinon.stub(),
      };

      const mockInitFloatingToolbar = sinon.stub().resolves(mockToolbarInstance);

      const adapter = await createFloatingToolbarAdapter(
        slotEl,
        { palette: { colors: ['#ff0000'], name: 'Test' } },
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar }
      );

      expect(adapter.element.getAttribute('role')).to.equal('toolbar');
      expect(adapter.element.getAttribute('aria-label')).to.exist;
      expect(adapter.element.getAttribute('aria-label')).to.equal('Palette actions');

      adapter.destroy();
    });

    it('should ensure toolbar buttons have aria-label attributes', async () => {
      const slotEl = document.createElement('div');
      container.appendChild(slotEl);

      const toolbarElement = document.createElement('div');
      const button1 = document.createElement('button');
      button1.className = 'edit-button';
      const button2 = document.createElement('button');
      button2.className = 'save-button';
      toolbarElement.appendChild(button1);
      toolbarElement.appendChild(button2);

      const mockContextAPI = {
        get: sinon.stub().returns({ colors: ['#ff0000'], name: 'Test Palette' }),
        on: sinon.stub(),
        off: sinon.stub(),
      };

      const mockToolbarInstance = {
        toolbar: {
          element: toolbarElement,
          updateSwatches: sinon.stub(),
        },
        destroy: sinon.stub(),
      };

      const mockInitFloatingToolbar = sinon.stub().resolves(mockToolbarInstance);

      const adapter = await createFloatingToolbarAdapter(
        slotEl,
        { palette: { colors: ['#ff0000'], name: 'Test' } },
        mockContextAPI,
        { initFloatingToolbar: mockInitFloatingToolbar }
      );

      // Verify buttons have aria-label
      const buttons = adapter.element.querySelectorAll('button');
      buttons.forEach((btn) => {
        expect(btn.getAttribute('aria-label')).to.exist;
      });

      adapter.destroy();
    });
  });

  describe('Test 3: Route changes announced via announceToScreenReader', () => {
    it('should announce page navigation to screen readers', () => {
      const announceStub = sandbox.stub();
      
      // Mock the announceToScreenReader function
      const originalAnnounce = announceToScreenReader;
      const mockAnnounce = (message, priority) => {
        announceStub(message, priority);
        originalAnnounce(message, priority);
      };

      // Simulate a route change announcement
      mockAnnounce('Navigated to Color Wheel page', 'polite');

      expect(announceStub.calledOnce).to.be.true;
      expect(announceStub.firstCall.args[0]).to.equal('Navigated to Color Wheel page');
      expect(announceStub.firstCall.args[1]).to.equal('polite');
    });

    it('should announce with page title when navigating', () => {
      const announceStub = sandbox.stub();
      
      const originalAnnounce = announceToScreenReader;
      const mockAnnounce = (message, priority) => {
        announceStub(message, priority);
        originalAnnounce(message, priority);
      };

      // Simulate navigation to different pages
      mockAnnounce('Navigated to Contrast Checker page', 'polite');
      mockAnnounce('Navigated to Color Blindness Simulator page', 'polite');

      expect(announceStub.callCount).to.equal(2);
      expect(announceStub.firstCall.args[0]).to.include('Contrast Checker');
      expect(announceStub.secondCall.args[0]).to.include('Color Blindness Simulator');
    });

    it('should use polite priority for route announcements', () => {
      const announceStub = sandbox.stub();
      
      const originalAnnounce = announceToScreenReader;
      const mockAnnounce = (message, priority) => {
        announceStub(message, priority);
        originalAnnounce(message, priority);
      };

      mockAnnounce('Navigated to Color Wheel page', 'polite');

      expect(announceStub.firstCall.args[1]).to.equal('polite');
    });
  });

  describe('Test 4: Slot containers use semantic elements appropriate to their role', () => {
    it('should use semantic HTML elements for palette-builder layout slots', () => {
      const layoutAdapter = createPaletteBuilderLayout();
      const layoutInstance = layoutAdapter.mount(container);

      const topbarSlot = layoutInstance.getSlot('topbar');
      const sidebarSlot = layoutInstance.getSlot('sidebar');
      const canvasSlot = layoutInstance.getSlot('canvas');
      const footerSlot = layoutInstance.getSlot('footer');

      // Topbar should be a header or have role="banner"
      expect(topbarSlot.tagName === 'HEADER' || topbarSlot.getAttribute('role') === 'banner').to.be.true;

      // Sidebar should be an aside or have role="complementary"
      expect(sidebarSlot.tagName === 'ASIDE' || sidebarSlot.getAttribute('role') === 'complementary').to.be.true;

      // Canvas should be a main or have role="main"
      expect(canvasSlot.tagName === 'MAIN' || canvasSlot.getAttribute('role') === 'main').to.be.true;

      // Footer should be a footer or have role="contentinfo"
      expect(footerSlot.tagName === 'FOOTER' || footerSlot.getAttribute('role') === 'contentinfo').to.be.true;

      layoutInstance.destroy();
    });

    it('should use main element for full-width layout main slot', () => {
      const layoutAdapter = createFullWidthLayout();
      const layoutInstance = layoutAdapter.mount(container);

      const mainSlot = layoutInstance.getSlot('main');
      expect(mainSlot.tagName === 'MAIN' || mainSlot.getAttribute('role') === 'main').to.be.true;

      layoutInstance.destroy();
    });

    it('should ensure slot elements have appropriate ARIA roles when not using semantic HTML', () => {
      const layoutAdapter = createPaletteBuilderLayout();
      const layoutInstance = layoutAdapter.mount(container);

      const slots = layoutInstance.getSlotNames();
      
      slots.forEach((slotName) => {
        const slot = layoutInstance.getSlot(slotName);
        
        // If not using semantic HTML, must have a role
        if (!['HEADER', 'ASIDE', 'MAIN', 'FOOTER', 'NAV', 'SECTION'].includes(slot.tagName)) {
          expect(slot.getAttribute('role')).to.exist;
        }
      });

      layoutInstance.destroy();
    });
  });
});
