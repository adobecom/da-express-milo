import { AuthenticationError } from '../core/Errors.js';

/**
 * @param {string} topic - Action topic
 * @param {Array} args - Action arguments
 * @param {Function} next - Next middleware/handler
 * @param {Object} [context] - Middleware context
 * @returns {Promise<any>} Action result
 * @throws {AuthenticationError} When user is not logged in
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
 * @param {Object} meta - { plugin, serviceName, topic, args }
 * @returns {Object} Context object for middleware
 */
authMiddleware.buildContext = ({ serviceName, topic }) => ({
  serviceName,
  topic,
});
