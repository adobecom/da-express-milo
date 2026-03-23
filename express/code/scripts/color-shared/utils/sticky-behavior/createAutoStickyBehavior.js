import createStickyBehavior from './createStickyBehavior.js';

function createAutoStickyBehavior(options) {
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

export { createAutoStickyBehavior };
export default createAutoStickyBehavior;
