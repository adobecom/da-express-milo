import { getState, setState } from './state.js';
import { DEFAULT_PLACEHOLDERS } from './placeholders.js';

const BASE_PATH = '/express/code/blocks/font-generator';
const STYLESHEET_HREF = `${BASE_PATH}/textInput.css`;
const DEBOUNCE_MS = 300;
const MIN_TEXTAREA_HEIGHT = 104; // matches textInput.css .label min-height

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
        <textarea class="label"></textarea>
        <div class="counter-expander">
          <div class="character-count"></div>
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

// Pointer Y from either a mouse or a touch event.
function pointerY(e) {
  return e.touches?.[0]?.clientY ?? e.clientY;
}

function initResizeHandle(panel) {
  const textarea = panel.querySelector('textarea.label');
  const handle = panel.querySelector('.resize-handle');
  if (!textarea || !handle) return;

  const onStart = (e) => {
    const startY = pointerY(e);
    const startHeight = textarea.offsetHeight;
    const ac = new AbortController();
    const { signal } = ac;

    const onMove = (moveEvent) => {
      // Block the page from scrolling while a touch drag resizes the textarea.
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const newHeight = Math.max(MIN_TEXTAREA_HEIGHT, startHeight + (pointerY(moveEvent) - startY));
      textarea.style.height = `${newHeight}px`;
    };

    const onEnd = () => ac.abort();

    document.addEventListener('mousemove', onMove, { signal });
    document.addEventListener('mouseup', onEnd, { signal });
    document.addEventListener('touchmove', onMove, { passive: false, signal });
    document.addEventListener('touchend', onEnd, { signal });
    if (e.cancelable) e.preventDefault();
  };

  handle.addEventListener('mousedown', onStart);
  handle.addEventListener('touchstart', onStart, { passive: false });
}

function syncCounter(textarea, counter) {
  counter.textContent = `${textarea.value.length}/${textarea.maxLength}`;
}

function initTextInput(panel) {
  const textarea = panel.querySelector('textarea.label');
  const counter = panel.querySelector('.character-count');
  if (!textarea || !counter) return () => {};

  // Restore state set by initFromUrl before this panel was created, truncating
  // an overlong value (e.g. from a ?text= URL param) to the current limit.
  const initial = getState().previewText;
  if (initial) {
    const truncated = initial.slice(0, textarea.maxLength);
    textarea.value = truncated;
    if (truncated !== initial) setState({ previewText: truncated });
  }
  syncCounter(textarea, counter);

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
    const truncated = text.slice(0, textarea.maxLength);
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
  const textarea = panel.querySelector('textarea.label');
  textarea.maxLength = config.strings?.maxLength || DEFAULT_PLACEHOLDERS.maxLength;
  applyStrings(panel, config.strings);
  initResizeHandle(panel);
  const cancelPendingInput = initTextInput(panel);
  populateSuggestions(panel, config.suggestions);
  initSuggestionPills(panel, cancelPendingInput);
  return { panel, unsubscribe: cancelPendingInput };
}
