// eslint-disable-next-line import/prefer-default-export
export function createEventBus(dispatchTarget, prefix = '') {
  const listeners = new Map();

  function on(event, cb) {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event).push(cb);
  }

  function emit(event, detail = {}) {
    (listeners.get(event) ?? []).forEach((cb) => {
      try {
        cb(detail);
      } catch (err) {
        const tag = prefix || 'event-bus';
        window.lana?.log(`Event bus error [${tag}:${event}]: ${err.message}`, {
          tags: `${tag},events`,
        });
      }
    });

    const eventName = prefix ? `${prefix}:${event}` : event;
    dispatchTarget.dispatchEvent(new CustomEvent(eventName, {
      detail, bubbles: true, composed: true,
    }));
  }

  function destroy() {
    listeners.clear();
  }

  return { on, emit, destroy };
}
