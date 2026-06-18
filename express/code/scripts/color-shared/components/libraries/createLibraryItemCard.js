import { createTag } from '../../../utils.js';
import { createPaletteStrip, PALETTE_STRIP_VARIANTS } from '../../palettes/palettes.js';
import { gradientToBackgroundImage } from '../gradients/gradient-strip.js';
import { decorateAnalyticsAttributes, navigateToColorTool } from '../../utils/utilities.js';
import { createLibraryAccessibilityMenu } from './createLibraryAccessibilityMenu.js';
import { createLibraryDownloadMenu } from './createLibraryDownloadMenu.js';

function interpolate(template, vars = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? vars[key] : ''));
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
  const actions = createTag('div', { class: 'ax-lib-card__actions' });

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
      label: interpolate(strings.librariesEditAria, { name }),
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
    label: interpolate(strings.librariesOpenAria, { name }),
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
  const openLabel = interpolate(strings.librariesOpenAria, { name });
  const visual = createTag('div', {
    class: 'ax-lib-card__visual',
    role: 'button',
    tabindex: '0',
    'aria-label': openLabel,
  });
  decorateAnalyticsAttributes(visual, { linkLabel: openLabel });
  visual.addEventListener('click', onOpen);
  visual.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  });

  if (item.type === 'gradient') {
    const gradientVisual = createTag('div', { class: 'gradient-strip-visual ax-lib-card__gradient' });
    gradientVisual.style.backgroundImage = gradientToBackgroundImage(item);
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

  const card = createTag('article', {
    class: `ax-lib-card ax-lib-card--${item.type === 'gradient' ? 'gradient' : 'theme'}`,
    'data-item-id': item.id || '',
    role: 'group',
    'aria-label': name,
  });

  card.appendChild(createVisual(item, name, strings, () => emit('item-open', payload)));

  const info = createTag('div', { class: 'ax-lib-card__info' });
  const text = createTag('div', { class: 'ax-lib-card__text' });
  const nameEl = createTag('p', { class: 'ax-lib-card__name' });
  nameEl.textContent = name;
  const subtitleEl = createTag('p', { class: 'ax-lib-card__subtitle' });
  subtitleEl.textContent = getSubtitle(item, strings);
  text.append(nameEl, subtitleEl);

  info.append(text, buildActions(item, name, strings, emit, payload, toolHrefs));
  card.appendChild(info);

  return card;
}
