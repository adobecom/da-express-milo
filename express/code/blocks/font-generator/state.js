// @import { State, StateUpdate, StateListener } from './types.js'

import {
  INITIAL_VISIBLE_COUNT,
  DEFAULT_LAYOUT,
  DEFAULT_FONT_SIZE,
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
} from './types.js';

/** @type {State} */
let state = {
  previewText: '',
  activeFilters: [],
  filtersOpen: false,
  loading: false,
  layout: DEFAULT_LAYOUT,
  fontSize: DEFAULT_FONT_SIZE,
  allFonts: [],
  activeFonts: [],
  visibleCount: INITIAL_VISIBLE_COUNT,
};

/** @type {Set<function>} */
const listeners = new Set();

function normalizeFontSize(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(parsed)));
}

/** @returns {State} */
export function getState() {
  return { ...state };
}

/**
 * @param {StateUpdate} update
 */
export function setState(update) {
  const normalizedUpdate = { ...update };
  if (normalizedUpdate.fontSize !== undefined) {
    const fontSize = normalizeFontSize(normalizedUpdate.fontSize);
    if (fontSize === undefined) delete normalizedUpdate.fontSize;
    else normalizedUpdate.fontSize = fontSize;
  }

  const filtersChanged = normalizedUpdate.activeFilters !== undefined
    && normalizedUpdate.activeFilters !== state.activeFilters;

  state = { ...state, ...normalizedUpdate };

  if (filtersChanged) {
    state = { ...state, visibleCount: INITIAL_VISIBLE_COUNT };
  }

  listeners.forEach((fn) => fn(state));
}

/**
 * @param {function(State): void} listener
 * @returns {function(): void} unsubscribe
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function initFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const text = params.get('text');
  const filters = params.get('filters');
  const view = params.get('view');
  const fontSize = params.get('fontSize');

  const mobileLayout = window.matchMedia('(max-width: 899px)').matches ? 'list' : 'grid';
  const defaultLayout = view === 'grid' || view === 'list' ? view : mobileLayout;

  setState({
    ...(text && { previewText: text }),
    ...(filters && { activeFilters: filters.split(',').filter(Boolean) }),
    layout: defaultLayout,
    ...(fontSize && Number.isFinite(Number(fontSize)) && { fontSize }),
  });
}
