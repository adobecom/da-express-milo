import { createEventBus } from '../utils/createEventBus.js';

/**
 * Creates a context provider with key-value storage and selector-based subscriptions.
 * Wraps createEventBus to add state management layer.
 *
 * @returns {{ set: Function, get: Function, on: Function, off: Function }}
 */
export function createContextProvider() {
  const store = {};
  const listeners = {};
  const bus = createEventBus(document, 'context');

  function get(key) {
    return store[key];
  }

  function set(key, value) {
    if (store[key] === value) {
      return;
    }

    store[key] = value;

    const keyListeners = listeners[key] || [];
    keyListeners.forEach((cb) => {
      try {
        cb(value);
      } catch (err) {
        window.lana?.log(`Context provider error [${key}]: ${err.message}`, {
          tags: 'context,shell',
        });
      }
    });

    bus.emit(key, value);
  }

  function parseSelector(selector) {
    return selector.split('.');
  }

  function getValueBySelector(selector) {
    const parts = parseSelector(selector);
    const rootKey = parts[0];
    const rootValue = store[rootKey];

    if (parts.length === 1) {
      return rootValue;
    }

    if (rootValue === null || rootValue === undefined || typeof rootValue !== 'object') {
      return undefined;
    }

    let current = rootValue;
    for (let i = 1; i < parts.length; i++) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[parts[i]];
    }

    return current;
  }

  function on(keyOrSelector, callback) {
    const parts = parseSelector(keyOrSelector);
    const rootKey = parts[0];

    if (!listeners[rootKey]) {
      listeners[rootKey] = [];
    }

    if (parts.length === 1) {
      listeners[rootKey].push(callback);
    } else {
      const cacheKey = Symbol('selector-cache');
      const rootExistedKey = Symbol('root-existed');
      const currentValue = getValueBySelector(keyOrSelector);
      callback[cacheKey] = currentValue;
      callback[rootExistedKey] = rootKey in store;

      const wrappedCallback = (value) => {
        const selectorValue = getValueBySelector(keyOrSelector);
        const previousValue = callback[cacheKey];
        const rootPreviouslyExisted = callback[rootExistedKey];
        const rootNowExists = rootKey in store;
        const rootValue = store[rootKey];
        const isRootObject = rootValue !== null && rootValue !== undefined && typeof rootValue === 'object';

        if (!rootPreviouslyExisted && rootNowExists && isRootObject) {
          callback[rootExistedKey] = true;
          callback[cacheKey] = selectorValue;
          callback(selectorValue);
        } else if (previousValue !== selectorValue) {
          callback[cacheKey] = selectorValue;
          callback(selectorValue);
        }
      };

      callback.__wrappedCallback = wrappedCallback;
      callback.__cacheKey = cacheKey;
      callback.__rootExistedKey = rootExistedKey;
      listeners[rootKey].push(wrappedCallback);
    }
  }

  function off(keyOrSelector, callback) {
    const parts = parseSelector(keyOrSelector);
    const rootKey = parts[0];

    if (!listeners[rootKey]) {
      return;
    }

    if (parts.length === 1) {
      const index = listeners[rootKey].indexOf(callback);
      if (index > -1) {
        listeners[rootKey].splice(index, 1);
      }
    } else {
      const wrappedCallback = callback.__wrappedCallback;
      if (wrappedCallback) {
        const index = listeners[rootKey].indexOf(wrappedCallback);
        if (index > -1) {
          listeners[rootKey].splice(index, 1);
        }
        delete callback.__wrappedCallback;
        if (callback.__cacheKey) {
          delete callback[callback.__cacheKey];
          delete callback.__cacheKey;
        }
        if (callback.__rootExistedKey) {
          delete callback[callback.__rootExistedKey];
          delete callback.__rootExistedKey;
        }
      }
    }
  }

  return { set, get, on, off };
}
