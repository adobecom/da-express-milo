export function createLoadingStateManager() {
  const state = {
    litLoaded: false,
    apiCalled: false,
    dataLoaded: false,
    loading: false,
  };

  const listeners = {
    litLoaded: [],
    apiCalled: [],
    dataLoaded: [],
    loading: [],
  };

  function emit(event) {
    if (listeners[event]) {
      listeners[event].forEach(callback => callback(state[event]));
    }
  }

  function on(event, callback) {
    if (listeners[event]) {
      listeners[event].push(callback);
    }
  }

  function setLitLoaded() {
    state.litLoaded = true;
    emit('litLoaded');
  }

  function setApiCalled() {
    state.apiCalled = true;
    emit('apiCalled');
  }

  function setDataLoaded(loaded) {
    state.dataLoaded = loaded;
    emit('dataLoaded');
  }

  function setLoading(loading) {
    state.loading = loading;
    emit('loading');
  }

  function getState() {
    return { ...state };
  }

  function isLitLoaded() {
    return state.litLoaded || window.customElements?.get('color-palette') !== undefined;
  }

  function hasApiBeenCalled() {
    return state.apiCalled;
  }

  function isDataLoaded() {
    return state.dataLoaded;
  }

  function isLoading() {
    return state.loading;
  }

  return {
    on,
    setLitLoaded,
    setApiCalled,
    setDataLoaded,
    setLoading,
    getState,
    isLitLoaded,
    hasApiBeenCalled,
    isDataLoaded,
    isLoading,
  };
}

export const globalLoadingState = createLoadingStateManager();
