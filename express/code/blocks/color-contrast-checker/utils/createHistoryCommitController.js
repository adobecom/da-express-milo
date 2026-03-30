function isSameState(a, b) {
  return a?.fg === b?.fg && a?.bg === b?.bg;
}

export default function createHistoryCommitController(
  historyService,
  { debounceMs = 300, onUpdate } = {},
) {
  let timerId = null;
  let pendingState = null;

  function notifyUpdate() {
    onUpdate?.(historyService);
  }

  function clearTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function pushIfChanged(state) {
    if (!state || isSameState(state, historyService.getCurrent())) return false;

    historyService.push(state);
    notifyUpdate();
    return true;
  }

  function schedule(state) {
    pendingState = state;
    clearTimer();
    timerId = setTimeout(() => {
      timerId = null;
      const stateToPush = pendingState;
      pendingState = null;
      pushIfChanged(stateToPush);
    }, debounceMs);
  }

  function flush() {
    if (timerId === null) return false;

    clearTimer();
    const stateToPush = pendingState;
    pendingState = null;
    return pushIfChanged(stateToPush);
  }

  function commit(state) {
    clearTimer();
    pendingState = null;
    return pushIfChanged(state);
  }

  function cancel() {
    clearTimer();
    pendingState = null;
  }

  return {
    schedule,
    flush,
    commit,
    cancel,
  };
}
