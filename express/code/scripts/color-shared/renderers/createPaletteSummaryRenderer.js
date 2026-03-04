/**
 * Renders Figma 5806-89102 Palette summary: .ax-color-strip-summary-card with
 * one horizontal strip per card (up to 10 colors). Matches color-strip.css summary rules.
 */
/* eslint-disable import/prefer-default-export */
import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';

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

  /* Full-width cards: strip 100% width + short (half) or mobile height */
  let stripClass = 'ax-color-strip-summary-card__strip';
  if (sizeModifier === 'full') {
    stripClass = 'ax-color-strip-summary-card__strip '
      + 'ax-color-strip-summary-card__strip--full ax-color-strip-summary-card__strip--short';
  } else if (sizeModifier === 'full-mobile') {
    stripClass = 'ax-color-strip-summary-card__strip '
      + 'ax-color-strip-summary-card__strip--full ax-color-strip-summary-card__strip--mobile';
  } else if (sizeModifier) {
    stripClass = `ax-color-strip-summary-card__strip ax-color-strip-summary-card__strip--${sizeModifier}`;
  }
  const stripWrap = createTag('div', { class: stripClass });
  stripWrap.appendChild(strip);
  return stripWrap;
}

function buildSummaryCard(palette, options = {}) {
  const colors = palette?.colors || [];
  const title = palette?.name || `Palette ${palette?.id ?? ''}`;
  const sizeModifier = options.sizeModifier || ''; // 'short' | 'mobile' | 'full' (100% width)
  const padToTen = options.padToTen === true;
  const displayColors = padToTen
    ? padColorsToCount(colors, MAX_COLORS_PER_STRIP)
    : colors.slice(0, MAX_COLORS_PER_STRIP);
  const count = displayColors.length;

  const isFullWidthCard = sizeModifier === 'full' || sizeModifier === 'full-mobile';
  const cardClass = isFullWidthCard
    ? 'ax-color-strip-summary-card ax-color-strip-summary-card--full-width'
    : 'ax-color-strip-summary-card';
  const card = createTag('div', { class: cardClass });
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
  const config = options?.config || {};
  /** When true, show full-width cards (short + mobile). API: config.fullWidthSummary */
  const showFullWidthVariant = config.fullWidthSummary === true;
  let listElement = null;

  function getSizeModifiers() {
    const list = ['', 'short', 'mobile'];
    if (showFullWidthVariant) {
      list.push('full'); /* full width + short (36px) */
      list.push('full-mobile'); /* full width + mobile (24px) */
    }
    return list;
  }

  function render(container) {
    container.innerHTML = '';
    container.classList.add('color-explorer-palette-summary');
    listElement = container;

    const data = getData();
    const palette = data[0]; /* Same palette for all cards; optional full-width variants */
    if (!palette) return;
    const sizeModifiers = getSizeModifiers();
    sizeModifiers.forEach((sizeModifier, index) => {
      const card = buildSummaryCard(palette, {
        sizeModifier,
        padToTen: index === 0, // First card shows 10 colors (Figma: up to 10)
      });
      listElement.appendChild(card);
    });
  }

  function update(newData) {
    if (!listElement) return;
    listElement.innerHTML = '';
    const data = Array.isArray(newData) ? newData : getData();
    const palette = data[0];
    if (!palette) return;
    const sizeModifiers = getSizeModifiers();
    sizeModifiers.forEach((sizeModifier, index) => {
      const card = buildSummaryCard(palette, {
        sizeModifier,
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
