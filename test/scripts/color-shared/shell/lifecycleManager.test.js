import { expect } from '@esm-bundle/chai';
import createLifecycleManager from '../../../../express/code/scripts/color-shared/shell/lifecycleManager.js';

describe('lifecycleManager', () => {
  let container;
  let layoutAdapter;
  let layoutInstance;
  let targetConfig;
  let contextProvider;
  let componentRegistry;
  let dependencyTracker;
  let eventBus;
  let lifecycleManager;
  let events;

  beforeEach(() => {
    // Setup container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock layout instance
    layoutInstance = {
      type: 'test-layout',
      root: document.createElement('div'),
      hasSlot: (name) => ['shared-slot', 'page-slot'].includes(name),
      getSlot: (name) => {
        if (!layoutInstance.hasSlot(name)) return null;
        const slot = document.createElement('div');
        slot.dataset.slotName = name;
        return slot;
      },
      getSlotNames: () => ['shared-slot', 'page-slot'],
      clearSlot: (name) => {
        const slot = layoutInstance.getSlot(name);
        if (slot) slot.innerHTML = '';
      },
      destroy: () => {
        layoutInstance.root.remove();
      },
    };

    // Mock layout adapter
    layoutAdapter = {
      type: 'test-layout',
      mount: (containerEl, config) => {
        containerEl.appendChild(layoutInstance.root);
        return layoutInstance;
      },
    };

    // Mock context provider
    contextProvider = {
      set: (key, value) => {},
      get: (key) => null,
      on: (key, cb) => {},
      off: (key, cb) => {},
    };

    // Mock component registry
    const mockComponents = new Map();
    componentRegistry = {
      resolve: (type, options) => {
        const component = {
          type,
          element: document.createElement('div'),
          init: async (slotEl, initOptions, contextAPI) => {
            component.element.textContent = `${type} component`;
            slotEl.appendChild(component.element);
          },
          update: (newOptions) => {},
          destroy: () => {
            component.element.remove();
          },
        };
        mockComponents.set(type, component);
        return component;
      },
      update: (slotName, options) => {},
    };

    // Mock dependency tracker
    dependencyTracker = {
      preload: async (config) => {
        if (config.shouldFail) {
          throw new Error('Dependency preload failed');
        }
      },
    };

    // Mock event bus
    events = [];
    eventBus = {
      on: (event, cb) => {},
      emit: (event, detail) => {
        events.push({ event, detail });
      },
    };

    // Target config with shared components and page
    targetConfig = {
      layoutAdapter,
      sharedComponents: [
        { slotName: 'shared-slot', type: 'toolbar', options: {} },
      ],
      dependencies: {
        css: ['shared.css'],
        services: ['spectrum'],
      },
      page: {
        id: 'test-page',
        requiredSlots: ['page-slot'],
        dependencies: {
          css: ['page.css'],
        },
        mount: async (contextAPI) => {
          const pageEl = document.createElement('div');
          pageEl.textContent = 'Page content';
          const slot = contextAPI.getSlot('page-slot');
          if (slot) slot.appendChild(pageEl);
        },
        destroy: () => {},
      },
    };

    lifecycleManager = createLifecycleManager({
      contextProvider,
      componentRegistry,
      dependencyTracker,
      eventBus,
    });
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('start()', () => {
    it('mounts layout before shared components and pages', async () => {
      const mountOrder = [];

      // Override layout adapter to track mount
      layoutAdapter.mount = (containerEl, config) => {
        mountOrder.push('layout');
        containerEl.appendChild(layoutInstance.root);
        return layoutInstance;
      };

      // Override component registry to track init
      const originalResolve = componentRegistry.resolve;
      componentRegistry.resolve = (type, options) => {
        const component = originalResolve(type, options);
        const originalInit = component.init;
        component.init = async (slotEl, initOptions, contextAPI) => {
          mountOrder.push(`shared-component:${type}`);
          return originalInit.call(component, slotEl, initOptions, contextAPI);
        };
        return component;
      };

      // Override page mount to track
      const originalPageMount = targetConfig.page.mount;
      targetConfig.page.mount = async (contextAPI) => {
        mountOrder.push('page');
        return originalPageMount(contextAPI);
      };

      await lifecycleManager.start(container, targetConfig);

      expect(mountOrder[0]).to.equal('layout');
      expect(mountOrder[1]).to.equal('shared-component:toolbar');
      expect(mountOrder[2]).to.equal('page');
    });

    it('dependencies preload before page activation', async () => {
      const loadOrder = [];

      // Track dependency loading
      dependencyTracker.preload = async (config) => {
        if (config.css?.includes('shared.css')) {
          loadOrder.push('shared-deps');
        }
        if (config.css?.includes('page.css')) {
          loadOrder.push('page-deps');
        }
      };

      // Track page mount
      const originalPageMount = targetConfig.page.mount;
      targetConfig.page.mount = async (contextAPI) => {
        loadOrder.push('page-mount');
        return originalPageMount(contextAPI);
      };

      await lifecycleManager.start(container, targetConfig);

      const sharedDepsIndex = loadOrder.indexOf('shared-deps');
      const pageDepsIndex = loadOrder.indexOf('page-deps');
      const pageMountIndex = loadOrder.indexOf('page-mount');

      expect(sharedDepsIndex).to.be.lessThan(pageMountIndex);
      expect(pageDepsIndex).to.be.lessThan(pageMountIndex);
    });

    it('double start() throws', async () => {
      await lifecycleManager.start(container, targetConfig);

      let error;
      try {
        await lifecycleManager.start(container, targetConfig);
      } catch (e) {
        error = e;
      }

      expect(error).to.exist;
      expect(error.message).to.include('already started');
    });

    it('lifecycle events emitted in order', async () => {
      await lifecycleManager.start(container, targetConfig);

      const eventNames = events.map((e) => e.event);
      
      expect(eventNames).to.include('lifecycle:layout-mounted');
      expect(eventNames).to.include('lifecycle:shared-components-mounted');
      expect(eventNames).to.include('lifecycle:page-mounted');
      expect(eventNames).to.include('lifecycle:started');

      const layoutIndex = eventNames.indexOf('lifecycle:layout-mounted');
      const sharedIndex = eventNames.indexOf('lifecycle:shared-components-mounted');
      const pageIndex = eventNames.indexOf('lifecycle:page-mounted');
      const startedIndex = eventNames.indexOf('lifecycle:started');

      expect(layoutIndex).to.be.lessThan(sharedIndex);
      expect(sharedIndex).to.be.lessThan(pageIndex);
      expect(pageIndex).to.be.lessThan(startedIndex);
    });

    it('page module load failure shows error state with retry', async () => {
      const failingConfig = {
        ...targetConfig,
        page: {
          ...targetConfig.page,
          mount: async () => {
            throw new Error('Page module load failed');
          },
        },
      };

      // In production mode (graceful error handling)
      const prodLifecycle = createLifecycleManager({
        contextProvider,
        componentRegistry,
        dependencyTracker,
        eventBus,
        isDev: false,
      });

      await prodLifecycle.start(container, failingConfig);

      // Should emit error event
      const errorEvent = events.find((e) => e.event === 'lifecycle:error');
      expect(errorEvent).to.exist;
      expect(errorEvent.detail.type).to.equal('page-load');

      // Should have retry capability
      const state = prodLifecycle.getState();
      expect(state.error).to.exist;
      expect(state.canRetry).to.be.true;
    });

    it('dependency preload failure blocks page mount, shows error state', async () => {
      const failingConfig = {
        ...targetConfig,
        dependencies: {
          ...targetConfig.dependencies,
          shouldFail: true,
        },
      };

      // In production mode
      const prodLifecycle = createLifecycleManager({
        contextProvider,
        componentRegistry,
        dependencyTracker,
        eventBus,
        isDev: false,
      });

      await prodLifecycle.start(container, failingConfig);

      // Should emit error event
      const errorEvent = events.find((e) => e.event === 'lifecycle:error');
      expect(errorEvent).to.exist;
      expect(errorEvent.detail.type).to.equal('dependency-load');

      // Page should not be mounted
      const pageMountEvent = events.find((e) => e.event === 'lifecycle:page-mounted');
      expect(pageMountEvent).to.not.exist;

      // Should have error state
      const state = prodLifecycle.getState();
      expect(state.error).to.exist;
    });

    it('shared component init() failure logs but does not block page mount', async () => {
      const logs = [];
      const originalLana = window.lana;
      window.lana = {
        log: (message, options) => {
          logs.push({ message, options });
        },
      };

      // Make component init fail
      const originalResolve = componentRegistry.resolve;
      componentRegistry.resolve = (type, options) => {
        const component = originalResolve(type, options);
        component.init = async () => {
          throw new Error('Component init failed');
        };
        return component;
      };

      // In production mode
      const prodLifecycle = createLifecycleManager({
        contextProvider,
        componentRegistry,
        dependencyTracker,
        eventBus,
        isDev: false,
      });

      await prodLifecycle.start(container, targetConfig);

      // Should log error
      expect(logs.length).to.be.greaterThan(0);
      const componentError = logs.find((log) => log.message.includes('Component init failed'));
      expect(componentError).to.exist;

      // Page should still mount
      const pageMountEvent = events.find((e) => e.event === 'lifecycle:page-mounted');
      expect(pageMountEvent).to.exist;

      window.lana = originalLana;
    });
  });

  describe('navigate()', () => {
    it('orchestrates page transition with proper teardown and setup', async () => {
      await lifecycleManager.start(container, targetConfig);

      const transitionOrder = [];

      const newPage = {
        id: 'new-page',
        requiredSlots: ['page-slot'],
        dependencies: { css: ['new-page.css'] },
        mount: async (contextAPI) => {
          transitionOrder.push('new-page-mount');
          const pageEl = document.createElement('div');
          pageEl.textContent = 'New page content';
          const slot = contextAPI.getSlot('page-slot');
          if (slot) slot.appendChild(pageEl);
        },
        destroy: () => {
          transitionOrder.push('new-page-destroy');
        },
      };

      // Override old page destroy to track
      const originalDestroy = targetConfig.page.destroy;
      targetConfig.page.destroy = () => {
        transitionOrder.push('old-page-destroy');
        originalDestroy();
      };

      await lifecycleManager.navigate(newPage);

      expect(transitionOrder[0]).to.equal('old-page-destroy');
      expect(transitionOrder[1]).to.equal('new-page-mount');
    });
  });

  describe('destroy()', () => {
    it('tears down page, shared components, then layout instance', async () => {
      await lifecycleManager.start(container, targetConfig);

      const destroyOrder = [];

      // Track page destroy
      const originalPageDestroy = targetConfig.page.destroy;
      targetConfig.page.destroy = () => {
        destroyOrder.push('page');
        originalPageDestroy();
      };

      // Track component destroy
      const originalResolve = componentRegistry.resolve;
      componentRegistry.resolve = (type, options) => {
        const component = originalResolve(type, options);
        const originalDestroy = component.destroy;
        component.destroy = () => {
          destroyOrder.push(`shared-component:${type}`);
          originalDestroy.call(component);
        };
        return component;
      };

      // Track layout destroy
      const originalLayoutDestroy = layoutInstance.destroy;
      layoutInstance.destroy = () => {
        destroyOrder.push('layout');
        originalLayoutDestroy.call(layoutInstance);
      };

      // Need to restart to capture the wrapped methods
      lifecycleManager = createLifecycleManager({
        contextProvider,
        componentRegistry,
        dependencyTracker,
        eventBus,
      });
      await lifecycleManager.start(container, targetConfig);

      lifecycleManager.destroy();

      expect(destroyOrder[0]).to.equal('page');
      expect(destroyOrder[1]).to.equal('shared-component:toolbar');
      expect(destroyOrder[2]).to.equal('layout');
    });
  });
});
