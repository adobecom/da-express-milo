/**
 * Router Core
 * 
 * Responsibilities:
 * - Query-param routing with whitelist validation
 * - Page activation through active layout instance
 * - URL updates with history.pushState
 * - Validates required slots before mounting pages
 * - Merges shared overrides into page options
 * 
 * Reuses patterns from:
 * - createPageInitService: URL param reading pattern
 */

/**
 * Create a router instance
 * @param {Object} config - Router configuration
 * @param {string} config.queryParam - Query parameter name to read (e.g., 'tool')
 * @param {string} config.defaultPage - Default page ID to use when param is missing
 * @param {Object} config.pageRegistry - Registry of page definitions
 * @param {Object} config.layoutInstance - Active layout instance (optional, required for navigation)
 * @param {Object} config.sharedOverrides - Page-specific option overrides (optional)
 * @param {Function} config.getSearchString - Function to get search string (for testing)
 * @returns {Object} Router API
 */
export function createRouter(config) {
  const {
    queryParam = 'tool',
    defaultPage,
    pageRegistry,
    layoutInstance,
    sharedOverrides = {},
    getSearchString = () => window.location.search,
  } = config;

  // Validate required config
  if (!pageRegistry) {
    throw new Error('[Router] pageRegistry is required');
  }

  if (!pageRegistry[defaultPage]) {
    throw new Error(`[Router] Default page "${defaultPage}" not found in registry`);
  }

  // Track current page
  let currentPageId = null;
  let currentPageInstance = null;
  let popstateHandler = null;
  const loadedModules = new Set();

  /**
   * Get page ID from URL query parameter
   * @returns {string} Page ID from URL or default
   */
  function getPageIdFromUrl() {
    const urlParams = new URLSearchParams(getSearchString());
    const pageId = urlParams.get(queryParam);

    // If no param or unknown page, fall back to default
    if (!pageId || !pageRegistry[pageId]) {
      if (pageId && !pageRegistry[pageId]) {
        console.warn('[Router] Unknown page ID:', pageId, '- falling back to default');
      }
      return defaultPage;
    }

    return pageId;
  }

  /**
   * Get the current page ID
   * @returns {string} Current page ID
   */
  function getCurrentPage() {
    if (currentPageId) {
      return currentPageId;
    }
    return getPageIdFromUrl();
  }

  /**
   * Validate that layout has all required slots for a page
   * @param {Object} page - Page definition
   * @throws {Error} If required slot is missing
   */
  function validateRequiredSlots(page) {
    if (!layoutInstance) {
      throw new Error('[Router] layoutInstance is required for page activation');
    }

    for (const slotName of page.requiredSlots) {
      if (!layoutInstance.hasSlot(slotName)) {
        throw new Error(
          `[Router] Required slot "${slotName}" not available in layout "${layoutInstance.type}"`
        );
      }
    }
  }

  /**
   * Get slot elements for a page
   * @param {Object} page - Page definition
   * @returns {Object} Map of slot name to element
   */
  function getSlotElements(page) {
    const slots = {};
    for (const slotName of page.requiredSlots) {
      slots[slotName] = layoutInstance.getSlot(slotName);
    }
    return slots;
  }

  /**
   * Clear slots for a page
   * @param {Object} page - Page definition
   */
  function clearSlots(page) {
    for (const slotName of page.requiredSlots) {
      layoutInstance.clearSlot(slotName);
    }
  }

  /**
   * Activate a page by mounting it into layout slots
   * @param {string} pageId - Page ID to activate
   */
  async function activatePage(pageId) {
    const page = pageRegistry[pageId];

    if (!page) {
      throw new Error(`[Router] Page "${pageId}" not found in registry`);
    }

    // Validate layout has required slots
    validateRequiredSlots(page);

    // Destroy previous page if exists
    if (currentPageInstance && currentPageInstance.destroy) {
      currentPageInstance.destroy();
      currentPageInstance = null;
    }

    // Clear slots before mounting
    clearSlots(page);

    // Get slot elements
    const slots = getSlotElements(page);

    // Merge shared overrides for this page
    const pageOptions = sharedOverrides[pageId] || {};

    // Mount the page
    await page.mount(slots, pageOptions);

    // Track current page
    currentPageId = pageId;
    currentPageInstance = page;
  }

  /**
   * Navigate to a page
   * @param {string} pageId - Page ID to navigate to
   */
  async function navigate(pageId) {
    // Validate page exists
    if (!pageRegistry[pageId]) {
      throw new Error(`[Router] Page "${pageId}" not found in registry`);
    }

    // Check if URL needs updating
    const urlPageId = getPageIdFromUrl();
    const needsUrlUpdate = urlPageId !== pageId;

    // Update URL if needed
    if (needsUrlUpdate) {
      const urlParams = new URLSearchParams(getSearchString());
      urlParams.set(queryParam, pageId);
      const newUrl = `?${urlParams.toString()}`;
      window.history.pushState({ pageId }, '', newUrl);
    }

    // Don't re-activate if already on this page
    if (currentPageId === pageId) {
      return;
    }

    // Activate the page
    await activatePage(pageId);
  }

  /**
   * Handle popstate events (browser back/forward)
   */
  async function handlePopstate() {
    const pageId = getPageIdFromUrl();
    if (pageId !== currentPageId) {
      await activatePage(pageId);
    }
  }

  /**
   * Initialize popstate listener
   */
  function initPopstateListener() {
    popstateHandler = () => {
      handlePopstate();
    };
    window.addEventListener('popstate', popstateHandler);
  }

  /**
   * Prefetch idle pages (non-active pages during browser idle time)
   */
  function prefetchIdlePages() {
    if (typeof requestIdleCallback === 'undefined') {
      return;
    }

    requestIdleCallback(() => {
      Object.entries(pageRegistry).forEach(([pageId, page]) => {
        if (pageId !== currentPageId && page.loader && !loadedModules.has(pageId)) {
          page.loader().then(() => {
            loadedModules.add(pageId);
          }).catch(() => {
            // Silently fail prefetch
          });
        }
      });
    });
  }

  /**
   * Destroy router and clean up listeners
   */
  function destroy() {
    if (popstateHandler) {
      window.removeEventListener('popstate', popstateHandler);
      popstateHandler = null;
    }
  }

  // Initialize popstate listener
  initPopstateListener();

  return {
    getCurrentPage,
    navigate,
    prefetchIdlePages,
    destroy,
  };
}
