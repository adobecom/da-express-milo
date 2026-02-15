import { AuthenticationError } from '../core/Errors.js';

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

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
 * 1. Gates unauthenticated users with AuthenticationError
 * 2. Proactively refreshes tokens nearing expiry (5-min buffer)
 *    to avoid disruptive page reloads from scripts.js onTokenExpired
 *
 * @param {string} topic - Action topic
 * @param {Array} args - Action arguments
 * @param {Function} next - Next middleware/handler
 * @param {Object} [context] - Middleware context
 * @returns {Promise<any>} Action result
 * @throws {AuthenticationError} When user is not logged in
 */
export default async function authMiddleware(topic, args, next, context = {}) {
  const ims = window?.adobeIMS;
  const isSignedInUser = ims?.isSignedInUser() || false;

  if (!isSignedInUser) {
    throw new AuthenticationError('User is not logged in, requires login', {
      topic,
      serviceName: context.serviceName,
    });
  }

  const tokenInfo = ims?.getAccessToken();
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
