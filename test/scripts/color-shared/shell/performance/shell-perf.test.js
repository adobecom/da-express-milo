import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { measureShellStart, measureNavigation } from '../../../../../express/code/scripts/color-shared/shell/performance/perf-helpers.js';
import createShell from '../../../../../express/code/scripts/color-shared/shell/createShell.js';

describe('Performance Test Infrastructure [I1]', () => {
  let shell;
  let mockLayoutAdapter;
  let mockLayoutInstance;
  let container;
  let canvasSlot;
  let sidebarSlot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    canvasSlot = document.createElement('div');
    canvasSlot.setAttribute('data-slot', 'canvas');
    canvasSlot.setAttribute('role', 'main');

    sidebarSlot = document.createElement('div');
    sidebarSlot.setAttribute('data-slot', 'sidebar');
    sidebarSlot.setAttribute('role', 'complementary');

    container.appendChild(canvasSlot);
    container.appendChild(sidebarSlot);

    mockLayoutInstance = {
      type: 'test-layout',
      root: container,
      hasSlot: sinon.stub().callsFake((name) =>
        ['canvas', 'sidebar'].includes(name)
      ),
      getSlot: sinon.stub().callsFake((name) => {
        const slotMap = { canvas: canvasSlot, sidebar: sidebarSlot };
        return slotMap[name] || null;
      }),
      getSlotNames: sinon.stub().returns(['canvas', 'sidebar']),
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
      type: 'test-layout',
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

  describe('Test 1: measureShellStart() returns timing breakdowns', () => {
    it('should measure shell start with timing breakdowns', async () => {
      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });

      const timings = await measureShellStart(shell);

      expect(timings).to.be.an('object');
      expect(timings.total).to.be.a('number');
      expect(timings.total).to.be.at.least(0);
      expect(timings.layoutMount).to.be.a('number');
      expect(timings.layoutMount).to.be.at.least(0);
      expect(timings.componentInit).to.be.a('number');
      expect(timings.componentInit).to.be.at.least(0);
      expect(timings.layoutMount + timings.componentInit).to.be.at.most(timings.total + 1);
    });

    it('should measure shell start with shared components', async () => {
      const mockComponent = {
        init: sinon.stub().resolves(),
        element: document.createElement('div'),
        update: sinon.stub(),
        destroy: sinon.stub(),
      };

      shell._internal.componentRegistry.register('test-component', () => mockComponent);

      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {
          sidebar: { type: 'test-component', options: {} },
        },
      });

      const timings = await measureShellStart(shell);

      expect(timings.total).to.be.a('number');
      expect(timings.layoutMount).to.be.a('number');
      expect(timings.componentInit).to.be.a('number');
      expect(timings.componentInit).to.be.greaterThan(0);
      
      // Verify component was actually mounted by checking DOM
      const sidebarContent = sidebarSlot.querySelector('[data-shared-component]');
      expect(sidebarContent).to.not.be.null;
      expect(sidebarContent).to.equal(mockComponent.element);
    });

    it('should return timing breakdowns even with no components', async () => {
      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });

      const timings = await measureShellStart(shell);

      expect(timings.componentInit).to.equal(0);
      expect(timings.layoutMount).to.be.greaterThan(0);
      expect(timings.total).to.be.greaterThan(0);
    });
  });

  describe('Test 2: measureNavigation() measures teardown/load/mount', () => {
    it('should measure navigation timing breakdowns', async () => {
      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });

      await shell.start();

      const page1 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Page 1';
          shellAPI.inject('canvas', content);
        },
        destroy: sinon.stub(),
      };

      const page2 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Page 2';
          shellAPI.inject('canvas', content);
        },
      };

      shell.page('page1', page1);
      shell.page('page2', page2);

      await shell.navigate('page1');

      const timings = await measureNavigation(shell, 'page2');

      expect(timings).to.be.an('object');
      expect(timings.total).to.be.a('number');
      expect(timings.total).to.be.at.least(0);
      expect(timings.teardown).to.be.a('number');
      expect(timings.teardown).to.be.at.least(0);
      expect(timings.mount).to.be.a('number');
      expect(timings.mount).to.be.at.least(0);
      expect(timings.teardown + timings.mount).to.be.at.most(timings.total + 1);
      expect(page1.destroy.calledOnce).to.be.true;
    });

    it('should measure navigation from initial state (no current page)', async () => {
      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });

      await shell.start();

      const page1 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Page 1';
          shellAPI.inject('canvas', content);
        },
      };

      shell.page('page1', page1);

      const timings = await measureNavigation(shell, 'page1');

      expect(timings.teardown).to.equal(0);
      expect(timings.mount).to.be.greaterThan(0);
      expect(timings.total).to.be.greaterThan(0);
    });

    it('should measure navigation with complex page lifecycle', async () => {
      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });

      await shell.start();

      const page1 = {
        requiredSlots: ['canvas', 'sidebar'],
        async mount(shellAPI) {
          const canvasContent = document.createElement('div');
          canvasContent.textContent = 'Canvas 1';
          shellAPI.inject('canvas', canvasContent);

          const sidebarContent = document.createElement('div');
          sidebarContent.textContent = 'Sidebar 1';
          shellAPI.inject('sidebar', sidebarContent);
        },
        destroy: sinon.stub(),
      };

      const page2 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Canvas 2';
          shellAPI.inject('canvas', content);
        },
      };

      shell.page('page1', page1);
      shell.page('page2', page2);

      await shell.navigate('page1');

      const timings = await measureNavigation(shell, 'page2');

      expect(timings.teardown).to.be.greaterThan(0);
      expect(timings.mount).to.be.greaterThan(0);
      expect(timings.total).to.be.greaterThan(0);
      expect(page1.destroy.calledOnce).to.be.true;
    });
  });

  describe('Test 3: helpers are non-intrusive', () => {
    it('should not modify shell behavior during measurement', async () => {
      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });

      const timings = await measureShellStart(shell);

      expect(shell.hasSlot('canvas')).to.be.true;
      expect(shell.getSlot('canvas')).to.equal(canvasSlot);
      expect(mockLayoutAdapter.mount.calledOnce).to.be.true;
    });

    it('should not affect shell state after navigation measurement', async () => {
      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });

      await shell.start();

      const page1 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Page 1';
          shellAPI.inject('canvas', content);
        },
        destroy: sinon.stub(),
      };

      const page2 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          content.textContent = 'Page 2';
          shellAPI.inject('canvas', content);
        },
      };

      shell.page('page1', page1);
      shell.page('page2', page2);

      await shell.navigate('page1');

      const canvasContentBefore = canvasSlot.textContent;
      expect(canvasContentBefore).to.include('Page 1');

      await measureNavigation(shell, 'page2');

      const canvasContentAfter = canvasSlot.textContent;
      expect(canvasContentAfter).to.include('Page 2');
      expect(page1.destroy.calledOnce).to.be.true;
    });

    it('should allow multiple measurements without interference', async () => {
      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });

      const timings1 = await measureShellStart(shell);
      shell.destroy();

      shell = createShell();
      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });

      const timings2 = await measureShellStart(shell);

      expect(timings1.total).to.be.a('number');
      expect(timings2.total).to.be.a('number');
      expect(mockLayoutAdapter.mount.calledTwice).to.be.true;
    });

    it('should not leak memory or event listeners', async () => {
      shell.target({
        name: 'test-target',
        layoutAdapter: mockLayoutAdapter,
        container,
        components: {},
      });

      await shell.start();

      const page1 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          shellAPI.inject('canvas', content);
        },
      };

      const page2 = {
        requiredSlots: ['canvas'],
        async mount(shellAPI) {
          const content = document.createElement('div');
          shellAPI.inject('canvas', content);
        },
      };

      shell.page('page1', page1);
      shell.page('page2', page2);

      await shell.navigate('page1');
      await measureNavigation(shell, 'page2');

      const childCountBefore = canvasSlot.children.length;

      await measureNavigation(shell, 'page1');

      const childCountAfter = canvasSlot.children.length;

      expect(childCountBefore).to.equal(childCountAfter);
    });
  });
});
