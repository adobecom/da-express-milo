/**
 * Custom Element Registry Utilities
 *
 * Provides safe registration guards and readiness helpers so that
 * multiple Spectrum loaders can coexist without "already registered" errors.
 */

/**
 * Install a temporary guard that silently skips duplicate custom-element
 * registrations.  Call `restore()` on the returned object when done.
 *
 * Usage:
 *   const guard = installRegistryGuard();
 *   try {
 *     await import('./some-spectrum-bundle.js');
 *   } finally {
 *     guard.restore();
 *   }
 *
 * @returns {{ restore: () => void }}
 */
export function installRegistryGuard() {
  const original = window.customElements.define.bind(window.customElements);

  window.customElements.define = function safeDefine(name, ctor, opts) {
    if (window.customElements.get(name)) return;
    return original(name, ctor, opts);
  };

  return {
    restore() {
      window.customElements.define = original;
    },
  };
}

/**
 * Wait until all given custom-element tag names are registered.
 *
 * @param {string[]} tagNames — e.g. ['sp-picker', 'sp-menu']
 * @param {number}   [timeout=5000] — max ms to wait
 * @returns {Promise<void>}
 */
export async function waitForComponents(tagNames, timeout = 5000) {
  const deadline = Date.now() + timeout;

  await Promise.all(
    tagNames.map(async (name) => {
      if (window.customElements.get(name)) return;

      // customElements.whenDefined returns a promise that resolves
      // when the element is registered.
      const defined = window.customElements.whenDefined(name);
      const timer = new Promise((_, reject) => {
        const remaining = Math.max(0, deadline - Date.now());
        setTimeout(
          () => reject(new Error(`Timed out waiting for <${name}> to register`)),
          remaining,
        );
      });

      await Promise.race([defined, timer]);
    }),
  );
}
