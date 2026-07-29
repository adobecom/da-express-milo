export function useState(init) {
  let s = typeof init === 'function' ? init() : init;
  return [s, (v) => { s = typeof v === 'function' ? v(s) : v; }];
}

export function useEffect() {}

export function useContext() {
  return undefined;
}

export function useRef(v) {
  return { current: v };
}

export function useCallback(fn) {
  return fn;
}

export function useMemo(fn) {
  return fn();
}

export function useReducer(reducer, init) {
  const [s, set] = useState(init);
  return [s, (a) => set((v) => reducer(v, a))];
}

export default {
  useState, useEffect, useContext, useRef, useCallback, useMemo, useReducer,
};
