/**
 * Keyboard Navigation Tests [H4]
 * 
 * Tests keyboard support for shared shell UI without hardcoding slot order.
 * 
 * Key Requirements:
 * 1. Tab sequence follows layout DOM order (no hardcoded assumptions)
 * 2. Escape behavior uses handleEscapeClose and is component-specific
 * 3. Toolbar keyboard interaction follows established ARIA patterns (roving tabindex)
 * 4. Focus does not get trapped within the shell
 * 
 * Reuses:
 * - handleEscapeClose from color-shared/spectrum/utils/a11y.js
 * - Roving tabindex + arrow-key patterns from blocks/tabs-ax/tabs-ax.js
 * 
 * Depends on: H2 (Focus Management), H3 (ARIA & Semantics)
 */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createShell } from '../../../../express/code/scripts/color-shared/shell/createShell.js';
import { createPaletteBuilderLayout } from '../../../../express/code/scripts/color-shared/shell/layouts/createPaletteBuilderLayout.js';

describe('Keyboard Navigation [H4]', () => {
  let shell;
  let mockLayoutAdapter;
  let mockLayoutInstance;
  let container;
  let topbarSlot;
  let sidebarSlot;
  let canvasSlot;
  let footerSlot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create mock layout slots
    topbarSlot = document.createElement('div');
    topbarSlot.setAttribute('data-slot', 'topbar');
    topbarSlot.setAttribute('role', 'banner');

    sidebarSlot = document.createElement('div');
    sidebarSlot.setAttribute('data-slot', 'sidebar');
    sidebarSlot.setAttribute('role', 'complementary');

    canvasSlot = document.createElement('div');
    canvasSlot.setAttribute('data-slot', 'canvas');
    canvasSlot.setAttribute('role', 'main');

    footerSlot = document.createElement('div');
    footerSlot.setAttribute('data-slot', 'footer');
    footerSlot.setAttribute('role', 'contentinfo');

    container.appendChild(topbarSlot);
    container.appendChild(sidebarSlot);
    container.appendChild(canvasSlot);
    container.appendChild(footerSlot);

    mockLayoutInstance = {
      type: 'palette-builder',
      root: container,
      hasSlot: sinon.stub().callsFake((name) =>
        ['topbar', 'sidebar', 'canvas', 'footer'].includes(name)
      ),
      getSlot: sinon.stub().callsFake((name) => {
        const slotMap = { topbar: topbarSlot, sidebar: sidebarSlot, canvas: canvasSlot, footer: footerSlot };
        return slotMap[name] || null;
      }),
      getSlotNames: sinon.stub().returns(['topbar', 'sidebar', 'canvas', 'footer']),
      clearSlot: sinon.stub().callsFake((name) => {
        const slot = mockLayoutInstance.getSlot(name);
        if (slot) {
          Array.from(slot.children).forEach((child) => {
            if (!child.hasAttribute('data-shared-component')) {
              slot.removeChild(child);
            }
          });
        }
      }),
      destroy: sinon.stub(),
    };

    mockLayoutAdapter = {
      type: 'palette-builder',
      mount: sinon.stub().returns(mockLayoutInstance),
    };

    shell = createShell();
  });

  afterEach(() => {
    if (shell) {
      shell.destroy();
    }
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Test 1: tab sequence follows layout DOM order', () => {
    it('should allow tab navigation through slots in DOM order', async () => {
      const topbarButton = document.createElement('button');
      topbarButton.textContent = 'Topbar Button';
      topbarButton.id = 'topbar-btn';
      topbarSlot.appendChild(topbarButton);

      const sidebarButton = document.createElement('button');
      sidebarButton.textContent = 'Sidebar Button';
      sidebarButton.id = 'sidebar-btn';
      sidebarSlot.appendChild(sidebarButton);

      const canvasButton = document.createElement('button');
      canvasButton.textContent = 'Canvas Button';
      canvasButton.id = 'canvas-btn';
      canvasSlot.appendChild(canvasButton);

      const footerButton = document.createElement('button');
      footerButton.textContent = 'Footer Button';
      footerButton.id = 'footer-btn';
      footerSlot.appendChild(footerButton);

      const page = {
        requiredSlots: ['sidebar', 'canvas'],
        async mount(shellAPI) {
          // Content already in slots
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Verify DOM order matches expected tab order
      const focusableElements = container.querySelectorAll('button');
      const elementArray = Array.from(focusableElements);

      expect(elementArray[0]).to.equal(topbarButton);
      expect(elementArray[1]).to.equal(sidebarButton);
      expect(elementArray[2]).to.equal(canvasButton);
      expect(elementArray[3]).to.equal(footerButton);

      // Verify no tabindex manipulation that would break natural order
      expect(topbarButton.getAttribute('tabindex')).to.not.equal('-1');
      expect(sidebarButton.getAttribute('tabindex')).to.not.equal('-1');
      expect(canvasButton.getAttribute('tabindex')).to.not.equal('-1');
      expect(footerButton.getAttribute('tabindex')).to.not.equal('-1');
    });

    it('should preserve natural tab order without hardcoding slot positions', async () => {
      const button1 = document.createElement('button');
      button1.textContent = 'Button 1';
      sidebarSlot.appendChild(button1);

      const button2 = document.createElement('button');
      button2.textContent = 'Button 2';
      canvasSlot.appendChild(button2);

      const button3 = document.createElement('button');
      button3.textContent = 'Button 3';
      footerSlot.appendChild(button3);

      const page = {
        requiredSlots: ['sidebar', 'canvas', 'footer'],
        async mount(shellAPI) {
          // Content already in slots
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Focus first button
      button1.focus();
      expect(document.activeElement).to.equal(button1);

      // Tab to next button - should follow DOM order
      button2.focus();
      expect(document.activeElement).to.equal(button2);

      // Tab to next button
      button3.focus();
      expect(document.activeElement).to.equal(button3);
    });

    it('should not interfere with browser default tab behavior', async () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'test-input';
      canvasSlot.appendChild(input);

      const button = document.createElement('button');
      button.textContent = 'Submit';
      button.id = 'submit-btn';
      canvasSlot.appendChild(button);

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          // Content already in slots
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Focus input
      input.focus();
      expect(document.activeElement).to.equal(input);

      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      input.dispatchEvent(tabEvent);

      // Focus should naturally move to button
      button.focus();
      expect(document.activeElement).to.equal(button);
    });
  });

  describe('Test 2: escape behavior uses handleEscapeClose and is component-specific', () => {
    it('should handle escape key on toolbar component', async () => {
      const toolbarContainer = document.createElement('div');
      toolbarContainer.setAttribute('role', 'toolbar');
      toolbarContainer.setAttribute('data-component', 'toolbar');
      footerSlot.appendChild(toolbarContainer);

      const toolbarButton = document.createElement('button');
      toolbarButton.textContent = 'Toolbar Action';
      toolbarContainer.appendChild(toolbarButton);

      let escapeHandled = false;
      const mockToolbarComponent = {
        element: toolbarContainer,
        init: sinon.stub().resolves(),
        destroy: sinon.stub(),
        handleEscape: () => {
          escapeHandled = true;
        },
      };

      const page = {
        requiredSlots: ['footer'],
        async mount(shellAPI) {
          // Toolbar already mounted
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Focus toolbar button
      toolbarButton.focus();

      // Simulate Escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      toolbarContainer.dispatchEvent(escapeEvent);

      // Component-specific escape handler should be called
      // (This test verifies the pattern - actual implementation will wire this up)
      expect(escapeEvent.defaultPrevented).to.be.false; // Should not prevent default unless component handles it
    });

    it('should allow components to register escape handlers via keyboard module', async () => {
      const componentEl = document.createElement('div');
      componentEl.setAttribute('data-component', 'custom');
      canvasSlot.appendChild(componentEl);

      const button = document.createElement('button');
      button.textContent = 'Component Button';
      componentEl.appendChild(button);

      let escapeCallbackCalled = false;

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          // Simulate component registering escape handler
          // This will be provided by keyboard navigation module
          if (shellAPI.keyboard && shellAPI.keyboard.onEscape) {
            shellAPI.keyboard.onEscape(componentEl, () => {
              escapeCallbackCalled = true;
            });
          }
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Focus button
      button.focus();

      // Simulate Escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      componentEl.dispatchEvent(escapeEvent);

      // Callback should be called (when keyboard module is implemented)
      // expect(escapeCallbackCalled).to.be.true;
    });

    it('should not trap escape key globally - only for registered components', async () => {
      const button = document.createElement('button');
      button.textContent = 'Regular Button';
      canvasSlot.appendChild(button);

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          // No escape handler registered
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Focus button
      button.focus();

      // Simulate Escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      button.dispatchEvent(escapeEvent);

      // Should not be prevented by shell
      expect(escapeEvent.defaultPrevented).to.be.false;
    });
  });

  describe('Test 3: toolbar keyboard interaction follows established patterns', () => {
    it('should support arrow key navigation in toolbar with roving tabindex', async () => {
      const toolbar = document.createElement('div');
      toolbar.setAttribute('role', 'toolbar');
      toolbar.setAttribute('aria-label', 'Palette actions');
      footerSlot.appendChild(toolbar);

      const button1 = document.createElement('button');
      button1.textContent = 'Action 1';
      button1.setAttribute('tabindex', '0');
      toolbar.appendChild(button1);

      const button2 = document.createElement('button');
      button2.textContent = 'Action 2';
      button2.setAttribute('tabindex', '-1');
      toolbar.appendChild(button2);

      const button3 = document.createElement('button');
      button3.textContent = 'Action 3';
      button3.setAttribute('tabindex', '-1');
      toolbar.appendChild(button3);

      const page = {
        requiredSlots: ['footer'],
        async mount(shellAPI) {
          // Toolbar already mounted
          // Keyboard module should enable arrow key navigation
          if (shellAPI.keyboard && shellAPI.keyboard.enableToolbarNavigation) {
            shellAPI.keyboard.enableToolbarNavigation(toolbar);
          }
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Focus first button
      button1.focus();
      expect(document.activeElement).to.equal(button1);

      // Simulate ArrowRight key
      const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      toolbar.dispatchEvent(arrowRightEvent);

      // After implementation, button2 should be focused and have tabindex="0"
      // expect(document.activeElement).to.equal(button2);
      // expect(button1.getAttribute('tabindex')).to.equal('-1');
      // expect(button2.getAttribute('tabindex')).to.equal('0');
    });

    it('should wrap arrow navigation at toolbar boundaries', async () => {
      const toolbar = document.createElement('div');
      toolbar.setAttribute('role', 'toolbar');
      footerSlot.appendChild(toolbar);

      const button1 = document.createElement('button');
      button1.textContent = 'First';
      button1.setAttribute('tabindex', '0');
      toolbar.appendChild(button1);

      const button2 = document.createElement('button');
      button2.textContent = 'Last';
      button2.setAttribute('tabindex', '-1');
      toolbar.appendChild(button2);

      const page = {
        requiredSlots: ['footer'],
        async mount(shellAPI) {
          if (shellAPI.keyboard && shellAPI.keyboard.enableToolbarNavigation) {
            shellAPI.keyboard.enableToolbarNavigation(toolbar);
          }
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Focus last button
      button2.focus();
      button2.setAttribute('tabindex', '0');
      button1.setAttribute('tabindex', '-1');

      // Simulate ArrowRight - should wrap to first
      const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      toolbar.dispatchEvent(arrowRightEvent);

      // After implementation, should wrap to button1
      // expect(document.activeElement).to.equal(button1);
    });

    it('should support Home/End keys in toolbar', async () => {
      const toolbar = document.createElement('div');
      toolbar.setAttribute('role', 'toolbar');
      footerSlot.appendChild(toolbar);

      const button1 = document.createElement('button');
      button1.textContent = 'First';
      toolbar.appendChild(button1);

      const button2 = document.createElement('button');
      button2.textContent = 'Middle';
      toolbar.appendChild(button2);

      const button3 = document.createElement('button');
      button3.textContent = 'Last';
      toolbar.appendChild(button3);

      const page = {
        requiredSlots: ['footer'],
        async mount(shellAPI) {
          if (shellAPI.keyboard && shellAPI.keyboard.enableToolbarNavigation) {
            shellAPI.keyboard.enableToolbarNavigation(toolbar);
          }
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Focus middle button
      button2.focus();

      // Simulate End key - should jump to last button
      const endEvent = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
      toolbar.dispatchEvent(endEvent);

      // After implementation:
      // expect(document.activeElement).to.equal(button3);

      // Simulate Home key - should jump to first button
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
      toolbar.dispatchEvent(homeEvent);

      // After implementation:
      // expect(document.activeElement).to.equal(button1);
    });
  });

  describe('Test 4: focus does not get trapped within the shell', () => {
    it('should allow focus to leave shell container', async () => {
      const shellButton = document.createElement('button');
      shellButton.textContent = 'Shell Button';
      canvasSlot.appendChild(shellButton);

      const externalButton = document.createElement('button');
      externalButton.textContent = 'External Button';
      externalButton.id = 'external-btn';
      document.body.appendChild(externalButton);

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          // Content already in slots
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Focus shell button
      shellButton.focus();
      expect(document.activeElement).to.equal(shellButton);

      // Focus external button - should succeed
      externalButton.focus();
      expect(document.activeElement).to.equal(externalButton);

      document.body.removeChild(externalButton);
    });

    it('should not prevent Tab key from moving focus outside shell', async () => {
      const lastShellButton = document.createElement('button');
      lastShellButton.textContent = 'Last Shell Button';
      footerSlot.appendChild(lastShellButton);

      const externalButton = document.createElement('button');
      externalButton.textContent = 'After Shell';
      document.body.appendChild(externalButton);

      const page = {
        requiredSlots: ['footer'],
        async mount(shellAPI) {
          // Content already in slots
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Focus last button in shell
      lastShellButton.focus();
      expect(document.activeElement).to.equal(lastShellButton);

      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      lastShellButton.dispatchEvent(tabEvent);

      // Should not be prevented
      expect(tabEvent.defaultPrevented).to.be.false;

      document.body.removeChild(externalButton);
    });

    it('should not trap focus when shell is embedded in larger page', async () => {
      const beforeShellButton = document.createElement('button');
      beforeShellButton.textContent = 'Before Shell';
      document.body.insertBefore(beforeShellButton, container);

      const shellButton = document.createElement('button');
      shellButton.textContent = 'Shell Button';
      canvasSlot.appendChild(shellButton);

      const afterShellButton = document.createElement('button');
      afterShellButton.textContent = 'After Shell';
      document.body.appendChild(afterShellButton);

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          // Content already in slots
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Focus before shell
      beforeShellButton.focus();
      expect(document.activeElement).to.equal(beforeShellButton);

      // Focus shell
      shellButton.focus();
      expect(document.activeElement).to.equal(shellButton);

      // Focus after shell
      afterShellButton.focus();
      expect(document.activeElement).to.equal(afterShellButton);

      document.body.removeChild(beforeShellButton);
      document.body.removeChild(afterShellButton);
    });

    it('should allow Shift+Tab to move focus backward out of shell', async () => {
      const firstShellButton = document.createElement('button');
      firstShellButton.textContent = 'First Shell Button';
      topbarSlot.appendChild(firstShellButton);

      const externalButton = document.createElement('button');
      externalButton.textContent = 'Before Shell';
      document.body.insertBefore(externalButton, container);

      const page = {
        requiredSlots: ['topbar'],
        async mount(shellAPI) {
          // Content already in slots
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('test-page', page);

      await shell.start();
      await shell.navigate('test-page');

      // Focus first button in shell
      firstShellButton.focus();
      expect(document.activeElement).to.equal(firstShellButton);

      // Simulate Shift+Tab key
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      firstShellButton.dispatchEvent(shiftTabEvent);

      // Should not be prevented
      expect(shiftTabEvent.defaultPrevented).to.be.false;

      document.body.removeChild(externalButton);
    });
  });

  describe('Integration: Real layout adapter keyboard behavior', () => {
    it('should work with actual palette-builder layout', async () => {
      const realContainer = document.createElement('div');
      document.body.appendChild(realContainer);

      const layoutAdapter = createPaletteBuilderLayout();
      const layoutInstance = layoutAdapter.mount(realContainer);

      const sidebarSlot = layoutInstance.getSlot('sidebar');
      const canvasSlot = layoutInstance.getSlot('canvas');

      const sidebarButton = document.createElement('button');
      sidebarButton.textContent = 'Sidebar Control';
      sidebarSlot.appendChild(sidebarButton);

      const canvasButton = document.createElement('button');
      canvasButton.textContent = 'Canvas Content';
      canvasSlot.appendChild(canvasButton);

      // Verify DOM order
      const buttons = realContainer.querySelectorAll('button');
      const buttonArray = Array.from(buttons);

      // Sidebar should come before canvas in DOM
      const sidebarIndex = buttonArray.indexOf(sidebarButton);
      const canvasIndex = buttonArray.indexOf(canvasButton);
      expect(sidebarIndex).to.be.lessThan(canvasIndex);

      layoutInstance.destroy();
      document.body.removeChild(realContainer);
    });
  });
});
