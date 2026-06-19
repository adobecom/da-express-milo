import { transformText, getFontById, getCategories } from '../../unicodeEngine.js';
import { setState } from '../../state.js';

const FONT_SHEET_PATH = '/express/code/blocks/font-generator/font-sheets/v2/v2.json';
const BASE_PATH = '/express/code/blocks/font-generator/side-panel';

const STYLESHEET_HREF = `${BASE_PATH}/output/side-panel.css`;

function injectStyles() {
  if (document.querySelector(`link[href="${STYLESHEET_HREF}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLESHEET_HREF;
  document.head.appendChild(link);
}

const template = document.createElement('template');
template.innerHTML = `<div class="font-generator-side">
  <div class="text-field">
    <div class="text-area-l-in-line">
      <div class="field">
        <textarea class="label" placeholder="Type the preview text you want to get started..." maxlength="200"></textarea>
        <div class="counter-expander">
          <div class="character-count">0/200</div>
        </div>
        <div class="resize-handle" aria-hidden="true"></div>
      </div>
      <div class="suggestions-bar">
        <div class="text-wrapper">Try these:</div>
        <div class="tags-fade">
          <div class="tags-wrap"></div>
        </div>
      </div>
    </div>
  </div>
  <div class="div-2">
    <div class="categories-accordian">
      <div class="div-2">
        <div class="content-stack">
          <div class="spacing"></div>
          <div class="chevron"><svg class="s-chevron" aria-hidden="true" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.46967 9.53033C2.17678 9.23744 2.17678 8.76256 2.46967 8.46967L6.96967 3.96967C7.26256 3.67678 7.73744 3.67678 8.03033 3.96967L12.5303 8.46967C12.8232 8.76256 12.8232 9.23744 12.5303 9.53033C12.2374 9.82322 11.7626 9.82322 11.4697 9.53033L7.5 5.56066L3.53033 9.53033C3.23744 9.82322 2.76256 9.82322 2.46967 9.53033Z" fill="#292929" stroke="#292929" stroke-width="1" stroke-linejoin="round"/></svg></div>
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

async function fetchFontSheet() {
  const res = await fetch(FONT_SHEET_PATH);
  if (!res.ok) return null;
  return res.json();
}

function buildCategoryCell(stylizedText) {
  const cell = document.createElement('div');
  cell.className = 'font-category-cell';
  const inner = document.createElement('div');
  inner.className = 'text-container-2';
  const label = document.createElement('div');
  label.className = 'label-3';
  label.textContent = stylizedText;
  inner.append(label);
  cell.append(inner);
  return cell;
}

function buildSuggestionPill(text) {
  const pill = document.createElement('div');
  pill.className = 'tag-pills';
  const tag = document.createElement('div');
  tag.className = 'tag-m';
  const content = document.createElement('div');
  content.className = 'content';
  const container = document.createElement('div');
  container.className = 'text-container';
  const label = document.createElement('p');
  label.className = 'div';
  label.textContent = text;
  container.append(label);
  content.append(container);
  tag.append(content);
  pill.append(tag);
  return pill;
}

function populateSuggestions(panel, suggestions = []) {
  const wrap = panel.querySelector('.tags-wrap');
  if (!wrap) return;
  suggestions.forEach((text) => wrap.append(buildSuggestionPill(text)));
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

function initResizeHandle(panel) {
  const textarea = panel.querySelector('textarea.label');
  const handle = panel.querySelector('.resize-handle');
  if (!textarea || !handle) return;

  handle.addEventListener('mousedown', (e) => {
    const startY = e.clientY;
    const startHeight = textarea.offsetHeight;

    const onMove = (moveEvent) => {
      const newHeight = Math.max(104, startHeight + (moveEvent.clientY - startY));
      textarea.style.height = `${newHeight}px`;
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  });
}

function initTextAreaCounter(panel) {
  const textarea = panel.querySelector('textarea.label');
  const counter = panel.querySelector('.character-count');
  if (!textarea || !counter) return;
  const max = textarea.maxLength;
  textarea.addEventListener('input', () => {
    counter.textContent = `${textarea.value.length}/${max}`;
  });
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

function initSuggestionPills(panel) {
  const textarea = panel.querySelector('textarea.label');
  const counter = panel.querySelector('.character-count');
  if (!textarea) return;

  panel.querySelector('.tags-wrap')?.addEventListener('click', (e) => {
    const pill = e.target.closest('.tag-pills');
    if (!pill) return;
    const text = pill.querySelector('.div')?.textContent ?? '';
    textarea.value = text;
    if (counter) counter.textContent = `${text.length}/${textarea.maxLength}`;
    textarea.dispatchEvent(new Event('input'));
  });
}

function initAccordion(panel) {
  const header = panel.querySelector('.content-stack');
  const accordion = panel.querySelector('.categories-accordian');
  if (!header || !accordion) return;
  header.addEventListener('click', () => accordion.classList.toggle('is-collapsed'));
}

async function populateCategories(panel, categoryStyles = {}) {
  const sheet = await fetchFontSheet();
  if (!sheet?.fonts) return;

  const allStyleId = categoryStyles.all;
  if (allStyleId) {
    const allFontDef = getFontById(sheet.fonts, allStyleId);
    const allLabel = panel.querySelector('.font-category .label-2');
    if (allFontDef && allLabel) {
      allLabel.textContent = transformText(allLabel.textContent, allFontDef);
    }
  }

  const categories = getCategories(sheet.fonts);
  const grid = panel.querySelector('.descoped-categories');
  if (!grid) return;

  const cells = [];
  for (const { category, fontId } of categories) {
    const overrideId = categoryStyles[category.toLowerCase()];
    const resolvedFontDef = getFontById(sheet.fonts, overrideId ?? fontId);
    const stylizedText = resolvedFontDef ? transformText(category, resolvedFontDef) : category;
    const cell = buildCategoryCell(stylizedText);
    cell.addEventListener('click', () => selectCategory(panel, cell, category));
    grid.append(cell);
    cells.push(cell);
  }

  requestAnimationFrame(() => cells.forEach(fitLabelToCell));
}

export function createSidePanel(config = {}) {
  injectStyles();
  const panel = template.content.firstElementChild.cloneNode(true);
  initResizeHandle(panel);
  initTextAreaCounter(panel);
  initCategorySelection(panel);
  populateSuggestions(panel, config.suggestions);
  populatePromo(panel, config);
  initSuggestionPills(panel);
  initAccordion(panel);
  populateCategories(panel, config.categoryStyles ?? {});
  return panel;
}
