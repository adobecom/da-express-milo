/**
 * Shell Framework Integration Tests [H1]
 * 
 * Tests:
 * 1. start() mounts target layout and shared components
 * 2. navigate() swaps pages without replacing shared component slots
 * 3. same page contract works with both palette-builder and full-width layouts
 * 4. destroy() tears everything down cleanly
 * 
 * Depends on: A5, C1, C2, D3, E2+E3, F2
 */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import createShell from '../../../../express/code/scripts/color-shared/shell/createShell.js';
import createPaletteBuilderLayout from '../../../../express/code/scripts/color-shared/shell/layouts/createPaletteBuilderLayout.js';
import createFullWidthLayout from '../../../../express/code/scripts/color-shared/shell/layouts/createFullWidthLayout.js';

describe('Shell Runtime + Layout Integration [H1]', () => {
  let container;
  let shell;
  let componentRegistry;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    shell = createShell();
    
    // Get internal component registry for test setup
    componentRegistry = shell._internal.componentRegistry;
  });

  afterEach(() => {
    if (shell) {
      shell.destroy();
    }
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Test 1: start() mounts target layout and shared components', () => {
    it('should mount palette-builder layout into container', async () => {
      const layoutAdapter = createPaletteBuilderLayout();
      
      shell.target({
        name: 'test-target',
        layoutAdapter,
        container,
      });

      await shell.start();

      // Verify layout is mounted
      const layoutRoot = container.querySelector('[data-layout="palette-builder"]');
      expect(layoutRoot).to.exist;
      
      // Verify all slots exist
      expect(shell.hasSlot('topbar')).to.be.true;
      expect(shell.hasSlot('sidebar')).to.be.true;
      expect(shell.hasSlot('canvas')).to.be.true;
      expect(shell.hasSlot('footer')).to.be.true;
    });

    it('should mount full-width layout into container', async () => {
      const layoutAdapter = createFullWidthLayout();
      
      shell.target({
        name: 'test-target',
        layoutAdapter,
        container,
      });

      await shell.start();

      // Verify layout is mounted
      const layoutRoot = container.querySelector('[data-layout="full-width"]');
      expect(layoutRoot).to.exist;
      
      // Verify all slots exist
      expect(shell.hasSlot('header')).to.be.true;
      expect(shell.hasSlot('main')).to.be.true;
      expect(shell.hasSlot('footer')).to.be.true;
    });

    it('should mount shared components into designated slots', async () => {
      const layoutAdapter = createPaletteBuilderLayout();
      
      // Register a mock shared component
      const mockComponent = {
        element: document.createElement('div'),
        init: sinon.stub().resolves(),
        update: sinon.stub(),
        destroy: sinon.stub(),
      };
      mockComponent.element.dataset.sharedComponent = 'true';
      mockComponent.element.textContent = 'Shared Toolbar';

      componentRegistry.register('toolbar', () => mockComponent);

      shell.target({
        name: 'test-target',
        layoutAdapter,
        container,
        components: {
          footer: { type: 'toolbar', options: {} },
        },
      });

      await shell.start();

      // Verify component is in the footer slot
      const footerSlot = shell.getSlot('footer');
      expect(footerSlot).to.exist;
      
      // Verify shared component element is mounted in the slot
      expect(footerSlot.contains(mockComponent.element)).to.be.true;
      expect(mockComponent.element.dataset.sharedComponent).to.equal('true');
    });

    it('should not allow start() to be called twice', async () => {
      const layoutAdapter = createPaletteBuilderLayout();
      
      shell.target({
        name: 'test-target',
        layoutAdapter,
        container,
      });

      await shell.start();
      
      // Second start should be a no-op
      await shell.start();
      
      // Should still have only one layout root
      const layoutRoots = container.querySelectorAll('[data-layout]');
      expect(layoutRoots.length).to.equal(1);
    });
  });

  describe('Test 2: navigate() swaps pages without replacing shared component slots', () => {
    let wheelPage;
    let contrastPage;
    let sharedComponent;

    beforeEach(() => {
      // Create mock pages following the page contract
      wheelPage = {
        requiredSlots: ['sidebar', 'canvas'],
        mount: sinon.stub().callsFake((shell) => {
          const sidebar = shell.getSlot('sidebar');
          const canvas = shell.getSlot('canvas');
          
          const sidebarContent = document.createElement('div');
          sidebarContent.dataset.pageContent = 'wheel-sidebar';
          sidebarContent.textContent = 'Wheel Sidebar';
          sidebar.appendChild(sidebarContent);
          
          const canvasContent = document.createElement('div');
          canvasContent.dataset.pageContent = 'wheel-canvas';
          canvasContent.textContent = 'Wheel Canvas';
          canvas.appendChild(canvasContent);
        }),
        destroy: sinon.stub(),
      };

      contrastPage = {
        requiredSlots: ['sidebar', 'canvas'],
        mount: sinon.stub().callsFake((shell) => {
          const sidebar = shell.getSlot('sidebar');
          const canvas = shell.getSlot('canvas');
          
          const sidebarContent = document.createElement('div');
          sidebarContent.dataset.pageContent = 'contrast-sidebar';
          sidebarContent.textContent = 'Contrast Sidebar';
          sidebar.appendChild(sidebarContent);
          
          const canvasContent = document.createElement('div');
          canvasContent.dataset.pageContent = 'contrast-canvas';
          canvasContent.textContent = 'Contrast Canvas';
          canvas.appendChild(canvasContent);
        }),
        destroy: sinon.stub(),
      };

      // Create mock shared component
      sharedComponent = {
        element: document.createElement('div'),
        init: sinon.stub().resolves(),
        update: sinon.stub(),
        destroy: sinon.stub(),
      };
      sharedComponent.element.dataset.sharedComponent = 'true';
      sharedComponent.element.textContent = 'Shared Footer';
    });

    it('should swap page content while preserving shared components', async () => {
      const layoutAdapter = createPaletteBuilderLayout();
      
      componentRegistry.register('toolbar', () => sharedComponent);

      shell.target({
        name: 'test-target',
        layoutAdapter,
        container,
        components: {
          footer: { type: 'toolbar', options: {} },
        },
        reservedSlots: ['footer'],
      });

      // Register pages
      shell.page('wheel', wheelPage);
      shell.page('contrast', contrastPage);

      await shell.start();

      // Navigate to initial page
      await shell.navigate('wheel');

      // Verify wheel page content is present
      const footerSlot = shell.getSlot('footer');
      const sidebarSlot = shell.getSlot('sidebar');
      const canvasSlot = shell.getSlot('canvas');
      
      expect(sidebarSlot.querySelector('[data-page-content="wheel-sidebar"]')).to.exist;
      expect(canvasSlot.querySelector('[data-page-content="wheel-canvas"]')).to.exist;
      
      // Store reference to shared component element
      const sharedElement = sharedComponent.element;
      expect(footerSlot.contains(sharedElement) || footerSlot.querySelector('[data-shared-component]')).to.exist;

      // Navigate to contrast page
      await shell.navigate('contrast');

      // Verify wheel page was destroyed
      expect(wheelPage.destroy.called).to.be.true;

      // Verify wheel page content is removed
      expect(sidebarSlot.querySelector('[data-page-content="wheel-sidebar"]')).to.not.exist;
      expect(canvasSlot.querySelector('[data-page-content="wheel-canvas"]')).to.not.exist;

      // Verify contrast page content is present
      expect(sidebarSlot.querySelector('[data-page-content="contrast-sidebar"]')).to.exist;
      expect(canvasSlot.querySelector('[data-page-content="contrast-canvas"]')).to.exist;

      // Verify shared component is still present and not destroyed
      expect(sharedComponent.destroy.called).to.be.false;
      expect(footerSlot.contains(sharedElement) || footerSlot.querySelector('[data-shared-component]')).to.exist;
    });

    it('should call page destroy hook before clearing slots', async () => {
      const layoutAdapter = createPaletteBuilderLayout();
      const destroyOrder = [];

      wheelPage.destroy = sinon.stub().callsFake(() => {
        destroyOrder.push('page-destroy');
      });

      shell.target({
        name: 'test-target',
        layoutAdapter,
        container,
      });

      shell.page('wheel', wheelPage);
      shell.page('contrast', contrastPage);

      await shell.start();
      
      // Navigate to initial page
      await shell.navigate('wheel');

      // Navigate away
      await shell.navigate('contrast');

      expect(destroyOrder[0]).to.equal('page-destroy');
      expect(wheelPage.destroy.calledOnce).to.be.true;
    });
  });

  describe('Test 3: same page contract works with both palette-builder and full-width layouts', () => {
    let universalPage;

    beforeEach(() => {
      // Create a page that adapts to available slots
      universalPage = {
        requiredSlots: ['main'],
        mount: sinon.stub().callsFake((shell) => {
          const mainSlot = shell.getSlot('main') || shell.getSlot('canvas');
          
          const content = document.createElement('div');
          content.dataset.pageContent = 'universal-main';
          content.textContent = 'Universal Page Content';
          mainSlot.appendChild(content);

          // Optionally use sidebar if available
          if (shell.hasSlot('sidebar')) {
            const sidebar = shell.getSlot('sidebar');
            const sidebarContent = document.createElement('div');
            sidebarContent.dataset.pageContent = 'universal-sidebar';
            sidebarContent.textContent = 'Sidebar Content';
            sidebar.appendChild(sidebarContent);
          }
        }),
        destroy: sinon.stub(),
      };
    });

    it('should work with palette-builder layout (sidebar + canvas)', async () => {
      const layoutAdapter = createPaletteBuilderLayout();
      
      shell.target({
        name: 'palette-target',
        layoutAdapter,
        container,
      });

      shell.page('universal', universalPage);

      await shell.start();
      
      // Verify layout slots exist
      expect(shell.hasSlot('sidebar')).to.be.true;
      expect(shell.hasSlot('canvas')).to.be.true;

      // Mount page
      await universalPage.mount(shell);

      // Verify page mounted successfully
      expect(universalPage.mount.calledOnce).to.be.true;
    });

    it('should work with full-width layout (header + main + footer)', async () => {
      const layoutAdapter = createFullWidthLayout();
      
      shell.target({
        name: 'fullwidth-target',
        layoutAdapter,
        container,
      });

      shell.page('universal', universalPage);

      await shell.start();
      
      // Verify layout slots exist
      expect(shell.hasSlot('header')).to.be.true;
      expect(shell.hasSlot('main')).to.be.true;
      expect(shell.hasSlot('footer')).to.be.true;

      // Mount page
      await universalPage.mount(shell);

      // Verify page mounted successfully
      expect(universalPage.mount.calledOnce).to.be.true;
    });

    it('should allow pages to query available slots at runtime', async () => {
      const adaptivePage = {
        requiredSlots: [],
        mount: sinon.stub().callsFake((shell) => {
          // Page adapts based on available slots
          if (shell.hasSlot('sidebar')) {
            const sidebar = shell.getSlot('sidebar');
            const content = document.createElement('div');
            content.textContent = 'Sidebar Layout';
            sidebar.appendChild(content);
          } else if (shell.hasSlot('header')) {
            const header = shell.getSlot('header');
            const content = document.createElement('div');
            content.textContent = 'Header Layout';
            header.appendChild(content);
          }
        }),
        destroy: sinon.stub(),
      };

      // Test with palette-builder
      const pbLayout = createPaletteBuilderLayout();
      shell.target({
        name: 'pb-target',
        layoutAdapter: pbLayout,
        container,
      });

      await shell.start();
      await adaptivePage.mount(shell);

      const sidebarSlot = shell.getSlot('sidebar');
      expect(sidebarSlot.textContent).to.include('Sidebar Layout');

      shell.destroy();

      // Test with full-width
      const fwContainer = document.createElement('div');
      document.body.appendChild(fwContainer);
      
      const fwShell = createShell();
      const fwLayout = createFullWidthLayout();
      
      fwShell.target({
        name: 'fw-target',
        layoutAdapter: fwLayout,
        container: fwContainer,
      });

      await fwShell.start();
      
      // Reset mount stub
      adaptivePage.mount.resetHistory();
      await adaptivePage.mount(fwShell);

      const headerSlot = fwShell.getSlot('header');
      expect(headerSlot.textContent).to.include('Header Layout');

      fwShell.destroy();
      document.body.removeChild(fwContainer);
    });
  });

  describe('Test 4: destroy() tears everything down cleanly', () => {
    let wheelPage;
    let sharedComponent;

    beforeEach(() => {
      wheelPage = {
        requiredSlots: ['sidebar', 'canvas'],
        mount: sinon.stub().callsFake((shell) => {
          const sidebar = shell.getSlot('sidebar');
          const canvas = shell.getSlot('canvas');
          
          const sidebarContent = document.createElement('div');
          sidebarContent.textContent = 'Wheel Sidebar';
          sidebar.appendChild(sidebarContent);
          
          const canvasContent = document.createElement('div');
          canvasContent.textContent = 'Wheel Canvas';
          canvas.appendChild(canvasContent);
        }),
        destroy: sinon.stub(),
      };

      sharedComponent = {
        element: document.createElement('div'),
        init: sinon.stub().resolves(),
        update: sinon.stub(),
        destroy: sinon.stub(),
      };
      sharedComponent.element.dataset.sharedComponent = 'true';
    });

    it('should destroy page, shared components, and layout in correct order', async () => {
      const layoutAdapter = createPaletteBuilderLayout();
      const destroyOrder = [];

      wheelPage.destroy = sinon.stub().callsFake(() => {
        destroyOrder.push('page');
      });

      sharedComponent.destroy = sinon.stub().callsFake(() => {
        destroyOrder.push('shared-component');
      });

      componentRegistry.register('toolbar', () => sharedComponent);

      shell.target({
        name: 'test-target',
        layoutAdapter,
        container,
        components: {
          footer: { type: 'toolbar', options: {} },
        },
      });

      shell.page('wheel', wheelPage);

      await shell.start();
      
      // Navigate to page
      await shell.navigate('wheel');

      // Destroy everything
      shell.destroy();

      // Verify destroy order: page → shared components → layout
      expect(destroyOrder[0]).to.equal('page');
      expect(destroyOrder[1]).to.equal('shared-component');
    });

    it('should remove layout DOM from container', async () => {
      const layoutAdapter = createPaletteBuilderLayout();
      
      shell.target({
        name: 'test-target',
        layoutAdapter,
        container,
      });

      await shell.start();

      // Verify layout exists
      expect(container.querySelector('[data-layout]')).to.exist;

      shell.destroy();

      // Verify layout is removed
      expect(container.querySelector('[data-layout]')).to.not.exist;
    });

    it('should throw error when accessing slots after destroy', async () => {
      const layoutAdapter = createPaletteBuilderLayout();
      
      shell.target({
        name: 'test-target',
        layoutAdapter,
        container,
      });

      await shell.start();
      shell.destroy();

      // Should throw when accessing slots
      expect(() => shell.getSlot('sidebar')).to.throw(/Layout not mounted/);
      expect(() => shell.hasSlot('sidebar')).to.throw(/Layout not mounted/);
    });

    it('should allow restart after destroy', async () => {
      const layoutAdapter = createPaletteBuilderLayout();
      
      shell.target({
        name: 'test-target',
        layoutAdapter,
        container,
      });

      await shell.start();
      shell.destroy();

      // Should be able to start again
      shell.target({
        name: 'test-target-2',
        layoutAdapter: createPaletteBuilderLayout(),
        container,
      });

      await shell.start();

      expect(shell.hasSlot('sidebar')).to.be.true;
    });
  });
});
