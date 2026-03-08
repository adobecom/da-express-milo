import { announceToScreenReader } from '../spectrum/utils/a11y.js';

/**
 * Create a router instance
 * @param {Object} config - Router configuration
 * @param {string} config.queryParam - Query parameter name to read (e.g., 'tool')
 * @param {string} config.defaultPage - Default page ID to use when param is missing
 * @param {Object} config.pageRegistry - Registry of page definitions
 * @param {Object} config.layoutInstance - Active layout instance
 *   (optional, required for navigation)
 * @param {Object} config.sharedOverrides - Page-specific option overrides (optional)
 * @param {Function} config.getSearchString - Function to get search string
 *   (for testing)
 * @returns {Object} Router API
 */
export default function createRouter(config) {
  const {
    queryParam = 'tool',
    defaultPage,
    pageRegistry,
    layoutInstance,
    sharedOverrides = {},
    getSearchString = () => window.location.search,
  } = config;

  if (!pageRegistry) {
    throw new Error('[Router] pageRegistry is required');
  }

  if (!pageRegistry[defaultPage]) {
    throw new Error(`[Router] Default page "${defaultPage}" not found in registry`);
  }

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

    if (!pageId || !pageRegistry[pageId]) {
      if (pageId && !pageRegistry[pageId]) {
        // eslint-disable-next-line no-console
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
          `[Router] Required slot "${slotName}" not available in layout "${layoutInstance.type}"`,
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

    validateRequiredSlots(page);

    if (currentPageInstance && currentPageInstance.destroy) {
      currentPageInstance.destroy();
      currentPageInstance = null;
    }

    clearSlots(page);

    const slots = getSlotElements(page);

    const pageOptions = sharedOverrides[pageId] || {};

    await page.mount(slots, pageOptions);

    currentPageId = pageId;
    currentPageInstance = page;

    const pageTitle = page.title || pageId;
    announceToScreenReader(`Navigated to ${pageTitle} page`, 'polite');
  }

  /**
   * Navigate to a page
   * @param {string} pageId - Page ID to navigate to
   */
  async function navigate(pageId) {
    if (!pageRegistry[pageId]) {
      throw new Error(`[Router] Page "${pageId}" not found in registry`);
    }

    const urlPageId = getPageIdFromUrl();
    const needsUrlUpdate = urlPageId !== pageId;

    if (needsUrlUpdate) {
      const urlParams = new URLSearchParams(getSearchString());
      urlParams.set(queryParam, pageId);
      const newUrl = `?${urlParams.toString()}`;
      window.history.pushState({ pageId }, '', newUrl);
    }

    if (currentPageId === pageId) {
      return;
    }

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
          }).catch(() => {});
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

  initPopstateListener();

  return {
    getCurrentPage,
    navigate,
    prefetchIdlePages,
    destroy,
  };
}
