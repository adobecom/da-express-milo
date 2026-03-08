import { handleEscapeClose } from '../spectrum/utils/a11y.js';

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
 * Find all focusable elements within a container
 * @param {HTMLElement} container - Container to search
 * @returns {HTMLElement[]} Array of focusable elements
 */
function getFocusableElements(container) {
  if (!container) return [];

  const focusable = container.querySelectorAll(FOCUSABLE_SELECTOR);
  return Array.from(focusable).filter((el) => el.offsetParent !== null);
}

/**
 * Enable roving tabindex keyboard navigation for a toolbar
 * Follows ARIA toolbar pattern with arrow key navigation
 *
 * @param {HTMLElement} toolbar - Toolbar element with role="toolbar"
 * @returns {{ release: () => void }} Cleanup function
 */
export function enableToolbarNavigation(toolbar) {
  if (!toolbar) {
    // eslint-disable-next-line no-console
    console.warn('[Keyboard] enableToolbarNavigation called with null toolbar');
    return { release: () => {} };
  }

  const controller = new AbortController();
  let currentFocus = 0;

  /**
   * Update tabindex attributes for roving tabindex pattern
   * @param {HTMLElement[]} items - Focusable items
   * @param {number} focusIndex - Index to focus
   */
  function updateTabindex(items, focusIndex) {
    items.forEach((item, index) => {
      if (index === focusIndex) {
        item.setAttribute('tabindex', '0');
        item.focus();
      } else {
        item.setAttribute('tabindex', '-1');
      }
    });
  }

  /**
   * Handle keyboard navigation within toolbar
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeydown(e) {
    const items = getFocusableElements(toolbar);
    if (items.length === 0) return;

    const activeIndex = items.indexOf(document.activeElement);
    if (activeIndex !== -1) {
      currentFocus = activeIndex;
    }

    let handled = false;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        currentFocus = (currentFocus + 1) % items.length;
        updateTabindex(items, currentFocus);
        handled = true;
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
        currentFocus -= 1;
        if (currentFocus < 0) currentFocus = items.length - 1;
        updateTabindex(items, currentFocus);
        handled = true;
        break;

      case 'Home':
        currentFocus = 0;
        updateTabindex(items, currentFocus);
        handled = true;
        break;

      case 'End':
        currentFocus = items.length - 1;
        updateTabindex(items, currentFocus);
        handled = true;
        break;

      default:
        break;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  toolbar.addEventListener('keydown', handleKeydown, { signal: controller.signal });

  const items = getFocusableElements(toolbar);
  if (items.length > 0) {
    const hasTabindexZero = items.some((item) => item.getAttribute('tabindex') === '0');
    if (!hasTabindexZero) {
      items.forEach((item, index) => {
        item.setAttribute('tabindex', index === 0 ? '0' : '-1');
      });
    }
  }

  return {
    release() {
      controller.abort();
    },
  };
}

/**
 * Register an escape key handler for a component
 * Wraps handleEscapeClose from a11y utilities
 *
 * @param {HTMLElement} element - Element to listen on
 * @param {Function} callback - Callback to invoke on Escape
 * @returns {{ release: () => void }} Cleanup function
 */
export function onEscape(element, callback) {
  if (!element || typeof callback !== 'function') {
    // eslint-disable-next-line no-console
    console.warn('[Keyboard] onEscape called with invalid arguments');
    return { release: () => {} };
  }

  return handleEscapeClose(element, callback);
}

/**
 * Create keyboard navigation API for shell
 * Provides keyboard utilities without hardcoding slot positions
 *
 * @returns {Object} Keyboard navigation API
 */
export function createKeyboardNavigation() {
  const registeredHandlers = new Set();

  /**
   * Enable toolbar keyboard navigation
   * @param {HTMLElement} toolbar - Toolbar element
   * @returns {{ release: () => void }} Cleanup function
   */
  function enableToolbar(toolbar) {
    const handler = enableToolbarNavigation(toolbar);
    registeredHandlers.add(handler);
    return {
      release() {
        handler.release();
        registeredHandlers.delete(handler);
      },
    };
  }

  /**
   * Register escape key handler for a component
   * @param {HTMLElement} element - Element to listen on
   * @param {Function} callback - Callback to invoke on Escape
   * @returns {{ release: () => void }} Cleanup function
   */
  function registerEscapeHandler(element, callback) {
    const handler = onEscape(element, callback);
    registeredHandlers.add(handler);
    return {
      release() {
        handler.release();
        registeredHandlers.delete(handler);
      },
    };
  }

  /**
   * Cleanup all registered keyboard handlers
   */
  function destroy() {
    registeredHandlers.forEach((handler) => {
      if (handler && typeof handler.release === 'function') {
        handler.release();
      }
    });
    registeredHandlers.clear();
  }

  return {
    enableToolbarNavigation: enableToolbar,
    onEscape: registerEscapeHandler,
    destroy,
  };
}

/**
 * Integrate keyboard navigation into shell API
 * Provides keyboard utilities to pages and components
 *
 * @param {Object} shellAPI - Shell API object to augment
 * @returns {Object} Keyboard navigation instance
 */
export function integrateKeyboardNavigation(shellAPI) {
  const keyboard = createKeyboardNavigation();

  shellAPI.keyboard = {
    enableToolbarNavigation: keyboard.enableToolbarNavigation,
    onEscape: keyboard.onEscape,
  };

  return keyboard;
}
