import { createStickyBehavior } from './createStickyBehavior.js';

/**
 * Creates sticky behavior that auto-initializes when element connects to DOM
 * Convenience wrapper that handles MutationObserver setup
 *
 * @param {import('./constants.js').StickyBehaviorOptions} options - Configuration options
 * @returns {import('./constants.js').StickyBehaviorAPI} Public API with auto-init behavior
 */
export function createAutoStickyBehavior(options) {
  const stickyBehavior = createStickyBehavior(options);
  let mutationObserver = null;

  if (options.sentinel.isConnected) {
    stickyBehavior.init();
  } else {
    mutationObserver = new MutationObserver((mutations, obs) => {
      if (options.sentinel.isConnected) {
        stickyBehavior.init();
        obs.disconnect();
        mutationObserver = null;
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  const originalDestroy = stickyBehavior.destroy;

  return Object.freeze({
    ...stickyBehavior,
    destroy() {
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }
      originalDestroy();
    },
  });
}

