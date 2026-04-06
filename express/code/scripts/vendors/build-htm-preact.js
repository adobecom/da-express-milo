/* eslint-disable import/extensions */
/* eslint-disable max-len */
// Used to create custom htm-preact dependency file

import { h, Component, createContext, createRef, render, Fragment } from 'preact';
import {
  useState, useReducer, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useContext, useDebugValue, useErrorBoundary, useId,
} from 'preact/hooks';
import htm from 'htm';

function useSyncExternalStore(subscribe, getSnapshot) {
  const [state, setState] = useState(() => getSnapshot());

  useLayoutEffect(() => {
    function checkForUpdates() {
      const next = getSnapshot();
      setState((prev) => (Object.is(prev, next) ? prev : next));
    }

    checkForUpdates();

    const unsubscribe = subscribe(checkForUpdates);
    return unsubscribe;
  }, [subscribe, getSnapshot]);

  useDebugValue(state);
  return state;
}

const html = htm.bind(h);

export {
  h, html, render, Component, createContext, createRef, useState, useReducer, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useContext, useDebugValue, useErrorBoundary, useId, useSyncExternalStore, Fragment,
};
