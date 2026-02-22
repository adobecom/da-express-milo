/**
 * @param {string} pattern
 * @param {string} topic
 * @returns {boolean}
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
 * @param {Function} predicate
 * @param {Function} middleware
 * @returns {Function}
 * @throws {TypeError}
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
