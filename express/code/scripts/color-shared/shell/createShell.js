import { wrapLayoutWithReservedSlots } from './target/reservedSlotEnforcement.js';
import createContextProvider from './contextProvider.js';
import createComponentRegistry from './componentRegistry.js';
import { createDependencyTracker } from './dependencyTracker.js';
import createFocusManagement from './focusManagement.js';
import { createKeyboardNavigation } from './keyboard.js';

/**
 * Create a shell instance
 * @returns {Object} Shell API
 */
export default function createShell() {
  let targetConfig = null;
  let layoutInstance = null;
  let isStarted = false;
  const routes = new Map();
  const pages = new Map();

  const contextProvider = createContextProvider();
  const componentRegistry = createComponentRegistry();
  const dependencyTracker = createDependencyTracker();
  const focusManagement = createFocusManagement({
    getLayoutInstance: () => layoutInstance,
  });
  const keyboardNavigation = createKeyboardNavigation();

  let mountedSharedComponents = [];
  let currentPage = null;

  /**
   * Ensure layout is mounted before slot operations
   * @throws {Error} If layout is not mounted
   */
  function ensureLayoutMounted() {
    if (!layoutInstance) {
      throw new Error(
        'Layout not mounted. Call shell.start() before accessing slot methods (getSlot, hasSlot, inject, clearSlot).',
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
    return Promise.resolve();
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
   * @param {Object} clearOptions - Clear options
   */
  function clearSlot(slotName, clearOptions) {
    ensureLayoutMounted();
    layoutInstance.clearSlot(slotName, clearOptions);
  }

  /**
   * Mount shared components into their designated slots
   * @param {Object} components - Component mappings { slotName: { type, options } }
   * @returns {Promise<void>}
   */
  async function mountSharedComponents(components) {
    const getSlotFn = (name) => layoutInstance.getSlot(name);

    for (const [slotName, config] of Object.entries(components)) {
      try {
        const { type, options = {} } = config;
        const component = componentRegistry.resolve(type, options);
        const slot = layoutInstance.getSlot(slotName);

        if (!slot) {
          // eslint-disable-next-line no-console
          console.warn(`[Shell] Shared component "${type}" requires slot "${slotName}" but layout does not provide it`);
        } else {
          const contextAPI = {
            slotName,
            getSlot: getSlotFn,
            keyboard: {
              enableToolbarNavigation: keyboardNavigation.enableToolbarNavigation,
              onEscape: keyboardNavigation.onEscape,
            },
            ...contextProvider,
          };

          await component.init(slot, options, contextAPI);

          if (component.element && !slot.contains(component.element)) {
            component.element.dataset.sharedComponent = 'true';
            slot.appendChild(component.element);
          }

          mountedSharedComponents.push({ slotName, type, component });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[Shell] Failed to mount shared component:', error);
      }
    }
  }

  /**
   * Unmount current page
   * @param {Object} pageConfig - Page configuration
   */
  async function unmountPage(pageConfig) {
    if (!pageConfig) return;

    try {
      if (pageConfig.destroy) {
        const shellAPI = {
          getSlot: (name) => layoutInstance.getSlot(name),
          hasSlot: (name) => layoutInstance.hasSlot(name),
          ...contextProvider,
        };
        pageConfig.destroy(shellAPI);
      }

      if (pageConfig.requiredSlots) {
        const reservedSlots = targetConfig?.reservedSlots || [];
        for (const slotName of pageConfig.requiredSlots) {
          if (!reservedSlots.includes(slotName)) {
            clearSlot(slotName);
          }
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Shell] Page unmount failed:', error);
    }
  }

  /**
   * Mount a page
   * @param {Object} pageConfig - Page configuration
   * @param {string} pageName - Name/identifier of the page
   * @returns {Promise<void>}
   */
  async function mountPage(pageConfig, pageName) {
    if (pageConfig.requiredSlots) {
      for (const slotName of pageConfig.requiredSlots) {
        if (!layoutInstance.hasSlot(slotName)) {
          throw new Error(`Page requires slot "${slotName}" but layout does not provide it`);
        }
      }
    }

    if (pageConfig.context) {
      for (const [key, value] of Object.entries(pageConfig.context)) {
        contextProvider.set(key, value);
      }
    }

    const shellAPI = {
      getSlot: (name) => layoutInstance.getSlot(name),
      hasSlot: (name) => layoutInstance.hasSlot(name),
      inject: (name, content) => inject(name, content),
      clearSlot: (name) => clearSlot(name),
      keyboard: {
        enableToolbarNavigation: keyboardNavigation.enableToolbarNavigation,
        onEscape: keyboardNavigation.onEscape,
      },
      ...contextProvider,
    };

    if (pageConfig.mount) {
      await pageConfig.mount(shellAPI);
    }

    focusManagement.handleNavigation(pageName, pageConfig, shellAPI);
  }

  /**
   * Navigate to a different page/route
   * @param {string} destination - Route or page name
   * @param {Object} options - Navigation options
   * @returns {Promise<void>}
   */
  async function navigate(destination) {
    if (!isStarted) {
      throw new Error('Shell not started. Call shell.start() before navigating.');
    }

    const pageConfig = pages.get(destination);
    if (!pageConfig) {
      throw new Error(`Page "${destination}" not found. Register it with shell.page() first.`);
    }

    focusManagement.saveFocus();

    if (currentPage) {
      await unmountPage(currentPage);
    }

    await mountPage(pageConfig, destination);
    currentPage = pageConfig;
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

    layoutInstance = layoutAdapter.mount(container, targetConfig);

    if (reservedSlots.length > 0) {
      wrapLayoutWithReservedSlots(layoutInstance, reservedSlots);
    }

    await mountSharedComponents(components);

    isStarted = true;
  }

  /**
   * Destroy the shell and cleanup
   */
  function destroy() {
    if (!isStarted) {
      return;
    }

    try {
      if (currentPage) {
        unmountPage(currentPage);
        currentPage = null;
      }

      for (const { component } of mountedSharedComponents) {
        try {
          if (component.destroy) {
            component.destroy();
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[Shell] Shared component destroy failed:', error);
        }
      }
      mountedSharedComponents = [];

      if (keyboardNavigation && keyboardNavigation.destroy) {
        keyboardNavigation.destroy();
      }

      if (layoutInstance && layoutInstance.destroy) {
        layoutInstance.destroy();
      }
      layoutInstance = null;

      isStarted = false;
      routes.clear();
      pages.clear();
      targetConfig = null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Shell] Destroy failed:', error);
    }
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
    preload,
    start,
    navigate,
    destroy,
    target,
    route,
    page,
    getSlot,
    hasSlot,
    inject,
    clearSlot,
    hasSharedComponent,
    isSlotReserved,
    _internal: {
      contextProvider,
      componentRegistry,
      dependencyTracker,
    },
  };
}
