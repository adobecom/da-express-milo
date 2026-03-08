const SHELL_OWNED_ATTR = 'data-shell-owned';

/**
 * Creates a harness around a layout instance
 * @param {Object} instance - The layout instance to wrap
 * @param {Object} options - Configuration options
 * @param {boolean} options.strict - Throw on missing slot access (default: false)
 * @param {boolean} options.dev - Log warnings for missing slots (default: false)
 * @returns {Object} Wrapped layout instance with safety features
 */
export default function createLayoutInstanceHarness(instance, options = {}) {
  const { strict = false, dev = false } = options;
  let destroyed = false;

  function assertNotDestroyed(methodName) {
    if (destroyed) {
      throw new Error(`Layout instance destroyed: cannot call ${methodName}()`);
    }
  }

  function warnMissingSlot(slotName) {
    if (dev) {
      // eslint-disable-next-line no-console
      console.warn(`Layout instance: slot "${slotName}" not found`);
    }
  }

  return {
    get type() {
      return instance.type;
    },

    get root() {
      return instance.root;
    },

    /**
     * Check if a slot exists
     * @param {string} name - Slot name
     * @returns {boolean} True if slot exists
     */
    hasSlot(name) {
      assertNotDestroyed('hasSlot');
      return instance.hasSlot(name);
    },

    /**
     * Get a slot element
     * @param {string} name - Slot name
     * @returns {Element|null} Slot element or null if not found
     */
    getSlot(name) {
      assertNotDestroyed('getSlot');
      const slot = instance.getSlot(name);

      if (!slot) {
        warnMissingSlot(name);
      }

      return slot;
    },

    /**
     * Get all exposed slot names
     * @returns {string[]} Array of slot names
     */
    getSlotNames() {
      assertNotDestroyed('getSlotNames');
      return instance.getSlotNames();
    },

    /**
     * Clear page-owned nodes from a slot (preserves shell-owned nodes)
     * @param {string} name - Slot name
     */
    clearSlot(name) {
      assertNotDestroyed('clearSlot');

      const slot = instance.getSlot(name);

      if (!slot) {
        if (strict) {
          throw new Error(`Cannot clear slot "${name}": slot not found`);
        }
        return;
      }

      const nodesToRemove = Array.from(slot.children).filter(
        (node) => !node.hasAttribute(SHELL_OWNED_ATTR),
      );

      nodesToRemove.forEach((node) => node.remove());
    },

    /**
     * Check if instance has been destroyed
     * @returns {boolean} True if destroyed
     */
    isDestroyed() {
      return destroyed;
    },

    /**
     * Destroy the layout instance
     */
    destroy() {
      if (destroyed) return;

      destroyed = true;

      if (instance.destroy) {
        instance.destroy();
      }
    },
  };
}
