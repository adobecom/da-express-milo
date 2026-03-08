/**
 * Shell Facade - Public API for the Shell Framework
 * 
 * Responsibilities:
 * - Store target configuration (layout adapter, container, components)
 * - Expose lifecycle methods: preload, start, navigate, destroy
 * - Expose routing methods: route, page
 * - Delegate slot operations to active layout instance (getSlot, hasSlot, inject, clearSlot)
 * - Throw helpful errors when slot methods are called before layout mount
 * - Enforce reserved slot ownership (D3)
 * 
 * Depends on:
 * - contextProvider (A1): Context storage and subscriptions
 * - componentRegistry (A3): Component registration and resolution
 * - Layout harness (B2): Layout instance wrapper
 * - reservedSlotEnforcement (D3): Reserved slot protection
 */

import { wrapLayoutWithReservedSlots } from './target/reservedSlotEnforcement.js';
import { createContextProvider } from './contextProvider.js';
import { createComponentRegistry } from './componentRegistry.js';
import { createDependencyTracker } from './dependencyTracker.js';

/**
 * Create a shell instance
 * @returns {Object} Shell API
 */
export function createShell() {
  let targetConfig = null;
  let layoutInstance = null;
  let isStarted = false;
  const routes = new Map();
  const pages = new Map();
  
  // Create internal dependencies
  const contextProvider = createContextProvider();
  const componentRegistry = createComponentRegistry();
  const dependencyTracker = createDependencyTracker();
  
  // Track mounted shared components and current page
  let mountedSharedComponents = [];
  let currentPage = null;

  /**
   * Ensure layout is mounted before slot operations
   * @throws {Error} If layout is not mounted
   */
  function ensureLayoutMounted() {
    if (!layoutInstance) {
      throw new Error(
        'Layout not mounted. Call shell.start() before accessing slot methods (getSlot, hasSlot, inject, clearSlot).'
      );
    }
  }

  /**
   * Configure the target (layout adapter, container, components)
   * @param {Object} config - Target configuration
   * @param {string} config.name - Target name
   * @param {Object} config.layoutAdapter - Layout adapter { type, mount }
   * @param {HTMLElement} config.container - Container element
   * @param {Object} config.components - Component mappings { slotName: { type, options } }
   */
  function target(config) {
    targetConfig = config;
  }

  /**
   * Register a route handler
   * @param {string} routeName - Route identifier
   * @param {Function} handler - Route handler function
   */
  function route(routeName, handler) {
    routes.set(routeName, handler);
  }

  /**
   * Register a page
   * @param {string} pageName - Page identifier
   * @param {Object} pageConfig - Page configuration
   */
  function page(pageName, pageConfig) {
    pages.set(pageName, pageConfig);
  }

  /**
   * Preload dependencies (CSS, scripts, etc.)
   * @returns {Promise<void>}
   */
  async function preload() {
    // Placeholder for dependency preloading
    // Will be implemented when dependency tracker is integrated
    return Promise.resolve();
  }

  /**
   * Start the shell - mount layout and initialize
   * @returns {Promise<void>}
   */
  async function start() {
    if (!targetConfig) {
      throw new Error('Target configuration not set. Call shell.target() before shell.start().');
    }

    if (isStarted) {
      return;
    }

    const { layoutAdapter, container, reservedSlots = [], components = {} } = targetConfig;

    // Mount layout adapter
    layoutInstance = layoutAdapter.mount(container, targetConfig);
    
    // Wrap layout instance with reserved slot enforcement
    if (reservedSlots.length > 0) {
      wrapLayoutWithReservedSlots(layoutInstance, reservedSlots);
    }
    
    // Mount shared components
    await mountSharedComponents(components);
    
    isStarted = true;
  }
  
  /**
   * Mount shared components into their designated slots
   * @param {Object} components - Component mappings { slotName: { type, options } }
   * @returns {Promise<void>}
   */
  async function mountSharedComponents(components) {
    for (const [slotName, config] of Object.entries(components)) {
      try {
        const { type, options = {} } = config;
        
        // Resolve component from registry
        const component = componentRegistry.resolve(type, options);
        
        // Get slot from layout
        const slot = layoutInstance.getSlot(slotName);
        if (!slot) {
          console.warn(`[Shell] Shared component "${type}" requires slot "${slotName}" but layout does not provide it`);
          continue;
        }
        
        // Create context API for component
        const contextAPI = {
          slotName,
          getSlot: (name) => layoutInstance.getSlot(name),
          ...contextProvider,
        };
        
        // Initialize component
        await component.init(slot, options, contextAPI);
        
        // Append component element to slot if not already there
        if (component.element && !slot.contains(component.element)) {
          component.element.dataset.sharedComponent = 'true';
          slot.appendChild(component.element);
        }
        
        mountedSharedComponents.push({ slotName, type, component });
      } catch (error) {
        console.error(`[Shell] Failed to mount shared component:`, error);
      }
    }
  }

  /**
   * Navigate to a different page/route
   * @param {string} destination - Route or page name
   * @param {Object} options - Navigation options
   * @returns {Promise<void>}
   */
  async function navigate(destination, options = {}) {
    if (!isStarted) {
      throw new Error('Shell not started. Call shell.start() before navigating.');
    }
    
    const page = pages.get(destination);
    if (!page) {
      throw new Error(`Page "${destination}" not found. Register it with shell.page() first.`);
    }
    
    // Unmount current page if exists
    if (currentPage) {
      await unmountPage(currentPage);
    }
    
    // Mount new page
    await mountPage(page);
    currentPage = page;
  }
  
  /**
   * Mount a page
   * @param {Object} page - Page configuration
   * @returns {Promise<void>}
   */
  async function mountPage(page) {
    // Validate required slots
    if (page.requiredSlots) {
      for (const slotName of page.requiredSlots) {
        if (!layoutInstance.hasSlot(slotName)) {
          throw new Error(`Page requires slot "${slotName}" but layout does not provide it`);
        }
      }
    }
    
    // Set page context if provided
    if (page.context) {
      for (const [key, value] of Object.entries(page.context)) {
        contextProvider.set(key, value);
      }
    }
    
    // Create shell API for page
    const shellAPI = {
      getSlot: (name) => layoutInstance.getSlot(name),
      hasSlot: (name) => layoutInstance.hasSlot(name),
      inject: (name, content) => inject(name, content),
      clearSlot: (name) => clearSlot(name),
      ...contextProvider,
    };
    
    // Mount page content
    if (page.mount) {
      await page.mount(shellAPI);
    }
  }
  
  /**
   * Unmount current page
   * @param {Object} page - Page configuration
   */
  async function unmountPage(page) {
    if (!page) return;
    
    try {
      // 1. Call page destroy hook BEFORE slot cleanup
      if (page.destroy) {
        const shellAPI = {
          getSlot: (name) => layoutInstance.getSlot(name),
          hasSlot: (name) => layoutInstance.hasSlot(name),
          ...contextProvider,
        };
        page.destroy(shellAPI);
      }
      
      // 2. Clear page-owned slots (skip reserved shared slots)
      if (page.requiredSlots) {
        const reservedSlots = targetConfig?.reservedSlots || [];
        for (const slotName of page.requiredSlots) {
          if (!reservedSlots.includes(slotName)) {
            clearSlot(slotName);
          }
        }
      }
    } catch (error) {
      console.error('[Shell] Page unmount failed:', error);
    }
  }

  /**
   * Destroy the shell and cleanup
   */
  function destroy() {
    if (!isStarted) {
      return;
    }
    
    try {
      // 1. Unmount current page
      if (currentPage) {
        unmountPage(currentPage);
        currentPage = null;
      }
      
      // 2. Destroy shared components
      for (const { component } of mountedSharedComponents) {
        try {
          if (component.destroy) {
            component.destroy();
          }
        } catch (error) {
          console.error('[Shell] Shared component destroy failed:', error);
        }
      }
      mountedSharedComponents = [];
      
      // 3. Destroy layout instance
      if (layoutInstance && layoutInstance.destroy) {
        layoutInstance.destroy();
      }
      layoutInstance = null;
      
      // Reset state
      isStarted = false;
      routes.clear();
      pages.clear();
      targetConfig = null;
    } catch (error) {
      console.error('[Shell] Destroy failed:', error);
    }
  }

  /**
   * Get a slot element from the active layout
   * @param {string} slotName - Slot name
   * @returns {HTMLElement|null} Slot element or null
   */
  function getSlot(slotName) {
    ensureLayoutMounted();
    return layoutInstance.getSlot(slotName);
  }

  /**
   * Check if a slot exists in the active layout
   * @param {string} slotName - Slot name
   * @returns {boolean} True if slot exists
   */
  function hasSlot(slotName) {
    ensureLayoutMounted();
    return layoutInstance.hasSlot(slotName);
  }

  /**
   * Inject content into a slot
   * @param {string} slotName - Slot name
   * @param {HTMLElement} content - Content to inject
   */
  function inject(slotName, content) {
    ensureLayoutMounted();
    const slot = layoutInstance.getSlot(slotName);
    if (slot) {
      slot.appendChild(content);
    }
  }

  /**
   * Clear a slot (remove page-owned content, preserve shell-owned)
   * @param {string} slotName - Slot name
   * @param {Object} options - Clear options
   */
  function clearSlot(slotName, options) {
    ensureLayoutMounted();
    layoutInstance.clearSlot(slotName, options);
  }

  /**
   * Check if a slot has shared components mounted
   * @param {string} slotName - Slot name
   * @returns {boolean} True if slot has shared components
   */
  function hasSharedComponent(slotName) {
    ensureLayoutMounted();
    const slot = layoutInstance.getSlot(slotName);
    if (!slot) return false;
    return slot.querySelector('[data-shared-component]') !== null;
  }

  /**
   * Check if a slot is reserved
   * @param {string} slotName - Slot name
   * @returns {boolean} True if slot is reserved
   */
  function isSlotReserved(slotName) {
    if (!targetConfig) return false;
    const { reservedSlots = [] } = targetConfig;
    return reservedSlots.includes(slotName);
  }

  return {
    // Lifecycle methods
    preload,
    start,
    navigate,
    destroy,

    // Configuration methods
    target,
    route,
    page,

    // Slot operations (delegated to layout instance)
    getSlot,
    hasSlot,
    inject,
    clearSlot,
    
    // Reserved slot helpers (D3)
    hasSharedComponent,
    isSlotReserved,
    
    // Internal dependencies (for testing and advanced usage)
    _internal: {
      contextProvider,
      componentRegistry,
      dependencyTracker,
    },
  };
}
