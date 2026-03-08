/**
 * Page Transition Cleanup Tests (E3)
 * 
 * Tests page-owned slot cleanup, reserved slot persistence, and context cleanup
 * during page transitions. Per AD#18: palette persists, page-specific keys clear.
 */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

describe('pageTransitionCleanup', () => {
  let lifecycleManager;
  let mockContextProvider;
  let mockComponentRegistry;
  let mockDependencyTracker;
  let mockEventBus;
  let mockLayoutInstance;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockContextProvider = {
      set: sinon.stub(),
      get: sinon.stub(),
      on: sinon.stub(),
      off: sinon.stub(),
    };

    mockComponentRegistry = {
      resolve: sinon.stub(),
      update: sinon.stub(),
    };

    mockDependencyTracker = {
      preload: sinon.stub().resolves(),
    };

    mockEventBus = {
      emit: sinon.stub(),
      on: sinon.stub(),
      off: sinon.stub(),
    };

    mockLayoutInstance = {
      type: 'test-layout',
      root: document.createElement('div'),
      hasSlot: sinon.stub().callsFake((name) => ['content', 'sidebar', 'toolbar'].includes(name)),
      getSlot: sinon.stub().callsFake((name) => {
        if (['content', 'sidebar', 'toolbar'].includes(name)) {
          const slot = document.createElement('div');
          slot.dataset.slot = name;
          return slot;
        }
        return null;
      }),
      getSlotNames: sinon.stub().returns(['content', 'sidebar', 'toolbar']),
      clearSlot: sinon.stub(),
      destroy: sinon.stub(),
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
    sinon.restore();
  });

  describe('E3 Test 4: page-owned slots clear on navigate-away', () => {
    it('should clear page-owned slots when navigating to a new page', async () => {
      const { createLifecycleManager } = await import('../../../../../express/code/scripts/color-shared/shell/lifecycleManager.js');
      
      lifecycleManager = createLifecycleManager({
        contextProvider: mockContextProvider,
        componentRegistry: mockComponentRegistry,
        dependencyTracker: mockDependencyTracker,
        eventBus: mockEventBus,
        isDev: false,
      });

      const page1 = {
        id: 'page1',
        requiredSlots: ['content', 'sidebar'],
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      const page2 = {
        id: 'page2',
        requiredSlots: ['content'],
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      const config = {
        layoutAdapter: {
          type: 'test-layout',
          mount: () => mockLayoutInstance,
        },
        page: page1,
      };

      await lifecycleManager.start(container, config);

      mockLayoutInstance.clearSlot.resetHistory();

      await lifecycleManager.navigate(page2);

      expect(mockLayoutInstance.clearSlot.calledWith('content')).to.be.true;
      expect(mockLayoutInstance.clearSlot.calledWith('sidebar')).to.be.true;
    });

    it('should only clear slots owned by the outgoing page', async () => {
      const { createLifecycleManager } = await import('../../../../../express/code/scripts/color-shared/shell/lifecycleManager.js');
      
      lifecycleManager = createLifecycleManager({
        contextProvider: mockContextProvider,
        componentRegistry: mockComponentRegistry,
        dependencyTracker: mockDependencyTracker,
        eventBus: mockEventBus,
        isDev: false,
      });

      const page1 = {
        id: 'page1',
        requiredSlots: ['content'],
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      const page2 = {
        id: 'page2',
        requiredSlots: ['content', 'sidebar'],
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      const config = {
        layoutAdapter: {
          type: 'test-layout',
          mount: () => mockLayoutInstance,
        },
        page: page1,
      };

      await lifecycleManager.start(container, config);

      mockLayoutInstance.clearSlot.resetHistory();

      await lifecycleManager.navigate(page2);

      expect(mockLayoutInstance.clearSlot.calledWith('content')).to.be.true;
      expect(mockLayoutInstance.clearSlot.calledWith('sidebar')).to.be.false;
    });
  });

  describe('E3 Test 5: reserved shared slots persist', () => {
    it('should not clear reserved shared component slots during navigation', async () => {
      const { createLifecycleManager } = await import('../../../../../express/code/scripts/color-shared/shell/lifecycleManager.js');
      
      lifecycleManager = createLifecycleManager({
        contextProvider: mockContextProvider,
        componentRegistry: mockComponentRegistry,
        dependencyTracker: mockDependencyTracker,
        eventBus: mockEventBus,
        isDev: false,
      });

      const page1 = {
        id: 'page1',
        requiredSlots: ['content'],
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      const page2 = {
        id: 'page2',
        requiredSlots: ['content'],
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      const config = {
        layoutAdapter: {
          type: 'test-layout',
          mount: () => mockLayoutInstance,
        },
        sharedComponents: [
          { slotName: 'toolbar', type: 'floatingToolbar', options: {} },
        ],
        reservedSlots: ['toolbar'],
        page: page1,
      };

      await lifecycleManager.start(container, config);

      mockLayoutInstance.clearSlot.resetHistory();

      await lifecycleManager.navigate(page2);

      expect(mockLayoutInstance.clearSlot.calledWith('toolbar')).to.be.false;
      expect(mockLayoutInstance.clearSlot.calledWith('content')).to.be.true;
    });
  });

  describe('E3 Test 6: page destroy() runs before slot cleanup', () => {
    it('should call page destroy before clearing slots', async () => {
      const { createLifecycleManager } = await import('../../../../../express/code/scripts/color-shared/shell/lifecycleManager.js');
      
      lifecycleManager = createLifecycleManager({
        contextProvider: mockContextProvider,
        componentRegistry: mockComponentRegistry,
        dependencyTracker: mockDependencyTracker,
        eventBus: mockEventBus,
        isDev: false,
      });

      const callOrder = [];

      const page1 = {
        id: 'page1',
        requiredSlots: ['content'],
        mount: sinon.stub().resolves(),
        destroy: sinon.stub().callsFake(() => {
          callOrder.push('page-destroy');
        }),
      };

      const page2 = {
        id: 'page2',
        requiredSlots: ['content'],
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      mockLayoutInstance.clearSlot.callsFake(() => {
        callOrder.push('slot-clear');
      });

      const config = {
        layoutAdapter: {
          type: 'test-layout',
          mount: () => mockLayoutInstance,
        },
        page: page1,
      };

      await lifecycleManager.start(container, config);
      await lifecycleManager.navigate(page2);

      expect(callOrder[0]).to.equal('page-destroy');
      expect(callOrder[1]).to.equal('slot-clear');
    });
  });

  describe('E3 Test 7: palette context persists across page transitions (AD#18)', () => {
    it('should preserve palette context when navigating between pages', async () => {
      const { createLifecycleManager } = await import('../../../../../express/code/scripts/color-shared/shell/lifecycleManager.js');
      
      const contextStore = {};
      mockContextProvider.get.callsFake((key) => contextStore[key]);
      mockContextProvider.set.callsFake((key, value) => {
        contextStore[key] = value;
      });

      lifecycleManager = createLifecycleManager({
        contextProvider: mockContextProvider,
        componentRegistry: mockComponentRegistry,
        dependencyTracker: mockDependencyTracker,
        eventBus: mockEventBus,
        isDev: false,
      });

      const page1 = {
        id: 'page1',
        requiredSlots: ['content'],
        context: {
          palette: { colors: ['#FF0000', '#00FF00'], name: 'Test Palette' },
        },
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      const page2 = {
        id: 'page2',
        requiredSlots: ['content'],
        context: {
          palette: { colors: ['#0000FF'], name: 'Page 2 Palette' },
        },
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      const config = {
        layoutAdapter: {
          type: 'test-layout',
          mount: () => mockLayoutInstance,
        },
        page: page1,
      };

      await lifecycleManager.start(container, config);

      const paletteAfterPage1 = mockContextProvider.get('palette');
      expect(paletteAfterPage1).to.deep.equal({ colors: ['#FF0000', '#00FF00'], name: 'Test Palette' });

      await lifecycleManager.navigate(page2);

      const paletteAfterPage2 = mockContextProvider.get('palette');
      expect(paletteAfterPage2).to.deep.equal({ colors: ['#0000FF'], name: 'Page 2 Palette' });
    });
  });

  describe('E3 Test 8: page-specific context keys cleared on navigate-away', () => {
    it('should clear page-specific context keys when navigating away', async () => {
      const { createLifecycleManager } = await import('../../../../../express/code/scripts/color-shared/shell/lifecycleManager.js');
      
      const contextStore = {};
      const deletedKeys = [];
      
      mockContextProvider.get.callsFake((key) => contextStore[key]);
      mockContextProvider.set.callsFake((key, value) => {
        if (value === undefined) {
          deletedKeys.push(key);
          delete contextStore[key];
        } else {
          contextStore[key] = value;
        }
      });

      lifecycleManager = createLifecycleManager({
        contextProvider: mockContextProvider,
        componentRegistry: mockComponentRegistry,
        dependencyTracker: mockDependencyTracker,
        eventBus: mockEventBus,
        isDev: false,
      });

      const page1 = {
        id: 'page1',
        requiredSlots: ['content'],
        context: {
          palette: { colors: ['#FF0000'], name: 'Test' },
          'wheel:harmony': 'complementary',
          'wheel:baseColor': '#FF0000',
        },
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      const page2 = {
        id: 'page2',
        requiredSlots: ['content'],
        context: {
          contrastRatio: 4.5,
        },
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      const config = {
        layoutAdapter: {
          type: 'test-layout',
          mount: () => mockLayoutInstance,
        },
        page: page1,
      };

      await lifecycleManager.start(container, config);

      expect(contextStore['wheel:harmony']).to.equal('complementary');
      expect(contextStore['wheel:baseColor']).to.equal('#FF0000');

      await lifecycleManager.navigate(page2);

      expect(deletedKeys).to.include('wheel:harmony');
      expect(deletedKeys).to.include('wheel:baseColor');
      expect(contextStore['wheel:harmony']).to.be.undefined;
      expect(contextStore['wheel:baseColor']).to.be.undefined;
      expect(contextStore.palette).to.exist;
    });
  });

  describe('E3 Test 9: incoming page context defaults applied after outgoing cleanup', () => {
    it('should apply incoming page context after clearing outgoing page context', async () => {
      const { createLifecycleManager } = await import('../../../../../express/code/scripts/color-shared/shell/lifecycleManager.js');
      
      const contextStore = {};
      const setOrder = [];
      
      mockContextProvider.get.callsFake((key) => contextStore[key]);
      mockContextProvider.set.callsFake((key, value) => {
        setOrder.push({ key, value });
        if (value === undefined) {
          delete contextStore[key];
        } else {
          contextStore[key] = value;
        }
      });

      lifecycleManager = createLifecycleManager({
        contextProvider: mockContextProvider,
        componentRegistry: mockComponentRegistry,
        dependencyTracker: mockDependencyTracker,
        eventBus: mockEventBus,
        isDev: false,
      });

      const page1 = {
        id: 'page1',
        requiredSlots: ['content'],
        context: {
          'wheel:harmony': 'complementary',
        },
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      const page2 = {
        id: 'page2',
        requiredSlots: ['content'],
        context: {
          contrastRatio: 4.5,
          simulationType: 'protanopia',
        },
        mount: sinon.stub().resolves(),
        destroy: sinon.stub(),
      };

      const config = {
        layoutAdapter: {
          type: 'test-layout',
          mount: () => mockLayoutInstance,
        },
        page: page1,
      };

      await lifecycleManager.start(container, config);
      setOrder.length = 0;

      await lifecycleManager.navigate(page2);

      const clearIndex = setOrder.findIndex(op => op.key === 'wheel:harmony' && op.value === undefined);
      const setIndex = setOrder.findIndex(op => op.key === 'contrastRatio');

      expect(clearIndex).to.be.greaterThan(-1);
      expect(setIndex).to.be.greaterThan(-1);
      expect(clearIndex).to.be.lessThan(setIndex);

      expect(contextStore.contrastRatio).to.equal(4.5);
      expect(contextStore.simulationType).to.equal('protanopia');
      expect(contextStore['wheel:harmony']).to.be.undefined;
    });
  });
});
