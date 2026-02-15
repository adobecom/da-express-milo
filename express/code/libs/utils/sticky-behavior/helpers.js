/**
 * Deep merges configuration objects
 * @param {Object} defaults - Default configuration
 * @param {Object} overrides - User overrides
 * @returns {Object} Merged configuration
 */
export function mergeConfig(defaults, overrides) {
  return {
    ...defaults,
    ...overrides,
    animation: { ...defaults.animation, ...overrides?.animation },
    observer: { ...defaults.observer, ...overrides?.observer },
  };
}

/**
 * Creates a default sticky wrapper element
 * @returns {HTMLElement} Wrapper element
 */
export function createDefaultWrapper() {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position: fixed; z-index: 100;';
  return wrapper;
}

