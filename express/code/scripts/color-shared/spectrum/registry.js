/**
 * Custom Element Registry Utilities
 *
 * Provides safe registration guards and readiness helpers so that
 * multiple Spectrum loaders can coexist without "already registered" errors.
 */

let guardDepth = 0;
let originalDefine = null;

/**
 * Install a temporary guard that silently skips duplicate custom-element
 * registrations.  Call `restore()` on the returned object when done.
 *
 * This guard is re-entrant: concurrent/nested installs share one patched
 * `customElements.define` and only restore the original when the last guard
 * is released.
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
  if (!originalDefine) {
    originalDefine = window.customElements.define.bind(window.customElements);
  }

  if (guardDepth === 0) {
    window.customElements.define = function safeDefine(name, ctor, opts) {
      if (window.customElements.get(name)) return;

      try {
        return originalDefine(name, ctor, opts);
      } catch (error) {
        const message = String(error?.message || '');
        // In async module races the element may have been defined after our
        // `get()` check; treat this as non-fatal and continue.
        if (message.includes('has already been used with this registry')) {
          return;
        }
        throw error;
      }
    };
  }

  guardDepth += 1;
  let restored = false;

  return {
    restore() {
      if (restored) return;
      restored = true;

      guardDepth = Math.max(0, guardDepth - 1);
      if (guardDepth === 0 && originalDefine) {
        window.customElements.define = originalDefine;
      }
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
