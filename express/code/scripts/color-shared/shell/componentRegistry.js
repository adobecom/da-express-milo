/**
 * Validate that a component instance follows the required protocol
 * @param {Object} component - Component instance to validate
 * @param {string} type - Component type name (for error messages)
 * @throws {Error} If component doesn't follow protocol
 */
function validateComponentProtocol(component, type) {
  const requiredMethods = ['init', 'update', 'destroy'];
  const requiredProperties = ['element'];

  for (const method of requiredMethods) {
    if (!component[method]) {
      throw new Error(`Component protocol violation: "${type}" missing required method "${method}"`);
    }
    if (typeof component[method] !== 'function') {
      throw new Error(`Component protocol violation: "${type}" method "${method}" must be a function`);
    }
  }

  for (const prop of requiredProperties) {
    if (!component[prop]) {
      throw new Error(`Component protocol violation: "${type}" missing required property "${prop}"`);
    }
  }
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Create a component registry instance
 * @returns {Object} Registry API
 */
export default function createComponentRegistry() {
  const COMPONENT_REGISTRY = {};
  const MOUNTED_COMPONENTS = new Map();

  return {
    /**
     * Register a component type
     * @param {string} type - Component type identifier
     * @param {Function} factory - Factory function that creates component instances
     * @param {Object} defaultOptions - Default options for this component type
     */
    register(type, factory, defaultOptions = {}) {
      if (COMPONENT_REGISTRY[type]) {
        // eslint-disable-next-line no-console
        console.warn(`[ComponentRegistry] Overwriting existing component type: ${type}`);
      }

      COMPONENT_REGISTRY[type] = {
        create: factory,
        defaultOptions,
      };
    },

    /**
     * Resolve a component instance with merged options
     * @param {string} type - Component type identifier
     * @param {Object} options - Options to merge with defaults
     * @returns {Object} Component instance
     * @throws {Error} If type is not registered or component doesn't follow protocol
     */
    resolve(type, options = {}) {
      const entry = COMPONENT_REGISTRY[type];

      if (!entry) {
        throw new Error(`[ComponentRegistry] Unknown component type: "${type}"`);
      }

      const finalOptions = deepMerge(entry.defaultOptions, options);

      const component = entry.create(finalOptions);

      validateComponentProtocol(component, type);

      const originalInit = component.init;
      component.init = async function wrappedInit(slotEl, initOptions, contextAPI) {
        const result = await originalInit.call(this, slotEl, initOptions, contextAPI);

        if (contextAPI && contextAPI.slotName) {
          MOUNTED_COMPONENTS.set(contextAPI.slotName, component);
        }

        return result;
      };

      return component;
    },

    /**
     * Update a mounted component by slot name
     * @param {string} slotName - Slot name where component is mounted
     * @param {Object} options - New options to pass to component's update method
     */
    update(slotName, options) {
      const component = MOUNTED_COMPONENTS.get(slotName);

      if (component) {
        component.update(options);
      }
    },
  };
}
