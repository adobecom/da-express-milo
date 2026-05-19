export default function createTestHistoryService(limit = 200) {
  let entries = [];
  let index = -1;

  function trimToLimit() {
    if (entries.length <= limit) return;

    const overflow = entries.length - limit;
    entries = entries.slice(overflow);
    index = Math.max(-1, index - overflow);
  }

  return {
    push(state) {
      entries = [...entries.slice(0, index + 1), state];
      index = entries.length - 1;
      trimToLimit();
      return entries[index] ?? null;
    },
    undo() {
      if (index <= 0) return null;
      index -= 1;
      return entries[index];
    },
    redo() {
      if (index === -1 || index >= entries.length - 1) return null;
      index += 1;
      return entries[index];
    },
    canUndo() {
      return index > 0;
    },
    canRedo() {
      return index >= 0 && index < entries.length - 1;
    },
    clear() {
      entries = [];
      index = -1;
    },
    getCurrent() {
      return index >= 0 ? entries[index] : null;
    },
    getSize() {
      return {
        past: Math.max(index, 0),
        future: index >= 0 ? entries.length - index - 1 : 0,
      };
    },
  };
}
