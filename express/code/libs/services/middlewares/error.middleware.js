import { ServiceError } from '../core/Errors.js';

/**
 * Global Error Middleware
 *
 * Wraps all plugin dispatches with try-catch for consistent error handling.
 * Logs errors with service name context and re-throws with enriched information.
 *
 * @param {string} topic - Action topic
 * @param {Array} args - Action arguments
 * @param {Function} next - Next middleware/handler
 * @param {Object} [context] - Optional context (serviceName, etc.)
 * @returns {Promise<any>} Action result
 */
export default async function errorMiddleware(topic, args, next, context = {}) {
  const { serviceName = 'Unknown' } = context;

  try {
    return await next();
  } catch (error) {
    const enhancedError = error instanceof ServiceError
      ? error
      : new ServiceError(error.message, {
        serviceName,
        topic,
        originalError: error,
      });

    // Log to analytics
    if (window.lana) {
      window.lana.log(`[${serviceName}] ${topic} error: ${enhancedError.message}`, {
        tags: `color-explorer,${serviceName.toLowerCase()},error`,
        errorCode: enhancedError.code,
      });
    }

    throw enhancedError;
  }
}

/**
 * Build context for error middleware.
 * @param {Object} meta - { plugin, serviceName, topic, args }
 * @returns {Object} Context object for middleware
 */
errorMiddleware.buildContext = ({ serviceName, topic }) => ({
  serviceName,
  topic,
});

