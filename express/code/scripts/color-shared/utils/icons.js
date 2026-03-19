import { createTag } from '../../utils.js';

function toKebabCase(str) {
  return str.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Creates a Spectrum 2 icon custom element (e.g. `<sp-icon-download>`).
 */
export function createSpectrumIcon(name) {
  const tagName = `sp-icon-${toKebabCase(name)}`;
  return document.createElement(tagName);
}

/** @deprecated Prefer createSpectrumIcon for S2 icons. */
export function createIconImg(name, size = 20) {
  return createTag('img', {
    src: `/express/code/icons/S2_Icon_${name}_${size}_N.svg`,
    alt: '',
    width: size,
    height: size,
  });
}

export function createSVGIcon(svgMarkup, size = 20) {
  return createTag('span', {
    class: 'ax-icon',
    'aria-hidden': 'true',
    style: `width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;color:currentColor`,
  }, svgMarkup);
}

/**
 * Icon-only action button using Spectrum <sp-action-button quiet>.
 * The element is created synchronously; it upgrades once the action-button
 * bundle loads (caller must ensure loadActionButton() is called).
 */
export function createIconButton({ icon, label, onClick, size = 's' }) {
  const btn = document.createElement('sp-action-button');
  btn.setAttribute('quiet', '');
  btn.setAttribute('label', label);
  btn.setAttribute('size', size);

  const iconEl = createSpectrumIcon(icon);
  iconEl.setAttribute('slot', 'icon');
  btn.appendChild(iconEl);

  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
