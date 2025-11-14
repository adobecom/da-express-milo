export function debounce(cb, time, { leading = false } = {}) {
  let timer = null;
  const debounced = function debounced(...args) {
    let invoked = false;
    if (timer === null && leading) {
      cb.apply(this, args);
      invoked = true;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!invoked) {
        cb.apply(this, args);
      }
      timer = null;
    }, time);
  };
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

export function throttle(cb, delay, { trailing = false } = {}) {
  let timer = null;
  let lastArgs = null;
  function tryToEnd() {
    if (lastArgs && trailing) {
      cb.apply(this, lastArgs);
      lastArgs = null;
      timer = setTimeout(tryToEnd.bind(this), delay);
    } else {
      timer = null;
    }
  }
  return function throttled(...args) {
    if (timer) {
      lastArgs = args;
      return;
    }
    cb.apply(this, args);
    timer = setTimeout(tryToEnd.bind(this), delay);
  };
}

// returned memoized function is async/sync if input cb is async/sync respectively
export function memoize(cb, { key = (...args) => args.join(','), ttl } = {}) {
  if (cb && !(cb instanceof Function)) throw new Error('cb must be a function');
  if (!(ttl > 0 && Number.isInteger(ttl))) throw new Error('ttl must be greater than 0');
  const cache = new Map();
  const timers = new Map();
  function invalidate(k) {
    cache.delete(k);
    timers.delete(k);
  }
  return function memoized(...args) {
    const k = key(...args);
    if (cache.has(k)) {
      if (ttl) {
        clearTimeout(timers.get(k));
        timers.set(
          k,
          setTimeout(() => {
            invalidate(k);
          }, ttl),
        );
      }
      return cache.get(k);
    }
    const result = cb.apply(this, args);
    if (result && typeof result.then === 'function') {
      result.catch(() => {
        invalidate(k);
      });
    }
    cache.set(k, result);
    if (ttl) {
      timers.set(
        k,
        setTimeout(() => {
          invalidate(k);
        }, ttl),
      );
    }
    return result;
  };
}
