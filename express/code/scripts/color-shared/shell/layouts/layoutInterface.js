const REQUIRED_INSTANCE_METHODS = ['hasSlot', 'getSlot', 'getSlotNames', 'clearSlot', 'destroy'];

/**
 * Validates a layout adapter and wraps its mount method to validate instances
 * @param {Object} layoutAdapter - The layout adapter to validate
 * @returns {Object} The validated adapter (for chaining)
 * @throws {Error} If adapter or instance contract is violated
 */
export default function validateLayout(layoutAdapter) {
  if (!layoutAdapter || typeof layoutAdapter !== 'object') {
    throw new Error('Layout adapter must be an object');
  }

  if (!layoutAdapter.type || typeof layoutAdapter.type !== 'string') {
    throw new Error('Layout adapter must have a "type" property');
  }

  if (!layoutAdapter.mount || typeof layoutAdapter.mount !== 'function') {
    throw new Error('Layout adapter must have a "mount" method');
  }

  const originalMount = layoutAdapter.mount;

  layoutAdapter.mount = function wrappedMount(container, config) {
    const instance = originalMount.call(this, container, config);

    if (!instance || typeof instance !== 'object') {
      throw new Error('Layout mount() must return an instance object');
    }

    for (const method of REQUIRED_INSTANCE_METHODS) {
      if (!instance[method] || typeof instance[method] !== 'function') {
        throw new Error(`Layout instance must have a "${method}" method`);
      }
    }

    return instance;
  };

  return layoutAdapter;
}
