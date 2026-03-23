export function mergeConfig(defaults, overrides) {
  return {
    ...defaults,
    ...overrides,
    animation: { ...defaults.animation, ...overrides?.animation },
    observer: { ...defaults.observer, ...overrides?.observer },
  };
}

export function createDefaultWrapper() {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position: fixed; z-index: 100;';
  return wrapper;
}
