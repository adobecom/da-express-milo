import { createExpressTextfield } from '../../../scripts/color-shared/spectrum/components/express-textfield.js';
import { createExpressSlider } from '../../../scripts/color-shared/spectrum/components/express-slider.js';
import createCategoryAccordion from './createCategoryAccordion.js';
import { CATEGORIES } from '../unicode-styles.js';

const MAX_CHARS = 2200;
const DEFAULT_FONT_SIZE = 24;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 72;

const SUGGESTIONS = [
  'Hello World',
  'Typography',
  'Beautiful',
  'Adobe Express',
  'Creative',
  'こんにちは',
];

/**
 * Builds the left side panel: textarea + char counter + suggestion pills + font-size slider + category accordion.
 *
 * @param {{ onInput: (text: string) => void, onFontSize: (size: number) => void, onCategory: (id: string) => void }} callbacks
 * @returns {Promise<{ element: HTMLElement, getValue: () => string, destroy: () => void }>}
 */
export default async function createSidePanel({ onInput, onFontSize, onCategory }) {
  const panel = document.createElement('div');
  panel.classList.add('fg-side-panel');

  // ── Textarea via Spectrum textfield ────────────────────────────────────────
  const textfieldWrapper = await createExpressTextfield({
    placeholder: 'Type or paste your text here…',
    multiline: true,
    maxlength: MAX_CHARS,
    size: 'l',
    onInput: ({ value }) => {
      const capped = value.slice(0, MAX_CHARS);
      updateCounter(capped.length);
      onInput(capped);
    },
  });
  panel.append(textfieldWrapper.element);

  // ── Character counter ──────────────────────────────────────────────────────
  const counter = document.createElement('p');
  counter.classList.add('fg-char-counter');
  counter.setAttribute('aria-live', 'polite');
  counter.textContent = `0 / ${MAX_CHARS}`;
  panel.append(counter);

  const updateCounter = (count) => {
    counter.textContent = `${count} / ${MAX_CHARS}`;
    counter.classList.toggle('fg-char-counter--near-limit', count >= MAX_CHARS * 0.9);
  };

  // ── Suggestion pills ───────────────────────────────────────────────────────
  const suggestionsRow = document.createElement('div');
  suggestionsRow.classList.add('fg-suggestions');

  const tryLabel = document.createElement('span');
  tryLabel.classList.add('fg-suggestions-label');
  tryLabel.textContent = 'Try these:';
  suggestionsRow.append(tryLabel);

  SUGGESTIONS.forEach((text) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.classList.add('fg-suggestion-pill');
    pill.textContent = text;
    pill.addEventListener('click', () => {
      textfieldWrapper.setValue(text);
      updateCounter(text.length);
      onInput(text);
    });
    suggestionsRow.append(pill);
  });

  panel.append(suggestionsRow);

  // ── Font size slider ───────────────────────────────────────────────────────
  const sliderSection = document.createElement('div');
  sliderSection.classList.add('fg-slider-section');

  const sliderLabel = document.createElement('label');
  sliderLabel.classList.add('fg-slider-label');
  sliderLabel.textContent = 'Preview font size';
  sliderSection.append(sliderLabel);

  const sliderInstance = await createExpressSlider({
    value: DEFAULT_FONT_SIZE,
    min: MIN_FONT_SIZE,
    max: MAX_FONT_SIZE,
    step: 1,
    label: 'Preview font size',
    onInput: ({ value }) => onFontSize(Number(value)),
    onChange: ({ value }) => onFontSize(Number(value)),
  });
  sliderSection.append(sliderInstance.element);
  panel.append(sliderSection);

  // ── Category accordion ─────────────────────────────────────────────────────
  const accordion = createCategoryAccordion(CATEGORIES, onCategory);
  panel.append(accordion.element);

  return {
    element: panel,
    getValue: () => textfieldWrapper.getValue(),
    destroy: () => {
      textfieldWrapper.destroy();
      sliderInstance.destroy();
      accordion.destroy();
      panel.remove();
    },
  };
}
