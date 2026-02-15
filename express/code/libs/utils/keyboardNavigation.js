/**
 * @typedef {Object} KeyboardNavigationOptions
 * @property {string} [itemSelector='.list-item'] - CSS selector for navigable items
 * @property {string} [selectedClass='is-selected'] - Class applied to selected item
 * @property {boolean} [loop=false] - Whether navigation wraps around at boundaries
 * @property {string} [orientation='vertical'] - 'vertical' or 'horizontal' navigation
 * @property {Function} [onSelect] - Callback when item is selected (Enter key)
 * @property {Function} [onNavigate] - Callback when selection changes
 * @property {Function} [onEscape] - Callback when Escape is pressed
 */

/**
 * @typedef {Object} KeyboardNavigationAPI
 * @property {Function} attach - Attach keyboard handlers to an element
 * @property {Function} detach - Remove keyboard handlers
 * @property {Function} focusItem - Focus a specific item by index
 * @property {Function} getSelectedIndex - Get current selected index
 * @property {Function} setSelectedIndex - Set selected index programmatically
 * @property {Function} reset - Reset selection state
 */

/**
 * Key codes for navigation (supports both key and keyCode for compatibility)
 */
const KEYS = {
  ARROW_UP: ['ArrowUp', 38],
  ARROW_DOWN: ['ArrowDown', 40],
  ARROW_LEFT: ['ArrowLeft', 37],
  ARROW_RIGHT: ['ArrowRight', 39],
  ENTER: ['Enter', 13],
  ESCAPE: ['Escape', 27],
  HOME: ['Home', 36],
  END: ['End', 35],
};

/**
 * Checks if a keyboard event matches a key definition
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Array} keyDef - Key definition [keyName, keyCode]
 * @returns {boolean}
 */
function matchesKey(event, keyDef) {
  return event.key === keyDef[0] || event.keyCode === keyDef[1];
}

/**
 * Default configuration for keyboard navigation
 */
const DEFAULT_OPTIONS = {
  itemSelector: '.list-item',
  selectedClass: 'is-selected',
  loop: false,
  orientation: 'vertical',
  onSelect: null,
  onNavigate: null,
  onEscape: null,
};

/**
 * Creates keyboard navigation for a list container
 *
 * @param {HTMLElement} container - The container element holding list items
 * @param {KeyboardNavigationOptions} [options] - Configuration options
 * @returns {KeyboardNavigationAPI} Public API for controlling navigation
 */
export function createKeyboardNavigation(container, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  let selectedIndex = -1;
  let attachedElement = null;
  let keydownHandler = null;

  /**
   * Gets all navigable items in the container
   * @returns {NodeListOf<Element>}
   */
  function getItems() {
    return container.querySelectorAll(config.itemSelector);
  }

  /**
   * Updates visual selection state on items
   */
  function updateSelectionState() {
    const items = getItems();
    items.forEach((item, index) => {
      const isSelected = index === selectedIndex;
      item.classList.toggle(config.selectedClass, isSelected);
      item.setAttribute('aria-selected', String(isSelected));
    });
  }

  /**
   * Focuses a specific item by index
   * @param {number} index - Target index
   */
  function focusItem(index) {
    const items = getItems();
    if (index >= 0 && index < items.length) {
      items[index].focus();
    }
  }

  /**
   * Navigates to a new index
   * @param {number} newIndex - Target index
   * @param {boolean} [shouldFocus=true] - Whether to focus the item
   */
  function navigateTo(newIndex, shouldFocus = true) {
    const items = getItems();
    const itemCount = items.length;

    if (itemCount === 0) return;

    let targetIndex = newIndex;

    if (config.loop) {
      if (targetIndex < 0) targetIndex = itemCount - 1;
      if (targetIndex >= itemCount) targetIndex = 0;
    } else {
      targetIndex = Math.max(0, Math.min(targetIndex, itemCount - 1));
    }

    selectedIndex = targetIndex;
    updateSelectionState();

    if (shouldFocus) {
      focusItem(selectedIndex);
    }

    config.onNavigate?.(items[selectedIndex], selectedIndex);
  }

  /**
   * Handles keydown events for navigation
   * @param {KeyboardEvent} event
   */
  function handleKeydown(event) {
    const items = getItems();
    const itemCount = items.length;

    if (itemCount === 0) return;

    const isVertical = config.orientation === 'vertical';
    const prevKey = isVertical ? KEYS.ARROW_UP : KEYS.ARROW_LEFT;
    const nextKey = isVertical ? KEYS.ARROW_DOWN : KEYS.ARROW_RIGHT;

    if (matchesKey(event, prevKey)) {
      event.preventDefault();
      navigateTo(selectedIndex - 1);
      return;
    }

    if (matchesKey(event, nextKey)) {
      event.preventDefault();
      navigateTo(selectedIndex + 1);
      return;
    }

    if (matchesKey(event, KEYS.HOME)) {
      event.preventDefault();
      navigateTo(0);
      return;
    }

    if (matchesKey(event, KEYS.END)) {
      event.preventDefault();
      navigateTo(itemCount - 1);
      return;
    }

    if (matchesKey(event, KEYS.ENTER)) {
      if (selectedIndex >= 0 && selectedIndex < itemCount) {
        event.preventDefault();
        config.onSelect?.(items[selectedIndex], selectedIndex);
      }
      return;
    }

    if (matchesKey(event, KEYS.ESCAPE)) {
      config.onEscape?.();
    }
  }

  /**
   * Attaches keyboard handlers to an element
   * @param {HTMLElement} element - Element to attach handlers to
   */
  function attach(element) {
    if (attachedElement) {
      detach();
    }

    keydownHandler = handleKeydown;
    element.addEventListener('keydown', keydownHandler);
    attachedElement = element;
  }

  /**
   * Detaches keyboard handlers
   */
  function detach() {
    if (attachedElement && keydownHandler) {
      attachedElement.removeEventListener('keydown', keydownHandler);
      attachedElement = null;
      keydownHandler = null;
    }
  }

  /**
   * Resets selection state
   */
  function reset() {
    selectedIndex = -1;
    updateSelectionState();
  }

  return Object.freeze({
    attach,
    detach,
    focusItem,
    getSelectedIndex: () => selectedIndex,
    setSelectedIndex: (index) => {
      selectedIndex = index;
      updateSelectionState();
    },
    navigateTo,
    reset,
    updateSelectionState,
  });
}

/**
 * Attaches item-level keyboard navigation to list items
 * Enables arrow key navigation when items themselves are focused
 *
 * @param {HTMLElement} container - Container holding the items
 * @param {Object} options - Configuration options
 * @param {string} options.itemSelector - CSS selector for items
 * @param {Function} options.onSelect - Selection callback
 * @returns {Function} Cleanup function
 */
export function attachItemNavigation(container, options) {
  const { itemSelector, onSelect } = options;

  function handleItemKeydown(event) {
    const item = event.target.closest(itemSelector);
    if (!item) return;

    const items = Array.from(container.querySelectorAll(itemSelector));
    const currentIndex = items.indexOf(item);

    if (matchesKey(event, KEYS.ARROW_DOWN)) {
      event.preventDefault();
      const nextIndex = currentIndex + 1;
      if (nextIndex < items.length) {
        items[nextIndex].focus();
      }
    }

    if (matchesKey(event, KEYS.ARROW_UP)) {
      event.preventDefault();
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        items[prevIndex].focus();
      }
    }

    if (matchesKey(event, KEYS.ENTER)) {
      event.preventDefault();
      onSelect?.(item, currentIndex);
    }
  }

  container.addEventListener('keydown', handleItemKeydown);

  return () => {
    container.removeEventListener('keydown', handleItemKeydown);
  };
}

