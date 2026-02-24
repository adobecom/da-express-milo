/**
 * Renders Figma 5806-89102 Palette summary: .ax-color-strip-summary-card with
 * one horizontal strip per card (up to 10 colors). Matches color-strip.css summary rules.
 */
/* eslint-disable import/prefer-default-export */
import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';

const MAX_PALETTES = 3;
const MAX_COLORS_PER_STRIP = 10;

function normalizeHex(c) {
  if (typeof c === 'string' && c.startsWith('#')) return c;
  if (typeof c === 'string') return `#${c}`;
  return '#000000';
}

/**
 * Pad colors to targetCount by repeating (Figma "up to 10"; first strip shows 10).
 */
function padColorsToCount(colors, targetCount) {
  const list = (colors || []).slice(0, targetCount);
  if (list.length >= targetCount) return list;
  const out = [...list];
  while (out.length < targetCount) {
    out.push(list[(out.length % list.length)]);
  }
  return out;
}

function buildSummaryStrip(colors, sizeModifier = '', padToTen = false) {
  const raw = (colors || []).slice(0, MAX_COLORS_PER_STRIP);
  const slice = padToTen ? padColorsToCount(raw, MAX_COLORS_PER_STRIP) : raw;
  const strip = createTag('div', { class: 'ax-color-strip ax-color-strip--horizontal' });
  const inner = createTag('div', { class: 'ax-color-strip__inner' });
  slice.forEach((c) => {
    const cell = createTag('div', { class: 'ax-color-strip__cell' });
    cell.style.backgroundColor = normalizeHex(c);
    inner.appendChild(cell);
  });
  strip.appendChild(inner);

  const stripClass = sizeModifier
    ? `ax-color-strip-summary-card__strip ax-color-strip-summary-card__strip--${sizeModifier}`
    : 'ax-color-strip-summary-card__strip';
  const stripWrap = createTag('div', { class: stripClass });
  stripWrap.appendChild(strip);
  return stripWrap;
}

function buildSummaryCard(palette, options = {}) {
  const colors = palette?.colors || [];
  const title = palette?.name || `Palette ${palette?.id ?? ''}`;
  const sizeModifier = options.sizeModifier || ''; // 'short' | 'mobile' | ''
  const padToTen = options.padToTen === true;
  const displayColors = padToTen
    ? padColorsToCount(colors, MAX_COLORS_PER_STRIP)
    : colors.slice(0, MAX_COLORS_PER_STRIP);
  const count = displayColors.length;

  const card = createTag('div', { class: 'ax-color-strip-summary-card' });
  const titleEl = createTag('div', { class: 'ax-color-strip-summary-card__title' });
  titleEl.textContent = title;
  card.appendChild(titleEl);

  const countEl = createTag('p', { class: 'ax-color-strip-summary-card__count' });
  countEl.textContent = `${count} color${count !== 1 ? 's' : ''}`;
  card.appendChild(countEl);

  const stripWrap = buildSummaryStrip(colors, sizeModifier, padToTen);
  card.appendChild(stripWrap);

  return card;
}

export function createPaletteSummaryRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData } = base;
  let listElement = null;

  function render(container) {
    container.innerHTML = '';
    container.classList.add('color-explorer-palette-summary');
    listElement = container;

    const data = getData().slice(0, MAX_PALETTES);
    const sizeModifiers = ['', 'short', 'mobile']; // Full, Short, Mobile per Figma variants
    data.forEach((palette, index) => {
      const card = buildSummaryCard(palette, {
        sizeModifier: sizeModifiers[index] || '',
        padToTen: index === 0, // First card always shows 10 colors (Figma: up to 10)
      });
      listElement.appendChild(card);
    });
  }

  function update(newData) {
    if (!listElement) return;
    listElement.innerHTML = '';
    const data = (Array.isArray(newData) ? newData : getData()).slice(0, MAX_PALETTES);
    const sizeModifiers = ['', 'short', 'mobile'];
    data.forEach((palette, index) => {
      const card = buildSummaryCard(palette, {
        sizeModifier: sizeModifiers[index] || '',
        padToTen: index === 0,
      });
      listElement.appendChild(card);
    });
  }

  function destroy() {
    listElement = null;
  }

  return {
    ...base,
    render,
    update,
    destroy,
  };
}
