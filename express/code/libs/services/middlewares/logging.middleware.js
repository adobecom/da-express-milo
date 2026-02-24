/**
 * @param {string} topic
 * @param {Array} args
 * @param {Function} next
 * @param {Object} [context]
 * @returns {Promise<any>}
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
 * @param {Object} meta
 * @returns {Object}
 */
loggingMiddleware.buildContext = ({ serviceName, topic }) => ({
  serviceName,
  topic,
});
