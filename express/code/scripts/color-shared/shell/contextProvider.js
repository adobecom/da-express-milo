import { createEventBus } from '../utils/createEventBus.js';

const callbackMeta = new WeakMap();

function parseSelector(selector) {
  return selector.split('.');
}

/**
 * @param {EventTarget} [host=document] DOM node that receives context CustomEvents
 * @returns {{ set: Function, get: Function, on: Function, off: Function }}
 */
export default function createContextProvider(host = document) {
  const store = {};
  const listeners = {};
  const bus = createEventBus(host, 'context');

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

  const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

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
    for (let i = 1; i < parts.length; i += 1) {
      if (BLOCKED_KEYS.has(parts[i])) return undefined;
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
      const wrappedCallback = () => {
        const meta = callbackMeta.get(callback);
        const selectorValue = getValueBySelector(keyOrSelector);
        const previousValue = meta.cacheValue;
        const rootPreviouslyExisted = meta.rootExistedValue;
        const rootNowExists = rootKey in store;
        const rootValue = store[rootKey];
        const isRootObject = rootValue !== null && rootValue !== undefined && typeof rootValue === 'object';

        if (!rootPreviouslyExisted && rootNowExists && isRootObject) {
          meta.rootExistedValue = true;
          meta.cacheValue = selectorValue;
          callback(selectorValue);
        } else if (previousValue !== selectorValue) {
          meta.cacheValue = selectorValue;
          callback(selectorValue);
        }
      };

      callbackMeta.set(callback, {
        wrappedCallback,
        cacheValue: getValueBySelector(keyOrSelector),
        rootExistedValue: rootKey in store,
      });

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
      const meta = callbackMeta.get(callback);
      if (meta?.wrappedCallback) {
        const index = listeners[rootKey].indexOf(meta.wrappedCallback);
        if (index > -1) {
          listeners[rootKey].splice(index, 1);
        }
        callbackMeta.delete(callback);
      }
    }
  }

  return { set, get, on, off };
}
