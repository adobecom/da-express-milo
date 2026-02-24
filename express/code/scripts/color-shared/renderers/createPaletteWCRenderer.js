/**
 * Standalone factory for the palette-wc variant (palettes).
 * Parallel to createStripsRenderer and createStripContainerRenderer: same WC, own DOM.
 * Independent branch — no shared render path.
 */
/* eslint-disable import/prefer-default-export */
import { createTag } from '../../utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import { createPaletteAdapter } from '../adapters/litComponentAdapters.js';
import { STRIP_CONTAINER_DEFAULTS } from '../components/strips/stripContainerDefaults.js';

const VARIANT_SIZES = ['l', 'm', 's'];
const MAX_VARIANTS = 3;

export function createPaletteWCRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData, emit } = base;
  const stripOptions = options.config?.stripOptions ?? { ...STRIP_CONTAINER_DEFAULTS };

  let listElement = null;

  function createPaletteWCCard(palette, size) {
    const adapter = createPaletteAdapter(palette, {
      onSelect: () => emit('palette-click', palette),
      stripOptions,
    });
    const stripEl = adapter.element;
    stripEl.setAttribute('palette-aria-label', 'Color {hex}, swatch {index}');

    const card = createTag('div', { class: `palette-wc-card palette-wc-card--size-${size}` });
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open palette: ${palette.name || palette.id}`);
    card.addEventListener('click', (e) => {
      if (e.target.closest('.palette-wc-card__action') || e.target.closest('color-palette')) return;
      emit('palette-click', palette);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!e.target.closest('.palette-wc-card__action')) emit('palette-click', palette);
      }
    });

    card.appendChild(stripEl);

    const footer = createTag('div', { class: 'palette-wc-card__footer' });
    const nameEl = createTag('div', { class: 'palette-wc-card__name' });
    nameEl.textContent = palette.name || `Palette ${palette.id}`;
    footer.appendChild(nameEl);

    const actions = createTag('div', { class: 'palette-wc-card__actions' });
    const iconBase = options?.iconBaseUrl ?? '/express/code/icons';
    const iconAction = (ariaLabel, iconName, href, onClick) => {
      const el = href
        ? createTag('a', { class: 'palette-wc-card__action', href })
        : createTag('button', { type: 'button', class: 'palette-wc-card__action' });
      el.setAttribute('aria-label', ariaLabel);
      el.setAttribute('title', ariaLabel);
      if (href) el.setAttribute('target', '_blank');
      const img = createTag('img', {
        src: `${iconBase}/${iconName}.svg`,
        alt: '',
        width: 32,
        height: 32,
      });
      img.setAttribute('aria-hidden', 'true');
      el.appendChild(img);
      if (onClick) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onClick(e);
        });
      }
      return el;
    };
    actions.appendChild(iconAction('Edit palette', 'palette-edit', palette.editLink));
    actions.appendChild(iconAction(
      'View palette',
      'palette-view',
      palette.viewLink,
      palette.viewLink ? undefined : () => emit('palette-click', palette),
    ));
    footer.appendChild(actions);
    card.appendChild(footer);
    return card;
  }

  function render(container) {
    container.innerHTML = '';
    container.classList.add('color-explorer-palette-wc');
    listElement = container;

    const data = getData().slice(0, MAX_VARIANTS);
    VARIANT_SIZES.forEach((size, i) => {
      const palette = data[i];
      if (palette) listElement.appendChild(createPaletteWCCard(palette, size));
    });
  }

  function update(newData) {
    if (!listElement) return;
    listElement.innerHTML = '';
    const data = (Array.isArray(newData) ? newData : getData()).slice(0, MAX_VARIANTS);
    VARIANT_SIZES.forEach((size, i) => {
      const palette = data[i];
      if (palette) listElement.appendChild(createPaletteWCCard(palette, size));
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
