/**
 * Palette variant factory – one entry point for all strip variants.
 * Figma: 5639-129905 (Simplified), 6180-230471 (Color strip spec), 6215-344297 (Color-strip-container).
 * Summary = Figma 5806-89102 only (Palette summary card). Explore page grid = Palette Strips. Plus Compact.
 */

import { createTag } from '../../utils.js';
import { createPaletteStrip, PALETTE_STRIP_VARIANTS } from './palettes.js';
import { createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';
import { announceToScreenReader, clearScreenReaderAnnouncement } from '../spectrum/utils/a11y.js';

/** Figma node IDs for the three strip specs */
export const FIGMA_STRIP_NODES = {
  /** Simplified color strip – vertical strip container, padding 12px, gap 10px */
  SIMPLIFIED: '5639-129905',
  /** Color strip spec – annotations, strip cell sizing */
  STRIP_SPEC: '6180-230471',
  /** Color-strip-container – horizontal gap 2px, padding */
  CONTAINER_SPEC: '6215-344297',
};

/** Variant keys for createPaletteVariant() */
export const PALETTE_VARIANT = {
  SUMMARY: 'summary',
  COMPACT: 'compact',
  /** Figma 5639-129905 – vertical color-swatch-rail in ax-color-strip--simplified */
  SIMPLIFIED: 'simplified',
  /** Figma 6215 / 6180 – horizontal color-swatch-rail in ax-color-strip-container */
  HORIZONTAL_CONTAINER: 'horizontal-container',
};

/**
 * Build a controller from palette colors for <color-swatch-rail>.
 * @param {Object} palette - { colors: string[] }
 * @returns {Object} { subscribe(cb), updateFromPalette(palette) }
 */
export function createRailControllerFromPalette(palette) {
  const colors = palette?.colors || [];
  let swatches = colors.map((c) => ({ hex: c?.startsWith('#') ? c : `#${c}` }));
  if (swatches.length === 0) swatches = [{ hex: '#e0e0e0' }];
  const subscribers = new Set();
  return {
    subscribe(cb) {
      if (typeof cb !== 'function') return () => {};
      subscribers.add(cb);
      cb({ swatches: [...swatches], baseColorIndex: 0 });
      return () => subscribers.delete(cb);
    },
    updateFromPalette(p) {
      const next = (p?.colors || []).map((c) => ({ hex: c?.startsWith('#') ? c : `#${c}` }));
      if (next.length > 0) swatches = next;
      subscribers.forEach((cb) => cb({ swatches: [...swatches], baseColorIndex: 0 }));
    },
  };
}

/**
 * Create one palette variant element. Registers strip/controller/adapter via options.registry.
 * @param {Object} palette - { id, name, colors }
 * @param {string} variant - PALETTE_VARIANT.SUMMARY | COMPACT | SIMPLIFIED | HORIZONTAL_CONTAINER
 * @param {Object} options - { emit, registry, cardFocusable }
 * @param {boolean} [options.cardFocusable=true] - If true, card has tabindex="0" (default: focusable like demo). If false, card has tabindex="-1" so grid controls navigation (roving tabindex).
 * @returns {{ element: HTMLElement }}
 */
export function createPaletteVariant(palette, variant, options = {}) {
  const { emit = () => {}, registry = {}, swatchFeatures } = options;
  const pushStrip = registry.pushStrip || (() => {});
  const pushController = registry.pushController || (() => {});
  const pushAdapter = registry.pushAdapter || (() => {});

  if (variant === PALETTE_VARIANT.SUMMARY || variant === PALETTE_VARIANT.COMPACT) {
    const stripVariant = variant === PALETTE_VARIANT.COMPACT
      ? PALETTE_STRIP_VARIANTS.COMPACT
      : PALETTE_STRIP_VARIANTS.EXPLORE;
    const strip = createPaletteStrip(
      palette,
      { onSelect: (selectedPalette) => emit('palette-click', selectedPalette) },
      stripVariant,
    );
    pushStrip(strip);

    const cardFocusable = options.cardFocusable !== false;
    const card = createTag('div', { class: 'color-card' });
    card.setAttribute('data-palette-id', palette.id || '');
    card.setAttribute('tabindex', cardFocusable ? '0' : '-1');
    const name = palette.name || `Palette ${palette.id}`;
    if (cardFocusable) {
      card.setAttribute('role', 'group');
      card.setAttribute('aria-label', `Palette: ${name}`);
    }

    const visual = createTag('div', { class: 'color-card-visual' });
    visual.appendChild(strip.element);

    const info = createTag('div', { class: 'color-card-info' });
    const nameEl = createTag('p', { class: 'color-card-name' });
    nameEl.textContent = name;

    const actions = createTag('div', { class: 'color-card-actions' });
    const editBtn = createTag('button', {
      type: 'button',
      class: 'color-card-action-btn',
      'aria-label': `Edit ${name}`,
      'data-tooltip-content': 'Edit palette',
    });
    const editIcon = createTag('span', { class: 'action-icon' });
    const editIconEl = document.createElement('sp-icon-edit');
    editIconEl.setAttribute('size', 'm');
    editIconEl.setAttribute('aria-hidden', 'true');
    editIcon.appendChild(editIconEl);
    editBtn.appendChild(editIcon);
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); emit('palette-click', palette); });
    const shareBtn = createTag('button', {
      type: 'button',
      class: 'color-card-action-btn',
      'aria-label': 'View palette',
      'data-tooltip-content': 'View palette',
    });
    const shareIcon = createTag('span', { class: 'action-icon' });
    const viewIconEl = document.createElement('sp-icon-open-in');
    viewIconEl.setAttribute('size', 'm');
    viewIconEl.setAttribute('aria-hidden', 'true');
    shareIcon.appendChild(viewIconEl);
    shareBtn.appendChild(shareIcon);
    shareBtn.addEventListener('click', (e) => { e.stopPropagation(); emit('share', { palette }); });
    actions.appendChild(editBtn);
    actions.appendChild(shareBtn);
    info.appendChild(nameEl);
    info.appendChild(actions);
    card.appendChild(visual);
    card.appendChild(info);

    if (cardFocusable) {
      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const target = e.target;
        if (target === card || !card.contains(target)) return;
        e.preventDefault();
        clearScreenReaderAnnouncement();
        card.focus();
        announceToScreenReader(`Focus on palette: ${name}. Use Tab to move to actions or arrow keys to move between palettes.`, 'assertive', { immediate: true });
      }, true);
      card.addEventListener('focusin', (e) => {
        if (e.target !== card) return;
        if (e.relatedTarget && card.contains(e.relatedTarget)) return;
        setTimeout(() => {
          announceToScreenReader(`Focus on palette: ${name}. Use Tab to move to actions or arrow keys to move between palettes.`, 'assertive');
        }, 100);
      });
    }

    return { element: card };
  }

  if (variant === PALETTE_VARIANT.SIMPLIFIED) {
    const controller = createRailControllerFromPalette(palette);
    pushController(controller);
    const railOpts = { orientation: 'vertical' };
    if (swatchFeatures != null) railOpts.swatchFeatures = swatchFeatures;
    const railAdapter = createSwatchRailAdapter(controller, railOpts);
    pushAdapter(railAdapter);

    const outer = createTag('div', { class: 'ax-color-strip ax-color-strip--simplified' });
    const container = createTag('div', { class: 'ax-color-strip-container' });
    const inner = createTag('div', { class: 'ax-color-strip-container__inner' });
    inner.appendChild(railAdapter.element);
    container.appendChild(inner);
    outer.appendChild(container);
    return { element: outer };
  }

  if (variant === PALETTE_VARIANT.HORIZONTAL_CONTAINER) {
    const controller = createRailControllerFromPalette(palette);
    pushController(controller);
    const railOpts = { orientation: 'horizontal' };
    if (swatchFeatures != null) railOpts.swatchFeatures = swatchFeatures;
    const railAdapter = createSwatchRailAdapter(controller, railOpts);
    pushAdapter(railAdapter);

    const cell = createTag('div', { class: 'ax-color-strip__cell ax-color-strip__cell--with-strip' });
    cell.appendChild(railAdapter.element);
    return { element: cell };
  }

  return { element: createTag('div') };
}
