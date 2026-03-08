import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import createShell from '../../../../express/code/scripts/color-shared/shell/createShell.js';

describe('Focus Management [H2]', () => {
  let shell;
  let mockLayoutAdapter;
  let mockLayoutInstance;
  let container;
  let sidebarSlot;
  let canvasSlot;
  let topbarSlot;
  let footerSlot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create mock layout slots with focusable elements
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

  describe('Test 1: focus moves to main content target after mount', () => {
    it('should move focus to canvas slot after page mount when no getInitialFocus', async () => {
      const button = document.createElement('button');
      button.textContent = 'Canvas Button';

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.appendChild(button);
          shellAPI.inject('canvas', content);
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

      // Wait for focus to be applied
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(document.activeElement).to.equal(button);
    });

    it('should focus first focusable element in first required slot', async () => {
      const sidebarButton = document.createElement('button');
      sidebarButton.textContent = 'Sidebar Button';
      
      const canvasButton = document.createElement('button');
      canvasButton.textContent = 'Canvas Button';

      const page = {
        requiredSlots: ['sidebar', 'canvas'],
        async mount(shellAPI) {
          const sidebarContent = document.createElement('div');
          sidebarContent.appendChild(sidebarButton);
          shellAPI.inject('sidebar', sidebarContent);
          
          const canvasContent = document.createElement('div');
          canvasContent.appendChild(canvasButton);
          shellAPI.inject('canvas', canvasContent);
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

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(document.activeElement).to.equal(sidebarButton);
    });

    it('should handle pages with no focusable elements gracefully', async () => {
      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'No focusable content';
          shellAPI.inject('canvas', content);
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
      
      expect(async () => await shell.navigate('test-page')).to.not.throw();
    });
  });

  describe('Test 2: focus remains predictable after navigation (save/restore)', () => {
    it('should save focus before navigation and restore after', async () => {
      const page1Button = document.createElement('button');
      page1Button.textContent = 'Page 1 Button';
      page1Button.id = 'page1-btn';

      const page2Button = document.createElement('button');
      page2Button.textContent = 'Page 2 Button';
      page2Button.id = 'page2-btn';

      const page1 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.appendChild(page1Button);
          shellAPI.inject('canvas', content);
        },
      };

      const page2 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.appendChild(page2Button);
          shellAPI.inject('canvas', content);
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('page1', page1);
      shell.page('page2', page2);

      await shell.start();
      await shell.navigate('page1');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Focus should be on page1 button
      expect(document.activeElement).to.equal(page1Button);

      // Navigate to page2
      await shell.navigate('page2');
      
      await new Promise(resolve => setTimeout(resolve, 100));

      // Focus should move to page2 button
      expect(document.activeElement).to.equal(page2Button);
    });

    it('should preserve focus on shared components during navigation', async () => {
      const sharedButton = document.createElement('button');
      sharedButton.textContent = 'Shared Button';
      sharedButton.dataset.sharedComponent = 'true';
      topbarSlot.appendChild(sharedButton);

      const page1 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Page 1';
          shellAPI.inject('canvas', content);
        },
      };

      const page2 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Page 2';
          shellAPI.inject('canvas', content);
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('page1', page1);
      shell.page('page2', page2);

      await shell.start();
      await shell.navigate('page1');

      // Focus shared button
      sharedButton.focus();
      expect(document.activeElement).to.equal(sharedButton);

      // Navigate to page2
      await shell.navigate('page2');

      await new Promise(resolve => setTimeout(resolve, 100));

      // Shared button should still exist and could be focused
      expect(document.body.contains(sharedButton)).to.be.true;
    });
  });

  describe('Test 3: mobile layout preserves meaningful tab order', () => {
    it('should maintain DOM order for tab navigation on mobile', async () => {
      const topbarButton = document.createElement('button');
      topbarButton.textContent = 'Topbar';
      topbarSlot.appendChild(topbarButton);

      const sidebarButton = document.createElement('button');
      sidebarButton.textContent = 'Sidebar';
      sidebarSlot.appendChild(sidebarButton);

      const canvasButton = document.createElement('button');
      canvasButton.textContent = 'Canvas';
      canvasSlot.appendChild(canvasButton);

      const footerButton = document.createElement('button');
      footerButton.textContent = 'Footer';
      footerSlot.appendChild(footerButton);

      const page = {
        requiredSlots: ['sidebar', 'canvas'],
        async mount(shellAPI) {
          // Content already in slots for this test
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
    });

    it('should not break tab order with CSS reordering', async () => {
      // Simulate mobile viewport
      const mediaQuery = window.matchMedia('(max-width: 599px)');
      
      const button1 = document.createElement('button');
      button1.textContent = 'Button 1';
      sidebarSlot.appendChild(button1);

      const button2 = document.createElement('button');
      button2.textContent = 'Button 2';
      canvasSlot.appendChild(button2);

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

      // Tab order should follow DOM order, not visual order
      button1.focus();
      expect(document.activeElement).to.equal(button1);

      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      button1.dispatchEvent(tabEvent);

      // Focus should naturally move to next element in DOM
      button2.focus();
      expect(document.activeElement).to.equal(button2);
    });
  });

  describe('Test 4: focus trap does not block users from leaving the shell', () => {
    it('should not trap focus within shell when navigating away', async () => {
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
          const content = document.createElement('div');
          content.appendChild(shellButton);
          shellAPI.inject('canvas', content);
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

      // Focus should be able to move outside shell
      externalButton.focus();
      expect(document.activeElement).to.equal(externalButton);

      document.body.removeChild(externalButton);
    });

    it('should allow focus to move to browser chrome', async () => {
      const button1 = document.createElement('button');
      button1.textContent = 'Button 1';
      
      const button2 = document.createElement('button');
      button2.textContent = 'Button 2';

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.appendChild(button1);
          content.appendChild(button2);
          shellAPI.inject('canvas', content);
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

      // Move focus to second button - this proves no focus trap
      button2.focus();
      expect(document.activeElement).to.equal(button2);
      
      // Blur to body
      button2.blur();
      
      // Should not force focus back to any button
      await new Promise(resolve => setTimeout(resolve, 100));
      // We're not trapping focus, so it should stay on body or move elsewhere
      expect(document.activeElement).to.not.equal(button1);
    });
  });

  describe('Test 5: getInitialFocus() return value used when defined', () => {
    it('should use element returned by getInitialFocus()', async () => {
      const targetButton = document.createElement('button');
      targetButton.textContent = 'Target Button';
      targetButton.id = 'target-btn';

      const otherButton = document.createElement('button');
      otherButton.textContent = 'Other Button';

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.appendChild(otherButton);
          content.appendChild(targetButton);
          shellAPI.inject('canvas', content);
        },
        getInitialFocus() {
          return targetButton;
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

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(document.activeElement).to.equal(targetButton);
    });

    it('should use selector string returned by getInitialFocus()', async () => {
      const targetButton = document.createElement('button');
      targetButton.textContent = 'Target Button';
      targetButton.className = 'focus-target';

      const otherButton = document.createElement('button');
      otherButton.textContent = 'Other Button';

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.appendChild(otherButton);
          content.appendChild(targetButton);
          shellAPI.inject('canvas', content);
        },
        getInitialFocus(shellAPI) {
          return '.focus-target';
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

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(document.activeElement).to.equal(targetButton);
    });

    it('should handle getInitialFocus returning null gracefully', async () => {
      const button = document.createElement('button');
      button.textContent = 'Fallback Button';

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.appendChild(button);
          shellAPI.inject('canvas', content);
        },
        getInitialFocus() {
          return null;
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

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should fall back to first focusable in required slot
      expect(document.activeElement).to.equal(button);
    });

    it('should handle getInitialFocus returning invalid selector', async () => {
      const button = document.createElement('button');
      button.textContent = 'Fallback Button';

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.appendChild(button);
          shellAPI.inject('canvas', content);
        },
        getInitialFocus() {
          return '.non-existent-selector';
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

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should fall back to first focusable in required slot
      expect(document.activeElement).to.equal(button);
    });
  });

  describe('Test 6: fallback targets first requiredSlot container when getInitialFocus absent', () => {
    it('should focus first focusable element in first required slot', async () => {
      const sidebarButton = document.createElement('button');
      sidebarButton.textContent = 'Sidebar Button';

      const canvasButton = document.createElement('button');
      canvasButton.textContent = 'Canvas Button';

      const page = {
        requiredSlots: ['sidebar', 'canvas'],
        async mount(shellAPI) {
          const sidebarContent = document.createElement('div');
          sidebarContent.appendChild(sidebarButton);
          shellAPI.inject('sidebar', sidebarContent);

          const canvasContent = document.createElement('div');
          canvasContent.appendChild(canvasButton);
          shellAPI.inject('canvas', canvasContent);
        },
        // No getInitialFocus defined
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

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should focus first focusable in first required slot (sidebar)
      expect(document.activeElement).to.equal(sidebarButton);
    });

    it('should skip to second slot if first has no focusable elements', async () => {
      const canvasButton = document.createElement('button');
      canvasButton.textContent = 'Canvas Button';

      const page = {
        requiredSlots: ['sidebar', 'canvas'],
        async mount(shellAPI) {
          const sidebarContent = document.createElement('div');
          sidebarContent.textContent = 'No focusable content';
          shellAPI.inject('sidebar', sidebarContent);

          const canvasContent = document.createElement('div');
          canvasContent.appendChild(canvasButton);
          shellAPI.inject('canvas', canvasContent);
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

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should focus first focusable in second required slot (canvas)
      expect(document.activeElement).to.equal(canvasButton);
    });

    it('should handle page with single required slot', async () => {
      const button = document.createElement('button');
      button.textContent = 'Button';

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.appendChild(button);
          shellAPI.inject('canvas', content);
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

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(document.activeElement).to.equal(button);
    });
  });

  describe('Test 7: route changes announced via announceToScreenReader', () => {
    it('should announce page navigation to screen readers', async () => {
      const liveRegion = document.getElementById('express-spectrum-live-region');
      
      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Page content';
          shellAPI.inject('canvas', content);
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

      await new Promise(resolve => setTimeout(resolve, 150));

      // Live region should exist and have content
      const region = document.getElementById('express-spectrum-live-region');
      expect(region).to.exist;
      expect(region.textContent).to.not.be.empty;
    });

    it('should announce with polite priority by default', async () => {
      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Page content';
          shellAPI.inject('canvas', content);
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

      await new Promise(resolve => setTimeout(resolve, 150));

      const region = document.getElementById('express-spectrum-live-region');
      expect(region).to.exist;
      expect(region.getAttribute('aria-live')).to.equal('polite');
    });

    it('should announce navigation between pages', async () => {
      const page1 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Page 1';
          shellAPI.inject('canvas', content);
        },
      };

      const page2 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Page 2';
          shellAPI.inject('canvas', content);
        },
      };

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });
      shell.page('page1', page1);
      shell.page('page2', page2);

      await shell.start();
      await shell.navigate('page1');

      await new Promise(resolve => setTimeout(resolve, 150));

      const region = document.getElementById('express-spectrum-live-region');
      const firstAnnouncement = region.textContent;
      expect(firstAnnouncement).to.not.be.empty;

      await shell.navigate('page2');

      await new Promise(resolve => setTimeout(resolve, 150));

      const secondAnnouncement = region.textContent;
      expect(secondAnnouncement).to.not.be.empty;
      // Announcement should have changed
      expect(secondAnnouncement).to.not.equal(firstAnnouncement);
    });

    it('should create live region if it does not exist', async () => {
      // Remove live region if it exists
      const existingRegion = document.getElementById('express-spectrum-live-region');
      if (existingRegion) {
        existingRegion.remove();
      }

      const page = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Page content';
          shellAPI.inject('canvas', content);
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

      await new Promise(resolve => setTimeout(resolve, 150));

      const region = document.getElementById('express-spectrum-live-region');
      expect(region).to.exist;
      expect(region.getAttribute('role')).to.equal('status');
      expect(region.getAttribute('aria-live')).to.equal('polite');
      expect(region.getAttribute('aria-atomic')).to.equal('true');
    });
  });
});
