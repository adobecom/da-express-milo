import { getState, setState } from './state.js';
import { DEFAULT_PLACEHOLDERS } from './placeholders.js';
import { attachRovingTabIndex } from '../../scripts/color-shared/spectrum/utils/a11y.js';

const BASE_PATH = '/express/code/blocks/font-generator';
const STYLESHEET_HREF = `${BASE_PATH}/textInput.css`;
const DEBOUNCE_MS = 300;

// Unique-id counter so each instance's visible label associates with its own
// textarea (avoids duplicate ids if more than one input is ever rendered).
let instanceId = 0;

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
      <label class="preview-text-label"></label>
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
  const pills = suggestions.map((text) => {
    const pill = buildSuggestionPill(text);
    wrap.append(pill);
    return pill;
  });
  // Tab lands on the first pill; Arrow/Home/End then rove between the rest.
  attachRovingTabIndex(wrap, pills);
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
    // Read fresh per drag (not a hardcoded duplicate of the CSS value) so
    // this can never silently drift out of sync with --fg-textinput-height
    // the way a copy-pasted JS constant did before.
    const minHeight = parseFloat(getComputedStyle(textarea).getPropertyValue('--fg-textinput-height')) || startHeight;
    const ac = new AbortController();
    const { signal } = ac;

    const onMove = (moveEvent) => {
      // Block the page from scrolling while a touch drag resizes the textarea.
      if (moveEvent.cancelable) moveEvent.preventDefault();
      const newHeight = Math.max(minHeight, startHeight + (pointerY(moveEvent) - startY));
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
  const { length } = textarea.value;
  counter.textContent = `${length.toLocaleString()}/${textarea.maxLength.toLocaleString()}`;
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

// Toggles the left/right scroll fades on .tags-fade to match how far the
// pill row has scrolled, so a fade only appears on the side with more
// content to reveal (no fade at either scroll extreme).
function initTagsFade(panel) {
  const fade = panel.querySelector('.tags-fade');
  const wrap = panel.querySelector('.tags-wrap');
  if (!fade || !wrap) return () => {};

  const update = () => {
    const { scrollLeft, scrollWidth, clientWidth } = wrap;
    fade.classList.toggle('fade-left', scrollLeft > 0);
    fade.classList.toggle('fade-right', scrollLeft + clientWidth < scrollWidth - 1);
  };

  const ac = new AbortController();
  wrap.addEventListener('scroll', update, { passive: true, signal: ac.signal });
  window.addEventListener('resize', update, { signal: ac.signal });
  // createTextInput builds this panel while its ancestor container still has
  // font-generator.js's fg-loading class (display: none), and doesn't lose it
  // until a couple of awaits later — so wrap has no layout box yet here, and
  // scrollWidth/clientWidth would both read 0. A ResizeObserver's first
  // callback fires as soon as the element is actually measurable, whenever
  // that ends up being, rather than guessing a fixed delay.
  const ro = new ResizeObserver(update);
  ro.observe(wrap);
  ac.signal.addEventListener('abort', () => ro.disconnect());

  return () => ac.abort();
}

function initSuggestionPills(panel, cancelPendingInput) {
  const textarea = panel.querySelector('textarea.label');
  const counter = panel.querySelector('.character-count');
  const wrap = panel.querySelector('.tags-wrap');
  if (!textarea || !wrap) return;

  const clearActivePill = () => {
    wrap.querySelector('.tag-pills.is-active')?.classList.remove('is-active');
  };

  const activate = (pill) => {
    const text = pill.querySelector('.div')?.textContent ?? '';
    const truncated = text.slice(0, textarea.maxLength);
    cancelPendingInput();
    textarea.value = truncated;
    if (counter) syncCounter(textarea, counter);
    setState({ previewText: truncated });
    clearActivePill();
    pill.classList.add('is-active');
  };

  // Typing directly in the textarea deactivates whichever pill was selected,
  // since the previewed text no longer matches it. Setting .value from
  // activate() above doesn't fire 'input', so this only catches manual edits.
  textarea.addEventListener('input', clearActivePill);

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
  const previewLabel = panel.querySelector('.preview-text-label');
  if (previewLabel && strings.previewTextLabel) previewLabel.textContent = strings.previewTextLabel;
  const tryThese = panel.querySelector('.text-wrapper');
  if (tryThese && strings.tryThese) tryThese.textContent = strings.tryThese;
}

export default function createTextInput(config = {}) {
  injectStyles();
  const panel = template.content.firstElementChild.cloneNode(true);
  const textarea = panel.querySelector('textarea.label');
  textarea.maxLength = config.strings?.maxLength || DEFAULT_PLACEHOLDERS.maxLength;

  // Associate the visible "Preview Text" label with the textarea so it names
  // the field programmatically (clicking the label also focuses the input).
  instanceId += 1;
  const previewLabel = panel.querySelector('.preview-text-label');
  if (textarea && previewLabel) {
    const inputId = `font-generator-preview-input-${instanceId}`;
    textarea.id = inputId;
    previewLabel.htmlFor = inputId;
  }

  // Name the pill toolbar after the visible "Try these:" label rather than
  // duplicating that copy into a new aria-label.
  const tryThese = panel.querySelector('.text-wrapper');
  const tagsWrap = panel.querySelector('.tags-wrap');
  if (tryThese && tagsWrap) {
    const tryTheseId = `font-generator-try-these-${instanceId}`;
    tryThese.id = tryTheseId;
    tagsWrap.setAttribute('role', 'toolbar');
    tagsWrap.setAttribute('aria-labelledby', tryTheseId);
  }

  applyStrings(panel, config.strings);
  initResizeHandle(panel);
  const cancelPendingInput = initTextInput(panel);
  populateSuggestions(panel, config.suggestions);
  initSuggestionPills(panel, cancelPendingInput);
  const cancelTagsFade = initTagsFade(panel);
  return {
    panel,
    unsubscribe: () => {
      cancelPendingInput();
      cancelTagsFade();
    },
  };
}
