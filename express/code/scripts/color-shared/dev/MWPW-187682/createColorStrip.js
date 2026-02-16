/**
 * Color strip component (shared UI only). MWPW-187682.
 * Kept in dev/MWPW-187682/ — not used by current strips/palettes PR. For future variants: summary card,
 * vertical strip with labels, color-blindness label.
 *
 * Single implementation for palette strips: use the <color-palette> Web Component
 * (libs/color-components/components/color-palette) via createPaletteAdapter. Do not use
 * createColorStrip for palette cards — use the WC.
 */
import { createTag } from '../../../utils.js';

const DEFAULT_COLORS = ['#808080', '#c0c0c0'];

/**
 * Normalize color entry to { color, name? }.
 * @param {string|{ color: string, name?: string }} entry
 * @returns {{ color: string, name?: string }}
 */
function normalizeColor(entry) {
  if (typeof entry === 'string') return { color: entry };
  if (entry && typeof entry.color === 'string') {
    return { color: entry.color, name: entry.name };
  }
  return { color: '#808080' };
}

/**
 * Create a color strip with optional variants.
 * @param {Array<string|{ color: string, name?: string }>} colors - List of colors (hex or object).
 * @param {Object} [options] - ariaLabel, className, orientation, compact (48px), showLabels,
 *   colorBlindnessLabel, cornerRadius ('start'|'middle'|'end'|'full'|'none'|'mobile'),
 *   gapSize ('s'|'m'|'l'), sizing ('s'|'m'|'l'). Figma: 32/36/48px.
 * @returns {HTMLElement} Wrapper .ax-color-strip with variant classes.
 */
export function createColorStrip(colors = [], options = {}) {
  const list = Array.isArray(colors) && colors.length > 0
    ? colors.map(normalizeColor)
    : DEFAULT_COLORS.map((c) => ({ color: c }));

  const orientation = options.orientation === 'vertical' ? 'vertical' : 'horizontal';
  const classes = [
    'ax-color-strip',
    `ax-color-strip--${orientation}`,
    options.compact ? 'ax-color-strip--compact' : '',
    options.showLabels ? 'ax-color-strip--with-labels' : '',
    options.colorBlindnessLabel ? 'ax-color-strip--with-color-blindness-label' : '',
    options.cornerRadius ? `ax-color-strip--corner-${String(options.cornerRadius).toLowerCase()}` : '',
    options.gapSize ? `ax-color-strip--gap-${options.gapSize}` : '',
    options.sizing ? `ax-color-strip--size-${options.sizing}` : '',
    options.className || '',
  ].filter(Boolean);

  const wrapper = createTag('div', {
    class: classes.join(' '),
    role: 'list',
    'aria-label': options.ariaLabel ?? 'Color strip',
  });

  if (options.colorBlindnessLabel && typeof options.colorBlindnessLabel === 'string') {
    const labelEl = createTag('span', { class: 'ax-color-strip__color-blindness-label' });
    labelEl.textContent = options.colorBlindnessLabel;
    wrapper.appendChild(labelEl);
  } else if (options.colorBlindnessLabel === true) {
    const labelEl = createTag('span', { class: 'ax-color-strip__color-blindness-label' });
    labelEl.textContent = 'Color blindness friendly';
    wrapper.appendChild(labelEl);
  }

  const stripInner = createTag('div', { class: 'ax-color-strip__inner' });
  list.forEach(({ color, name }) => {
    const cell = createTag('div', {
      class: 'ax-color-strip__cell',
      role: 'listitem',
    });
    cell.style.backgroundColor = color;
    if (options.showLabels) {
      const label = createTag('span', { class: 'ax-color-strip__cell-label' });
      label.textContent = name || color;
      cell.appendChild(label);
    }
    stripInner.appendChild(cell);
  });
  wrapper.appendChild(stripInner);

  return wrapper;
}

/**
 * Create summary strip card: title, count, strip, actions. MWPW-187690.
 * @param {Object} opts - title, count, strip (createColorStrip), actions (HTMLElement[] or null).
 * @returns {HTMLElement}
 */
export function createSummaryStripCard(opts = {}) {
  const card = createTag('div', { class: 'ax-color-strip-summary-card' });
  if (opts.title) {
    const titleEl = createTag('h3', { class: 'ax-color-strip-summary-card__title' });
    titleEl.textContent = opts.title;
    card.appendChild(titleEl);
  }
  if (opts.count != null) {
    const countEl = createTag('p', { class: 'ax-color-strip-summary-card__count' });
    countEl.textContent = `${opts.count} color${opts.count !== 1 ? 's' : ''}`;
    card.appendChild(countEl);
  }
  if (opts.strip) {
    const stripWrap = createTag('div', { class: 'ax-color-strip-summary-card__strip' });
    stripWrap.appendChild(opts.strip);
    card.appendChild(stripWrap);
  }
  if (opts.actions && opts.actions.length) {
    const actionsWrap = createTag('div', { class: 'ax-color-strip-summary-card__actions' });
    opts.actions.forEach((el) => actionsWrap.appendChild(el));
    card.appendChild(actionsWrap);
  }
  return card;
}
