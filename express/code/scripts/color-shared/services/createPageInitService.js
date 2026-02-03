export function createPageInitService() {
  const urlParams = new URLSearchParams(window.location.search);
  
  function getInitialQuery() {
    return urlParams.get('q') || urlParams.get('query') || '';
  }

  function getInitialFilters() {
    const filters = {};
    
    if (urlParams.has('category')) {
      filters.category = urlParams.get('category');
    }
    
    if (urlParams.has('mood')) {
      filters.mood = urlParams.get('mood');
    }
    
    if (urlParams.has('color')) {
      filters.color = urlParams.get('color');
    }
    
    return Object.keys(filters).length > 0 ? filters : null;
  }

  function hasDeepLinkParams() {
    return urlParams.has('q') || 
           urlParams.has('query') || 
           urlParams.has('category') || 
           urlParams.has('mood') || 
           urlParams.has('color');
  }

  function getInitialState() {
    return {
      query: getInitialQuery(),
      filters: getInitialFilters(),
      hasParams: hasDeepLinkParams(),
    };
  }

  function dispatchInitEvent(state) {
    const event = new CustomEvent('color:init', {
      detail: state,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

  function initialize() {
    const state = getInitialState();
    
    if (state.hasParams) {
      dispatchInitEvent(state);
    }
    
    return state;
  }

  return {
    getInitialQuery,
    getInitialFilters,
    hasDeepLinkParams,
    getInitialState,
    initialize,
  };
}
