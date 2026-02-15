/**
 * @module guard
 */

/**
 * @param {string} pattern - Topic pattern. Supports exact match or wildcard suffix ('theme.*').
 * @param {string} topic - Topic string to test.
 * @returns {boolean} Whether the topic matches the pattern.
 */
export function matchTopic(pattern, topic) {
  if (pattern === topic) return true;
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -1);
    return topic.startsWith(prefix);
  }
  return false;
}

/**
 * @param {Function} predicate -
 * (topic, context) => boolean - return true to run the middleware, false to skip.
 * @param {Function} middleware - Middleware function: (topic, args, next, context) => result.
 * @returns {Function} Guarded middleware with the same signature.
 * @throws {TypeError} If predicate or middleware is not a function.
 */
export function guardMiddleware(predicate, middleware) {
  if (typeof predicate !== 'function') {
    throw new TypeError('guardMiddleware() predicate must be a function');
  }
  if (typeof middleware !== 'function') {
    throw new TypeError('guardMiddleware() middleware must be a function');
  }

  const guarded = async (topic, args, next, context = {}) => {
    if (predicate(topic, context)) {
      return middleware(topic, args, next, context);
    }
    return next();
  };

  if (typeof middleware.buildContext === 'function') {
    guarded.buildContext = middleware.buildContext;
  }

  return guarded;
}
