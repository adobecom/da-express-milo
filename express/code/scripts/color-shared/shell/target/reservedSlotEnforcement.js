/**
 * Reserved Slot Enforcement
 * 
 * Responsibilities:
 * - Prevent pages from clearing or hijacking slots reserved for shared components
 * - Preserve shared components when clearing reserved slots
 * - Allow normal clearing of page-owned slots
 * 
 * Depends on: D2 (slot validation), targetComposer
 */

/**
 * Create a protected clearSlot function that enforces reserved slot rules
 * @param {Object} layoutInstance - The active layout instance
 * @param {string[]} reservedSlots - Array of reserved slot names
 * @returns {Function} Protected clearSlot function
 */
export function enforceReservedSlots(layoutInstance, reservedSlots = []) {
  /**
   * Protected clearSlot function
   * @param {string} slotName - Name of the slot to clear
   * @param {Object} options - Clear options
   * @param {boolean} options.preserveShared - Whether to preserve shared components (default: true for reserved slots)
   * @param {boolean} options.force - Force clear even if reserved (throws error)
   * @throws {Error} If trying to clear a reserved slot without preserving shared components
   */
  return function clearSlot(slotName, options = {}) {
    const isReserved = reservedSlots.includes(slotName);
    const { preserveShared = isReserved, force = false } = options;

    // Prevent clearing reserved slots without preserving shared components
    if (isReserved && !preserveShared) {
      throw new Error(
        `Cannot clear reserved slot "${slotName}" without preserving shared components. Reserved slots must preserve shared components.`
      );
    }

    // Additional check for force flag
    if (isReserved && force && !preserveShared) {
      throw new Error(
        `Cannot force-clear reserved slot "${slotName}". Reserved slots must preserve shared components.`
      );
    }

    const slot = layoutInstance.getSlot(slotName);
    if (!slot) return;

    // If we need to preserve shared components (default for reserved slots)
    if (preserveShared) {
      // Remove only non-shared children
      const children = Array.from(slot.children);
      children.forEach((child) => {
        if (!child.dataset.sharedComponent) {
          slot.removeChild(child);
        }
      });
    } else {
      // Clear everything (only allowed for non-reserved slots)
      slot.innerHTML = '';
    }
  };
}

/**
 * Wrap a layout instance's clearSlot method with reserved slot enforcement
 * @param {Object} layoutInstance - The layout instance to wrap
 * @param {string[]} reservedSlots - Array of reserved slot names
 * @returns {Object} Layout instance with protected clearSlot method
 */
export function wrapLayoutWithReservedSlots(layoutInstance, reservedSlots = []) {
  const originalClearSlot = layoutInstance.clearSlot;
  const protectedClearSlot = enforceReservedSlots(layoutInstance, reservedSlots);

  // Replace the clearSlot method with the protected version
  layoutInstance.clearSlot = function(slotName, options) {
    protectedClearSlot(slotName, options);
  };

  return layoutInstance;
}

/**
 * Check if a slot has shared components mounted
 * @param {HTMLElement} slotElement - The slot element to check
 * @returns {boolean} True if slot has shared components
 */
export function hasSharedComponents(slotElement) {
  if (!slotElement) return false;
  return slotElement.querySelector('[data-shared-component]') !== null;
}

/**
 * Mark an element as a shared component
 * @param {HTMLElement} element - The element to mark
 * @returns {HTMLElement} The marked element
 */
export function markAsSharedComponent(element) {
  if (element) {
    element.dataset.sharedComponent = 'true';
  }
  return element;
}
