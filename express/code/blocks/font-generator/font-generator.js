import FONTS from './fonts.js';

const CHAR_LIMIT = 2200;
const DEFAULT_TEXT = 'Hello';
const DEFAULT_FONT_SIZE = 48;
const CATEGORIES = ['All', 'Popular', 'Cool', 'Fancy', 'Glitch', 'Symbol'];
const COPY_RESET_MS = 1500;
const DESIGN_URL_BASE = 'https://express.adobe.com/sp/';
const DESIGN_STORAGE_KEY = 'font-generator-design-payload';

const SUGGESTIONS = [
  'The quick brown fox jumps over the lazy dog',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'Realigned equestrian fez bewilders picky monarch',
  'Roger, hungry: ate 236 peaches & cantaloupes in 1904!',
  'Voix ambiguë d\'un cœur qui au zéphyr préfère les jattes de kiwi',
  'Victor jagt zwölf Boxkämpfer quer über den großen Sylter Deich',
  'Quiere la boca exhausta vid, kiwi, piña y fugaz jamón',
];

// --- helpers ---

function buildDesignUrl(text, fontName) {
  const params = new URLSearchParams({ text, style: fontName });
  return `${DESIGN_URL_BASE}?${params.toString()}`;
}

function storeDesignPayload(text, fontName) {
  try {
    localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify({ text, style: fontName }));
  } catch {
    // localStorage unavailable — query params are the fallback
  }
}

function copyIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M7 2a1 1 0 0 0-1 1v1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2h2a1 1 0 0 0 1-1V7l-4-5H7zm7 5h-2V4.5L15.5 7H14zM5 6h1v1H5V6zm0 3h9v1H5V9zm0 3h9v1H5v-1zm0 3h6v1H5v-1z"/>
  </svg>`;
}

function checkIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M16.7 5.3a1 1 0 0 0-1.4 0L8 12.6 4.7 9.3a1 1 0 0 0-1.4 1.4l4 4a1 1 0 0 0 1.4 0l8-8a1 1 0 0 0 0-1.4z"/>
  </svg>`;
}

// --- build side panel ---

function buildSidePanel(state, onInput, onSuggestion, onCategory, onSizeChange) {
  const panel = document.createElement('div');
  panel.className = 'fg-panel';

  // Text input card
  const inputCard = document.createElement('div');
  inputCard.className = 'fg-input-card';

  const textarea = document.createElement('textarea');
  textarea.className = 'fg-textarea';
  textarea.placeholder = 'Type the preview text you want to get started...';
  textarea.maxLength = CHAR_LIMIT;
  textarea.rows = 3;
  textarea.value = state.text === DEFAULT_TEXT ? '' : state.text;
  textarea.setAttribute('aria-label', 'Preview text');

  const counterRow = document.createElement('div');
  counterRow.className = 'fg-counter-row';
  const counter = document.createElement('span');
  counter.className = 'fg-counter';
  counter.textContent = `${textarea.value.length}/${CHAR_LIMIT}`;
  counterRow.append(counter);

  const suggestionsBar = document.createElement('div');
  suggestionsBar.className = 'fg-suggestions';
  const tryLabel = document.createElement('span');
  tryLabel.className = 'fg-suggestions-label';
  tryLabel.textContent = 'Try these:';
  const pillsRow = document.createElement('div');
  pillsRow.className = 'fg-suggestion-pills';
  SUGGESTIONS.forEach((s) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'fg-suggestion-pill';
    pill.textContent = s;
    pill.addEventListener('click', () => onSuggestion(s));
    pillsRow.append(pill);
  });
  suggestionsBar.append(tryLabel, pillsRow);

  textarea.addEventListener('input', () => {
    counter.textContent = `${textarea.value.length}/${CHAR_LIMIT}`;
    onInput(textarea.value || DEFAULT_TEXT);
  });

  inputCard.append(textarea, counterRow, suggestionsBar);

  // Category filter accordion
  const filterPanel = document.createElement('div');
  filterPanel.className = 'fg-filter-panel';

  const accordionBtn = document.createElement('button');
  accordionBtn.type = 'button';
  accordionBtn.className = 'fg-accordion-btn';
  accordionBtn.setAttribute('aria-expanded', 'true');

  const chevron = document.createElement('span');
  chevron.className = 'fg-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  const btnLabel = document.createElement('span');
  btnLabel.textContent = 'Categories';
  accordionBtn.append(chevron, btnLabel);

  const categoryGrid = document.createElement('div');
  categoryGrid.className = 'fg-category-grid';

  CATEGORIES.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fg-category-btn';
    if (cat === state.category) btn.classList.add('selected');
    btn.dataset.category = cat;
    btn.setAttribute('aria-pressed', cat === state.category ? 'true' : 'false');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      filterPanel.querySelectorAll('.fg-category-btn').forEach((b) => {
        b.classList.toggle('selected', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      onCategory(cat);
    });
    categoryGrid.append(btn);
  });

  accordionBtn.addEventListener('click', () => {
    const expanded = accordionBtn.getAttribute('aria-expanded') === 'true';
    accordionBtn.setAttribute('aria-expanded', String(!expanded));
    categoryGrid.hidden = expanded;
  });

  filterPanel.append(accordionBtn, categoryGrid);

  // Font size slider
  const sliderRow = document.createElement('div');
  sliderRow.className = 'fg-slider-row';
  const sliderLabel = document.createElement('label');
  sliderLabel.className = 'fg-slider-label';
  sliderLabel.textContent = 'Preview font size';
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'fg-slider';
  slider.min = '16';
  slider.max = '72';
  slider.value = String(state.fontSize);
  slider.setAttribute('aria-label', 'Preview font size');
  const sliderValue = document.createElement('span');
  sliderValue.className = 'fg-slider-value';
  sliderValue.textContent = state.fontSize;
  slider.addEventListener('input', () => {
    sliderValue.textContent = slider.value;
    onSizeChange(Number(slider.value));
  });
  sliderRow.append(sliderLabel, slider, sliderValue);

  // Sticky promo
  const promo = document.createElement('div');
  promo.className = 'fg-promo';
  const promoText = document.createElement('span');
  promoText.className = 'fg-promo-text';
  promoText.textContent = 'Looking for more fonts?';
  const promoLink = document.createElement('a');
  promoLink.className = 'fg-promo-btn';
  promoLink.href = 'https://fonts.adobe.com/fonts';
  promoLink.target = '_blank';
  promoLink.rel = 'noopener noreferrer';
  promoLink.textContent = 'Get Adobe Express Free';
  promo.append(promoText, promoLink);

  panel.append(inputCard, filterPanel, sliderRow, promo);

  return { panel, textarea, counter };
}

// --- build card grid ---

function buildCard(font, text, fontSize) {
  const card = document.createElement('div');
  card.className = 'fg-card';

  const preview = document.createElement('div');
  preview.className = 'fg-card-preview';

  const previewText = document.createElement('p');
  previewText.className = 'fg-card-text';
  previewText.style.fontSize = `${fontSize}px`;
  previewText.textContent = font.transform(text);

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'fg-copy-btn';
  copyBtn.setAttribute('aria-label', `Copy ${font.name} style`);
  copyBtn.innerHTML = copyIcon();

  preview.append(previewText, copyBtn);

  const strip = document.createElement('div');
  strip.className = 'fg-card-strip';

  const fontName = document.createElement('span');
  fontName.className = 'fg-card-name';
  fontName.textContent = font.name;

  const transformedText = font.transform(text);

  const designBtn = document.createElement('a');
  designBtn.className = 'fg-design-btn';
  designBtn.target = '_blank';
  designBtn.rel = 'noopener noreferrer';
  designBtn.href = buildDesignUrl(transformedText, font.name);
  designBtn.setAttribute('aria-label', `Design with style: ${font.name}`);
  designBtn.innerHTML = '<span class="fg-design-icon" aria-hidden="true"></span><span>Design with style</span>';
  designBtn.addEventListener('click', () => storeDesignPayload(transformedText, font.name));

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(font.transform(text)).then(() => {
      copyBtn.innerHTML = checkIcon();
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.innerHTML = copyIcon();
        copyBtn.classList.remove('copied');
      }, COPY_RESET_MS);
    });
  });

  strip.append(fontName, designBtn);
  card.append(preview, strip);
  return card;
}

function renderCards(container, fonts, text, fontSize) {
  container.innerHTML = '';
  fonts.forEach((font) => {
    container.append(buildCard(font, text, fontSize));
  });
}

// --- main decorate ---

export default async function decorate(block) {
  const state = {
    text: DEFAULT_TEXT,
    category: 'All',
    fontSize: DEFAULT_FONT_SIZE,
  };

  const filteredFonts = () => (state.category === 'All'
    ? FONTS
    : FONTS.filter((f) => f.category.toLowerCase() === state.category.toLowerCase()));

  // Outer layout
  const layout = document.createElement('div');
  layout.className = 'fg-layout';

  // Card grid and count label — declared early so callbacks can reference them via closure
  const cardGrid = document.createElement('div');
  cardGrid.className = 'fg-card-grid';

  const countLabel = document.createElement('span');
  countLabel.className = 'fg-count';
  countLabel.textContent = `${FONTS.length} unicode fonts`;

  // Side panel
  const { panel, textarea } = buildSidePanel(
    state,
    (text) => {
      state.text = text;
      renderCards(cardGrid, filteredFonts(), state.text, state.fontSize);
    },
    (suggestion) => {
      textarea.value = suggestion;
      textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
    },
    (category) => {
      state.category = category;
      const filtered = filteredFonts();
      countLabel.textContent = `${filtered.length} unicode fonts`;
      renderCards(cardGrid, filtered, state.text, state.fontSize);
    },
    (size) => {
      state.fontSize = size;
      cardGrid.querySelectorAll('.fg-card-text').forEach((el) => {
        el.style.fontSize = `${size}px`;
      });
    },
  );

  // Card grid column
  const cardColumn = document.createElement('div');
  cardColumn.className = 'fg-cards-column';

  // Filter bar: count label + view toggle
  const filterBar = document.createElement('div');
  filterBar.className = 'fg-filter-bar';

  const viewToggle = document.createElement('div');
  viewToggle.className = 'fg-view-toggle';
  viewToggle.setAttribute('role', 'group');
  viewToggle.setAttribute('aria-label', 'Card layout');

  ['list', 'grid'].forEach((view, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fg-view-btn';
    btn.dataset.view = view;
    btn.setAttribute('aria-label', `${view} view`);
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    if (i === 0) btn.classList.add('active');
    btn.addEventListener('click', () => {
      viewToggle.querySelectorAll('.fg-view-btn').forEach((b) => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      cardGrid.dataset.view = view;
    });
    viewToggle.append(btn);
  });

  filterBar.append(countLabel, viewToggle);

  // Initial card render
  renderCards(cardGrid, filteredFonts(), state.text, state.fontSize);

  cardColumn.append(filterBar, cardGrid);
  layout.append(panel, cardColumn);

  block.innerHTML = '';
  block.append(layout);
}
