import { createTag } from '../../../utils.js';
import { createPaletteStrip, PALETTE_STRIP_VARIANTS } from '../../palettes/palettes.js';
import { decorateAnalyticsAttributes, navigateToColorTool } from '../../utils/utilities.js';
import { createLibraryAccessibilityMenu } from './createLibraryAccessibilityMenu.js';
import { createLibraryDownloadMenu } from './createLibraryDownloadMenu.js';
import { libraryGradientToBackgroundImage } from './libraryUtils.js';
import { libraryGradientToModalGradient } from './libraryDownloadUtils.js';

function interpolate(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? vars[key] : ''));
}

// Hex codes for the item's palette, used in the preview accessible name.
function getItemHexColors(item) {
  if (item.type === 'gradient') {
    const { colorStops } = libraryGradientToModalGradient(item);
    return (colorStops || []).map((stop) => stop.color).filter(Boolean);
  }
  return (item.colors || []).filter(Boolean);
}

// Descriptive name for the palette preview (Figma "Preview" item). The "colour
// blind safe" wording only appears when the matching badge is shown.
function getPreviewLabel(item, name, strings) {
  const colors = getItemHexColors(item).join(', ');
  if (item.type === 'gradient') {
    return interpolate(strings.librariesPreviewGradientAria, { name, colors });
  }
  if (item.colorBlindSafe) {
    return interpolate(strings.librariesPreviewColorBlindThemeAria, { name, colors });
  }
  return interpolate(strings.librariesPreviewThemeAria, { name, colors });
}

function createSpIconButton(iconName) {
  const icon = document.createElement(iconName);
  icon.setAttribute('size', 'm');
  icon.setAttribute('aria-hidden', 'true');
  const wrap = createTag('span', { class: 'action-icon' });
  wrap.appendChild(icon);
  return wrap;
}

function createActionButton({ icon, label, onClick }) {
  const btn = createTag('button', {
    type: 'button',
    class: 'ax-lib-card__action',
    'aria-label': label,
    'data-tooltip-content': label,
  });
  btn.appendChild(icon);
  decorateAnalyticsAttributes(btn, { linkLabel: label });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick?.();
  });
  return btn;
}

function buildActions(item, name, strings, emit, payload, toolHrefs) {
  const isGradient = item.type === 'gradient';
  const actions = createTag('div', {
    class: 'ax-lib-card__actions',
    role: 'group',
    'aria-label': interpolate(strings.librariesCardActions, { name }),
  });

  if (!isGradient) {
    const accessMenu = createLibraryAccessibilityMenu({
      item,
      strings,
      toolHrefs,
    });
    actions.appendChild(accessMenu.element);
  }

  actions.appendChild(createLibraryDownloadMenu({ item, strings }).element);

  const defs = [
    {
      icon: createSpIconButton('sp-icon-delete'),
      label: interpolate(strings.librariesDeleteAria, { name }),
      onClick: () => emit('item-delete', payload),
    },
  ];

  if (!isGradient) {
    defs.push({
      icon: createSpIconButton('sp-icon-edit'),
      label: strings.librariesEditLabel,
      onClick: () => {
        if (!toolHrefs.colorWheel || !item?.colors?.length) return;
        navigateToColorTool(toolHrefs.colorWheel, {
          colors: item.colors,
          name: item.name,
          tags: item.tags,
        });
      },
    });
  }

  defs.push({
    icon: createSpIconButton('sp-icon-open-in'),
    label: strings.librariesPreviewLabel,
    onClick: () => emit('item-open', payload),
  });

  defs.forEach((def) => actions.appendChild(createActionButton(def)));
  return actions;
}

function getSubtitle(item, strings) {
  if (item.type === 'gradient') return strings.librariesGradientSubtitle;
  if (item.colorBlindSafe) return strings.librariesThemeColorBlindSubtitle;
  return strings.librariesThemeSubtitle;
}

function createVisual(item, name, strings, onOpen) {
  // The palette/gradient preview is the first focus target once the card is
  // entered (Figma "Preview"). It starts at tabindex -1 and is promoted to the
  // tab order by the card's drill-in handler; activating it opens the item.
  const previewLabel = getPreviewLabel(item, name, strings);
  const visual = createTag('div', {
    class: 'ax-lib-card__visual',
    role: 'button',
    tabindex: '-1',
    'aria-label': previewLabel,
  });
  decorateAnalyticsAttributes(visual, { linkLabel: previewLabel });
  visual.addEventListener('click', onOpen);
  visual.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  });

  if (item.type === 'gradient') {
    const gradientVisual = createTag('div', { class: 'gradient-strip-visual ax-lib-card__gradient' });
    gradientVisual.style.backgroundImage = libraryGradientToBackgroundImage(item);
    visual.appendChild(gradientVisual);
  } else {
    const strip = createPaletteStrip(
      { id: item.id, name, colors: item.colors || [] },
      {},
      PALETTE_STRIP_VARIANTS.EXPLORE,
    );
    const paletteEl = strip.element.querySelector('color-palette');
    paletteEl?.setAttribute('focusable', 'false');
    visual.appendChild(strip.element);
    if (item.colorBlindSafe) {
      visual.appendChild(createTag(
        'span',
        { class: 'ax-lib-card__badge' },
        strings.librariesColorBlindBadge,
      ));
    }
  }
  return visual;
}

/**
 * Library item card: existing color/gradient strip visual + Figma chrome
 * (name, subtitle, color-blind-safe pill, and per-action buttons that emit events).
 * @param {Object} item - Theme or gradient item
 * @param {Object} [options]
 * @param {Object} [options.library]
 * @param {Object} [options.strings] - resolved placeholders
 * @param {Function} [options.emit]
 */
export function createLibraryItemCard(item, options = {}) {
  const {
    library = {},
    strings = {},
    emit = () => {},
    toolHrefs = {},
  } = options;
  const name = item.name || strings.librariesDefaultName || '';
  const payload = { item, libraryId: library.id, libraryName: library.name };

  const nameId = item.id ? `ax-lib-card-name-${item.id}` : '';
  const hintId = item.id ? `ax-lib-card-hint-${item.id}` : '';
  // The whole card is a single tab stop; pressing Enter drills into its controls.
  const cardAttrs = {
    class: `ax-lib-card ax-lib-card--${item.type === 'gradient' ? 'gradient' : 'theme'}`,
    'data-item-id': item.id || '',
    tabindex: '0',
  };
  // Name the card region from its h3 when an id is available; otherwise fall
  // back to a direct label so the card still has an accessible name.
  if (nameId) cardAttrs['aria-labelledby'] = nameId;
  else cardAttrs['aria-label'] = name;
  const card = createTag('article', cardAttrs);

  const openItem = () => emit('item-open', payload);
  const visual = createVisual(item, name, strings, openItem);
  card.appendChild(visual);

  const info = createTag('div', { class: 'ax-lib-card__info' });
  const text = createTag('div', { class: 'ax-lib-card__text' });
  // h3: card-level heading (palette / theme name) under the library h2. It is a
  // heading for document structure only — not a tab stop (the card is).
  const nameEl = createTag('h3', { class: 'ax-lib-card__name' });
  if (nameId) nameEl.id = nameId;
  nameEl.textContent = name;
  const subtitleEl = createTag('p', { class: 'ax-lib-card__subtitle' });
  subtitleEl.textContent = getSubtitle(item, strings);
  text.append(nameEl, subtitleEl);

  info.append(text, buildActions(item, name, strings, emit, payload, toolHrefs));
  card.appendChild(info);

  // Screen-reader hint describing the drill-in interaction, announced after the
  // card name via aria-describedby.
  if (strings.librariesCardHint && hintId) {
    const hint = createTag('span', { class: 'ax-lib-card__sr-only', id: hintId }, strings.librariesCardHint);
    card.setAttribute('aria-describedby', hintId);
    card.appendChild(hint);
  }

  // ── Composite focus model (drill-in) ────────────────────────────
  // Tab lands on the card. Enter moves focus to the preview, then Tab walks the
  // action buttons in order. Inner controls stay out of the page tab order until
  // the card is entered; leaving the card resets it to a single tab stop.
  const innerFocusables = [visual, ...card.querySelectorAll('.ax-lib-card__action')];
  let entered = false;

  function setEntered(next) {
    if (entered === next) return;
    entered = next;
    innerFocusables.forEach((el) => el.setAttribute('tabindex', next ? '0' : '-1'));
    card.setAttribute('tabindex', next ? '-1' : '0');
  }

  card.addEventListener('keydown', (e) => {
    if (e.target === card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setEntered(true);
      visual.focus();
      return;
    }
    if (e.key === 'Escape' && entered) {
      // Let an open action menu handle Escape first (it closes itself).
      if (card.querySelector('.ax-lib-card__action-menu-popover:not([hidden])')) return;
      e.preventDefault();
      setEntered(false);
      card.focus();
    }
  });

  card.addEventListener('focusin', (e) => {
    if (e.target === card) setEntered(false);
    else setEntered(true);
  });

  card.addEventListener('focusout', (e) => {
    if (!card.contains(e.relatedTarget)) setEntered(false);
  });

  return card;
}
