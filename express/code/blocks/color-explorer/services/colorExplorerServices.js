/**
 * Bootstrap for color-explorer service layer (auth + CC Library).
 * Registers AuthStateProvider and inits cclibrary plugin so the floating toolbar
 * can gate "Save to CC Libraries" on login state.
 */

let initPromise = null;

/**
 * Ensure the service layer is ready: AuthStateProvider registered, cclibrary loaded.
 * Safe to call multiple times (returns same promise).
 * @returns {Promise<{ serviceManager: Object, authState: Object, ccLibrary?: Object }>}
 */
export async function ensureColorServicesReady() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { serviceManager, initApiService, AuthStateProvider } = await import(
      '../../../libs/services/index.js'
    );

    try {
      if (!serviceManager.hasProvider?.('authState')) {
        serviceManager.registerProvider('authState', new AuthStateProvider());
      }
    } catch (e) {
      // Already registered (e.g. ProviderRegistrationError)
    }

    await initApiService({ plugins: ['cclibrary'] });

    const authState = await serviceManager.getProvider('authState');
    let ccLibrary = null;
    try {
      ccLibrary = await serviceManager.getProvider('cclibrary');
    } catch {
      // cclibrary may fail if config/API not set
    }

    return { serviceManager, authState, ccLibrary };
  })();

  return initPromise;
}
