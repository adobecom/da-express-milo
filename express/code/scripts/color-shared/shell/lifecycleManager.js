/**
 * Lifecycle Manager — Orchestrate start/navigate/destroy against layout + target config
 *
 * Responsibilities:
 * - Mount layout adapter before shared components and pages
 * - Preload dependencies before page activation
 * - Orchestrate page transitions (destroy old → mount new)
 * - Handle errors gracefully in prod, strictly in dev
 * - Emit lifecycle events via event bus
 *
 * Reuses:
 * - createLoadingStateManager state machine pattern
 * - createEventBus for lifecycle events
 *
 * Error handling:
 * - Dev mode: throw for slot/config errors
 * - Prod mode: error state + retry for page/dep failures, log-and-continue for component init
 */

/**
 * Create a lifecycle manager instance
 * @param {Object} deps - Dependencies
 * @param {Object} deps.contextProvider - Context provider instance
 * @param {Object} deps.componentRegistry - Component registry instance
 * @param {Object} deps.dependencyTracker - Dependency tracker instance
 * @param {Object} deps.eventBus - Event bus instance
 * @param {boolean} [deps.isDev=true] - Development mode flag
 * @returns {Object} Lifecycle manager API
 */
export function createLifecycleManager(deps) {
  const {
    contextProvider,
    componentRegistry,
    dependencyTracker,
    eventBus,
    isDev = true,
  } = deps;

  // State machine (inspired by createLoadingStateManager)
  const state = {
    started: false,
    layoutMounted: false,
    sharedComponentsMounted: false,
    pageMounted: false,
    error: null,
    canRetry: false,
  };

  // Track mounted instances
  let container = null;
  let layoutInstance = null;
  let targetConfig = null;
  let activePage = null;
  let mountedSharedComponents = [];
  let activePageContextKeys = [];

  /**
   * Emit a lifecycle event
   * @param {string} event - Event name
   * @param {Object} detail - Event detail
   */
  function emit(event, detail = {}) {
    eventBus.emit(`lifecycle:${event}`, detail);
  }

  /**
   * Handle error based on mode (dev vs prod)
   * @param {Error} error - Error to handle
   * @param {string} type - Error type
   * @param {boolean} canRetry - Whether error is retryable
   * @throws {Error} In dev mode
   */
  function handleError(error, type, canRetry = false) {
    if (isDev) {
      throw error;
    }
    state.error = { type, message: error.message, error };
    state.canRetry = canRetry;
    emit('error', state.error);
  }

  /**
   * Validate layout adapter contract
   * @param {Object} adapter - Layout adapter to validate
   * @throws {Error} If adapter contract is violated
   */
  function validateLayoutAdapter(adapter) {
    if (!adapter || typeof adapter !== 'object') {
      throw new Error('[LifecycleManager] Layout adapter must be an object');
    }
    if (!adapter.type || typeof adapter.type !== 'string') {
      throw new Error('[LifecycleManager] Layout adapter must have a "type" property');
    }
    if (!adapter.mount || typeof adapter.mount !== 'function') {
      throw new Error('[LifecycleManager] Layout adapter must have a "mount" method');
    }
  }

  /**
   * Validate layout instance contract
   * @param {Object} instance - Layout instance to validate
   * @throws {Error} If instance contract is violated
   */
  function validateLayoutInstance(instance) {
    if (!instance || typeof instance !== 'object') {
      throw new Error('[LifecycleManager] Layout mount() must return an instance object');
    }

    const requiredMethods = ['hasSlot', 'getSlot', 'getSlotNames', 'clearSlot', 'destroy'];
    for (const method of requiredMethods) {
      if (!instance[method] || typeof instance[method] !== 'function') {
        throw new Error(`[LifecycleManager] Layout instance must have a "${method}" method`);
      }
    }

    if (!instance.root || !(instance.root instanceof HTMLElement)) {
      throw new Error('[LifecycleManager] Layout instance must have a "root" HTMLElement property');
    }
  }

  /**
   * Validate page required slots exist in layout
   * @param {string[]} requiredSlots - Slots required by page
   * @throws {Error} If required slot is missing (dev mode only)
   */
  function validatePageSlots(requiredSlots) {
    if (!requiredSlots || !Array.isArray(requiredSlots)) {
      return;
    }

    for (const slotName of requiredSlots) {
      if (!layoutInstance.hasSlot(slotName)) {
        const error = new Error(
          `[LifecycleManager] Page requires slot "${slotName}" but layout does not provide it`
        );
        if (isDev) {
          throw error;
        } else {
          window.lana?.log(error.message, { tags: 'shell,lifecycle' });
        }
      }
    }
  }

  /**
   * Mount layout adapter into container
   * @param {HTMLElement} containerEl - Container element
   * @param {Object} config - Target configuration
   * @returns {Promise<Object>} Layout instance
   */
  async function mountLayout(containerEl, config) {
    try {
      validateLayoutAdapter(config.layoutAdapter);

      const instance = config.layoutAdapter.mount(containerEl, config);
      validateLayoutInstance(instance);

      layoutInstance = instance;
      state.layoutMounted = true;
      emit('layout-mounted', { type: instance.type });

      return instance;
    } catch (error) {
      handleError(error, 'layout-mount', false);
      throw error;
    }
  }

  /**
   * Mount shared components into their designated slots
   * @param {Array} sharedComponents - Array of { slotName, type, options }
   * @returns {Promise<void>}
   */
  async function mountSharedComponents(sharedComponents = []) {
    if (!sharedComponents || sharedComponents.length === 0) {
      state.sharedComponentsMounted = true;
      emit('shared-components-mounted', { count: 0 });
      return;
    }

    const mounted = [];

    for (const { slotName, type, options } of sharedComponents) {
      try {
        // Resolve component from registry
        const component = componentRegistry.resolve(type, options);

        // Get slot from layout
        const slot = layoutInstance.getSlot(slotName);
        if (!slot) {
          const error = new Error(
            `[LifecycleManager] Shared component "${type}" requires slot "${slotName}" but layout does not provide it`
          );
          if (isDev) {
            throw error;
          }
          window.lana?.log(error.message, { tags: 'shell,lifecycle' });
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
        mounted.push({ slotName, type, component });
      } catch (error) {
        // In prod mode, log and continue (component init failure should not block page mount)
        if (isDev) {
          throw error;
        }
        window.lana?.log(
          `[LifecycleManager] Shared component init failed: ${error.message}`,
          { tags: 'shell,lifecycle,component' }
        );
      }
    }

    mountedSharedComponents = mounted;
    state.sharedComponentsMounted = true;
    emit('shared-components-mounted', { count: mounted.length });
  }

  /**
   * Preload dependencies
   * @param {Object} dependencies - Dependency configuration
   * @returns {Promise<void>}
   */
  async function preloadDependencies(dependencies) {
    if (!dependencies) {
      return;
    }

    try {
      await dependencyTracker.preload(dependencies);
    } catch (error) {
      handleError(error, 'dependency-load', true);
      throw error;
    }
  }

  /**
   * Mount a page
   * @param {Object} page - Page configuration
   * @returns {Promise<void>}
   */
  async function mountPage(page) {
    try {
      // Validate required slots
      if (page.requiredSlots) {
        validatePageSlots(page.requiredSlots);
      }

      // Preload page-specific dependencies
      if (page.dependencies) {
        await preloadDependencies(page.dependencies);
      }

      // Set page-specific context (after outgoing page cleanup)
      // Track context keys for cleanup on navigate-away
      if (page.context) {
        activePageContextKeys = Object.keys(page.context);
        for (const [key, value] of Object.entries(page.context)) {
          contextProvider.set(key, value);
        }
      }

      // Create context API for page
      const contextAPI = {
        getSlot: (name) => layoutInstance.getSlot(name),
        ...contextProvider,
      };

      // Mount page content
      await page.mount(contextAPI);

      activePage = page;
      state.pageMounted = true;
      emit('page-mounted', { id: page.id });
    } catch (error) {
      handleError(error, 'page-load', true);
      throw error;
    }
  }

  /**
   * Clear page-specific context keys
   * Per AD#18: palette persists, page-specific keys clear
   */
  function clearPageContext() {
    for (const key of activePageContextKeys) {
      // Skip reserved keys that should persist
      if (key === 'palette') {
        continue;
      }
      contextProvider.set(key, undefined);
    }
    activePageContextKeys = [];
  }

  /**
   * Clear page-owned slots (skip reserved shared slots)
   * @param {string[]} slotNames - Slots to clear
   */
  function clearPageSlots(slotNames) {
    const reservedSlots = targetConfig?.reservedSlots || [];
    for (const slotName of slotNames) {
      // Skip reserved shared component slots
      if (reservedSlots.includes(slotName)) {
        continue;
      }
      if (layoutInstance.hasSlot(slotName)) {
        layoutInstance.clearSlot(slotName);
      }
    }
  }

  /**
   * Unmount current page
   */
  function unmountPage() {
    if (!activePage) {
      return;
    }

    try {
      // 1. Call page destroy hook BEFORE slot cleanup
      if (activePage.destroy) {
        activePage.destroy();
      }

      // 2. Clear page-owned slots (skip reserved shared slots)
      if (activePage.requiredSlots) {
        clearPageSlots(activePage.requiredSlots);
      }

      // 3. Clear page-specific context keys (palette persists per AD#18)
      clearPageContext();

      emit('page-unmounted', { id: activePage.id });
      activePage = null;
      state.pageMounted = false;
    } catch (error) {
      window.lana?.log(
        `[LifecycleManager] Page unmount failed: ${error.message}`,
        { tags: 'shell,lifecycle' }
      );
    }
  }

  /**
   * Start the lifecycle - mount layout, shared components, and initial page
   * @param {HTMLElement} containerEl - Container element
   * @param {Object} config - Target configuration
   * @returns {Promise<void>}
   */
  async function start(containerEl, config) {
    if (state.started) {
      throw new Error('[LifecycleManager] Lifecycle already started');
    }

    container = containerEl;
    targetConfig = config;
    state.started = true;

    try {
      // 1. Preload shared dependencies
      if (config.dependencies) {
        await preloadDependencies(config.dependencies);
      }

      // 2. Mount layout adapter
      await mountLayout(containerEl, config);

      // 3. Mount shared components
      await mountSharedComponents(config.sharedComponents);

      // 4. Mount initial page
      if (config.page) {
        await mountPage(config.page);
      }

      emit('started');
    } catch (error) {
      // Error already handled in individual methods
      if (!state.error) {
        state.error = { type: 'start', message: error.message, error };
        emit('error', state.error);
      }
    }
  }

  /**
   * Navigate to a new page
   * @param {Object} newPage - New page configuration
   * @returns {Promise<void>}
   */
  async function navigate(newPage) {
    if (!state.started) {
      throw new Error('[LifecycleManager] Cannot navigate before lifecycle is started');
    }

    try {
      // 1. Unmount current page
      unmountPage();

      // 2. Mount new page
      await mountPage(newPage);

      emit('navigated', { from: activePage?.id, to: newPage.id });
    } catch (error) {
      if (isDev) {
        throw error;
      }
      window.lana?.log(
        `[LifecycleManager] Navigation failed: ${error.message}`,
        { tags: 'shell,lifecycle' }
      );
    }
  }

  /**
   * Destroy lifecycle - tear down page, shared components, and layout
   */
  function destroy() {
    if (!state.started) {
      return;
    }

    try {
      // 1. Unmount page
      unmountPage();

      // 2. Destroy shared components
      for (const { component, type } of mountedSharedComponents) {
        try {
          component.destroy();
        } catch (error) {
          window.lana?.log(
            `[LifecycleManager] Shared component destroy failed: ${error.message}`,
            { tags: 'shell,lifecycle,component' }
          );
        }
      }
      mountedSharedComponents = [];
      state.sharedComponentsMounted = false;

      // 3. Destroy layout instance
      if (layoutInstance) {
        try {
          layoutInstance.destroy();
        } catch (error) {
          window.lana?.log(
            `[LifecycleManager] Layout destroy failed: ${error.message}`,
            { tags: 'shell,lifecycle' }
          );
        }
        layoutInstance = null;
        state.layoutMounted = false;
      }

      // Reset state
      state.started = false;
      state.error = null;
      state.canRetry = false;
      container = null;
      targetConfig = null;

      emit('destroyed');
    } catch (error) {
      window.lana?.log(
        `[LifecycleManager] Destroy failed: ${error.message}`,
        { tags: 'shell,lifecycle' }
      );
    }
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  function getState() {
    return { ...state };
  }

  /**
   * Retry after error
   * @returns {Promise<void>}
   */
  async function retry() {
    if (!state.canRetry) {
      throw new Error('[LifecycleManager] Cannot retry - no retryable error');
    }

    state.error = null;
    state.canRetry = false;

    if (!state.pageMounted && targetConfig?.page) {
      await mountPage(targetConfig.page);
    }
  }

  return {
    start,
    navigate,
    destroy,
    getState,
    retry,
  };
}
