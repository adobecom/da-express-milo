import { createTag } from '../../utils.js';
import { createPaletteStrip, PALETTE_STRIP_VARIANTS } from './palettes.js';
import { announceToScreenReader, clearScreenReaderAnnouncement } from '../spectrum/utils/a11y.js';
import { wrapInTheme } from '../spectrum/utils/theme.js';

export const PALETTE_VARIANT = {
  SUMMARY: 'summary',
  COMPACT: 'compact',
};

export function createPaletteVariant(palette, variant, options = {}) {
  const {
    emit = () => {},
    registry = {},
    cardFocusable = true,
  } = options;
  const pushStrip = registry.pushStrip || (() => {});

  const stripVariant = variant === PALETTE_VARIANT.COMPACT
    ? PALETTE_STRIP_VARIANTS.COMPACT
    : PALETTE_STRIP_VARIANTS.EXPLORE;

  const strip = createPaletteStrip(
    palette,
    {
      onSelect: (selectedPalette) => emit('palette-click', selectedPalette),
    },
    stripVariant,
  );
  pushStrip(strip);

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
  });
  const editIcon = createTag('span', { class: 'action-icon' });
  const editIconEl = document.createElement('sp-icon-edit');
  editIconEl.setAttribute('size', 'm');
  editIconEl.setAttribute('aria-hidden', 'true');
  editIcon.appendChild(editIconEl);
  editBtn.appendChild(editIcon);
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emit('palette-click', palette);
  });

  const viewBtn = createTag('button', {
    type: 'button',
    class: 'color-card-action-btn',
    'aria-label': 'View palette',
  });
  const viewIcon = createTag('span', { class: 'action-icon' });
  const viewIconEl = document.createElement('sp-icon-open-in');
  viewIconEl.setAttribute('size', 'm');
  viewIconEl.setAttribute('aria-hidden', 'true');
  viewIcon.appendChild(viewIconEl);
  viewBtn.appendChild(viewIcon);
  viewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emit('palette-click', palette);
    emit('share', { palette });
  });

  actions.appendChild(editBtn);
  actions.appendChild(viewBtn);
  info.appendChild(nameEl);
  info.appendChild(actions);
  card.appendChild(visual);
  card.appendChild(info);

  if (cardFocusable) {
    card.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const { target } = e;
      if (target === card || !card.contains(target)) return;
      e.preventDefault();
      clearScreenReaderAnnouncement();
      card.focus();
      announceToScreenReader(
        `Focus on palette: ${name}. Use Tab to move to actions or arrow keys to move between palettes.`,
        'assertive',
        { immediate: true },
      );
    }, true);
    card.addEventListener('focusin', (e) => {
      if (e.target !== card) return;
      if (e.relatedTarget && card.contains(e.relatedTarget)) return;
      setTimeout(() => {
        announceToScreenReader(
          `Focus on palette: ${name}. Use Tab to move to actions or arrow keys to move between palettes.`,
          'assertive',
        );
      }, 100);
    });
  }

  return { element: wrapInTheme(card, { system: 'spectrum-two' }) };
}
