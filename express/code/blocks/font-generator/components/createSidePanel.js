const CATEGORIES = ['All', 'Popular', 'Cool', 'Fancy', 'Glitch', 'Symbol'];
const MAX_CHARS = 2200;
const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 72;
const FONT_SIZE_DEFAULT = 32;

const SUGGESTION_TAGS = [
  'Hello World',
  'Beautiful',
  'Stay Positive',
  'NEW POST',
  'Good Vibes',
  'Love & Life',
  'Happy Birthday',
];

export async function createSidePanel({ onStateChange, styleCount }) {
  const {
    loadTextfield,
    loadSlider,
    loadActionButton,
    loadTag,
  } = await import('../../../scripts/color-shared/spectrum/load-spectrum.js');

  await Promise.all([loadTextfield(), loadSlider(), loadActionButton(), loadTag()]);
  await Promise.all([
    customElements.whenDefined('sp-textfield'),
    customElements.whenDefined('sp-slider'),
    customElements.whenDefined('sp-action-button'),
    customElements.whenDefined('sp-tag'),
  ]);

  const state = { text: 'Hello', category: 'All', fontSize: FONT_SIZE_DEFAULT };

  function emit() {
    onStateChange({ ...state });
  }

  // ── Panel root ────────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.className = 'font-generator-panel';

  const card = document.createElement('div');
  card.className = 'font-panel-card';

  // ── Textarea ──────────────────────────────────────────────────────────────
  const textareaWrap = document.createElement('div');
  textareaWrap.className = 'font-panel-textarea-wrap';

  const textarea = document.createElement('sp-textfield');
  textarea.setAttribute('multiline', '');
  textarea.setAttribute('quiet', '');
  textarea.setAttribute('placeholder', 'Type the preview text you want to get started…');
  textarea.setAttribute('maxlength', String(MAX_CHARS));
  textarea.setAttribute('value', state.text);
  textarea.setAttribute('size', 'xl');

  const counter = document.createElement('p');
  counter.className = 'font-panel-counter';
  counter.textContent = `${state.text.length} / ${MAX_CHARS}`;

  textarea.addEventListener('input', () => {
    state.text = textarea.value;
    counter.textContent = `${state.text.length} / ${MAX_CHARS}`;
    emit();
  });

  textareaWrap.append(textarea, counter);

  // ── Suggestion tags ───────────────────────────────────────────────────────
  const suggestWrap = document.createElement('div');
  suggestWrap.className = 'font-panel-suggestions';

  const suggestLabel = document.createElement('p');
  suggestLabel.className = 'font-panel-label';
  suggestLabel.textContent = 'Try these:';
  suggestWrap.appendChild(suggestLabel);

  const tagRow = document.createElement('div');
  tagRow.className = 'font-panel-tag-row';
  SUGGESTION_TAGS.forEach((phrase) => {
    const tag = document.createElement('sp-tag');
    tag.textContent = phrase;
    tag.style.cursor = 'pointer';
    tag.addEventListener('click', () => {
      textarea.value = phrase;
      state.text = phrase;
      counter.textContent = `${state.text.length} / ${MAX_CHARS}`;
      emit();
    });
    tagRow.appendChild(tag);
  });
  suggestWrap.appendChild(tagRow);

  // ── Category pills ────────────────────────────────────────────────────────
  const categoryWrap = document.createElement('div');
  categoryWrap.className = 'font-panel-categories';

  const categoryLabel = document.createElement('p');
  categoryLabel.className = 'font-panel-label';
  categoryLabel.textContent = 'Categories';
  categoryWrap.appendChild(categoryLabel);

  const pillRow = document.createElement('div');
  pillRow.className = 'font-panel-pill-row';
  const pills = CATEGORIES.map((cat) => {
    const btn = document.createElement('sp-action-button');
    btn.textContent = cat;
    btn.dataset.category = cat;
    if (cat === 'All') btn.setAttribute('selected', '');
    btn.addEventListener('click', () => {
      pills.forEach((p) => p.removeAttribute('selected'));
      btn.setAttribute('selected', '');
      state.category = cat;
      emit();
    });
    pillRow.appendChild(btn);
    return btn;
  });
  categoryWrap.appendChild(pillRow);

  // ── Font count label ──────────────────────────────────────────────────────
  const countLabel = document.createElement('p');
  countLabel.className = 'font-panel-count-label';
  countLabel.textContent = `${styleCount} unicode fonts`;

  // ── Font size slider ──────────────────────────────────────────────────────
  const sliderWrap = document.createElement('div');
  sliderWrap.className = 'font-panel-slider-wrap';

  const sliderLabel = document.createElement('p');
  sliderLabel.className = 'font-panel-label';
  sliderLabel.textContent = 'Preview font size';
  sliderWrap.appendChild(sliderLabel);

  const slider = document.createElement('sp-slider');
  slider.setAttribute('min', String(FONT_SIZE_MIN));
  slider.setAttribute('max', String(FONT_SIZE_MAX));
  slider.setAttribute('step', '1');
  slider.value = FONT_SIZE_DEFAULT;
  slider.setAttribute('label', 'Preview font size');
  slider.addEventListener('input', () => {
    state.fontSize = Number(slider.value);
    emit();
  });
  sliderWrap.appendChild(slider);

  card.append(textareaWrap, suggestWrap, categoryWrap, countLabel, sliderWrap);

  // ── Promo strip ───────────────────────────────────────────────────────────
  const promo = document.createElement('div');
  promo.className = 'font-panel-promo';

  const promoText = document.createElement('p');
  promoText.textContent = 'Looking for more fonts?';

  const promoCta = document.createElement('a');
  promoCta.className = 'font-panel-promo-cta';
  promoCta.href = 'https://express.adobe.com/';
  promoCta.target = '_blank';
  promoCta.rel = 'noopener noreferrer';
  promoCta.textContent = 'Get Adobe Express Free';

  promo.append(promoText, promoCta);
  panel.append(card, promo);

  return { panel };
}
