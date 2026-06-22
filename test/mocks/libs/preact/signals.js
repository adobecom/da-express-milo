export function signal(v) {
  return {
    value: v,
    peek() { return v; },
    subscribe() { return () => {}; },
  };
}

export function computed(fn) {
  return signal(fn());
}

export function effect(fn) {
  fn();
  return () => {};
}

export function batch(fn) {
  return fn();
}

export default { signal, computed, effect, batch };
