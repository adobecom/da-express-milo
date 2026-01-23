/**
 * Logging Middleware
 *
 * Logs all service action dispatches with timing information.
 *
 * @param {string} topic - Action topic
 * @param {Array} args - Action arguments
 * @param {Function} next - Next middleware/handler
 * @param {Object} [context] - Optional middleware context
 * @returns {Promise<any>} Action result
 */
export default async function loggingMiddleware(topic, args, next, context = {}) {
  const start = performance.now();
  const { serviceName = 'ColorService' } = context;
  const prefix = `[${serviceName}][${topic}]`;

  // eslint-disable-next-line no-console
  console.log(`${prefix} Request:`, ...args);

  try {
    const result = await next();
    const duration = (performance.now() - start).toFixed(2);

    // eslint-disable-next-line no-console
    console.log(`${prefix} Response (${duration}ms):`, result);

    return result;
  } catch (error) {
    const duration = (performance.now() - start).toFixed(2);

    // eslint-disable-next-line no-console
    console.error(`${prefix} Error (${duration}ms):`, error);

    throw error;
  }
}

/**
 * Build context for logging middleware.
 * @param {Object} meta - { plugin, serviceName, topic, args }
 * @returns {Object} Context object for middleware
 */
loggingMiddleware.buildContext = ({ serviceName, topic }) => ({
  serviceName,
  topic,
});

