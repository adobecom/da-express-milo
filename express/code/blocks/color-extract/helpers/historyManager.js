const MAX_HISTORY = 50;

/**
 * Simple undo/redo history stack for palette state.
 * Each snapshot is a plain object: { swatches: string[], mood: string }
 *
 * @param {(snapshot: object) => void} onRestore - Called when undo/redo restores a state
 * @param {(canUndo: boolean, canRedo: boolean) => void} onUpdate - Called when stack changes
 * @returns {{ push: Function, undo: Function, redo: Function, clear: Function }}
 */
export function createHistoryManager(onRestore, onUpdate) {
  const undoStack = [];
  const redoStack = [];

  function notify() {
    if (onUpdate) onUpdate(undoStack.length > 0, redoStack.length > 0);
  }

  function snapshot(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function push(state) {
    undoStack.push(snapshot(state));
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack.length = 0;
    notify();
  }

  function undo(currentState) {
    if (!undoStack.length) return;
    redoStack.push(snapshot(currentState));
    const prev = undoStack.pop();
    if (onRestore) onRestore(prev);
    notify();
  }

  function redo(currentState) {
    if (!redoStack.length) return;
    undoStack.push(snapshot(currentState));
    const next = redoStack.pop();
    if (onRestore) onRestore(next);
    notify();
  }

  function clear() {
    undoStack.length = 0;
    redoStack.length = 0;
    notify();
  }

  return { push, undo, redo, clear };
}
