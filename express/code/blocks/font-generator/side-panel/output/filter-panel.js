import { transformText, getFontById, getCategories } from '../../unicodeEngine.js';
import { getState, setState, subscribe } from '../../state.js';
import { getLibs } from '../../../../scripts/utils.js';
import {
  trapFocus,
  disableBackgroundScroll,
  restoreBackgroundScroll,
} from '../../../../scripts/color-shared/spectrum/utils/a11y.js';

const FONT_SHEET_PATH = '/express/code/blocks/font-generator/font-sheets/font-styles.json';
const BASE_PATH = '/express/code/blocks/font-generator/side-panel';

const STYLESHEET_HREF = `${BASE_PATH}/output/filter-panel.css`;

function injectStyles() {
  if (document.querySelector(`link[href="${STYLESHEET_HREF}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLESHEET_HREF;
  document.head.appendChild(link);
}

const template = document.createElement('template');
template.innerHTML = `<div class="filter-panel">
  <div class="filter-panel-drag-handle" aria-hidden="true"></div>
  <button class="filter-panel-close" type="button" aria-label="Close">
    <svg class="filter-panel-close-icon" aria-hidden="true" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
  </button>
  <div class="div-2">
    <div class="categories-accordian">
      <div class="div-2">
        <div class="content-stack">
          <div class="spacing"></div>
          <div class="chevron"><svg class="s-chevron" aria-hidden="true" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.46967 9.53033C2.17678 9.23744 2.17678 8.76256 2.46967 8.46967L6.96967 3.96967C7.26256 3.67678 7.73744 3.67678 8.03033 3.96967L12.5303 8.46967C12.8232 8.76256 12.8232 9.23744 12.5303 9.53033C12.2374 9.82322 11.7626 9.82322 11.4697 9.53033L7.5 5.56066L3.53033 9.53033C3.23744 9.82322 2.76256 9.82322 2.46967 9.53033Z" fill="#292929" stroke="#292929" stroke-width="1" stroke-linejoin="round"/></svg></div>
          <div class="text-stack"><div class="title">Categories</div></div>
          <div class="spacing"></div>
        </div>
        <div class="asset-container">
          <div class="descoped-categories">
            <div class="font-category">
              <div class="container">
                <div class="label-wrapper">
                  <div class="label-2">All</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="sticky-promo">
    <div class="font-icon-container">
      <img class="icon-group" src="${BASE_PATH}/icon-example.svg" alt="" aria-hidden="true" />
      <div class="title-2"></div>
    </div>
    <a class="button" data-buttons-mode="m">
      <div class="text-frame"><div class="text"></div></div>
    </a>
  </div>
</div>`;

// Async-enhances a hardcoded fallback string from placeholders; keeps the
// fallback if the key is undefined, matching the pattern in font-generator.js.
async function getPlaceholder(key, fallback) {
  try {
    const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
    const { replaceKey } = await import(`${getLibs()}/features/placeholders.js`);
    return (await replaceKey(key, getConfig())) || fallback;
  } catch (e) {
    return fallback;
  }
}

async function fetchFontSheet() {
  const res = await fetch(FONT_SHEET_PATH);
  if (!res.ok) return null;
  return res.json();
}

function buildCategoryCell(stylizedText, fontSize) {
  const cell = document.createElement('div');
  cell.className = 'font-category-cell';
  const inner = document.createElement('div');
  inner.className = 'text-container-2';
  const label = document.createElement('div');
  label.className = 'label-3';
  label.textContent = stylizedText;
  if (fontSize) label.style.fontSize = `${fontSize}px`;
  inner.append(label);
  cell.append(inner);
  return cell;
}

function fitLabelToCell(cell) {
  const label = cell.querySelector('.label-3');
  if (!label) return;

  const available = label.clientWidth;
  if (available === 0) return;

  label.style.whiteSpace = 'nowrap';
  const natural = label.scrollWidth;
  label.style.whiteSpace = '';

  if (natural <= available) return;

  const currentSize = parseFloat(getComputedStyle(label).fontSize);
  const scaled = Math.floor(currentSize * (available / natural));
  label.style.fontSize = `${Math.max(scaled, 8)}px`;
}

function populatePromo(panel, { promoTitle = '', promoCta = null } = {}) {
  const title = panel.querySelector('.sticky-promo .title-2');
  if (title) title.textContent = promoTitle;

  const cta = panel.querySelector('.sticky-promo .button');
  if (cta && promoCta) {
    cta.href = promoCta.href;
    const text = cta.querySelector('.text');
    if (text) text.textContent = promoCta.text;
  }
}

function selectCategory(panel, activeCell, category) {
  panel.querySelectorAll('.font-category, .font-category-cell').forEach((cell) => {
    cell.classList.remove('is-selected');
  });
  activeCell.classList.add('is-selected');
  setState({ activeFilters: category === 'all' ? [] : [category] });
}

function initCategorySelection(panel) {
  const allCell = panel.querySelector('.font-category');
  if (allCell) {
    allCell.classList.add('is-selected');
    allCell.addEventListener('click', () => selectCategory(panel, allCell, 'all'));
  }
}

function initAccordion(panel) {
  const header = panel.querySelector('.content-stack');
  const accordion = panel.querySelector('.categories-accordian');
  if (!header || !accordion) return;
  header.addEventListener('click', () => accordion.classList.toggle('is-collapsed'));
}

async function populateCategories(panel, categoryStyles = {}) {
  const [sheet, allText] = await Promise.all([
    fetchFontSheet(),
    getPlaceholder('all', 'All'),
  ]);
  if (!sheet?.fonts) return;

  const allLabelEl = panel.querySelector('.font-category .label-2');
  if (allLabelEl) allLabelEl.textContent = allText;

  const allStyle = categoryStyles.all ?? {};
  if (allStyle.fontId) {
    const allFontDef = getFontById(sheet.fonts, allStyle.fontId);
    const allLabel = panel.querySelector('.font-category .label-2');
    if (allFontDef && allLabel) {
      allLabel.textContent = transformText(allLabel.textContent, allFontDef);
      if (allStyle.fontSize) allLabel.style.fontSize = `${allStyle.fontSize}px`;
    }
  }

  const categories = getCategories(sheet.fonts);
  const grid = panel.querySelector('.descoped-categories');
  if (!grid) return;

  const cells = [];
  for (const { category, fontId } of categories) {
    const styleConfig = categoryStyles[category.toLowerCase()] ?? {};
    const resolvedFontDef = getFontById(sheet.fonts, styleConfig.fontId ?? fontId);
    const stylizedText = resolvedFontDef ? transformText(category, resolvedFontDef) : category;
    const cell = buildCategoryCell(stylizedText, styleConfig.fontSize);
    cell.addEventListener('click', () => selectCategory(panel, cell, category));
    grid.append(cell);
    cells.push(cell);
  }

  requestAnimationFrame(() => cells.forEach(fitLabelToCell));
}

// The docked drawer (< 1200px) behaves like a modal while open: focus is
// trapped inside it and the background can't scroll. At 1200px+ the panel is
// inline and permanently visible, so none of that modal behavior applies.
function isDockedDrawer() {
  return !window.matchMedia('(min-width: 1200px)').matches;
}

// Below 600px the drawer is a bottom sheet dismissed by dragging its handle
// down; at 600-1199px it's a side drawer dismissed by the close (×) button.
function isBottomSheet() {
  return !window.matchMedia('(min-width: 600px)').matches;
}

// The close (×) button dismisses the drawer. Hidden via CSS at >=1200px (and
// on the mobile bottom sheet, where the drag handle takes over).
function initCloseButton(panel) {
  panel.querySelector('.filter-panel-close')?.addEventListener('click', () => {
    setState({ filtersOpen: false });
  });
}

// Escape closes the drawer when it is open. No-op at >=1200px, where the panel
// is inline and filtersOpen never gets set true. Registered once per page
// regardless of how many filter panels are mounted.
let escapeListenerAttached = false;
function initEscapeToClose() {
  if (escapeListenerAttached) return;
  escapeListenerAttached = true;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && getState().filtersOpen) {
      setState({ filtersOpen: false });
    }
  });
}

// Swipe-down-to-dismiss for the mobile bottom sheet. No-op at 600px+, where
// the handle is hidden via CSS and this never receives a pointer event.
function initDragHandle(panel) {
  const handle = panel.querySelector('.filter-panel-drag-handle');
  if (!handle) return;

  function onDragStart(e) {
    if (!isBottomSheet()) return;
    const startY = e.touches?.[0]?.clientY ?? e.clientY;
    const dragAc = new AbortController();

    const onMove = (moveEvent) => {
      const delta = (moveEvent.touches?.[0]?.clientY ?? moveEvent.clientY) - startY;
      if (delta > 0) panel.style.transform = `translateY(${delta}px)`;
    };

    const onEnd = (endEvent) => {
      const endY = endEvent.changedTouches?.[0]?.clientY ?? endEvent.clientY;
      panel.style.transform = '';
      if (endY - startY > 100) setState({ filtersOpen: false });
      dragAc.abort();
    };

    window.addEventListener('touchmove', onMove, { passive: true, signal: dragAc.signal });
    window.addEventListener('touchend', onEnd, { signal: dragAc.signal });
    window.addEventListener('mousemove', onMove, { signal: dragAc.signal });
    window.addEventListener('mouseup', onEnd, { signal: dragAc.signal });
  }

  handle.addEventListener('touchstart', onDragStart, { passive: true });
  handle.addEventListener('mousedown', onDragStart);
}

// Dark scrim behind the docked drawer (< 1200px); clicking it closes the
// drawer, same as the close button or Escape.
function createOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'filter-panel-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.addEventListener('click', () => setState({ filtersOpen: false }));
  return overlay;
}

export default function createFilterPanel(config = {}) {
  injectStyles();
  const panel = template.content.firstElementChild.cloneNode(true);
  // Guard against FOUC: hide until the stylesheet is ready, then let CSS take over.
  panel.style.visibility = 'hidden';
  const cssLink = document.querySelector(`link[href="${STYLESHEET_HREF}"]`);
  if (cssLink?.sheet) {
    panel.style.visibility = '';
  } else {
    cssLink?.addEventListener('load', () => { panel.style.visibility = ''; }, { once: true });
  }
  initCategorySelection(panel);
  initAccordion(panel);
  initCloseButton(panel);
  initDragHandle(panel);
  populatePromo(panel, config);
  populateCategories(panel, config.categoryStyles ?? {});
  panel.classList.toggle('is-loading', getState().loading);

  const overlay = createOverlay();

  // Focus trap / scroll lock only ever apply to this panel instance, so they
  // live in this closure rather than the module-level helpers above.
  let focusTrap = null;
  let previouslyFocused = null;

  function syncOpenState(filtersOpen) {
    const isOpen = Boolean(filtersOpen);
    panel.classList.toggle('is-open', isOpen);
    overlay.classList.toggle('is-open', isOpen);

    if (!isDockedDrawer()) return;

    if (isOpen && !focusTrap) {
      previouslyFocused = document.activeElement;
      disableBackgroundScroll();
      focusTrap = trapFocus(panel);
    } else if (!isOpen && focusTrap) {
      restoreBackgroundScroll();
      focusTrap.release();
      focusTrap = null;
      previouslyFocused?.focus();
      previouslyFocused = null;
    }
  }

  const unsubscribe = subscribe((state) => {
    syncOpenState(state.filtersOpen);
    panel.classList.toggle('is-loading', state.loading);
  });
  initEscapeToClose();

  return {
    panel,
    overlay,
    unsubscribe() {
      unsubscribe();
      // Release any active trap/lock if the panel is torn down while open.
      if (focusTrap) {
        restoreBackgroundScroll();
        focusTrap.release();
        focusTrap = null;
      }
    },
  };
}
