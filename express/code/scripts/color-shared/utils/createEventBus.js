/**
 * Shared event bus factory — used by toolbar, renderers, and other color-shared consumers.
 *
 * @param {EventTarget} dispatchTarget  DOM node (or `document`) that receives CustomEvents
 * @param {string}      [prefix='']     Namespace prepended to CustomEvent names
 * @returns {{ on: Function, emit: Function }}
 */
// eslint-disable-next-line import/prefer-default-export
export function createEventBus(dispatchTarget, prefix = '') {
  const listeners = {};

  function on(event, cb) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
  }

  function emit(event, detail = {}) {
    (listeners[event] ?? []).forEach((cb) => {
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

  return { on, emit };
}
