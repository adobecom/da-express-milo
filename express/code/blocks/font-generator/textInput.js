import { getState, setState, subscribe } from './state.js';

const BASE_PATH = '/express/code/blocks/font-generator';
const STYLESHEET_HREF = `${BASE_PATH}/textInput.css`;
const MAX_LENGTH = 200;
const DEBOUNCE_MS = 300;

function injectStyles() {
  if (document.querySelector(`link[href="${STYLESHEET_HREF}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLESHEET_HREF;
  document.head.appendChild(link);
}

const template = document.createElement('template');
template.innerHTML = `<div class="font-generator-text-input">
  <div class="text-field">
    <div class="text-area-l-in-line">
      <div class="field">
        <textarea class="label" maxlength="${MAX_LENGTH}"></textarea>
        <div class="counter-expander">
          <div class="character-count">0/${MAX_LENGTH}</div>
        </div>
        <div class="resize-handle" aria-hidden="true"></div>
      </div>
      <div class="suggestions-bar">
        <div class="text-wrapper"></div>
        <div class="tags-fade">
          <div class="tags-wrap"></div>
        </div>
      </div>
    </div>
  </div>
</div>`;

function buildSuggestionPill(text) {
  const pill = document.createElement('div');
  pill.className = 'tag-pills';
  pill.setAttribute('role', 'button');
  pill.setAttribute('tabindex', '0');
  pill.setAttribute('aria-label', text);
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

function syncCounter(textarea, counter) {
  counter.textContent = `${textarea.value.length}/${textarea.maxLength}`;
}

function initTextInput(panel) {
  const textarea = panel.querySelector('textarea.label');
  const counter = panel.querySelector('.character-count');
  if (!textarea || !counter) return () => {};

  // Restore state set by initFromUrl before this panel was created.
  const initial = getState().previewText;
  if (initial) {
    textarea.value = initial;
    syncCounter(textarea, counter);
  }

  let timer;
  const flush = (value) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      setState({ previewText: value });
    }, DEBOUNCE_MS);
  };

  textarea.addEventListener('input', () => {
    syncCounter(textarea, counter);
    flush(textarea.value);
  });

  return () => clearTimeout(timer);
}

function initSuggestionPills(panel, cancelPendingInput) {
  const textarea = panel.querySelector('textarea.label');
  const counter = panel.querySelector('.character-count');
  if (!textarea) return;

  const activate = (pill) => {
    const text = pill.querySelector('.div')?.textContent ?? '';
    const truncated = text.slice(0, MAX_LENGTH);
    cancelPendingInput();
    textarea.value = truncated;
    if (counter) syncCounter(textarea, counter);
    setState({ previewText: truncated });
  };

  const wrap = panel.querySelector('.tags-wrap');
  if (!wrap) return;

  wrap.addEventListener('click', (e) => {
    const pill = e.target.closest('.tag-pills');
    if (pill) activate(pill);
  });

  wrap.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const pill = e.target.closest('.tag-pills');
    if (!pill) return;
    e.preventDefault();
    activate(pill);
  });
}

function applyStrings(panel, strings = {}) {
  const textarea = panel.querySelector('textarea.label');
  if (textarea) {
    if (strings.previewPlaceholder) textarea.placeholder = strings.previewPlaceholder;
    if (strings.inputLabel) textarea.setAttribute('aria-label', strings.inputLabel);
  }
  const tryThese = panel.querySelector('.text-wrapper');
  if (tryThese && strings.tryThese) tryThese.textContent = strings.tryThese;
}

export default function createTextInput(config = {}) {
  injectStyles();
  const panel = template.content.firstElementChild.cloneNode(true);
  applyStrings(panel, config.strings);
  initResizeHandle(panel);
  const cancelPendingInput = initTextInput(panel);
  populateSuggestions(panel, config.suggestions);
  initSuggestionPills(panel, cancelPendingInput);
  panel.classList.toggle('is-loading', getState().loading);
  const unsubscribeLoading = subscribe(({ loading }) => panel.classList.toggle('is-loading', loading));
  const unsubscribe = () => {
    cancelPendingInput();
    unsubscribeLoading();
  };
  return { panel, unsubscribe };
}
