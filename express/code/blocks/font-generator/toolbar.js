// @import { State } from './types.js'
import { setState, subscribe } from './state.js';
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from './types.js';
import { DEFAULT_PLACEHOLDERS } from './placeholders.js';

const BLOCK_PATH = '/express/code/blocks/font-generator';
const STYLESHEET_HREF = `${BLOCK_PATH}/toolbar.css`;
const SLIDER_DEBOUNCE_MS = 60;

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected || document.querySelector(`link[href="${STYLESHEET_HREF}"]`)) return;
  stylesInjected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLESHEET_HREF;
  document.head.appendChild(link);
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─── Icons (loaded from block directory) ──────────────────────────────────────

function makeIcon(filename) {
  const img = document.createElement('img');
  img.src = `/express/code/icons/font-generator-${filename}`;
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  return img;
}

function makeLayoutBtn(layout, label, icon) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'toolbar-layout-btn';
  btn.dataset.layout = layout;
  btn.setAttribute('aria-label', label);
  btn.setAttribute('aria-pressed', 'false');
  btn.append(icon);
  return btn;
}

function setSliderFill(sliderEl, value) {
  const pct = ((value - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN)) * 100;
  sliderEl.style.setProperty('--fill', `${pct}%`);
}

// Single tab stop for the pair — arrow keys move focus between them.
// Mirrors filters.js's initArrowNav; tabindex itself is kept in sync with
// the active layout in syncState below, not here.
function initLayoutArrowNav(group) {
  group.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft'
      && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const btns = [...group.querySelectorAll('.toolbar-layout-btn')];
    const idx = btns.indexOf(e.target);
    if (idx === -1) return;
    e.preventDefault();
    const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    const next = btns[(idx + (forward ? 1 : -1) + btns.length) % btns.length];
    next.focus();
  });
}

export default function createToolbar({ panelId, strings = {} } = {}) {
  injectStyles();
  const s = { ...DEFAULT_PLACEHOLDERS, ...strings };

  const toolbar = document.createElement('div');
  toolbar.className = 'font-generator-toolbar';

  // ── Left: layout toggles + active font count + filter trigger ───────────
  const leftGroup = document.createElement('div');
  leftGroup.className = 'toolbar-left';

  const btnGroup = document.createElement('div');
  btnGroup.className = 'toolbar-layout-group';
  btnGroup.setAttribute('role', 'group');
  btnGroup.setAttribute('aria-label', s.layoutGroupLabel);

  const gridBtn = makeLayoutBtn('grid', s.gridViewLabel, makeIcon('grid.svg'));
  const rowBtn = makeLayoutBtn('list', s.rowViewLabel, makeIcon('row.svg'));
  btnGroup.append(gridBtn, rowBtn);
  initLayoutArrowNav(btnGroup);

  const count = document.createElement('span');
  count.className = 'toolbar-count';
  count.setAttribute('aria-live', 'polite');

  // Open/close is owned by panel.js (an imperative open()/close() API, not
  // shared store state) — the caller wires the click handler and keeps
  // aria-expanded in sync via panel.js's onOpenChange callback.
  const filterTrigger = document.createElement('button');
  filterTrigger.type = 'button';
  filterTrigger.className = 'font-generator-filter-trigger';
  filterTrigger.setAttribute('aria-haspopup', 'true');
  filterTrigger.setAttribute('aria-expanded', 'false');
  if (panelId) filterTrigger.setAttribute('aria-controls', panelId);

  const filterLabel = document.createElement('span');
  filterLabel.className = 'filter-trigger-label';
  filterLabel.textContent = s.filterTrigger;
  filterTrigger.setAttribute('aria-label', s.filterTrigger);
  filterTrigger.append(makeIcon('filter.svg'), filterLabel);

  leftGroup.append(btnGroup, count, filterTrigger);

  // ── Right: font size slider ──────────────────────────────────────────────
  const rightGroup = document.createElement('div');
  rightGroup.className = 'toolbar-right';

  const sliderId = 'font-generator-size-slider';

  const sliderLabel = document.createElement('label');
  sliderLabel.className = 'toolbar-slider-label';
  sliderLabel.htmlFor = sliderId;
  sliderLabel.textContent = s.fontSizeLabel;

  const sliderValue = document.createElement('span');
  sliderValue.className = 'toolbar-slider-value';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = sliderId;
  slider.className = 'toolbar-slider';
  slider.min = String(FONT_SIZE_MIN);
  slider.max = String(FONT_SIZE_MAX);
  slider.step = '1';

  rightGroup.append(sliderLabel, slider, sliderValue);
  toolbar.append(leftGroup, rightGroup);

  // ── State sync ───────────────────────────────────────────────────────────

  function syncState({
    layout, fontSize, activeFonts, activeFilters,
  }) {
    const isGrid = layout === 'grid';
    gridBtn.classList.toggle('is-active', isGrid);
    rowBtn.classList.toggle('is-active', !isGrid);
    gridBtn.setAttribute('aria-pressed', String(isGrid));
    rowBtn.setAttribute('aria-pressed', String(!isGrid));
    // Single tab stop — Tab lands on whichever button reflects the active
    // layout; arrow keys (initLayoutArrowNav) move focus to the other one.
    gridBtn.setAttribute('tabindex', isGrid ? '0' : '-1');
    rowBtn.setAttribute('tabindex', isGrid ? '-1' : '0');

    slider.value = String(fontSize);
    sliderValue.textContent = fontSize;
    setSliderFill(slider, fontSize);

    // activeFilters is single-select (0 or 1 category) — name it in the
    // count so a filtered result reads as a confirmation, not just a number.
    const [category] = activeFilters;
    count.textContent = category
      ? `${activeFonts.length} ${category} ${s.fontCountLabel}`
      : `${activeFonts.length} ${s.fontCountLabel}`;
  }

  // ── Events ───────────────────────────────────────────────────────────────
  // state.js owns URL sync centrally; these just write to the store.

  gridBtn.addEventListener('click', () => setState({ layout: 'grid' }));
  rowBtn.addEventListener('click', () => setState({ layout: 'list' }));

  const flushSize = debounce((value) => setState({ fontSize: value }), SLIDER_DEBOUNCE_MS);

  slider.addEventListener('input', () => {
    const value = Number(slider.value);
    sliderValue.textContent = value;
    setSliderFill(slider, value);
    flushSize(value);
  });

  const unsubscribe = subscribe(syncState);

  return { toolbar, filterTrigger, unsubscribe };
}
