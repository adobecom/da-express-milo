import { AuthenticationError } from '../core/Errors.js';

/**
 * Auth Middleware
 *
 * Checks authentication state before allowing requests.
 * Throws AuthenticationError if user is not logged in.
 *
 * @param {string} topic - Action topic
 * @param {Array} args - Action arguments
 * @param {Function} next - Next middleware/handler
 * @param {Object} [context] - Optional middleware context
 * @returns {Promise<any>} Action result
 */
export default async function authMiddleware(topic, args, next, context = {}) {
  const isSignedInUser = window?.adobeIMS?.isSignedInUser() || false;

  if (!isSignedInUser) {
    throw new AuthenticationError('User is not logged in, requires login', {
      topic,
      serviceName: context.serviceName,
    });
  }

  return next();
}

/**
 * Build context for auth middleware.
 * @param {Object} meta - { plugin, serviceName, topic, args }
 * @returns {Object} Context object for middleware
 */
authMiddleware.buildContext = ({ serviceName, topic }) => ({
  serviceName,
  topic,
});

