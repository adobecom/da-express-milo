/**
 * Validate that a layout adapter follows the required contract
 * @param {Object} layoutAdapter - Layout adapter to validate
 * @throws {Error} If adapter doesn't follow contract
 */
function validateLayoutAdapter(layoutAdapter) {
  if (!layoutAdapter || typeof layoutAdapter !== 'object') {
    throw new Error('Layout adapter must be an object');
  }

  if (!layoutAdapter.type || typeof layoutAdapter.type !== 'string') {
    throw new Error('Layout adapter must have a "type" property');
  }

  if (!layoutAdapter.mount || typeof layoutAdapter.mount !== 'function') {
    throw new Error('Layout adapter must have a "mount" method');
  }
}

/**
 * Validate shared component configuration
 * @param {Array} shared - Array of shared component configs
 * @throws {Error} If any component config is invalid
 */
function validateSharedComponents(shared) {
  if (!Array.isArray(shared)) {
    throw new Error('Shared components must be an array');
  }

  for (const component of shared) {
    if (!component.slot || typeof component.slot !== 'string') {
      throw new Error('Shared component must have a "slot" property');
    }

    if (!component.type || typeof component.type !== 'string') {
      throw new Error('Shared component must have a "type" property');
    }
  }
}

/**
 * Validate reserved slots configuration
 * @param {Array} reservedSlots - Array of reserved slot names
 * @throws {Error} If reserved slots config is invalid
 */
function validateReservedSlots(reservedSlots) {
  if (!Array.isArray(reservedSlots)) {
    throw new Error('Reserved slots must be an array');
  }

  for (const slot of reservedSlots) {
    if (typeof slot !== 'string') {
      throw new Error('Reserved slot names must be strings');
    }
  }
}

/**
 * Create a target composer instance
 * @returns {Object} Target composer API
 */
export default function createTargetComposer() {
  let targetConfig = null;
  let configured = false;

  /**
   * Ensure target is configured before accessing
   * @throws {Error} If target not configured
   */
  function ensureConfigured() {
    if (!configured) {
      throw new Error('Target not configured');
    }
  }

  return {
    /**
     * Configure the target with layout, shared components, and reserved slots
     * @param {Object} config - Target configuration
     * @param {Object} config.layout - Layout adapter instance
     * @param {Object} config.layoutOptions - Options to pass to layout mount
     * @param {Array} config.shared - Array of shared component mappings
     * @param {Array} config.reservedSlots - Array of reserved slot names
     * @throws {Error} If config is invalid or configure is called twice
     */
    configure(config) {
      if (configured) {
        throw new Error('Target already configured');
      }

      if (!config.layout) {
        throw new Error('Target config must have a "layout" property');
      }

      validateLayoutAdapter(config.layout);

      if (config.layoutOptions !== undefined
          && (typeof config.layoutOptions !== 'object' || Array.isArray(config.layoutOptions))) {
        throw new Error('Layout options must be an object');
      }

      const shared = config.shared || [];
      validateSharedComponents(shared);

      const reservedSlots = config.reservedSlots || [];
      validateReservedSlots(reservedSlots);

      targetConfig = {
        layout: config.layout,
        layoutOptions: config.layoutOptions || {},
        shared,
        reservedSlots,
      };

      configured = true;
    },

    /**
     * Get the target configuration
     * @returns {Object} Target configuration
     * @throws {Error} If target not configured
     */
    getTarget() {
      ensureConfigured();
      return targetConfig;
    },

    /**
     * Check if a slot is reserved
     * @param {string} slotName - Name of the slot to check
     * @returns {boolean} True if slot is reserved
     * @throws {Error} If target not configured
     */
    isSlotReserved(slotName) {
      ensureConfigured();
      return targetConfig.reservedSlots.includes(slotName);
    },
  };
}
