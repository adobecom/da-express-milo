// @import { State, StateUpdate, StateListener } from './types.js'

import { INITIAL_VISIBLE_COUNT, DEFAULT_LAYOUT, DEFAULT_FONT_SIZE } from './types.js';

/** @type {State} */
let state = {
  previewText: '',
  activeFilters: [],
  filtersOpen: false,
  layout: DEFAULT_LAYOUT,
  fontSize: DEFAULT_FONT_SIZE,
  activeFonts: [],
  visibleCount: INITIAL_VISIBLE_COUNT,
};

/** @type {Set<function>} */
const listeners = new Set();

/** @returns {State} */
export function getState() {
  return { ...state };
}

/**
 * @param {StateUpdate} update
 */
export function setState(update) {
  const filtersChanged = update.activeFilters !== undefined
    && update.activeFilters !== state.activeFilters;

  state = { ...state, ...update };

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
  const layout = params.get('layout');
  const fontSize = params.get('fontSize');

  setState({
    ...(text && { previewText: text }),
    ...(filters && { activeFilters: filters.split(',').filter(Boolean) }),
    ...(layout === 'list' && { layout: 'list' }),
    ...(fontSize && !Number.isNaN(+fontSize) && { fontSize: +fontSize }),
  });
}
