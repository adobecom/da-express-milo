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
</div>`;

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

export function createSidePanel(config = {}) {
  injectStyles();
  const panel = template.content.firstElementChild.cloneNode(true);
  initResizeHandle(panel);
  initTextAreaCounter(panel);
  populateSuggestions(panel, config.suggestions);
  initSuggestionPills(panel);
  return panel;
}
