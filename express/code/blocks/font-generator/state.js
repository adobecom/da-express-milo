// @import { State, StateUpdate, StateListener } from './types.js'

import {
  INITIAL_VISIBLE_COUNT,
  DEFAULT_LAYOUT,
  DEFAULT_FONT_SIZE,
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
} from './types.js';

let allFonts = [];

const DEFAULTS = {
  previewText: '',
  activeFilters: [],
  layout: DEFAULT_LAYOUT,
  fontSize: DEFAULT_FONT_SIZE,
};

const URL_PARAMS = {
  previewText: 'text',
  activeFilters: 'filters',
  layout: 'layout',
  fontSize: 'size',
};

let state = {
  ...DEFAULTS,
  activeFonts: [],
  visibleCount: INITIAL_VISIBLE_COUNT,
};

const subscribers = new Set();

function deriveActiveFonts(activeFilters) {
  if (!activeFilters.length) return allFonts;
  return allFonts.filter((font) => activeFilters.includes(font.category));
}

// Clamp to the slider's supported range and round to a whole px; reject
// non-numeric input so a bad URL param (?size=large) can't poison the store.
function normalizeFontSize(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(parsed)));
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

/** @returns {State} */
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

/** @param {StateUpdate} updates */
export function setState(updates) {
  const next = { ...updates };

  if (next.fontSize !== undefined) {
    const size = normalizeFontSize(next.fontSize);
    if (size === undefined) delete next.fontSize;
    else next.fontSize = size;
  }

  const filtersChanged = 'activeFilters' in next;
  state = { ...state, ...next };

  if (filtersChanged) {
    state.activeFonts = deriveActiveFonts(state.activeFilters);
    state.visibleCount = INITIAL_VISIBLE_COUNT;
  }

  syncToUrl();
  notify();
}

/**
 * @param {StateListener} callback
 * @returns {() => void} unsubscribe
 */
export function subscribe(callback) {
  if (typeof callback !== 'function') return () => {};
  subscribers.add(callback);
  callback(getState());
  return () => subscribers.delete(callback);
}

// No layout param → default to list on narrow viewports (where the grid/list
// toggle is hidden and a single column reads better) and grid otherwise.
function resolveDefaultLayout() {
  const prefersList = window.matchMedia?.('(max-width: 899px)')?.matches;
  return prefersList ? 'list' : DEFAULTS.layout;
}

export function initFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const text = params.get(URL_PARAMS.previewText);
  if (text !== null) state.previewText = text;

  const filters = params.get(URL_PARAMS.activeFilters);
  if (filters) state.activeFilters = filters.split(',').filter(Boolean);

  const layout = params.get(URL_PARAMS.layout);
  state.layout = layout === 'grid' || layout === 'list' ? layout : resolveDefaultLayout();

  const fontSize = params.get(URL_PARAMS.fontSize);
  if (fontSize !== null) {
    const size = normalizeFontSize(fontSize);
    if (size !== undefined) state.fontSize = size;
  }

  state.activeFonts = deriveActiveFonts(state.activeFilters);
  state.visibleCount = INITIAL_VISIBLE_COUNT;
}

export function initFonts(fonts) {
  allFonts = fonts;
  state.activeFonts = deriveActiveFonts(state.activeFilters);
  notify();
}

export function getCategories() {
  return [...new Set(allFonts.map((f) => f.category))];
}
