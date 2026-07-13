// @import { State } from './types.js'
import { setState, subscribe } from './state.js';
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from './types.js';

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

export default function createToolbar({ panelId, strings = {} } = {}) {
  injectStyles();

  const toolbar = document.createElement('div');
  toolbar.className = 'font-generator-toolbar';

  // ── Left: layout toggles + active font count + filter trigger ───────────
  const leftGroup = document.createElement('div');
  leftGroup.className = 'toolbar-left';

  const btnGroup = document.createElement('div');
  btnGroup.className = 'toolbar-layout-group';
  btnGroup.setAttribute('role', 'group');
  btnGroup.setAttribute('aria-label', 'Card layout');

  const gridBtn = makeLayoutBtn('grid', 'Grid view', makeIcon('grid.svg'));
  const rowBtn = makeLayoutBtn('list', 'Row view', makeIcon('row.svg'));
  btnGroup.append(gridBtn, rowBtn);

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
  if (strings.filterTrigger) {
    filterLabel.textContent = strings.filterTrigger;
    filterTrigger.setAttribute('aria-label', strings.filterTrigger);
  }
  filterTrigger.append(makeIcon('filter.svg'), filterLabel);

  leftGroup.append(btnGroup, count, filterTrigger);

  // ── Right: font size slider ──────────────────────────────────────────────
  const rightGroup = document.createElement('div');
  rightGroup.className = 'toolbar-right';

  const sliderId = 'font-generator-size-slider';

  const sliderLabel = document.createElement('label');
  sliderLabel.className = 'toolbar-slider-label';
  sliderLabel.htmlFor = sliderId;
  sliderLabel.textContent = 'Preview font size';

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

  function syncState({ layout, fontSize, activeFonts }) {
    const isGrid = layout === 'grid';
    gridBtn.classList.toggle('is-active', isGrid);
    rowBtn.classList.toggle('is-active', !isGrid);
    gridBtn.setAttribute('aria-pressed', String(isGrid));
    rowBtn.setAttribute('aria-pressed', String(!isGrid));

    slider.value = String(fontSize);
    sliderValue.textContent = `${fontSize}px`;
    setSliderFill(slider, fontSize);

    count.textContent = `${activeFonts.length} unicode fonts`;
  }

  // ── Events ───────────────────────────────────────────────────────────────
  // state.js owns URL sync centrally; these just write to the store.

  gridBtn.addEventListener('click', () => setState({ layout: 'grid' }));
  rowBtn.addEventListener('click', () => setState({ layout: 'list' }));

  const flushSize = debounce((value) => setState({ fontSize: value }), SLIDER_DEBOUNCE_MS);

  slider.addEventListener('input', () => {
    const value = Number(slider.value);
    sliderValue.textContent = `${value}px`;
    setSliderFill(slider, value);
    flushSize(value);
  });

  const unsubscribe = subscribe(syncState);

  return { toolbar, filterTrigger, unsubscribe };
}
