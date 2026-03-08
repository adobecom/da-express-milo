import { announceToScreenReader } from '../spectrum/utils/a11y.js';
import { saveFocusedElement, restoreFocusedElement } from '../utils/utilities.js';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'sp-button:not([disabled])',
  'sp-picker:not([disabled])',
  'sp-menu-item:not([disabled])',
  'sp-action-button:not([disabled])',
].join(', ');

/**
 * Find the first focusable element in a container
 * @param {HTMLElement} container - Container to search
 * @returns {HTMLElement|null} First focusable element or null
 */
function findFirstFocusable(container) {
  if (!container) return null;

  const focusable = container.querySelectorAll(FOCUSABLE_SELECTOR);
  const visibleFocusable = Array.from(focusable).filter(
    (el) => el.offsetParent !== null,
  );

  return visibleFocusable[0] || null;
}

/**
 * Resolve focus target from page.getInitialFocus() result
 * @param {*} focusTarget - Result from getInitialFocus()
 * @param {HTMLElement} layoutRoot - Layout root element for selector queries
 * @returns {HTMLElement|null} Resolved element or null
 */
function resolveFocusTarget(focusTarget, layoutRoot) {
  if (!focusTarget) return null;

  if (focusTarget instanceof HTMLElement) {
    return document.body.contains(focusTarget) ? focusTarget : null;
  }

  if (typeof focusTarget === 'string') {
    try {
      return layoutRoot.querySelector(focusTarget);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[FocusManagement] Invalid selector:', focusTarget, e);
      return null;
    }
  }

  return null;
}

/**
 * Find fallback focus target from required slots
 * @param {string[]} requiredSlots - Array of required slot names
 * @param {Function} getSlot - Function to get slot by name
 * @returns {HTMLElement|null} First focusable element in required slots
 */
function findFallbackFocusTarget(requiredSlots, getSlot) {
  if (!requiredSlots || requiredSlots.length === 0) return null;

  for (const slotName of requiredSlots) {
    const slot = getSlot(slotName);
    if (slot) {
      const focusable = findFirstFocusable(slot);
      if (focusable) return focusable;
    }
  }

  return null;
}

/**
 * Create focus management system
 * @param {Object} options - Configuration options
 * @param {Function} options.getLayoutInstance - Function to get current layout instance
 * @returns {Object} Focus management API
 */
export default function createFocusManagement({ getLayoutInstance }) {
  let savedFocus = null;

  /**
   * Set initial focus after page mount
   * @param {Object} page - Page configuration
   * @param {Object} shellAPI - Shell API for page
   */
  function setInitialFocus(page, shellAPI) {
    const layoutInstance = getLayoutInstance();
    if (!layoutInstance) return;

    requestAnimationFrame(() => {
      let targetElement = null;

      if (typeof page.getInitialFocus === 'function') {
        try {
          const focusTarget = page.getInitialFocus(shellAPI);
          targetElement = resolveFocusTarget(focusTarget, layoutInstance.root);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[FocusManagement] getInitialFocus() threw error:', e);
        }
      }

      if (!targetElement && page.requiredSlots) {
        targetElement = findFallbackFocusTarget(
          page.requiredSlots,
          (name) => layoutInstance.getSlot(name),
        );
      }

      if (targetElement && typeof targetElement.focus === 'function') {
        try {
          targetElement.focus();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[FocusManagement] Failed to focus element:', e);
        }
      }
    });
  }

  /**
   * Save current focus before navigation
   */
  function saveFocus() {
    savedFocus = saveFocusedElement();
  }

  /**
   * Restore previously saved focus
   */
  function restoreFocus() {
    if (savedFocus) {
      restoreFocusedElement(savedFocus);
      savedFocus = null;
    }
  }

  /**
   * Announce navigation to screen readers
   * @param {string} pageName - Name of the page being navigated to
   * @param {Object} page - Page configuration
   */
  function announceNavigation(pageName, page) {
    const displayName = page.title || page.name || pageName;
    const message = `Navigated to ${displayName}`;
    announceToScreenReader(message, 'polite');
  }

  /**
   * Handle navigation focus management
   * @param {string} pageName - Name of the page being navigated to
   * @param {Object} page - Page configuration
   * @param {Object} shellAPI - Shell API for page
   */
  function handleNavigation(pageName, page, shellAPI) {
    announceNavigation(pageName, page);
    setInitialFocus(page, shellAPI);
  }

  return {
    setInitialFocus,
    saveFocus,
    restoreFocus,
    announceNavigation,
    handleNavigation,
  };
}
