// ToDo: Replace with import from unicodeEngine.js
let allFonts;

const DEFAULTS = {
  previewText: 'Type the preview text you want to get started...',
  activeFilters: [],
  layout: 'grid',
  fontSize: 48,
};

const VISIBLE_COUNT_DEFAULT = 12;

const URL_PARAMS = {
  previewText: 'text',
  activeFilters: 'filters',
  layout: 'layout',
  fontSize: 'size',
};

let state = {
  ...DEFAULTS,
  activeFonts: allFonts ?? [],
  visibleCount: VISIBLE_COUNT_DEFAULT,
};

const subscribers = new Set();

function deriveActiveFonts(activeFilters) {
  const fonts = allFonts ?? [];
  if (!activeFilters.length) return fonts;
  return fonts.filter((font) => activeFilters.includes(font.category));
}

function syncToUrl() {
  const url = new URL(window.location.href);

  if (state.previewText) {
    url.searchParams.set(URL_PARAMS.previewText, state.previewText);
  } else {
    url.searchParams.delete(URL_PARAMS.previewText);
  }

  if (state.activeFilters.length) {
    url.searchParams.set(URL_PARAMS.activeFilters, state.activeFilters.join(','));
  } else {
    url.searchParams.delete(URL_PARAMS.activeFilters);
  }

  if (state.layout !== DEFAULTS.layout) {
    url.searchParams.set(URL_PARAMS.layout, state.layout);
  } else {
    url.searchParams.delete(URL_PARAMS.layout);
  }

  if (state.fontSize !== DEFAULTS.fontSize) {
    url.searchParams.set(URL_PARAMS.fontSize, state.fontSize);
  } else {
    url.searchParams.delete(URL_PARAMS.fontSize);
  }

  window.history.replaceState(null, '', url);
}

export function getState() {
  return {
    ...state,
    activeFilters: [...state.activeFilters],
    activeFonts: [...state.activeFonts],
  };
}

function notify() {
  const snapshot = getState();
  subscribers.forEach((cb) => cb(snapshot));
}

export function setState(updates) {
  const filtersChanged = 'activeFilters' in updates;
  state = { ...state, ...updates };

  if (filtersChanged) {
    state.activeFonts = deriveActiveFonts(state.activeFilters);
    state.visibleCount = VISIBLE_COUNT_DEFAULT;
  }

  syncToUrl();
  notify();
}

export function subscribe(callback) {
  if (typeof callback !== 'function') return () => {};
  subscribers.add(callback);
  callback(getState());
  return () => subscribers.delete(callback);
}

export function initFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const text = params.get(URL_PARAMS.previewText);
  if (text !== null) state.previewText = text;

  const filters = params.get(URL_PARAMS.activeFilters);
  if (filters) state.activeFilters = filters.split(',').filter(Boolean);

  const layout = params.get(URL_PARAMS.layout);
  if (layout === 'grid' || layout === 'list') state.layout = layout;

  const fontSize = params.get(URL_PARAMS.fontSize);
  if (fontSize !== null) {
    const parsed = Number(fontSize);
    if (!Number.isNaN(parsed)) state.fontSize = parsed;
  }

  state.activeFonts = deriveActiveFonts(state.activeFilters);
  state.visibleCount = VISIBLE_COUNT_DEFAULT;
}
