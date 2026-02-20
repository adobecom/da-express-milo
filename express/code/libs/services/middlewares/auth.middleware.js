import { AuthenticationError } from '../core/Errors.js';

/**
 * @param {string} topic
 * @param {Array} args
 * @param {Function} next
 * @param {Object} [context]
 * @returns {Promise<any>}
 * @throws {AuthenticationError}
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
 * @param {Object} meta
 * @returns {Object}
 */
authMiddleware.buildContext = ({ serviceName, topic }) => ({
  serviceName,
  topic,
});
