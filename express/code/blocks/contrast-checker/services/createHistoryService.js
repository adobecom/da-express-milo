export default function createHistoryService(limit = 200) {
  let past = [];
  let current = null;
  let future = [];

  function push(state) {
    if (current !== null) {
      past.push(current);
    }
    current = state;
    future = [];
    if (past.length > limit) {
      past.shift();
    }
  }

  function undo() {
    if (past.length === 0) return null;
    future.push(current);
    current = past.pop();
    return current;
  }

  function redo() {
    if (future.length === 0) return null;
    past.push(current);
    current = future.pop();
    return current;
  }

  function canUndo() {
    return past.length > 0;
  }

  function canRedo() {
    return future.length > 0;
  }

  function getCurrent() {
    return current;
  }

  function clear() {
    past = [];
    future = [];
    current = null;
  }

  function getSize() {
    return { past: past.length, future: future.length };
  }

  return {
    push,
    undo,
    redo,
    canUndo,
    canRedo,
    getCurrent,
    clear,
    getSize,
  };
}
