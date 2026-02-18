import { AuthenticationError } from '../core/Errors.js';
import { getMetadata } from '../../../scripts/utils.js';

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const DEFAULT_IMS_TIMEOUT_MS = 10_000;

/**
 * Custom event name dispatched on `window` when IMS becomes ready.
 * Fired exactly once per page lifecycle by `ensureIms()`.
 * Standalone providers (e.g. AuthStateProvider) listen for this
 * to learn when the IMS SDK is available without polling.
 * @type {string}
 */
export const IMS_READY_EVENT = 'service:ims:ready';

/** @type {Promise<Object>|null} Cached IMS ready promise */
let imsReadyPromise = null;

/** @type {(() => Promise<void>)|null} Optional loader override (used by tests) */
let imsLoader = null;

/** @type {boolean} Whether the IMS ready event has been dispatched */
let imsReadyDispatched = false;

/**
 * Register an IMS loader override.
 * In production this is **not** needed — ensureIms() auto-discovers
 * milo's loadIms via getLibs(). Use this in tests to inject a mock loader.
 *
 * @param {() => Promise<void>} loader - Function that triggers IMS SDK loading
 */
export function setImsLoader(loader) {
  imsLoader = loader;
}

/**
 * Reset internal IMS state. Intended for tests only.
 * Clears the cached promise, registered loader, and dispatched flag
 * so each test starts clean.
 */
export function resetImsState() {
  imsReadyPromise = null;
  imsLoader = null;
  imsReadyDispatched = false;
}

/**
 * Dispatch the `service:ims:ready` event on `window` (at most once).
 * Called internally by `ensureIms()` once the IMS SDK is available.
 */
function notifyImsReady() {
  if (!imsReadyDispatched) {
    imsReadyDispatched = true;
    window.dispatchEvent(new CustomEvent(IMS_READY_EVENT));
  }
}

/**
 * Load IMS via milo's loadIms utility.
 * Dynamically imports getLibs to avoid a static dependency on the scripts layer.
 * @returns {Promise<void>}
 */
async function loadImsFromMilo() {
  const { getLibs } = await import('../../../scripts/utils.js');
  const { loadIms } = await import(`${getLibs()}/utils/utils.js`);
  return loadIms();
}

/**
 * Ensure the IMS SDK is loaded and ready.
 * - Returns immediately if `window.adobeIMS` already exists
 * - Otherwise triggers loading (via registered override or milo's loadIms)
 * - Dispatches a `service:ims:ready` event on `window` once the SDK is
 *   available (at most once per page lifecycle)
 * - Caches the promise so IMS is only loaded once
 *
 * @param {number} [timeoutMs=10000] - Max time to wait for IMS to become ready
 * @returns {Promise<Object>} Resolves with the `window.adobeIMS` instance
 * @throws {AuthenticationError} If IMS times out or the loader fails
 */
export function ensureIms(timeoutMs = DEFAULT_IMS_TIMEOUT_MS) {
  if (window.adobeIMS) {
    notifyImsReady();
    return Promise.resolve(window.adobeIMS);
  }

  if (!imsReadyPromise) {
    imsReadyPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        imsReadyPromise = null;
        reject(new AuthenticationError('IMS SDK load timed out', {
          code: 'IMS_TIMEOUT',
        }));
      }, timeoutMs);

      const loader = typeof imsLoader === 'function' ? imsLoader : loadImsFromMilo;
      loader().then(() => {
        if (window.adobeIMS) {
          clearTimeout(timeout);
          notifyImsReady();
          resolve(window.adobeIMS);
        }
      }).catch((err) => {
        clearTimeout(timeout);
        imsReadyPromise = null;
        reject(new AuthenticationError('IMS SDK failed to load', {
          code: 'IMS_LOAD_FAILED',
          originalError: err,
        }));
      });
    });
  }

  return imsReadyPromise;
}

/**
 * Check if a token is expiring within the buffer window.
 * @param {number} expireTimestamp - Token expiry time (ms since epoch)
 * @param {number} [bufferMs=300000] - Buffer window in milliseconds
 * @returns {boolean} True if token expires within buffer
 */
export function isExpiringSoon(expireTimestamp, bufferMs = TOKEN_REFRESH_BUFFER_MS) {
  if (!expireTimestamp || typeof expireTimestamp !== 'number') return false;
  return Date.now() > expireTimestamp - bufferMs;
}

/**
 * Authentication middleware with proactive token refresh.
 *
 * Waits for the IMS SDK to become available (triggering its load on demand
 * via the registered loader), then gates unauthenticated users and
 * proactively refreshes tokens nearing expiry.
 *
 * 1. Ensures IMS is loaded (with timeout) — triggers loading if needed
 * 2. Gates unauthenticated users with AuthenticationError
 * 3. Proactively refreshes tokens nearing expiry (5-min buffer)
 *    to avoid disruptive page reloads from scripts.js onTokenExpired
 *
 * @param {string} topic - Action topic
 * @param {Array} args - Action arguments
 * @param {Function} next - Next middleware/handler
 * @param {Object} [context] - Middleware context
 * @returns {Promise<any>} Action result
 * @throws {AuthenticationError} When IMS fails to load or user is not logged in
 */
export default async function authMiddleware(topic, args, next, context = {}) {
  const ims = await ensureIms();

  if (!ims.isSignedInUser()) {
    const susiTarget = getMetadata('susi-target');
    if (susiTarget) {
      const [path, hash] = susiTarget.split('#');
      const id = hash;
      const { getLibs } = await import('../../../scripts/utils.js');
      const { getModal } = await import(`${getLibs()}/blocks/modal/modal.js`);
      await getModal({ id, path });
    }
    throw new AuthenticationError('User is not logged in, start login process', {
      topic,
      serviceName: context.serviceName,
    });
  }

  const tokenInfo = ims.getAccessToken();
  if (tokenInfo?.expire && isExpiringSoon(tokenInfo.expire)) {
    try {
      await ims.refreshToken();
    } catch {
      // Refresh failed — token might still be valid, proceed and let API decide
    }
  }

  return next();
}

/**
 * @param {Object} meta - { plugin, serviceName, topic, args }
 * @returns {Object} Context object for middleware
 */
authMiddleware.buildContext = ({ serviceName, topic }) => ({
  serviceName,
  topic,
});
