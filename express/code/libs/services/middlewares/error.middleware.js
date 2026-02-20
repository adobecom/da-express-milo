import { ServiceError } from '../core/Errors.js';

/**
 * @param {string} topic
 * @param {Array} args
 * @param {Function} next
 * @param {Object} [context]
 * @returns {Promise<any>}
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
 * @param {Object} meta
 * @returns {Object}
 */
errorMiddleware.buildContext = ({ serviceName, topic }) => ({
  serviceName,
  topic,
});
