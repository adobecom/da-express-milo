/**
 * Shell Facade - Public API for the Shell Framework
 * 
 * Responsibilities:
 * - Store target configuration (layout adapter, container, components)
 * - Expose lifecycle methods: preload, start, navigate, destroy
 * - Expose routing methods: route, page
 * - Delegate slot operations to active layout instance (getSlot, hasSlot, inject, clearSlot)
 * - Throw helpful errors when slot methods are called before layout mount
 * 
 * Depends on:
 * - contextProvider (A1): Context storage and subscriptions
 * - componentRegistry (A3): Component registration and resolution
 * - Layout harness (B2): Layout instance wrapper
 */

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

    const { layoutAdapter, container } = targetConfig;

    // Mount layout adapter
    layoutInstance = layoutAdapter.mount(container, targetConfig);
    isStarted = true;
  }

  /**
   * Navigate to a different page/route
   * @param {string} destination - Route or page name
   * @param {Object} options - Navigation options
   * @returns {Promise<void>}
   */
  async function navigate(destination, options = {}) {
    // Placeholder for navigation logic
    // Will be implemented when router and lifecycle manager are integrated
    return Promise.resolve();
  }

  /**
   * Destroy the shell and cleanup
   */
  function destroy() {
    if (layoutInstance && layoutInstance.destroy) {
      layoutInstance.destroy();
    }
    layoutInstance = null;
    isStarted = false;
    routes.clear();
    pages.clear();
    targetConfig = null;
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
   */
  function clearSlot(slotName) {
    ensureLayoutMounted();
    layoutInstance.clearSlot(slotName);
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
  };
}
