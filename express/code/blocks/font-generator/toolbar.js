// @import { State } from './types.js'
import { getState, setState, subscribe } from './state.js';
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from './types.js';

const STYLESHEET_HREF = '/express/code/blocks/font-generator/toolbar.css';
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

function updateUrlParams(update) {
  const url = new URL(window.location.href);
  Object.entries(update).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    } else {
      url.searchParams.delete(key);
    }
  });
  window.history.replaceState(null, '', url);
}

// ─── Icons (currentColor so CSS drives fill/stroke per button state) ──────────

function makeGridIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');

  [
    [1, 1], [9, 1], [1, 9], [9, 9],
  ].forEach(([x, y]) => {
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', '6');
    rect.setAttribute('height', '6');
    rect.setAttribute('rx', '1');
    rect.setAttribute('stroke', 'currentColor');
    rect.setAttribute('stroke-width', '1.5');
    svg.append(rect);
  });

  return svg;
}

function makeRowIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');

  [[1, 2], [1, 9]].forEach(([x, y]) => {
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', '14');
    rect.setAttribute('height', '5');
    rect.setAttribute('rx', '1');
    rect.setAttribute('stroke', 'currentColor');
    rect.setAttribute('stroke-width', '1.5');
    svg.append(rect);
  });

  return svg;
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

export function createToolbar() {
  injectStyles();

  const toolbar = document.createElement('div');
  toolbar.className = 'font-generator-toolbar';

  // ── Left: layout toggles + active font count ────────────────────────────
  const leftGroup = document.createElement('div');
  leftGroup.className = 'toolbar-left';

  const btnGroup = document.createElement('div');
  btnGroup.className = 'toolbar-layout-group';
  btnGroup.setAttribute('role', 'group');
  btnGroup.setAttribute('aria-label', 'Card layout');

  const gridBtn = makeLayoutBtn('grid', 'Grid view', makeGridIcon());
  const rowBtn = makeLayoutBtn('list', 'Row view', makeRowIcon());
  btnGroup.append(gridBtn, rowBtn);

  const count = document.createElement('span');
  count.className = 'toolbar-count';
  count.setAttribute('aria-live', 'polite');

  leftGroup.append(btnGroup, count);

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

    count.textContent = `${activeFonts.length} styles`;
  }

  syncState(getState());

  // ── Events ───────────────────────────────────────────────────────────────

  gridBtn.addEventListener('click', () => {
    setState({ layout: 'grid' });
    updateUrlParams({ layout: 'grid' });
  });

  rowBtn.addEventListener('click', () => {
    setState({ layout: 'list' });
    updateUrlParams({ layout: 'list' });
  });

  const flushSize = debounce((value) => {
    setState({ fontSize: value });
    updateUrlParams({ fontSize: value });
  }, SLIDER_DEBOUNCE_MS);

  slider.addEventListener('input', () => {
    const value = Number(slider.value);
    sliderValue.textContent = `${value}px`;
    flushSize(value);
  });

  const unsubscribe = subscribe(syncState);

  return { toolbar, unsubscribe };
}
